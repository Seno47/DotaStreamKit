#!/usr/bin/env bash
set -euo pipefail

X="${1:?}"
Y="${2:?}"
WIDTH="${3:?}"
HEIGHT="${4:?}"
OUTPUT="${5:?}"

if ! command -v grim >/dev/null 2>&1; then
  echo "grim is required for Wayland screen capture" >&2
  exit 1
fi

grim -g "${X},${Y} ${WIDTH}x${HEIGHT}" "$OUTPUT"
