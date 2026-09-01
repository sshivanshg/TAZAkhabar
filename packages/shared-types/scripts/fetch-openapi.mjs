#!/usr/bin/env node
/**
 * Fetch OpenAPI JSON from a running TazaKhabar API and write the snapshot
 * used by NSwag generation.
 *
 * Default: http://localhost:8080/openapi/v1.json
 * Override: OPENAPI_URL=https://... node scripts/fetch-openapi.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'openapi')
const outFile = path.join(outDir, 'openapi.json')
const url = process.env.OPENAPI_URL ?? 'http://localhost:8080/openapi/v1.json'

const response = await fetch(url)
if (!response.ok) {
  console.error(`Failed to fetch OpenAPI from ${url}: ${response.status}`)
  process.exit(1)
}

// CI diffs this snapshot byte-for-byte against the live document, so persist
// the exact response bytes — re-serializing would change empty-object spacing
// (`{ }` vs `{}`), key order, and the trailing newline and fail the check.
const document = await response.text()
await mkdir(outDir, { recursive: true })
await writeFile(outFile, document, 'utf8')
console.log(`Wrote ${outFile}`)
