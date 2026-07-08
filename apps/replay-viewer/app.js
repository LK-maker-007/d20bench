(() => {
  'use strict';

  const INDEX = (window.D20BENCH_REPLAY_INDEX || { matches: [] });
  const bootQuery = new URLSearchParams(window.location.search);
  const CELL_MAX = Number(bootQuery.get('cell')) > 0 ? Number(bootQuery.get('cell')) : 44;
  // Freeze-frame mode for screenshots: &p=0.45 renders the current beat's
  // transient effects (attack lines, AoE circles, damage floaters) at a
  // fixed progress instead of animating them away.
  const FREEZE_PROGRESS = bootQuery.has('p') ? Math.max(0, Math.min(1, Number(bootQuery.get('p')))) : null;
  const TEAM_COLORS = { red: '#e11d48', blue: '#2563eb' };
  const DMG_COLORS = {
    fire: '#ea580c', cold: '#0284c7', acid: '#16a34a', lightning: '#ca8a04',
    poison: '#9333ea', necrotic: '#525252', radiant: '#d97706', psychic: '#db2777',
    thunder: '#2563eb', force: '#7c3aed', piercing: '#b91c1c', slashing: '#b91c1c',
    bludgeoning: '#b91c1c',
  };

  const el = {
    seasonSelect: document.getElementById('season-select'),
    matchFilter: document.getElementById('match-filter'),
    matchList: document.getElementById('match-list'),
    matchHeader: document.getElementById('match-header'),
    board: document.getElementById('board'),
    btnPlay: document.getElementById('btn-play'),
    btnRestart: document.getElementById('btn-restart'),
    btnBack: document.getElementById('btn-back'),
    btnFwd: document.getElementById('btn-fwd'),
    scrubber: document.getElementById('scrubber'),
    roundIndicator: document.getElementById('round-indicator'),
    decisionBody: document.getElementById('decision-body'),
    battleLog: document.getElementById('battle-log'),
  };
  const ctx = el.board.getContext('2d');

  const state = {
    match: null,
    timeline: [],
    cursor: 0,
    beatStart: 0,
    playing: false,
    speed: 1,
    sim: new Map(),
    lingering: [],
    currentGroup: null,
    currentRound: 0,
    activeKey: null,
  };

  const imageCache = new Map();
  function tokenImage(creature) {
    const slug = creature.heroClass
      ? creature.heroClass.toLowerCase()
      : (creature.monsterName || creature.displayName).toLowerCase().replace(/\s+l\d+.*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const src = `assets/tokens/${creature.team}/${slug}.webp`;
    if (!imageCache.has(src)) {
      const img = new Image();
      img.src = src;
      imageCache.set(src, img);
    }
    return imageCache.get(src);
  }
  function mapImage(src) {
    if (!src) return null;
    if (!imageCache.has(src)) {
      const img = new Image();
      img.src = src;
      imageCache.set(src, img);
    }
    return imageCache.get(src);
  }

  // ---------- sidebar ----------

  function agentShort(agentId) {
    return String(agentId)
      .replace('openrouter:', '')
      .replace(/^.*\//, '')
      .replace('battlecast.', 'battlecast ');
  }

  function seasonList() {
    const ids = [...new Set(INDEX.matches.map((m) => m.seasonId))];
    return ids.sort().reverse();
  }

  function renderSeasons() {
    el.seasonSelect.innerHTML = '';
    for (const id of seasonList()) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${id} (${INDEX.matches.filter((m) => m.seasonId === id).length})`;
      el.seasonSelect.appendChild(opt);
    }
    const preferred = seasonList().find((id) => id.includes('fairfix')) || seasonList()[0];
    if (preferred) el.seasonSelect.value = preferred;
  }

  function renderMatchList() {
    const season = el.seasonSelect.value;
    const filter = el.matchFilter.value.trim().toLowerCase();
    el.matchList.innerHTML = '';
    const matches = INDEX.matches.filter((m) => m.seasonId === season)
      .filter((m) => !filter || `${m.redAgent} ${m.blueAgent} ${m.scenarioId}`.toLowerCase().includes(filter));
    for (const m of matches) {
      const li = document.createElement('li');
      li.dataset.key = m.key;
      if (m.key === state.activeKey) li.classList.add('active');
      const winBadge = m.winner === 'draw'
        ? '<span class="badge draw">draw</span>'
        : `<span class="badge ${m.winner}">${m.winner} wins</span>`;
      li.innerHTML = `
        <div class="ml-agents"><span class="team-red">${agentShort(m.redAgent)}</span><span class="vs">vs</span><span class="team-blue">${agentShort(m.blueAgent)}</span></div>
        <div class="ml-sub">${winBadge}<span>${m.scenarioName || m.scenarioId}</span><span>seed ${m.seed}</span><span>${m.rounds}r</span></div>`;
      li.addEventListener('click', () =>

 loadMatch(m));
      el.matchList.appendChild(li);
    }
    if (!matches.length) {
      el.matchList.innerHTML = '<li style="cursor:default;color:var(--muted)">No matches.</li>';
    }
  }

  // ---------- match loading ----------

  function loadMatch(entry) {
    state.activeKey = entry.key;
    renderMatchList();
    window.D20BENCH_REPLAY_LOAD = (payload) => {
      if (payload.key !== entry.key) return;
      startMatch(payload);
    };
    const script = document.createElement('script');
    script.src = entry.file;
    document.body.appendChild(script);
  }

  function startMatch(payload) {
    state.match = payload;
    state.timeline = buildTimeline(payload.replay);
    state.cursor = 0;
    state.playing = false;
    state.speed = state.speed || 1;
    state.lingering = [];
    state.currentGroup = null;
    state.currentRound = 0;
    resetSim();
    el.scrubber.max = String(Math.max(0, state.timeline.length - 1));
    el.scrubber.value = '0';
    el.battleLog.innerHTML = '';
    renderHeader();
    renderDecision(null);
    updatePlayButton();
    fitCanvas();
    updateHud();
    const params = new URLSearchParams(window.location.search);
    const t = Number(params.get('t'));
    if (Number.isFinite(t) && t > 0) {
      seek(t);
      params.delete('t');
    } else {
      draw(0);
    }
    if (params.get('play') === '1') setPlaying(true);
  }

  function renderHeader() {
    const m = state.match;
    const winnerText = m.winner === 'draw' ? 'Draw' : `${m.winner} wins`;
    el.matchHeader.innerHTML = `
      <span class="mh-agent team-red">${agentShort(m.redAgent)}</span>
      <span class="mh-vs">VS</span>
      <span class="mh-agent team-blue">${agentShort(m.blueAgent)}</span>
      <div class="mh-meta">
        <span>${m.scenarioName || m.scenarioId}</span>
        <span>seed ${m.seed}</span>
        <span class="badge ${m.winner === 'draw' ? 'draw' : m.winner}">${winnerText}</span>
      </div>`;
  }

  // ---------- timeline / simulation ----------

  function buildTimeline(replay) {
    const beats = [];
    for (const event of replay) {
      if (event.type === 'round_started') {
        beats.push({ kind: 'round', round: event.round, durationMs: 700 });
      } else if (event.type === 'action_resolved') {
        const anims = (event.events || []).filter((e) => e.kind !== 'turnStart' && e.kind !== 'roundStart');
        if (!anims.length) {
          beats.push({ kind: 'anim', ev: { kind: 'noop', durationMs: 180 }, group: event, groupStart: true });
        } else {
          anims.forEach((ev, i) => beats.push({ kind: 'anim', ev, group: event, groupStart: i === 0 }));
        }
      } else if (event.type === 'match_finished') {
        beats.push({ kind: 'finish', winner: event.winner, durationMs: 1200 });
      }
    }
    return beats;
  }

  function resetSim() {
    state.sim = new Map();
    for (const creature of state.match.creatures) {
      state.sim.set(creature.id, {
        pos: { ...(state.match.initialPositions[creature.id] || creature.finalPosition) },
        hp: creature.maxHp,
        alive: true,
        downed: false,
        stable: false,
        conditions: new Set(),
      });
    }
  }

  function applyBeat(beat) {
    if (beat.kind === 'round') { state.currentRound = beat.round; return; }
    if (beat.kind !== 'anim') return;
    const ev = beat.ev;
    const sim = state.sim;
    const get = (id) => sim.get(id);
    switch (ev.kind) {
      case 'move': if (get(ev.creatureId)) get(ev.creatureId).pos = { ...ev.to }; break;
      case 'hit': if (get(ev.targetId)) get(ev.targetId).hp = ev.targetHpAfter; break;
      case 'heal': {
        const c = get(ev.creatureId);
        if (c) { c.hp = ev.creatureHpAfter; if (c.hp > 0) { c.downed = false; c.stable = false; c.conditions.delete('unconscious'); } }
        break;
      }
      case 'aoeDamage':
        for (const t of ev.targets || []) { if (get(t.targetId)) get(t.targetId).hp = t.targetHpAfter; }
        break;
      case 'downed': {
        const c = get(ev.creatureId);
        if (c) { c.hp = 0; c.downed = true; c.stable = false; }
        break;
      }
      case 'death': if (get(ev.creatureId)) { get(ev.creatureId).alive = false; get(ev.creatureId).downed = false; } break;
      case 'deaths':
        for (const id of ev.creatureIds || []) { if (get(id)) { get(id).alive = false; get(id).downed = false; } }
        break;
      case 'stabilise': {
        const c = get(ev.creatureId);
        if (c) { c.stable = true; if (typeof ev.hpAfter === 'number' && ev.hpAfter > 0) { c.hp = ev.hpAfter; c.downed = false; } }
        break;
      }
      case 'stabiliseAlly': if (get(ev.targetId || ev.creatureId)) get(ev.targetId || ev.creatureId).stable = true; break;
      case 'condition': {
        const c = get(ev.creatureId);
        if (c) { ev.applied ? c.conditions.add(ev.condition) : c.conditions.delete(ev.condition); }
        break;
      }
      case 'conditionBatch':
        for (const entry of ev.entries || []) {
          const c = get(entry.creatureId);
          if (c) { entry.applied ? c.conditions.add(entry.condition) : c.conditions.delete(entry.condition); }
        }
        break;
      default: break;
    }
  }

  function seek(target, { rebuildLog = true } = {}) {
    target = Math.max(0, Math.min(target, state.timeline.length - 1));
    resetSim();
    state.currentRound = 0;
    state.lingering = [];
    if (rebuildLog) el.battleLog.innerHTML = '';
    let group = null;
    for (let i = 0; i < target; i += 1) {
      const beat = state.timeline[i];
      applyBeat(beat);
      if (rebuildLog) {
        if (beat.kind === 'round') appendRoundLog(beat.round);
        if (beat.kind === 'anim' && beat.groupStart) appendGroupLogs(beat.group);
      }
      if (beat.kind === 'anim') group = beat.group;
    }
    state.cursor = target;
    state.beatStart = performance.now();
    const beat = state.timeline[target];
    if (beat?.kind === 'anim') {
      if (beat.groupStart && rebuildLog) appendGroupLogs(beat.group);
      group = beat.group;
    } else if (beat?.kind === 'round' && rebuildLog) {
      appendRoundLog(beat.round);
    }
    state.currentGroup = group;
    renderDecision(group);
    updateHud();
    draw(0);
  }

  // ---------- playback ----------

  let rafId = null;
  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (!state.match) return;
    const beat = state.timeline[state.cursor];
    if (!beat) { setPlaying(false); draw(0); return; }
    const duration = Math.max(60, (beat.durationMs ?? beat.ev?.durationMs ?? 400) / state.speed);
    const progress = FREEZE_PROGRESS !== null && !state.playing
      ? FREEZE_PROGRESS
      : Math.min(1, (now - state.beatStart) / duration);
    if (state.playing && progress >= 1) {
      advanceBeat(now);
    }
    draw(progress);
  }

  function advanceBeat(now) {
    const beat = state.timeline[state.cursor];
    if (!beat) return;
    applyBeat(beat);
    addLingering(beat, now);
    state.cursor += 1;
    state.beatStart = now;
    el.scrubber.value = String(state.cursor);
    const next = state.timeline[state.cursor];
    if (!next) { setPlaying(false); updateHud(); return; }
    if (next.kind === 'round') appendRoundLog(next.round);
    if (next.kind === 'anim') {
      if (next.groupStart) appendGroupLogs(next.group);
      if (next.group !== state.currentGroup) {
        state.currentGroup = next.group;
        renderDecision(next.group);
      }
    }
    updateHud();
  }

  function addLingering(beat, now) {
    if (beat.kind !== 'anim') return;
    const ev = beat.ev;
    if (['hit', 'miss', 'heal', 'aoeDamage', 'downed', 'save', 'deathSave', 'deathSaveFail'].includes(ev.kind)) {
      state.lingering.push({ ev, until: now + 700 / state.speed });
    }
    state.lingering = state.lingering.filter((l) => l.until > now);
  }

  function setPlaying(playing) {
    state.playing = playing;
    state.beatStart = performance.now();
    updatePlayButton();
  }

  function updatePlayButton() {
    el.btnPlay.innerHTML = state.playing ? '&#10074;&#10074;' : '&#9654;';
  }

  function stepGroup(direction) {
    if (!state.match) return;
    setPlaying(false);
    const startGroup = state.timeline[state.cursor]?.group ?? null;
    let i = state.cursor;
    if (direction > 0) {
      while (i < state.timeline.length - 1) {
        i += 1;
        const beat = state.timeline[i];
        if (beat.kind === 'round' || (beat.kind === 'anim' && beat.group !== startGroup && beat.groupStart)) break;
      }
    } else {
      while (i > 0) {
        i -= 1;
        const beat = state.timeline[i];
        if (beat.kind === 'round' || (beat.kind === 'anim' && beat.group !== startGroup && beat.groupStart)) break;
      }
    }
    el.scrubber.value = String(i);
    seek(i);
  }

  function updateHud() {
    const total = state.match ? Math.max(1, state.match.replay.filter((e) => e.type === 'round_started').length) : 0;
    el.roundIndicator.textContent = state.match ? `Round ${Math.max(1, state.currentRound)} / ${total}` : '-';
    el.scrubber.value = String(state.cursor);
  }

  // ---------- panels ----------

  function actionLabel(action) {
    if (!action) return 'unknown action';
    const t = action.type;
    if (t === 'attack') return `${action.actionName} → ${action.targetName}`;
    if (t === 'move_to') return `Move to (${action.destination.x}, ${action.destination.y})`;
    if (t === 'move_toward') return `Move toward ${action.targetName}`;
    if (t === 'spell') return `${action.actionName}${action.targetName ? ` → ${action.targetName}` : ''}${action.center ? ` @ (${action.center.x},${action.center.y})` : ''}`;
    if (t === 'reaction') return action.reaction === 'decline' ? `Decline reaction (${action.targetName})` : `Reaction: ${action.actionName || action.reaction} → ${action.targetName}`;
    if (t === 'smite') return action.smite === 'decline' ? 'Decline Divine Smite' : `Divine Smite → ${action.targetName}`;
    if (t === 'class_feature') return action.label || action.feature;
    if (t === 'stabilise') return `Stabilise ${action.targetName}`;
    if (t === 'battlecast_tactic') return `BattleCast tactic: ${action.tactic}`;
    if (t === 'end_turn') return 'End turn';
    return `${t}${action.targetName ? ` → ${action.targetName}` : ''}`;
  }

  function renderDecision(group) {
    if (!group) {
      el.decisionBody.innerHTML = '<div class="mh-empty">Actions will appear here during playback.</div>';
      return;
    }
    const creature = state.match.creatures.find((c) => c.id === group.activeCreatureId);
    const img = creature ? tokenImage(creature) : null;
    const trace = group.llmTrace;
    el.decisionBody.innerHTML = `
      <div class="decision-actor">
        ${img ? `<img src="${img.src}" alt="" onerror="this.style.display='none'">` : ''}
        <div>
          <div class="da-name ${creature ? `team-${creature.team}` : ''}">${creature ? creature.displayName : group.activeCreatureId}</div>
          <div class="da-model">${trace ? trace.model : agentShort(group.agentId)}</div>
        </div>
      </div>
      <div class="decision-action">${actionLabel(group.acceptedAction)}</div>
      ${trace?.rationale ? `<div class="decision-rationale">${escapeHtml(trace.rationale)}</div>` : ''}
      ${trace ? `<div class="decision-meta">${trace.latencyMs ? `${(trace.latencyMs / 1000).toFixed(1)}s` : ''}${trace.attempts > 1 ? ` · ${trace.attempts} attempts` : ''}${trace.totalTokens ? ` · ${trace.totalTokens.toLocaleString()} tokens` : ''}</div>` : ''}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function appendRoundLog(round) {
    const div = document.createElement('div');
    div.className = 'log-entry log-round';
    div.textContent = `Round ${round}`;
    el.battleLog.appendChild(div);
    el.battleLog.scrollTop = el.battleLog.scrollHeight;
  }

  function appendGroupLogs(group) {
    for (const log of group.logs || []) {
      const div = document.createElement('div');
      const cls = log.type === 'damage' ? 'log-damage'
        : log.type === 'heal' ? 'log-heal'
        : /death|dies|Downed/i.test(log.action + log.details) ? 'log-death'
        : 'log-info';
      div.className = `log-entry ${cls}`;
      div.innerHTML = `<span class="log-actor">${escapeHtml(log.actor)}</span> · ${escapeHtml(log.details)}`;
      el.battleLog.appendChild(div);
    }
    if ((group.logs || []).length) el.battleLog.scrollTop = el.battleLog.scrollHeight;
  }

  // ---------- rendering ----------

  function fitCanvas() {
    const rect = el.board.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    el.board.width = rect.width * dpr;
    el.board.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function boardGeometry() {
    const rect = el.board.parentElement.getBoundingClientRect();
    const grid = state.match.gridSize;
    const cell = Math.min(CELL_MAX, Math.floor(Math.min(rect.width - 24, rect.height - 24) / grid));
    const originX = (rect.width - cell * grid) / 2;
    const originY = (rect.height - cell * grid) / 2;
    return { cell, originX, originY, grid, width: rect.width, height: rect.height };
  }

  function draw(progress) {
    if (!state.match) return;
    const geo = boardGeometry();
    const { cell, originX, originY, grid } = geo;
    ctx.clearRect(0, 0, geo.width, geo.height);

    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, geo.width, geo.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(originX, originY, cell * grid, cell * grid);

    const map = mapImage(state.match.mapImage);
    if (map && map.complete && map.naturalWidth) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(map, originX, originY, cell * grid, cell * grid);
      ctx.globalAlpha = 1;
    }

    for (const t of state.match.terrain || []) {
      const x = originX + t.x * cell;
      const y = originY + t.y * cell;
      if (t.kind === 'wall') {
        ctx.fillStyle = 'rgba(20, 15, 10, 0.45)';
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = 'rgba(20, 15, 10, 0.6)';
        ctx.strokeRect(x + 1, y + 1, cell - 2, cell - 2);
      } else {
        ctx.fillStyle = 'rgba(145, 30, 30, 0.28)';
        ctx.fillRect(x, y, cell, cell);
      }
    }

    ctx.strokeStyle = map ? 'rgba(30,26,22,0.22)' : 'rgba(30,26,22,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= grid; i += 1) {
      ctx.beginPath();
      ctx.moveTo(originX + i * cell, originY);
      ctx.lineTo(originX + i * cell, originY + grid * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(originX, originY + i * cell);
      ctx.lineTo(originX + grid * cell, originY + i * cell);
      ctx.stroke();
    }
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 1;
    ctx.strokeRect(originX, originY, grid * cell, grid * cell);

    const beat = state.timeline[state.cursor];
    const overridePos = new Map();
    if (beat?.kind === 'anim' && beat.ev.kind === 'move' && (state.playing || FREEZE_PROGRESS !== null)) {
      const path = beat.ev.path && beat.ev.path.length > 1 ? beat.ev.path : [beat.ev.from, beat.ev.to];
      const eased = easeInOutCubic(progress);
      const idx = Math.min(path.length - 2, Math.floor(eased * (path.length - 1)));
      const frac = eased * (path.length - 1) - idx;
      overridePos.set(beat.ev.creatureId, {
        x: path[idx].x + (path[idx + 1].x - path[idx].x) * frac,
        y: path[idx].y + (path[idx + 1].y - path[idx].y) * frac,
      });
    }

    let aoeEv = beat?.kind === 'anim' && beat.ev.kind === 'aoe' ? beat.ev : null;
    let aoeProgress = progress;
    if (!aoeEv && FREEZE_PROGRESS !== null && beat?.kind === 'anim' && beat.ev.kind === 'aoeDamage') {
      const prev = state.timeline[state.cursor - 1];
      if (prev?.kind === 'anim' && prev.ev.kind === 'aoe') { aoeEv = prev.ev; aoeProgress = 1; }
    }
    if (aoeEv) {
      const center = cellCenter(aoeEv.center, geo);
      const radius = (aoeEv.radius / 5) * cell * Math.min(1, aoeProgress * 1.4);
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(234, 88, 12, 0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const sorted = [...state.match.creatures].sort((a, b) => {
      const sa = state.sim.get(a.id); const sb = state.sim.get(b.id);
      return (sa.alive ? 1 : 0) - (sb.alive ? 1 : 0);
    });
    for (const creature of sorted) {
      drawCreature(creature, geo, overridePos.get(creature.id));
    }

    if (beat?.kind === 'anim' && beat.ev.kind === 'attack') {
      const from = simCenter(beat.ev.attackerId, geo);
      const to = simCenter(beat.ev.targetId, geo);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        const p = Math.min(1, progress * 1.3);
        ctx.lineTo(from.x + (to.x - from.x) * p, from.y + (to.y - from.y) * p);
        ctx.strokeStyle = beat.ev.cause === 'opportunity' ? '#ca8a04' : '#0d9488';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    const now = performance.now();
    for (const item of state.lingering) {
      drawFloater(item.ev, geo, 1 - Math.max(0, (item.until - now) / 700));
    }
    if (beat?.kind === 'anim') drawFloater(beat.ev, geo, progress * 0.4);

    if (beat?.kind === 'round') {
      drawBanner(`Round ${beat.round}`, geo, progress);
    }
    if (beat?.kind === 'finish') {
      const label = beat.winner === 'draw' ? 'Draw' : `${beat.winner.toUpperCase()} WINS`;
      drawBanner(label, geo, Math.min(progress, 0.5), beat.winner === 'red' ? '#e11d48' : beat.winner === 'blue' ? '#2563eb' : '#78716c');
    }
  }

  function cellCenter(pos, geo) {
    return {
      x: geo.originX + (pos.x + 0.5) * geo.cell,
      y: geo.originY + (pos.y + 0.5) * geo.cell,
    };
  }

  function simCenter(id, geo) {
    const sim = state.sim.get(id);
    return sim ? cellCenter(sim.pos, geo) : null;
  }

  function drawCreature(creature, geo, override) {
    const sim = state.sim.get(creature.id);
    if (!sim) return;
    const pos = override || sim.pos;
    const center = cellCenter(pos, geo);
    const radius = geo.cell * 0.42;
    const beat = state.timeline[state.cursor];
    const isActive = beat?.kind === 'anim' && beat.group?.activeCreatureId === creature.id;

    ctx.save();
    if (!sim.alive) ctx.globalAlpha = 0.25;

    if (isActive) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    const img = tokenImage(creature);
    if (img && img.complete && img.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, center.x - radius, center.y - radius, radius * 2, radius * 2);
      ctx.restore();
    } else {
      const gradient = ctx.createRadialGradient(center.x, center.y, radius * 0.2, center.x, center.y, radius);
      const color = TEAM_COLORS[creature.team];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, shade(color));
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${Math.round(radius)}px 'Outfit', 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(creature.displayName[0], center.x, center.y + 1);
    }

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = TEAM_COLORS[creature.team];
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (!sim.alive) {
      ctx.strokeStyle = 'rgba(30, 26, 22, 0.8)';
      ctx.lineWidth = 2.5;
      const s = radius * 0.5;
      ctx.beginPath();
      ctx.moveTo(center.x - s, center.y - s); ctx.lineTo(center.x + s, center.y + s);
      ctx.moveTo(center.x + s, center.y - s); ctx.lineTo(center.x - s, center.y + s);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (sim.downed) {
      ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
      ctx.font = `800 ${Math.max(9, geo.cell * 0.26)}px 'Outfit', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sim.stable ? 'STABLE' : 'DOWN', center.x, center.y - radius - 12);
    }

    const barW = radius * 1.6;
    const barH = 3.5;
    const frac = Math.max(0, sim.hp / creature.maxHp);
    ctx.fillStyle = 'rgba(30, 26, 22, 0.55)';
    ctx.fillRect(center.x - barW / 2, center.y + radius + 2, barW, barH);
    ctx.fillStyle = frac > 0.5 ? '#16a34a' : frac > 0.25 ? '#ca8a04' : '#dc2626';
    ctx.fillRect(center.x - barW / 2, center.y + radius + 2, barW * frac, barH);

    if (sim.conditions.size) {
      ctx.fillStyle = '#9333ea';
      let cx = center.x - ((sim.conditions.size - 1) * 5) / 2;
      for (let i = 0; i < Math.min(4, sim.conditions.size); i += 1) {
        ctx.beginPath();
        ctx.arc(cx, center.y + radius + 10, 2.4, 0, Math.PI * 2);
        ctx.fill();
        cx += 5.5;
      }
    }
    ctx.restore();
  }

  function drawFloater(ev, geo, progress) {
    const rise = 14 * progress;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = Math.max(0, 1 - progress);
    const fontPx = Math.max(11, geo.cell * 0.38);
    ctx.font = `800 ${fontPx}px 'Outfit', 'Inter', sans-serif`;
    if (ev.kind === 'hit') {
      const c = simCenter(ev.targetId, geo);
      if (c) {
        ctx.fillStyle = DMG_COLORS[ev.damageType] || '#dc2626';
        ctx.font = `800 ${ev.critical ? fontPx * 1.4 : fontPx}px 'Outfit', sans-serif`;
        ctx.fillText(`-${ev.damage}${ev.critical ? '!' : ''}`, c.x, c.y - geo.cell * 0.6 - rise);
      }
    } else if (ev.kind === 'miss') {
      const c = simCenter(ev.targetId, geo);
      if (c) { ctx.fillStyle = '#78716c'; ctx.fillText('miss', c.x, c.y - geo.cell * 0.6 - rise); }
    } else if (ev.kind === 'heal') {
      const c = simCenter(ev.creatureId, geo);
      if (c) { ctx.fillStyle = '#16a34a'; ctx.fillText(`+${ev.amount}`, c.x, c.y - geo.cell * 0.6 - rise); }
    } else if (ev.kind === 'aoeDamage') {
      for (const t of ev.targets || []) {
        const c = simCenter(t.targetId, geo);
        if (c) {
          ctx.fillStyle = DMG_COLORS[t.damageType] || '#dc2626';
          ctx.fillText(`-${t.damage}`, c.x, c.y - geo.cell * 0.6 - rise);
        }
      }
    } else if (ev.kind === 'save') {
      const c = simCenter(ev.targetId, geo);
      if (c) { ctx.fillStyle = ev.success ? '#16a34a' : '#dc2626'; ctx.fillText(ev.success ? 'save' : 'fail', c.x, c.y - geo.cell * 0.6 - rise); }
    } else if (ev.kind === 'deathSave' || ev.kind === 'deathSaveFail') {
      const c = simCenter(ev.creatureId, geo);
      const ok = ev.outcome === 'success';
      if (c) { ctx.fillStyle = ok ? '#16a34a' : '#dc2626'; ctx.fillText(ok ? 'death save ✓' : 'death save ✗', c.x, c.y - geo.cell * 0.6 - rise); }
    } else if (ev.kind === 'effect' && ev.label) {
      const c = simCenter(ev.creatureId, geo);
      if (c) { ctx.fillStyle = '#0d9488'; ctx.fillText(ev.label, c.x, c.y - geo.cell * 0.6 - rise); }
    } else if (ev.kind === 'oaAvoided') {
      const c = simCenter(ev.moverId, geo);
      if (c) { ctx.fillStyle = '#78716c'; ctx.fillText('OA avoided', c.x, c.y - geo.cell * 0.6 - rise); }
    }
    ctx.restore();
  }

  function drawBanner(text, geo, progress, color = '#1e1a16') {
    const slide = easeInOutCubic(Math.min(1, progress * 2));
    ctx.save();
    ctx.globalAlpha = slide;
    const cx = geo.width / 2;
    const cy = geo.originY + geo.cell * geo.grid * 0.12;
    ctx.font = `800 26px 'Outfit', 'Inter', sans-serif`;
    ctx.textAlign = 'center';
    const w = ctx.measureText(text).width + 44;
    roundRect(cx - w / 2, cy - 24, w, 42, 21);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(30,26,22,0.15)';
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(text, cx, cy + 6);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function shade(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.floor(((n >> 16) & 255) * 0.55);
    const g = Math.floor(((n >> 8) & 255) * 0.55);
    const b = Math.floor((n & 255) * 0.55);
    return `rgb(${r},${g},${b})`;
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // ---------- events ----------

  el.seasonSelect.addEventListener('change', renderMatchList);
  el.matchFilter.addEventListener('input', renderMatchList);
  el.btnPlay.addEventListener('click', () => setPlaying(!state.playing));
  el.btnRestart.addEventListener('click', () => { if (state.match) { seek(0); setPlaying(false); } });
  el.btnBack.addEventListener('click', () => stepGroup(-1));
  el.btnFwd.addEventListener('click', () => stepGroup(1));
  el.scrubber.addEventListener('input', () => { setPlaying(false); seek(Number(el.scrubber.value)); });
  document.querySelectorAll('.speed-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach((other) => other.classList.remove('active'));
      btn.classList.add('active');
      state.speed = Number(btn.dataset.speed);
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') return;
    if (event.code === 'Space') { event.preventDefault(); setPlaying(!state.playing); }
    if (event.code === 'ArrowRight') stepGroup(1);
    if (event.code === 'ArrowLeft') stepGroup(-1);
  });
  window.addEventListener('resize', () => { if (state.match) { fitCanvas(); draw(0); } });

  // ---------- boot ----------

  renderSeasons();
  const bootParams = new URLSearchParams(window.location.search);
  const requested = bootParams.get('m') && INDEX.matches.find((m) => m.key === bootParams.get('m'));
  if (requested) el.seasonSelect.value = requested.seasonId;
  renderMatchList();
  const firstMatch = requested || INDEX.matches.find((m) => m.seasonId === el.seasonSelect.value);
  if (firstMatch) loadMatch(firstMatch);
  rafId = requestAnimationFrame(tick);
})();
