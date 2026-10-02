#!/usr/bin/env bash
set -euo pipefail

seeds="${1:-200}"
out="${2:-research/data/bot-matrix.jsonl}"
bots=(battlecast.smart battlecast.aggressive battlecast.kiting battlecast.defensive)
scenarios=(
  public.goblin-duel.v1
  public.goblin-warband-6v6.v1
  public.hero-mirror-balanced-l5.v1
  public.hero-mirror-chokepoint-l5.v1
  public.hero-mirror-status-l5.v1
)

# Every ordered pair, mirrors included, so each bot plays both sides.
jobs=()
for scenario in "${scenarios[@]}"; do
  for red in "${bots[@]}"; do
    for blue in "${bots[@]}"; do
      jobs+=("$red $blue $scenario $seeds")
    done
  done
done

: > "$out"
printf '%s\n' "${jobs[@]}" | xargs -P "$(nproc)" -L 1 node research/scripts/bot-pair.mjs | tee -a "$out"
echo "wrote $(wc -l < "$out") pairings to $out"
