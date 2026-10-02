import json
import sys
from collections import defaultdict

from stats import fair_coin_tail, wilson

if len(sys.argv) != 5:
    sys.exit('usage: python3 compare-paired.py <a.jsonl> <agent-a> <b.jsonl> <agent-b>')


def outcomes(path: str, agent: str) -> dict[tuple, bool]:
    games = {}
    for line in open(path):
        row = json.loads(line)
        if agent not in (row['red'], row['blue']):
            continue
        side = 'red' if row['red'] == agent else 'blue'
        opponent = row['blue'] if side == 'red' else row['red']
        key = (row['scenario'], opponent, row['seed'], side)
        if key in games:
            sys.exit(f'{path}: {agent} has two games for {key}')
        games[key] = row['winner'] == side
    return games


a_path, a_agent, b_path, b_agent = sys.argv[1:]
a, b = outcomes(a_path, a_agent), outcomes(b_path, b_agent)
shared = a.keys() & b.keys()
print(f'{b_agent} against {a_agent}, paired on scenario, opponent, seed and side: {len(shared)} pairs, '
      f'{len(a.keys() - shared)} unpaired in A, {len(b.keys() - shared)} unpaired in B\n')

# Per (scenario, opponent) and pooled per opponent: [A wins, B wins, B won and A lost, A won and B lost, pairs].
cells = defaultdict(lambda: [0, 0, 0, 0, 0])
for key in shared:
    for cell in (cells[(key[0], key[1])], cells[('pooled', key[1])]):
        cell[0] += a[key]
        cell[1] += b[key]
        cell[2] += b[key] and not a[key]
        cell[3] += a[key] and not b[key]
        cell[4] += 1

# Exact one-sided McNemar test: under "B no stronger than A", each discordant pair is a fair coin.
print(f'| scenario | opponent | pairs | {a_agent} win rate [95% Wilson] | {b_agent} win rate [95% Wilson] | only {b_agent} won | only {a_agent} won | p ({b_agent} stronger) |')
print('|---|---|---:|---|---|---:|---:|---:|')
for key in sorted(cells, key=lambda key: (key[1], key[0] == 'pooled', key[0])):
    a_wins, b_wins, b_only, a_only, pairs = cells[key]
    a_lo, a_hi = wilson(a_wins, pairs)
    b_lo, b_hi = wilson(b_wins, pairs)
    p = fair_coin_tail(b_only, b_only + a_only)
    print(f'| {key[0]} | {key[1]} | {pairs} | {a_wins / pairs:.3f} [{a_lo:.3f}, {a_hi:.3f}] | '
          f'{b_wins / pairs:.3f} [{b_lo:.3f}, {b_hi:.3f}] | {b_only} | {a_only} | {p:.3g} |')
