#!/bin/sh
# Writes the runtime config before nginx starts: the same image runs in develop, qa and main,
# only GATEWAY_URL changes (an environment variable, never rebuilt into the bundle).
set -eu

cat > /usr/share/nginx/html/config.js <<EOF
window.__OPTI_CONFIG__ = { gatewayUrl: "${GATEWAY_URL:-http://localhost:8000}" };
EOF

# Renders the /remotes/* proxy targets. Locally these default to the Docker Compose service names;
# on a host like Render, where a free service can only receive traffic on its public URL (not the
# private network), each is overridden with that portal's public HTTPS URL instead.
: "${AUTH_PORTAL_URL:=http://auth-portal}"
: "${CUSTOMERS_PORTAL_URL:=http://customers-portal}"
: "${PRODUCTS_PORTAL_URL:=http://products-portal}"
: "${SALES_PORTAL_URL:=http://sales-portal}"
export AUTH_PORTAL_URL CUSTOMERS_PORTAL_URL PRODUCTS_PORTAL_URL SALES_PORTAL_URL
envsubst '${AUTH_PORTAL_URL} ${CUSTOMERS_PORTAL_URL} ${PRODUCTS_PORTAL_URL} ${SALES_PORTAL_URL}' \
    < /etc/nginx/shell-template/shell.conf.template > /etc/nginx/conf.d/shell.conf

exec "$@"
