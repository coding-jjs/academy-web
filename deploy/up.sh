#!/usr/bin/env bash
# Lightsail 인스턴스에서 이미지 빌드 → 마이그레이션 → 앱/Caddy 기동.
# academy-web 에서: ./deploy/up.sh
# bundled-db 시험: ./deploy/up.sh --bundled-db

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
    echo ".env 가 없습니다. deploy/lightsail.env.example 을 .env 로 복사하세요." >&2
    exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ -z "${APP_DOMAIN:-}" || -z "${CADDY_EMAIL:-}" ]]; then
    echo "APP_DOMAIN 과 CADDY_EMAIL 을 .env 에 넣으세요." >&2
    exit 1
fi
if [[ -z "${DATABASE_URL:-}" || -z "${DIRECT_URL:-}" ]]; then
    echo "DATABASE_URL 과 DIRECT_URL 을 .env 에 넣으세요." >&2
    exit 1
fi
if [[ -z "${AUTH_SECRET:-}" ]]; then
    echo "AUTH_SECRET 을 .env 에 넣으세요. (openssl rand -base64 32)" >&2
    exit 1
fi

profile_args=()
if [[ "${1:-}" == "--bundled-db" ]]; then
    if [[ -z "${POSTGRES_PASSWORD:-}" ]]; then
        echo "--bundled-db 는 POSTGRES_PASSWORD 가 필요합니다." >&2
        exit 1
    fi
    profile_args=(--profile bundled-db)
fi

docker compose "${profile_args[@]}" build

if [[ "${1:-}" == "--bundled-db" ]]; then
    docker compose "${profile_args[@]}" up -d --wait postgres
fi

docker compose "${profile_args[@]}" run --rm migrate
docker compose "${profile_args[@]}" up -d app caddy
docker compose "${profile_args[@]}" ps
