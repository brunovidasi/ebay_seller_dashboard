#!/usr/bin/env bash
# Generates a self-signed TLS cert for local HTTPS dev.
# eBay's RuName (redirect URL) config forces https:// for the auth-accepted URL,
# so the backend must serve HTTPS even in local dev. This cert is self-signed
# (not added to any system trust store), so browsers will show a one-time
# security warning when visiting https://localhost:4000 directly.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/certs"
mkdir -p "$DIR"

if [[ -f "$DIR/localhost-cert.pem" && -f "$DIR/localhost-key.pem" ]]; then
  echo "Dev TLS cert already exists at $DIR — skipping."
  exit 0
fi

openssl req -x509 -newkey rsa:2048 \
  -keyout "$DIR/localhost-key.pem" \
  -out "$DIR/localhost-cert.pem" \
  -days 3650 -nodes -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Generated dev TLS cert at $DIR"
