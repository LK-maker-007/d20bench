import json
import sys
from collections import defaultdict

from stats import wilson

if len(sys.argv) < 2:
    sys.exit('usage: python3 summarize-parity.py <matches.jsonl> [more.jsonl ...]')

# Per (tactic, scenario): imitator wins, draws, games, games as red. Draws count as non-wins.
cells = defaultdict(lambda: [0, 0, 0, 0])
for path in sys.argv[1:]:
    for line in open(path):
        row = json.loads(line)
        for side, other in (('red', 'blue'), ('blue', 'red')):
            agent, opponent = row[side], row[other]
            if not agent.startswith('lk-47.imitate-'):
                continue
            tactic = agent.removeprefix('lk-47.imitate-')
            if opponent != f'battlecast.{tactic}':
                continue
            cell = cells[(tactic, row['scenario'])]
            cell[0] += row['winner'] == side
            cell[1] += row['winner'] == 'draw'
            cell[2] += 1
            cell[3] += side == 'red'

print('imitator against its own bot; pass = not significantly worse, 95% Wilson upper bound >= 0.5\n')
print('| tactic | scenario | imitator wins | draws | games | as red | win rate | 95% Wilson | passes |')
print('|---|---|---:|---:|---:|---:|---:|---|---|')
for (tactic, scenario), (wins, draws, games, as_red) in sorted(cells.items()):
    lo, hi = wilson(wins, games)
    print(f'| {tactic} | {scenario} | {wins} | {draws} | {games} | {as_red} | {wins / games:.3f} | [{lo:.3f}, {hi:.3f}] | {"yes" if hi >= 0.5 else "no"} |')
