#!/usr/bin/env bash
set -euo pipefail

# Smoke 的目标：确认“有一个可用入口”能执行最简单 prose workflow。
# 当前先做占位：收集环境信息 + 给出下一步提示。

echo "[smoke] repo=$(pwd)"

if command -v openclaw >/dev/null 2>&1; then
  echo "[smoke] openclaw: $(openclaw --version 2>/dev/null || true)"
else
  echo "[smoke] ERROR: openclaw not found in PATH"
  exit 1
fi

echo "[smoke] NOTE: open-prose 入口尚未在此脚本中固化。"
echo "[smoke] Next: 运行 'openclaw help' / 'openclaw plugins'（如支持）并在 runbook 里记录可用入口。"
