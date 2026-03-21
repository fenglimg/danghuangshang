#!/usr/bin/env bash
set -euo pipefail

demo=${1:-}
input=${2:-}

if [[ -z "${demo}" || -z "${input}" ]]; then
  echo "Usage: $0 <triage|review|release> <input-file>" >&2
  exit 2
fi

if [[ ! -f "${input}" ]]; then
  echo "Input not found: ${input}" >&2
  exit 2
fi

echo "[demo] ${demo} input=${input}"

# 占位：等确认 prose 的实际运行入口后，在此调用。
cat "${input}"
