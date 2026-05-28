#!/bin/sh
cd "$(dirname "$0")" || exit 1
node stop-catan.js >/dev/null 2>&1
node start-catan.js --foreground
