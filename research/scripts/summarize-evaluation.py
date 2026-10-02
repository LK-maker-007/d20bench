import json
import sys
from collections import defaultdict

from stats import fair_coin_tail, wilson

if len(sys.argv) != 3:
    sys.exit('usage: python3 summarize-evaluation.py <matches.jsonl> <agent-id>')
path, agent = sys.argv[1], sys.argv[2]

# Per (scenario, opponent): wins, draws, games, games as red. Draws count as non-wins.
cells = defaultdict(lambda: [0, 0, 0, 0])
for line in open(path):
    row = json.loads(line)
    if row['red'] == agent:
        side, opponent = 'red', row['blue']
    elif row['blue'] == agent:
        side, opponent = 'blue', row['red']
    else:
        continue
    cell = cells[(row['scenario'], opponent)]
    cell[0] += row['winner'] == side
    cell[1] += row['winner'] == 'draw'
    cell[2] += 1
    cell[3] += side == 'red'

# Exact one-sided binomial test of win rate > 0.5, Holm-corrected across all pairings, at 0.025:
# the one-sided level of a two-sided 95% interval, so a pass means the Holm-corrected exact bound clears 0.5.
ranked = sorted(cells, key=lambda key: fair_coin_tail(cells[key][0], cells[key][2]))
holm = {}
running = 0.0
for rank, key in enumerate(ranked):
    running = max(running, min(1.0, (len(ranked) - rank) * fair_coin_tail(cells[key][0], cells[key][2])))
    holm[key] = running

print(f'agent {agent}, {sum(cell[2] for cell in cells.values())} games, draws count as non-wins, '
      'pass = Holm-adjusted one-sided exact binomial p < 0.025\n')
print('| scenario | opponent | wins | draws | games | as red | win rate | 95% Wilson | p (win rate > 0.5) | Holm p | passes |')
print('|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|')
for key in sorted(cells):
    wins, draws, games, as_red = cells[key]
    lo, hi = wilson(wins, games)
    p = fair_coin_tail(wins, games)
    verdict = 'yes' if holm[key] < 0.025 else 'no'
    print(f'| {key[0]} | {key[1]} | {wins} | {draws} | {games} | {as_red} | {wins / games:.3f} | [{lo:.3f}, {hi:.3f}] | {p:.3g} | {holm[key]:.3g} | {verdict} |')
