#!/usr/bin/env bash
set -euo pipefail

# Backup OpenMOSS governance state (tasks, reviews, patrol alerts, activity log)
# Default state dir: ~/.openclaw/state/openmoss
# Override via OPENMOSS_STATE_DIR

TS="$(date +%Y%m%d%H%M%S)"
HOME_DIR="${HOME:-/home/ubuntu}"
STATE_DIR_DEFAULT="$HOME_DIR/.openclaw/state/openmoss"
STATE_DIR="${OPENMOSS_STATE_DIR:-$STATE_DIR_DEFAULT}"
BACKUP_DIR_DEFAULT="$HOME_DIR/.openclaw/backup"
BACKUP_DIR="${OPENMOSS_BACKUP_DIR:-$BACKUP_DIR_DEFAULT}"
OUT="$BACKUP_DIR/openmoss-state-$TS.tgz"

mkdir -p "$BACKUP_DIR"

if [ ! -d "$STATE_DIR" ]; then
  echo "ERROR: OpenMOSS state dir not found: $STATE_DIR" >&2
  echo "Tip: set OPENMOSS_STATE_DIR if your state lives elsewhere." >&2
  exit 1
fi

# Basic sanity: refuse to back up gigantic dirs accidentally
SIZE_MB=$(du -sm "$STATE_DIR" | awk '{print $1}')
if [ "$SIZE_MB" -gt 2048 ]; then
  echo "ERROR: Refusing to back up $STATE_DIR (size ${SIZE_MB}MB > 2048MB)" >&2
  echo "Set OPENMOSS_STATE_DIR correctly or back up manually." >&2
  exit 1
fi

tar -C "$(dirname "$STATE_DIR")" -czf "$OUT" "$(basename "$STATE_DIR")"

echo "OK: backed up OpenMOSS state"
echo "  from: $STATE_DIR"
echo "  to:   $OUT"
