#!/usr/bin/env bash
# After API edits, remind the agent to consider shared-types regeneration.
set -euo pipefail

input=$(cat)
path=$(printf '%s' "$input" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("file_path") or d.get("path") or "")' 2>/dev/null || true)

# Only remind for endpoint/DTO/OpenAPI-relevant C# files.
if printf '%s' "$path" | grep -Eq '\.(cs)$' && printf '%s' "$path" | grep -Eq 'apps/api/'; then
  if printf '%s' "$path" | grep -Eqi 'Program\.cs|Endpoints|Dtos|Models|Contracts|OpenApi|Map(Get|Post|Put|Delete|Patch)'; then
    cat <<'EOF'
{
  "additional_context": "API file changed. Ask the user whether packages/shared-types need regenerating from the OpenAPI document, and whether the web API client must be updated in this same PR. Do not silently skip shared-types updates for contract changes."
}
EOF
    exit 0
  fi
fi

echo '{}'
exit 0
