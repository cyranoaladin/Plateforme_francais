#!/usr/bin/env python3
import secrets
import os

# Générer secrets
SESSION_SECRET = secrets.token_hex(32)
CSRF_SECRET = secrets.token_hex(32)
CRON_SECRET = secrets.token_hex(32)
MCP_API_KEY = secrets.token_hex(16)

env_content = f"""# === ENVIRONNEMENT PRODUCTION LOCALE ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === BASE DE DONNÉES ===
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eaf_local_prod
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/eaf_local_prod

# === SÉCURITÉ ===
SESSION_SECRET={SESSION_SECRET}
CSRF_SECRET={CSRF_SECRET}
CRON_SECRET={CRON_SECRET}

# === REDIS ===
REDIS_URL=redis://localhost:6379

# === MCP SERVER ===
MCP_SERVER_URL=http://localhost:3100
MCP_API_KEY={MCP_API_KEY}
MCP_TRANSPORT=http

# === COOKIES ===
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# === LOGS ===
LOG_LEVEL=info
LOG_PRETTY=false

# === LLM ===
LLM_ROUTER_ENABLED=true

# === E2E TESTS ===
E2E_USER_EMAIL=jean@eaf.local
E2E_USER_PASSWORD=demo1234
"""

with open('.env.local', 'w') as f:
    f.write(env_content)

print("✅ .env.local créé avec secrets générés")
print(f"SESSION_SECRET: {SESSION_SECRET[:20]}...")
print(f"CSRF_SECRET: {CSRF_SECRET[:20]}...")
print(f"CRON_SECRET: {CRON_SECRET[:20]}...")
print(f"MCP_API_KEY: {MCP_API_KEY[:20]}...")
