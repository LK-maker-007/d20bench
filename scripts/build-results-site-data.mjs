import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const resultsRoot = path.join(repoRoot, "results");
const siteRoot = path.join(repoRoot, "apps", "results-site");
const includeProgressOnly =
  process.argv.includes("--include-progress-only") || process.env.D20BENCH_INCLUDE_PROGRESS_ONLY === "1";

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

async function listDirectories(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

function hasPublishableResults(season, progress) {
  if (!season) {
    return true;
  }

  const matchCount = Array.isArray(season.matches) ? season.matches.length : 0;
  const failedMatches = Number(progress?.failedMatches ?? season.failedMatches ?? 0);
  return matchCount > 0 || failedMatches === 0;
}

async function readSeasons() {
  const seasonIds = await listDirectories(path.join(resultsRoot, "seasons"));
  const seasons = [];

  for (const seasonId of seasonIds) {
    const jsonPath = path.join(resultsRoot, "seasons", seasonId, "standings.json");
    const progressPath = path.join(resultsRoot, "seasons", seasonId, "progress.json");
    const season = await readJsonIfExists(jsonPath);
    const progress = await readJsonIfExists(progressPath);

    if ((season || (includeProgressOnly && progress)) && hasPublishableResults(season, progress)) {
      seasons.push({
        ...(season || {
          seasonId: progress.seasonId || seasonId,
          description: progress.description || "In-progress benchmark season.",
          generatedAt: progress.startedAt || progress.updatedAt,
          initialRating: 1000,
          kFactor: 32,
          standings: [],
          battleTypeStandings: [],
          matches: [],
          costSummary: progress.costSummary,
        }),
        progress,
        sourcePath: path.relative(repoRoot, season ? jsonPath : progressPath),
        progressPath: progress ? path.relative(repoRoot, progressPath) : undefined,
      });
    }
  }

  return seasons.sort((a, b) => {
    const aDate = a.generatedAt || a.progress?.updatedAt || a.progress?.startedAt || 0;
    const bDate = b.generatedAt || b.progress?.updatedAt || b.progress?.startedAt || 0;
    const byDate = Date.parse(bDate) - Date.parse(aDate);
    return byDate || String(a.seasonId).localeCompare(String(b.seasonId));
  });
}

async function readMatchReports() {
  const reportIds = await listDirectories(path.join(resultsRoot, "matches"));
  const reports = [];

  for (const reportId of reportIds) {
    const jsonPath = path.join(resultsRoot, "matches", reportId, "report.json");
    try {
      const report = await readJson(jsonPath);
      reports.push({
        reportId,
        ...report,
        sourcePath: path.relative(repoRoot, jsonPath),
      });
    } catch (error) {
      if (!error || error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return reports.sort((a, b) => {
    const byDate = Date.parse(b.generatedAt || 0) - Date.parse(a.generatedAt || 0);
    return byDate || String(a.reportId).localeCompare(String(b.reportId));
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  seasons: await readSeasons(),
  matchReports: await readMatchReports(),
};

await mkdir(siteRoot, { recursive: true });
await writeFile(
  path.join(siteRoot, "data.js"),
  `window.D20BENCH_RESULTS = ${JSON.stringify(payload, null, 2)};\n`,
);

console.log(
  `Wrote ${path.relative(repoRoot, path.join(siteRoot, "data.js"))} with ${payload.seasons.length} season(s) and ${payload.matchReports.length} match report(s).`,
);
