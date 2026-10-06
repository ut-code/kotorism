# Open a copy of the production DB (SQLite) in an interactive sqlite3 shell, or run a single query
# Requires sqlite3 to be installed locally
#   just sql user@ip
#   just sql user@ip 'select count(*) from "user"'
# The copy is opened read-only.

app_uuid := env_var_or_default("COOLIFY_APP_UUID", "j96hoyha8v2vqwkqm1stmid9")

sql target *query:
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    ssh {{target}} 'c=$(docker ps --filter "name=^{{app_uuid}}" -q | head -n1); test -n "$c" || { echo "container not found" >&2; exit 1; }; docker exec "$c" cat /data/prod.db' > "$tmp/prod.db"
    test -s "$tmp/prod.db" || { echo "Failed to fetch the DB (empty file)" >&2; exit 1; }
    chmod 444 "$tmp/prod.db"
    q={{quote(query)}}
    if [ -n "$q" ]; then
        sqlite3 -readonly "$tmp/prod.db" "$q"
    else
        sqlite3 -readonly "$tmp/prod.db"
    fi
