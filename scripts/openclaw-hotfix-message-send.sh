#!/usr/bin/env bash
set -euo pipefail

# Hotfix: OpenClaw message(action=send) false-positive poll detection when tool adapters inject empty/default poll fields.
# Upstream context:
# - Issue: https://github.com/openclaw/openclaw/issues/48928
# - PR:    https://github.com/openclaw/openclaw/pull/40431 (as of 2026-03-17: open, not merged)
#
# What we patch (runtime dist):
# 1) hasPollCreationParams: numeric (and numeric-string) poll params count as poll intent only if > 0
# 2) runMessageAction: drop empty components payloads (e.g. components.modal.fields: []) to avoid validation failures

say() { echo "[danghuangshang][openclaw-hotfix] $*"; }

die() { echo "[danghuangshang][openclaw-hotfix][ERROR] $*" >&2; exit 1; }

OPENCLAW_BIN="${OPENCLAW_BIN:-$(command -v openclaw || true)}"
[ -n "$OPENCLAW_BIN" ] || die "openclaw not found in PATH"

# Resolve install root robustly.
# In many installs (including nvm-global), `openclaw` resolves directly to `.../openclaw/openclaw.mjs`.
OPENCLAW_BIN_REAL="$(readlink -f "$OPENCLAW_BIN" 2>/dev/null || echo "$OPENCLAW_BIN")"

if [[ "$OPENCLAW_BIN_REAL" == */openclaw.mjs ]]; then
  OPENCLAW_ROOT="$(cd "$(dirname "$OPENCLAW_BIN_REAL")" && pwd)"
  DIST_DIR="$OPENCLAW_ROOT/dist"
else
  # Fallback: derive from the openclaw CLI wrapper directory (common for some global installs)
  OPENCLAW_BIN_DIR="$(cd "$(dirname "$OPENCLAW_BIN_REAL")" && pwd)"
  OPENCLAW_PREFIX="$(cd "$OPENCLAW_BIN_DIR/.." && pwd)"
  OPENCLAW_ROOT="$OPENCLAW_PREFIX/lib/node_modules/openclaw"
  DIST_DIR="$OPENCLAW_ROOT/dist"

  # Fallback 1: if OPENCLAW_BIN_DIR itself is .../lib/node_modules/.bin
  if [ ! -d "$DIST_DIR" ]; then
    if [[ "$OPENCLAW_BIN_DIR" == */lib/node_modules/.bin ]]; then
      OPENCLAW_PREFIX="$(cd "$OPENCLAW_BIN_DIR/../../.." && pwd)"
      OPENCLAW_ROOT="$OPENCLAW_PREFIX/lib/node_modules/openclaw"
      DIST_DIR="$OPENCLAW_ROOT/dist"
    fi
  fi

  # Fallback 2: resolve via node module resolution (works for some non-prefix installs)
  if [ ! -d "$DIST_DIR" ]; then
    OPENCLAW_MJS="$(node -p "require.resolve('openclaw/openclaw.mjs')" 2>/dev/null || true)"
    [ -n "$OPENCLAW_MJS" ] || die "dist dir not found via prefix layout ($DIST_DIR), and cannot resolve openclaw/openclaw.mjs via node"
    OPENCLAW_ROOT="$(cd "$(dirname "$OPENCLAW_MJS")" && pwd)"
    DIST_DIR="$OPENCLAW_ROOT/dist"
  fi
fi

[ -d "$DIST_DIR" ] || die "dist dir not found: $DIST_DIR"

REPLY_FILE="$(ls -1 "$DIST_DIR"/reply-*.js 2>/dev/null | head -n 1 || true)"
[ -n "$REPLY_FILE" ] || die "reply-*.js not found under $DIST_DIR"

say "openclaw bin: $OPENCLAW_BIN"
say "openclaw root: $OPENCLAW_ROOT"
say "patch target: $REPLY_FILE"

backup="$REPLY_FILE.bak.danghuangshang.$(date +%Y%m%d%H%M%S)"
cp -a "$REPLY_FILE" "$backup"
say "backup written: $backup"

# Patch 1: hasPollCreationParams numeric guard: > 0
# Apply twice: number literal branch + any duplicated occurrences
perl -0777 -i -pe 's/\(typeof value === "number" && Number\.isFinite\(value\)\) return true;/\(typeof value === "number" && Number.isFinite\(value\) && value > 0\) return true;/g' "$REPLY_FILE"

# Patch 1b: numeric-string branch: enforce > 0 (align with PR #40431)
# Replace the simple Number.isFinite(Number(trimmed)) check with numericValue > 0.
perl -0777 -i -pe 's/if \(trimmed\.length > 0 && Number\.isFinite\(Number\(trimmed\)\)\) return true;/if (trimmed.length > 0) {\n\t\t\t\t\t\tconst numericValue = Number(trimmed);\n\t\t\t\t\t\tif (Number.isFinite(numericValue) && numericValue > 0) return true;\n\t\t\t\t\t}/g' "$REPLY_FILE"

# Patch 2: drop empty components payloads after parseComponentsParam(params);
# Insert only if not already present.
if ! grep -q "hotfix: drop empty components payloads" "$REPLY_FILE"; then
  perl -0777 -i -pe 's/(parseComponentsParam\(params\);\n)/$1\t\t\/\/ hotfix: drop empty components payloads (tool adapters may include empty arrays)\n\t\ttry {\n\t\t\tconst c = params.components;\n\t\t\tif (c && typeof c === "object") {\n\t\t\t\tif (c.modal && typeof c.modal === "object" && Array.isArray(c.modal.fields) && c.modal.fields.length === 0) {\n\t\t\t\t\tdelete c.modal;\n\t\t\t\t}\n\t\t\t\tif (Array.isArray(c.blocks) && c.blocks.length === 0) {\n\t\t\t\t\tdelete c.blocks;\n\t\t\t\t}\n\t\t\t\tconst keys = Object.keys(c);\n\t\t\t\tif (keys.length === 0) delete params.components;\n\t\t\t}\n\t\t} catch (e) {\n\t\t\t\/\/ ignore\n\t\t}\n/s' "$REPLY_FILE"
fi

say "patch applied. Recommended: restart gateway (openclaw gateway restart)"
