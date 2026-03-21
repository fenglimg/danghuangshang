#!/usr/bin/env bash
set -euo pipefail

# Smoke 的目标：在不依赖 Discord 的情况下，用 CLI 触发 OpenProse VM 跑通一个最小 .prose。
# 注意：如果固定 session-id 的历史被早期失败 run 弄脏，可能出现 transcript repair / missing tool result。
# 因此这里默认使用一个“新鲜”的 smoke session-id（可通过环境变量覆盖）。

SESSION_ID="${OPENPROSE_SESSION_ID:-danghuangshang-openprose-smoke}"
PROGRAM_REL="prose/demos/01-smoke.prose"
WORKSPACE_BASE="/root/clawd"
SRC_PROGRAM="$(pwd)/${PROGRAM_REL}"
DST_PROGRAM="${WORKSPACE_BASE}/${PROGRAM_REL}"

echo "[smoke] repo=$(pwd)"

if ! command -v openclaw >/dev/null 2>&1; then
  echo "[smoke] ERROR: openclaw not found in PATH" >&2
  exit 1
fi

if [[ ! -f "${SRC_PROGRAM}" ]]; then
  echo "[smoke] ERROR: source program not found: ${SRC_PROGRAM}" >&2
  exit 1
fi

mkdir -p "$(dirname "${DST_PROGRAM}")"
cp -f "${SRC_PROGRAM}" "${DST_PROGRAM}"

echo "[smoke] openclaw: $(openclaw --version 2>/dev/null || true)"
echo "[smoke] session-id=${SESSION_ID}"
echo "[smoke] program=${DST_PROGRAM}"

openclaw agent \
  --session-id "${SESSION_ID}" \
  --message "prose run ${DST_PROGRAM}" \
  --timeout 600
