#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${1:-${repo_dir}/artifacts/android}"

mkdir -p "${output_dir}"

docker buildx build \
  --platform linux/amd64 \
  --file "${repo_dir}/infra/docker/Dockerfile.android" \
  --target artifact \
  --output "type=local,dest=${output_dir}" \
  --build-arg "EXPO_PUBLIC_API_BASE_URL=${EXPO_PUBLIC_API_BASE_URL:-https://buildy-140j.onrender.com}" \
  --build-arg "EXPO_PUBLIC_APP_ENV=${EXPO_PUBLIC_APP_ENV:-production}" \
  --build-arg "EXPO_PUBLIC_SITE_URL=${EXPO_PUBLIC_SITE_URL:-https://tazakhabar-site.pages.dev}" \
  "${repo_dir}"

echo "APK written to ${output_dir}/tazakhabar-release.apk"

