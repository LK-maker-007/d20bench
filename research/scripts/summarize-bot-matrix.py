import json
import sys
from collections import defaultdict

from stats import wilson

path = sys.argv[1] if len(sys.argv) > 1 else 'research/data/bot-matrix.jsonl'
rows = [json.loads(line) for line in open(path)]
by_key = {(r['scenario'], r['red'], r['blue']): r for r in rows}
scenarios = sorted({r['scenario'] for r in rows})
bots = sorted({r['red'] for r in rows} | {r['blue'] for r in rows})

for scenario in scenarios:
    print(f'\n### {scenario}\n')
    print('| bot | opponent | wins | games | win rate | 95% Wilson |')
    print('|---|---|---:|---:|---:|---|')
    totals = defaultdict(lambda: [0, 0])
    for a in bots:
        for b in bots:
            if a >= b:
                continue
            ab = by_key.get((scenario, a, b))
            ba = by_key.get((scenario, b, a))
            if not ab or not ba:
                continue
            # Pool both side assignments so side bias cancels.
            wins = ab['redWins'] + ba['blueWins']
            draws = ab['draws'] + ba['draws']
            games = ab['n'] + ba['n']
            score = wins + 0.5 * draws
            lo, hi = wilson(wins, games)
            print(f'| {a} | {b} | {wins} | {games} | {wins / games:.3f} | [{lo:.3f}, {hi:.3f}] |')
            totals[a][0] += score
            totals[a][1] += games
            totals[b][0] += games - score
            totals[b][1] += games
    print('\n| bot | score vs the other bots | mirror: red wins / games |')
    print('|---|---:|---|')
    for bot in sorted(totals, key=lambda name: -totals[name][0] / totals[name][1]):
        mirror = by_key.get((scenario, bot, bot))
        mirror_text = f"{mirror['redWins']} / {mirror['n']}" if mirror else 'n/a'
        print(f'| {bot} | {totals[bot][0] / totals[bot][1]:.3f} | {mirror_text} |')
