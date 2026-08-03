#!/usr/bin/env node
/**
 * Fetch OpenAPI JSON from a running NewsFeed API and write the snapshot
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

const document = await response.json()
await mkdir(outDir, { recursive: true })
await writeFile(outFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
console.log(`Wrote ${outFile}`)
