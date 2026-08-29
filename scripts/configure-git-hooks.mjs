import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)))

// Docker build contexts intentionally exclude .git. In a real checkout, keep
// the repository's checked-in pre-push hook enabled as before.
if (!existsSync(join(repoRoot, '.git'))) {
  process.exit(0)
}

const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], {
  cwd: repoRoot,
  stdio: 'inherit',
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)

