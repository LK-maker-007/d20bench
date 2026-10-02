import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const watched = process.argv.slice(3);
if (!dir) {
  console.error('usage: node summarize-cpu-profile.mjs <cpu-prof-dir> [function-name ...]');
  process.exit(2);
}

const file = readdirSync(dir).find((name) => name.endsWith('.cpuprofile'));
const profile = JSON.parse(readFileSync(join(dir, file), 'utf8'));
const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
const parents = new Map();
for (const node of profile.nodes) for (const child of node.children ?? []) parents.set(child, node.id);

const label = (frame) => `${frame.functionName || '(anonymous)'} ${frame.url.split('/').at(-1)}:${frame.lineNumber}`;
const selfTime = new Map();
const inclusiveTime = new Map();
let total = 0;
for (let i = 0; i < profile.samples.length; i += 1) {
  const node = nodes.get(profile.samples[i]);
  const dt = profile.timeDeltas[i];
  total += dt;
  selfTime.set(label(node.callFrame), (selfTime.get(label(node.callFrame)) ?? 0) + dt);
  // Inclusive time counts each function once per sample, however deep the recursion.
  const seen = new Set();
  for (let id = node.id; id !== undefined; id = parents.get(id)) {
    const name = nodes.get(id).callFrame.functionName;
    if (seen.has(name)) continue;
    seen.add(name);
    inclusiveTime.set(name, (inclusiveTime.get(name) ?? 0) + dt);
  }
}

const pct = (value) => `${((100 * value) / total).toFixed(1).padStart(5)}%`;
console.log(`sampled ${(total / 1e6).toFixed(2)} s`);
if (watched.length > 0) {
  console.log('inclusive time:');
  for (const name of watched) console.log(`  ${pct(inclusiveTime.get(name) ?? 0)}  ${name}`);
}
console.log('top self time:');
for (const [name, value] of [...selfTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.log(`  ${pct(value)}  ${name}`);
}
