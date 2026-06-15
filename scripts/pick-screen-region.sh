#!/usr/bin/env bash
set -euo pipefail

RESULT_FILE="${1:-}"

pick_with_slurp() {
  local geometry
  if ! geometry="$(slurp 2>/dev/null)"; then
    echo '{"cancelled":true}'
    return 0
  fi
  geometry="$(echo "$geometry" | xargs)"
  if [[ "$geometry" =~ ^(-?[0-9]+),(-?[0-9]+)[[:space:]]+([0-9]+)x([0-9]+)$ ]]; then
    printf '{"x":%s,"y":%s,"width":%s,"height":%s}\n' \
      "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[4]}"
    return 0
  fi
  echo '{"error":"Failed to parse slurp output"}' >&2
  exit 1
}

pick_with_slop() {
  local geometry
  if ! geometry="$(slop -f '%x,%y,%w,%h' 2>/dev/null)"; then
    echo '{"cancelled":true}'
    return 0
  fi
  IFS=',' read -r x y width height <<< "$geometry"
  if [[ -z "${x:-}" || -z "${y:-}" || -z "${width:-}" || -z "${height:-}" ]]; then
    echo '{"cancelled":true}'
    return 0
  fi
  printf '{"x":%s,"y":%s,"width":%s,"height":%s}\n' "$x" "$y" "$width" "$height"
}

json=''
if [[ -n "${WAYLAND_DISPLAY:-}" ]] && command -v slurp >/dev/null 2>&1; then
  json="$(pick_with_slurp)"
elif command -v slop >/dev/null 2>&1; then
  json="$(pick_with_slop)"
else
  echo '{"error":"Install slop (X11) or slurp (Wayland) to pick a screen region"}' >&2
  exit 1
fi

if [[ -n "$RESULT_FILE" ]]; then
  printf '%s' "$json" > "$RESULT_FILE"
fi
printf '%s\n' "$json"
