import json
from collections import Counter, defaultdict
from math import comb

from stats import wilson


def season(name: str) -> dict:
    return json.load(open(f'results/seasons/{name}/standings.json'))


def matches_per_agent(data: dict, agent_id: str) -> int:
    return sum(1 for m in data['matches'] if agent_id in (m['redAgent'], m['blueAgent']))


fairfix = season('llm-actual-fairfix-tournament-v2')
print('## llm-actual-fairfix-tournament-v2 head to head\n')
print('| agent A | agent B | A wins | B wins | draws |')
print('|---|---|---:|---:|---:|')
h2h = defaultdict(lambda: [0, 0, 0])
for m in fairfix['matches']:
    a, b = sorted([m['redAgent'], m['blueAgent']])
    winner_agent = {'red': m['redAgent'], 'blue': m['blueAgent']}.get(m['winner'])
    h2h[(a, b)][0 if winner_agent == a else 1 if winner_agent == b else 2] += 1
for (a, b), (wa, wb, d) in sorted(h2h.items()):
    print(f'| {a} | {b} | {wa} | {wb} | {d} |')

print('\nwins by side:', dict(Counter(m['winner'] for m in fairfix['matches'])))
for scenario in sorted({m['scenarioId'] for m in fairfix['matches']}):
    print(f'wins by side, {scenario}:', dict(Counter(m['winner'] for m in fairfix['matches'] if m['scenarioId'] == scenario)))

print('\n## LLM cost per match\n')
print('| season | agent | matches | cost USD | USD per match |')
print('|---|---|---:|---:|---:|')
for name in ('llm-actual-fairfix-tournament-v2', 'llm-frontier-public-v1'):
    data = season(name)
    for row in data['costSummary']['byModel']:
        n = matches_per_agent(data, row['agentId'])
        print(f"| {name} | {row['agentId']} | {n} | {row['estimatedCostUsd']:.2f} | {row['estimatedCostUsd'] / n:.3f} |")


def clear_probability(p: float, n: int, target: float) -> float:
    k_min = next((k for k in range(n + 1) if wilson(k, n)[0] > target), n + 1)
    return sum(comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(k_min, n + 1))


def games_for_power(p: float, target: float, power: float = 0.8) -> int | None:
    return next((n for n in range(4, 3000) if clear_probability(p, n, target) >= power), None)


print('\n## Games per opponent for the 95% Wilson lower bound to clear a target')
print('"Break-even" assumes the observed rate equals the true rate, which happens about half the time.')
print('"80% power" is the exact binomial probability of clearing the target at least 80% of the time.\n')
print('| true win rate | > 0.5 break-even | > 0.5 at 80% power | > 0.6 break-even | > 0.6 at 80% power |')
print('|---:|---:|---:|---:|---:|')
for p in (0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9):
    cells = []
    for target in (0.5, 0.6):
        even = next((n for n in range(4, 5000) if wilson(round(p * n), n)[0] > target), None)
        powered = games_for_power(p, target) if p > target else None
        cells += [str(even) if even else '>5000', str(powered) if powered else 'n/a']
    print(f'| {p} | ' + ' | '.join(cells) + ' |')
