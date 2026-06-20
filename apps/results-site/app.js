(function () {
  const DATA = window.D20BENCH_RESULTS || { seasons: [], matchReports: [] };
  const state = {
    seasonId: DATA.seasons[0] && DATA.seasons[0].seasonId,
    activeAgent: null,
    agentFilter: "all",
    battleFilter: "all",
    matchSearch: "",
    visibleMatches: 80,
    liveProgress: {},
  };

  const palette = ["#0f9f8f", "#d97706", "#4f46e5", "#dc2626", "#3f8d44", "#2563eb", "#be185d", "#6d7b23"];

  const el = {
    seasonSelect: document.getElementById("seasonSelect"),
    seasonGenerated: document.getElementById("seasonGenerated"),
    seasonTitle: document.getElementById("seasonTitle"),
    seasonDescription: document.getElementById("seasonDescription"),
    ratingSpread: document.getElementById("ratingSpread"),
    ratingChart: document.getElementById("ratingChart"),
    metricGrid: document.getElementById("metricGrid"),
    agentFilter: document.getElementById("agentFilter"),
    standingsBody: document.getElementById("standingsBody"),
    agentPanel: document.getElementById("agentPanel"),
    battleTypeGrid: document.getElementById("battleTypeGrid"),
    matrixWrap: document.getElementById("matrixWrap"),
    battleFilter: document.getElementById("battleFilter"),
    matchSearch: document.getElementById("matchSearch"),
    matchBody: document.getElementById("matchBody"),
    matchCount: document.getElementById("matchCount"),
    showMoreButton: document.getElementById("showMoreButton"),
    progressPanel: document.getElementById("progressPanel"),
    progressStatus: document.getElementById("progressStatus"),
    reportList: document.getElementById("reportList"),
  };

  function season() {
    return DATA.seasons.find((item) => item.seasonId === state.seasonId) || DATA.seasons[0];
  }

  function standingsFor(currentSeason) {
    return [...(currentSeason.standings || [])].sort((a, b) => b.rating - a.rating);
  }

  function agentIds(currentSeason) {
    const ids = new Set();
    standingsFor(currentSeason).forEach((row) => ids.add(row.agentId));
    (currentSeason.matches || []).forEach((match) => {
      ids.add(match.redAgent);
      ids.add(match.blueAgent);
    });
    return [...ids].filter(Boolean).sort();
  }

  function battleLabel(match) {
    if (match.battleType) {
      return match.battleType;
    }
    const scenario = match.scenarioId || "unknown";
    return scenario.replace(/^public\./, "").replace(/\.v\d+$/, "");
  }

  function battleTypes(currentSeason) {
    const values = new Set();
    (currentSeason.battleTypeStandings || []).forEach((board) => values.add(board.battleType));
    (currentSeason.matches || []).forEach((match) => values.add(battleLabel(match)));
    return [...values].filter(Boolean).sort();
  }

  function formatRating(value) {
    return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  function formatInteger(value) {
    return Number(value || 0).toLocaleString();
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) {
      return "0%";
    }
    return `${Math.round(value * 100)}%`;
  }

  function formatDate(value) {
    if (!value) {
      return "Generated";
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function formatMoney(value) {
    return `$${Number(value || 0).toFixed(6)}`;
  }

  function formatDuration(ms) {
    const numeric = Number(ms || 0);
    if (numeric < 1000) {
      return `${Math.max(0, Math.round(numeric))} ms`;
    }
    return `${(numeric / 1000).toFixed(1)} s`;
  }

  function shortName(agentId) {
    return String(agentId || "").replace(/^baseline\./, "").replace(/^battlecast\./, "");
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/^public\./, "")
      .replace(/[-_.]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function colorFor(agentId) {
    let hash = 0;
    for (const char of String(agentId || "")) {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  function ratingDelta(match, side) {
    const before = Number(match[`${side}RatingBefore`]);
    const after = Number(match[`${side}RatingAfter`]);
    if (!Number.isFinite(before) || !Number.isFinite(after)) {
      return 0;
    }
    return after - before;
  }

  function recordWinRate(row) {
    const matches = Number(row.matches || 0);
    return matches ? (Number(row.wins || 0) + Number(row.draws || 0) * 0.5) / matches : 0;
  }

  function signed(value) {
    const numeric = Number(value || 0);
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(1)}`;
  }

  function setOptions(select, options, value) {
    select.innerHTML = options
      .map((option) => {
        const selected = option.value === value ? " selected" : "";
        return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
      })
      .join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function metric(label, value, note) {
    return `
      <article class="metric-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </article>
    `;
  }

  function renderSeasonControls() {
    setOptions(
      el.seasonSelect,
      DATA.seasons.map((item) => ({ value: item.seasonId, label: item.seasonId })),
      state.seasonId,
    );
  }

  function renderOverview(currentSeason) {
    const standings = standingsFor(currentSeason);
    const top = standings[0];
    const lowest = standings[standings.length - 1];
    const spread = top && lowest ? top.rating - lowest.rating : 0;
    const matches = currentSeason.matches || [];
    const agents = agentIds(currentSeason);
    const battleTypeCount = battleTypes(currentSeason).length;
    const totalDecisions = matches.filter((match) => match.winner && match.winner !== "draw").length;
    const topWinRate = top ? formatPercent(recordWinRate(top)) : "0%";

    el.seasonGenerated.textContent = formatDate(currentSeason.generatedAt);
    el.seasonTitle.textContent = currentSeason.seasonId || "Benchmark Results";
    el.seasonDescription.textContent = currentSeason.description || "Deterministic benchmark season results.";
    el.ratingSpread.textContent = `${formatRating(spread)} Elo`;
    el.metricGrid.innerHTML = [
      metric("Matches", formatInteger(matches.length), `${formatInteger(totalDecisions)} decisions`),
      metric("Agents", formatInteger(agents.length), top ? `${shortName(top.agentId)} leads` : "No leader"),
      metric("Battle Types", formatInteger(battleTypeCount || 1), currentSeason.kFactor ? `K ${currentSeason.kFactor}` : "Single board"),
      metric("Top Rating", top ? formatRating(top.rating) : "0", top ? `${topWinRate} win rate` : "No standings"),
    ].join("");

    renderRatingChart(standings);
  }

  function renderRatingChart(standings) {
    if (!standings.length) {
      el.ratingChart.innerHTML = `<p class="empty-state">No standings found.</p>`;
      return;
    }

    const min = Math.min(...standings.map((row) => row.rating));
    const max = Math.max(...standings.map((row) => row.rating));
    const range = Math.max(1, max - min);

    el.ratingChart.innerHTML = standings
      .map((row, index) => {
        const width = 16 + ((row.rating - min) / range) * 84;
        const color = colorFor(row.agentId);
        return `
          <div class="rating-row">
            <span class="rank-pill">${index + 1}</span>
            <span class="agent-chip" title="${escapeHtml(row.agentId)}">
              <i style="--agent-color:${color}"></i>${escapeHtml(shortName(row.agentId))}
            </span>
            <span class="rating-bar" aria-hidden="true">
              <span style="width:${width.toFixed(2)}%; --bar-color:${color}"></span>
            </span>
            <strong>${formatRating(row.rating)}</strong>
          </div>
        `;
      })
      .join("");
  }

  function renderFilters(currentSeason) {
    const agents = agentIds(currentSeason);
    const battles = battleTypes(currentSeason);

    setOptions(
      el.agentFilter,
      [{ value: "all", label: "All agents" }, ...agents.map((agent) => ({ value: agent, label: agent }))],
      state.agentFilter,
    );

    setOptions(
      el.battleFilter,
      [{ value: "all", label: "All battles" }, ...battles.map((battle) => ({ value: battle, label: battle }))],
      state.battleFilter,
    );
  }

  function renderStandings(currentSeason) {
    const standings = standingsFor(currentSeason);
    const topRating = standings[0] ? standings[0].rating : 0;
    const filtered = state.agentFilter === "all" ? standings : standings.filter((row) => row.agentId === state.agentFilter);

    if (!state.activeAgent || !agentIds(currentSeason).includes(state.activeAgent)) {
      state.activeAgent = standings[0] && standings[0].agentId;
    }

    el.standingsBody.innerHTML = filtered
      .map((row) => {
        const rank = standings.findIndex((item) => item.agentId === row.agentId) + 1;
        const winRate = recordWinRate(row);
        const gap = row.rating - topRating;
        const selected = row.agentId === state.activeAgent ? " is-selected" : "";
        return `
          <tr class="standings-row${selected}" tabindex="0" data-agent="${escapeHtml(row.agentId)}">
            <td><span class="rank-number">${rank}</span></td>
            <td>
              <div class="agent-name">
                <i style="--agent-color:${colorFor(row.agentId)}"></i>
                <span>${escapeHtml(row.agentId)}</span>
              </div>
            </td>
            <td>
              <strong>${formatRating(row.rating)}</strong>
              <small>${gap === 0 ? "leader" : `${signed(gap)} Elo`}</small>
            </td>
            <td>${formatInteger(row.wins)}-${formatInteger(row.losses)}-${formatInteger(row.draws)}</td>
            <td>
              <div class="mini-meter" aria-label="${formatPercent(winRate)}">
                <span style="width:${Math.round(winRate * 100)}%"></span>
              </div>
              <small>${formatPercent(winRate)}</small>
            </td>
            <td>${formatRating(row.score)}</td>
          </tr>
        `;
      })
      .join("");
  }

  function renderAgentPanel(currentSeason) {
    const active = state.activeAgent;
    const standings = standingsFor(currentSeason);
    const row = standings.find((item) => item.agentId === active);
    if (!row) {
      el.agentPanel.innerHTML = `<p class="empty-state">No agent selected.</p>`;
      return;
    }

    const boards = (currentSeason.battleTypeStandings || [])
      .map((board) => ({
        battleType: board.battleType,
        standing: (board.standings || []).find((item) => item.agentId === active),
      }))
      .filter((item) => item.standing)
      .sort((a, b) => b.standing.rating - a.standing.rating);

    const recent = [...(currentSeason.matches || [])]
      .filter((match) => match.redAgent === active || match.blueAgent === active)
      .slice(-6)
      .reverse();

    const rank = standings.findIndex((item) => item.agentId === active) + 1;
    const best = boards[0];
    const worst = boards[boards.length - 1];

    el.agentPanel.innerHTML = `
      <div class="panel-heading compact">
        <div>
          <p class="eyebrow">Agent</p>
          <h2>${escapeHtml(shortName(active))}</h2>
        </div>
        <span class="agent-dot" style="--agent-color:${colorFor(active)}"></span>
      </div>
      <div class="agent-stat-stack">
        ${metric("Overall Rank", `#${rank}`, `${formatRating(row.rating)} Elo`)}
        ${metric("Record", `${formatInteger(row.wins)}-${formatInteger(row.losses)}-${formatInteger(row.draws)}`, `${formatPercent(recordWinRate(row))} score rate`)}
      </div>
      <dl class="agent-details">
        <div>
          <dt>Best Board</dt>
          <dd>${best ? `${escapeHtml(best.battleType)} (${formatRating(best.standing.rating)})` : "Overall only"}</dd>
        </div>
        <div>
          <dt>Toughest Board</dt>
          <dd>${worst ? `${escapeHtml(worst.battleType)} (${formatRating(worst.standing.rating)})` : "Overall only"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>${escapeHtml(currentSeason.sourcePath || "results")}</dd>
        </div>
      </dl>
      <div class="recent-list">
        <h3>Recent Matches</h3>
        ${recent
          .map((match) => {
            const side = match.redAgent === active ? "red" : "blue";
            const opponent = side === "red" ? match.blueAgent : match.redAgent;
            const result = match.winner === side ? "win" : match.winner === "draw" ? "draw" : "loss";
            return `
              <div class="recent-match">
                <span class="result-token ${result}">${result}</span>
                <span>${escapeHtml(shortName(opponent))}</span>
                <small>${escapeHtml(battleLabel(match))}</small>
              </div>
            `;
          })
          .join("") || `<p class="empty-state">No match history.</p>`}
      </div>
    `;
  }

  function renderBattleTypes(currentSeason) {
    const boards = currentSeason.battleTypeStandings || [];
    if (!boards.length) {
      el.battleTypeGrid.innerHTML = `<p class="empty-state">This season has no separate battle-type tables.</p>`;
      return;
    }

    el.battleTypeGrid.innerHTML = boards
      .map((board) => {
        const standings = standingsFor({ standings: board.standings });
        const top = standings[0];
        const max = Math.max(...standings.map((row) => row.rating));
        const min = Math.min(...standings.map((row) => row.rating));
        const range = Math.max(1, max - min);
        return `
          <article class="battle-card">
            <div class="battle-card-head">
              <div>
                <span class="eyebrow">${escapeHtml(titleCase(board.battleType))}</span>
                <h3>${top ? escapeHtml(shortName(top.agentId)) : "No leader"}</h3>
              </div>
              <strong>${top ? formatRating(top.rating) : "0"}</strong>
            </div>
            <div class="battle-bars">
              ${standings
                .map((row, index) => {
                  const width = 18 + ((row.rating - min) / range) * 82;
                  return `
                    <button class="battle-row" type="button" data-agent="${escapeHtml(row.agentId)}">
                      <span>${index + 1}</span>
                      <b>${escapeHtml(shortName(row.agentId))}</b>
                      <i><span style="width:${width.toFixed(2)}%; --bar-color:${colorFor(row.agentId)}"></span></i>
                      <em>${formatRating(row.rating)}</em>
                    </button>
                  `;
                })
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  function headToHead(currentSeason) {
    const agents = standingsFor(currentSeason).map((row) => row.agentId);
    const matrix = new Map();
    for (const row of agents) {
      for (const col of agents) {
        matrix.set(`${row}|||${col}`, { wins: 0, losses: 0, draws: 0, matches: 0 });
      }
    }

    for (const match of currentSeason.matches || []) {
      if (!agents.includes(match.redAgent) || !agents.includes(match.blueAgent)) {
        continue;
      }
      const red = matrix.get(`${match.redAgent}|||${match.blueAgent}`);
      const blue = matrix.get(`${match.blueAgent}|||${match.redAgent}`);
      red.matches += 1;
      blue.matches += 1;
      if (match.winner === "red") {
        red.wins += 1;
        blue.losses += 1;
      } else if (match.winner === "blue") {
        blue.wins += 1;
        red.losses += 1;
      } else {
        red.draws += 1;
        blue.draws += 1;
      }
    }

    return { agents, matrix };
  }

  function renderMatrix(currentSeason) {
    const { agents, matrix } = headToHead(currentSeason);
    if (!agents.length) {
      el.matrixWrap.innerHTML = `<p class="empty-state">No pairings found.</p>`;
      return;
    }

    el.matrixWrap.innerHTML = `
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Agent</th>
            ${agents.map((agent) => `<th title="${escapeHtml(agent)}">${escapeHtml(shortName(agent))}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${agents
            .map((rowAgent) => `
              <tr>
                <th title="${escapeHtml(rowAgent)}">${escapeHtml(shortName(rowAgent))}</th>
                ${agents
                  .map((colAgent) => {
                    if (rowAgent === colAgent) {
                      return `<td class="matrix-empty"></td>`;
                    }
                    const record = matrix.get(`${rowAgent}|||${colAgent}`);
                    const score = record.matches ? (record.wins + record.draws * 0.5) / record.matches : 0;
                    const alpha = 0.12 + Math.abs(score - 0.5) * 1.1;
                    const tone = score >= 0.5 ? `rgba(15, 159, 143, ${alpha})` : `rgba(220, 38, 38, ${alpha})`;
                    return `
                      <td style="background:${tone}" title="${escapeHtml(rowAgent)} vs ${escapeHtml(colAgent)}: ${record.wins}-${record.losses}-${record.draws}">
                        <strong>${formatPercent(score)}</strong>
                        <small>${record.wins}-${record.losses}</small>
                      </td>
                    `;
                  })
                  .join("")}
              </tr>
            `)
            .join("")}
        </tbody>
      </table>
    `;
  }

  function filteredMatches(currentSeason) {
    const query = state.matchSearch.trim().toLowerCase();
    return (currentSeason.matches || []).filter((match) => {
      const battle = battleLabel(match);
      const agentMatch =
        state.agentFilter === "all" || match.redAgent === state.agentFilter || match.blueAgent === state.agentFilter;
      const battleMatch = state.battleFilter === "all" || battle === state.battleFilter;
      const queryMatch =
        !query ||
        [match.matchId, match.scenarioId, battle, match.redAgent, match.blueAgent, match.winner, match.finalStateHash]
          .join(" ")
          .toLowerCase()
          .includes(query);
      return agentMatch && battleMatch && queryMatch;
    });
  }

  function renderMatches(currentSeason) {
    const matches = filteredMatches(currentSeason);
    const visible = matches.slice(0, state.visibleMatches);

    el.matchBody.innerHTML =
      visible
        .map((match) => {
          const redDelta = ratingDelta(match, "red");
          const blueDelta = ratingDelta(match, "blue");
          const winnerText = match.winner === "draw" ? "Draw" : match.winner === "red" ? "Red" : "Blue";
          return `
            <tr>
              <td>
                <strong>${escapeHtml(battleLabel(match))}</strong>
                <small>${escapeHtml(match.scenarioId || "")}</small>
              </td>
              <td>${escapeHtml(match.seed)}</td>
              <td>${escapeHtml(shortName(match.redAgent))}</td>
              <td>${escapeHtml(shortName(match.blueAgent))}</td>
              <td><span class="winner-token ${escapeHtml(String(match.winner || "draw"))}">${escapeHtml(winnerText)}</span></td>
              <td>
                <span class="${redDelta >= 0 ? "positive" : "negative"}">R ${signed(redDelta)}</span>
                <span class="${blueDelta >= 0 ? "positive" : "negative"}">B ${signed(blueDelta)}</span>
              </td>
              <td><code>${escapeHtml(String(match.finalStateHash || "").slice(0, 12))}</code></td>
            </tr>
          `;
        })
        .join("") || `<tr><td colspan="7"><p class="empty-state">No matches found.</p></td></tr>`;

    el.matchCount.textContent = `${formatInteger(Math.min(visible.length, matches.length))} of ${formatInteger(matches.length)} matches`;
    el.showMoreButton.hidden = visible.length >= matches.length;
  }

  function progressForPanel(currentSeason) {
    if (currentSeason && state.liveProgress[currentSeason.seasonId]) {
      return state.liveProgress[currentSeason.seasonId];
    }
    if (currentSeason && currentSeason.progress) {
      return currentSeason.progress;
    }
    const live = Object.values(state.liveProgress);
    return live.sort((a, b) => Date.parse(b.updatedAt || 0) - Date.parse(a.updatedAt || 0))[0] || null;
  }

  function renderProgressPanel(currentSeason) {
    const progress = progressForPanel(currentSeason);
    if (!progress) {
      el.progressStatus.textContent = "Idle";
      el.progressStatus.className = "status-pill";
      el.progressPanel.innerHTML = `<p class="empty-state">No live season progress found.</p>`;
      return;
    }

    const completed = Number(progress.completedMatches || 0);
    const failed = Number(progress.failedMatches || 0);
    const running = Number(progress.runningMatches || 0);
    const total = Number(progress.totalMatches || 0);
    const finished = completed + failed;
    const ratio = total ? Math.min(1, finished / total) : 0;
    const status = progress.status || "running";
    const statusText = status === "running" ? `${formatInteger(finished)} / ${formatInteger(total)}` : titleCase(status);
    const cost = progress.costSummary || {};
    const activeMatches = progress.activeMatches || [];
    const recentMatches = progress.recentMatches || [];

    el.progressStatus.textContent = statusText;
    el.progressStatus.className = `status-pill ${escapeHtml(status)}`;
    el.progressPanel.innerHTML = `
      <div class="progress-summary">
        <div>
          <span class="eyebrow">${escapeHtml(progress.seasonId || "Season")}</span>
          <h3>${escapeHtml(progress.description || "Benchmark run")}</h3>
        </div>
        <div class="progress-meter" aria-label="${Math.round(ratio * 100)} percent complete">
          <span style="width:${(ratio * 100).toFixed(2)}%"></span>
        </div>
        <dl class="progress-stats">
          <div>
            <dt>Matches</dt>
            <dd>${formatInteger(completed)} done, ${formatInteger(failed)} failed</dd>
          </div>
          <div>
            <dt>Running</dt>
            <dd>${formatInteger(running)} at concurrency ${formatInteger(progress.concurrency)}</dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>${formatMoney(cost.estimatedCostUsd)}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>${formatInteger(cost.totalTokens)} total</dd>
          </div>
          <div>
            <dt>Decisions</dt>
            <dd>${formatInteger(cost.totalDecisions)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>${escapeHtml(formatDate(progress.updatedAt))}</dd>
          </div>
        </dl>
      </div>
      <div class="progress-columns">
        <div>
          <h3>Active Matches</h3>
          <div class="progress-list">
            ${activeMatches.map(renderProgressMatch).join("") || `<p class="empty-state">No matches currently running.</p>`}
          </div>
        </div>
        <div>
          <h3>Recent Matches</h3>
          <div class="progress-list">
            ${recentMatches.map(renderProgressMatch).join("") || `<p class="empty-state">No completed matches yet.</p>`}
          </div>
        </div>
      </div>
    `;
  }

  function renderProgressMatch(match) {
    const status = match.status === "completed" && match.winner ? `winner ${match.winner}` : match.status;
    const cost = match.estimatedCostUsd ? ` · ${formatMoney(match.estimatedCostUsd)}` : "";
    const duration = match.durationMs ? ` · ${formatDuration(match.durationMs)}` : "";
    const error = match.error ? `<small>${escapeHtml(match.error)}</small>` : "";
    return `
      <article class="progress-match ${escapeHtml(match.status || "running")}">
        <div>
          <strong>${escapeHtml(shortName(match.redAgent))} vs ${escapeHtml(shortName(match.blueAgent))}</strong>
          <span>${escapeHtml(match.battleType || match.scenarioId || "battle")} · seed ${escapeHtml(match.seed)}</span>
          ${error}
        </div>
        <em>${escapeHtml(status)}${cost}${duration}</em>
      </article>
    `;
  }

  function renderReports() {
    if (!DATA.matchReports.length) {
      el.reportList.innerHTML = `<p class="empty-state">No standalone match reports found.</p>`;
      return;
    }

    el.reportList.innerHTML = DATA.matchReports
      .map((report) => {
        const topRecord = [...(report.records || [])].sort((a, b) => b.winRate - a.winRate)[0];
        const firstMatch = report.matches && report.matches[0];
        return `
          <article class="report-item">
            <div>
              <span class="eyebrow">${escapeHtml(formatDate(report.generatedAt))}</span>
              <h3>${escapeHtml(report.reportId)}</h3>
              <p>${firstMatch ? `${escapeHtml(firstMatch.redAgent)} vs ${escapeHtml(firstMatch.blueAgent)}` : "No matches"}</p>
            </div>
            <dl>
              <div>
                <dt>Matches</dt>
                <dd>${formatInteger((report.matches || []).length)}</dd>
              </div>
              <div>
                <dt>Leader</dt>
                <dd>${topRecord ? escapeHtml(shortName(topRecord.agentId)) : "None"}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>${escapeHtml(report.sourcePath || "results")}</dd>
              </div>
            </dl>
          </article>
        `;
      })
      .join("");
  }

  function renderAll() {
    const currentSeason = season();
    if (!currentSeason) {
      document.body.innerHTML = `<main class="missing-data"><h1>No benchmark results found</h1><p>Run the data generator after producing results.</p></main>`;
      return;
    }

    renderSeasonControls();
    renderFilters(currentSeason);
    renderOverview(currentSeason);
    renderStandings(currentSeason);
    renderAgentPanel(currentSeason);
    renderBattleTypes(currentSeason);
    renderMatrix(currentSeason);
    renderMatches(currentSeason);
    renderProgressPanel(currentSeason);
    renderReports();
  }

  el.seasonSelect.addEventListener("change", (event) => {
    state.seasonId = event.target.value;
    state.agentFilter = "all";
    state.battleFilter = "all";
    state.matchSearch = "";
    state.visibleMatches = 80;
    state.activeAgent = null;
    el.matchSearch.value = "";
    renderAll();
  });

  el.agentFilter.addEventListener("change", (event) => {
    state.agentFilter = event.target.value;
    if (state.agentFilter !== "all") {
      state.activeAgent = state.agentFilter;
    }
    state.visibleMatches = 80;
    renderAll();
  });

  el.battleFilter.addEventListener("change", (event) => {
    state.battleFilter = event.target.value;
    state.visibleMatches = 80;
    renderMatches(season());
  });

  el.matchSearch.addEventListener("input", (event) => {
    state.matchSearch = event.target.value;
    state.visibleMatches = 80;
    renderMatches(season());
  });

  el.showMoreButton.addEventListener("click", () => {
    state.visibleMatches += 80;
    renderMatches(season());
  });

  el.standingsBody.addEventListener("click", (event) => {
    const row = event.target.closest("[data-agent]");
    if (!row) {
      return;
    }
    state.activeAgent = row.dataset.agent;
    renderStandings(season());
    renderAgentPanel(season());
  });

  el.standingsBody.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }
    const row = event.target.closest("[data-agent]");
    if (!row) {
      return;
    }
    event.preventDefault();
    state.activeAgent = row.dataset.agent;
    renderStandings(season());
    renderAgentPanel(season());
  });

  el.battleTypeGrid.addEventListener("click", (event) => {
    const row = event.target.closest("[data-agent]");
    if (!row) {
      return;
    }
    state.activeAgent = row.dataset.agent;
    state.agentFilter = row.dataset.agent;
    renderAll();
  });

  function liveProgressIds() {
    const ids = new Set(DATA.seasons.map((item) => item.seasonId).filter(Boolean));
    ids.add("llm-smoke-v0");
    return [...ids];
  }

  function progressUrl(seasonId) {
    return `../../results/seasons/${encodeURIComponent(seasonId)}/progress.json?ts=${Date.now()}`;
  }

  async function pollLiveProgress() {
    const updates = await Promise.all(
      liveProgressIds().map(async (seasonId) => {
        try {
          const response = await fetch(progressUrl(seasonId), { cache: "no-store" });
          if (!response.ok) {
            return null;
          }
          return await response.json();
        } catch {
          return null;
        }
      }),
    );

    let changed = false;
    for (const progress of updates) {
      if (!progress || !progress.seasonId) {
        continue;
      }
      const current = state.liveProgress[progress.seasonId];
      if (!current || current.updatedAt !== progress.updatedAt || current.status !== progress.status) {
        state.liveProgress[progress.seasonId] = progress;
        changed = true;
      }
    }
    if (changed) {
      renderProgressPanel(season());
    }
  }

  renderAll();
  pollLiveProgress();
  window.setInterval(pollLiveProgress, 2500);
})();
