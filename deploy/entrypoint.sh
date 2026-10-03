#!/bin/sh
# Writes the runtime config before nginx starts: the same image runs in develop, qa and main,
# only GATEWAY_URL changes (an environment variable, never rebuilt into the bundle).
set -eu

cat > /usr/share/nginx/html/config.js <<EOF
window.__OPTI_CONFIG__ = { gatewayUrl: "${GATEWAY_URL:-http://localhost:8000}" };
EOF

exec "$@"
