#!/usr/bin/env node
/**
 * Generate TypeScript DTO interfaces from the committed OpenAPI document
 * using NSwag (OpenAPI → TS).
 *
 * Workflow:
 * 1. Start the API locally (or use CI artifact)
 * 2. pnpm --filter @tazakhabar/shared-types fetch-openapi
 * 3. pnpm --filter @tazakhabar/shared-types generate
 * 4. Commit openapi/openapi.json + src/generated.ts in the same PR as API contract changes
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(root, '..')
const openapiPath = path.join(packageRoot, 'openapi', 'openapi.json')
const nswagConfig = path.join(packageRoot, 'nswag.json')

if (!existsSync(openapiPath)) {
  console.error(
    `Missing ${openapiPath}. Run: pnpm --filter @tazakhabar/shared-types fetch-openapi`,
  )
  process.exit(1)
}

const result = spawnSync(
  'pnpm',
  ['exec', 'nswag', 'run', nswagConfig],
  { cwd: packageRoot, stdio: 'inherit', shell: process.platform === 'win32' },
)

process.exit(result.status ?? 1)
