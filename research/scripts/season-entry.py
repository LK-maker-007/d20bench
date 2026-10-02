import json
import sys

if len(sys.argv) < 4 or len(sys.argv) % 2:
    sys.exit('usage: python3 season-entry.py <season standings.json> <entry.jsonl> <agent-id> [<entry.jsonl> <agent-id> ...]')
season_path = sys.argv[1]
season = json.load(open(season_path))
initial, k_factor = season['initialRating'], season['kFactor']
slots = {(match['scenarioId'], match['seed']) for match in season['matches'] if 'battlecast.smart' in (match['redAgent'], match['blueAgent'])}
scenario_order = list(dict.fromkeys(match['scenarioId'] for match in season['matches']))


# Each entry plays the slots every LLM played against battlecast.smart, once each from both sides.
def load_entry(entry_path: str, agent: str) -> list[dict]:
    entry = [json.loads(line) for line in open(entry_path)]
    entry = [row for row in entry if agent in (row['red'], row['blue']) and 'battlecast.smart' in (row['red'], row['blue'])]
    played = {(row['scenario'], row['seed'], row['red'] == agent) for row in entry}
    expected = {(scenario, seed, as_red) for scenario, seed in slots for as_red in (True, False)}
    if played != expected or len(entry) != len(expected):
        sys.exit(f'{entry_path}: expected exactly the {len(expected)} season slots against battlecast.smart, found {sorted(played)}')
    # Appended after the season, in the season's own scenario order, then seed, then the entry as red first.
    return sorted(entry, key=lambda row: (scenario_order.index(row['scenario']), row['seed'], row['red'] != agent))


# Several entries are appended one after another, in the order given.
entries = [(agent, load_entry(path, agent)) for path, agent in zip(sys.argv[2::2], sys.argv[3::2])]


def expected_score(rating: float, opponent: float) -> float:
    return 1 / (1 + 10 ** ((opponent - rating) / 400))


# The season's own update (packages/engine/src/ratings.ts, applyMatchRating), one match at a time in order.
ratings: dict[str, float] = {}
record: dict[str, list[int]] = {}
games = [(match['redAgent'], match['blueAgent'], match['winner']) for match in season['matches']]
games += [(row['red'], row['blue'], row['winner']) for _, entry in entries for row in entry]
for red, blue, winner in games:
    red_before, blue_before = ratings.get(red, initial), ratings.get(blue, initial)
    red_score = 1.0 if winner == 'red' else 0.0 if winner == 'blue' else 0.5
    ratings[red] = red_before + k_factor * (red_score - expected_score(red_before, blue_before))
    ratings[blue] = blue_before + k_factor * ((1 - red_score) - expected_score(blue_before, red_before))
    for name, score in ((red, red_score), (blue, 1 - red_score)):
        wins_losses = record.setdefault(name, [0, 0, 0])
        wins_losses[0 if score == 1 else 1 if score == 0 else 2] += 1

for agent, entry in entries:
    for row in entry:
        side = 'red' if row['red'] == agent else 'blue'
        print(f"{row['scenario']} seed {row['seed']}, {agent} as {side}: {'won' if row['winner'] == side else 'lost'}")
print(f'\n{season["seasonId"]} with {", ".join(agent for agent, _ in entries)} appended, start {initial}, K {k_factor}\n')
print('| rank | agent | Elo | W-L-D |')
print('|---:|---|---:|---|')
for rank, (name, rating) in enumerate(sorted(ratings.items(), key=lambda item: -item[1]), start=1):
    print(f'| {rank} | {name} | {rating:.1f} | {"-".join(map(str, record[name]))} |')
