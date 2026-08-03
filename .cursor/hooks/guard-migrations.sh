#!/usr/bin/env bash
# Warn before editing or removing already-checked-in EF migrations.
set -euo pipefail

input=$(cat)
command=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("command",""))' 2>/dev/null || true)

# Always allow listing / adding new migrations; flag remove or in-place edits of infra/migrations.
if printf '%s' "$command" | grep -Eqi 'Remove-Migration|dotnet ef migrations remove'; then
  cat <<'EOF'
{
  "permission": "ask",
  "user_message": "Removing an EF migration can rewrite history. Prefer a new migration if the previous one was already applied or merged.",
  "agent_message": "Do not edit or remove migrations that are already applied/merged under /infra/migrations. Create a new migration instead. Check existing files in /infra/migrations before proposing schema changes."
}
EOF
  exit 0
fi

if printf '%s' "$command" | grep -Eqi 'infra/migrations|Migrations/'; then
  cat <<'EOF'
{
  "permission": "ask",
  "user_message": "Migration-related command detected. Confirm you are adding a NEW migration, not editing an applied one.",
  "agent_message": "Before any schema change: inspect /infra/migrations. Never edit a migration that has already been applied or merged — always add a new migration."
}
EOF
  exit 0
fi

echo '{ "permission": "allow" }'
exit 0
