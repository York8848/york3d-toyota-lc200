#!/bin/sh
# Optional convenience launcher for this Mac's bundled Codex runtime. Standard Node + npm is preferred on a new computer.
set -eu
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  exec npm "$@"
fi
runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
if [ -x "$runtime/node" ] && [ -f .tools/npm/bin/npm-cli.js ]; then
  PATH="$PWD/.tools/bin:$runtime:$PATH"
  export PATH
  exec "$runtime/node" .tools/npm/bin/npm-cli.js "$@"
fi
printf '%s\n' 'Install Node.js 22.12+ with npm, then run npm ci.' >&2
exit 1
