#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
REPO_ROOT="$(readlink -f "$SCRIPT_DIR/..")"
DEFAULT_SOURCE="$REPO_ROOT/../eaf_ressources"
DEFAULT_REMOTE_ROOT="/srv/eaf_ressources"
DEFAULT_APP_DIR="/opt/eaf_platform"
DEFAULT_EXCLUDES=("env_scraping/")
REQUIRED_DIRS=("Annales_EAF" "Documents_Extraits" "Oeuvres" "Videos" "eaf_rapport_jury")

SSH_TARGET="${1:-}"
SOURCE_DIR="${RESSOURCES_SOURCE_DIR:-$DEFAULT_SOURCE}"
REMOTE_ROOT="${RESSOURCES_REMOTE_ROOT:-$DEFAULT_REMOTE_ROOT}"
APP_DIR="${APP_DIR:-$DEFAULT_APP_DIR}"
ALLOW_DELETE="false"
INCLUDE_SCRAPING_ENV="false"

usage() {
  cat <<EOF
Usage: $0 <user@host> [--allow-delete] [--include-env-scraping]

Environment variables:
  RESSOURCES_SOURCE_DIR   Override local source directory
  RESSOURCES_REMOTE_ROOT  Override remote durable ressources root
  APP_DIR                 Override remote app directory for compatibility symlink
EOF
}

if [ -z "$SSH_TARGET" ]; then
  usage
  exit 1
fi

shift || true
while [ "$#" -gt 0 ]; do
  case "$1" in
    --allow-delete)
      ALLOW_DELETE="true"
      ;;
    --include-env-scraping)
      INCLUDE_SCRAPING_ENV="true"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

for required_dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$SOURCE_DIR/$required_dir" ]; then
    echo "Missing required source directory: $SOURCE_DIR/$required_dir" >&2
    exit 1
  fi
done

FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -eq 0 ]; then
  echo "Source directory contains no files: $SOURCE_DIR" >&2
  exit 1
fi

RSYNC_ARGS=(
  -a
  --human-readable
  --info=progress2,stats
  --partial
  --append-verify
)

if [ "$ALLOW_DELETE" = "true" ]; then
  RSYNC_ARGS+=(--delete-delay)
fi

if [ "$INCLUDE_SCRAPING_ENV" != "true" ]; then
  for exclude in "${DEFAULT_EXCLUDES[@]}"; do
    RSYNC_ARGS+=(--exclude="$exclude")
  done
fi

REMOTE_SETUP=$(cat <<EOF
set -euo pipefail
mkdir -p "$REMOTE_ROOT"
mkdir -p "$APP_DIR"
EOF
)

ssh "$SSH_TARGET" "$REMOTE_SETUP"
rsync "${RSYNC_ARGS[@]}" -e ssh "$SOURCE_DIR/" "$SSH_TARGET:$REMOTE_ROOT/"

REMOTE_VERIFY=$(cat <<EOF
set -euo pipefail
printf 'remote_root=%s\n' "$REMOTE_ROOT"
ls -ld "$REMOTE_ROOT"
printf 'files='; find "$REMOTE_ROOT" -type f | wc -l
printf 'dirs='; find "$REMOTE_ROOT" -type d | wc -l
du -sh "$REMOTE_ROOT"
EOF
)

ssh "$SSH_TARGET" "$REMOTE_VERIFY"
