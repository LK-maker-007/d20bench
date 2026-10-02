import json
import sys

if len(sys.argv) != 3:
    sys.exit('usage: python3 compare-bot-matrix.py <reference.jsonl> <candidate.jsonl>')

# Wall-clock seconds and line order vary between runs; every game outcome must not.
fields = ('n', 'redWins', 'blueWins', 'draws', 'meanRounds')


def load(path: str) -> dict:
    rows = {}
    for line in open(path):
        row = json.loads(line)
        key = (row['scenario'], row['red'], row['blue'])
        if key in rows:
            sys.exit(f'{path}: duplicate pairing {key}')
        rows[key] = tuple(row[field] for field in fields)
    return rows


reference, candidate = load(sys.argv[1]), load(sys.argv[2])
missing = sorted(reference.keys() - candidate.keys())
extra = sorted(candidate.keys() - reference.keys())
changed = sorted(key for key in reference.keys() & candidate.keys() if reference[key] != candidate[key])
for key in missing:
    print('missing', key)
for key in extra:
    print('extra', key)
for key in changed:
    print('changed', key, dict(zip(fields, reference[key])), '->', dict(zip(fields, candidate[key])))
print(f'{len(reference)} reference pairings, {len(candidate)} candidate pairings: '
      f'{len(missing)} missing, {len(extra)} extra, {len(changed)} changed')
sys.exit(1 if missing or extra or changed else 0)
