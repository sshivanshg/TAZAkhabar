const { gzipSync } = require('node:zlib')
const { readdirSync, readFileSync, statSync } = require('node:fs')
const { join, relative } = require('node:path')

const root = join(__dirname, '..', 'dist')
const extensions = new Set(['.js', '.css'])

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      walk(path, files)
      continue
    }
    if ([...extensions].some((ext) => path.endsWith(ext))) {
      files.push(path)
    }
  }
  return files
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`
}

const assets = walk(root)
  .map((path) => {
    const buffer = readFileSync(path)
    return {
      path: relative(root, path),
      raw: buffer.length,
      gzip: gzipSync(buffer).length,
    }
  })
  .sort((a, b) => b.raw - a.raw)

const totals = assets.reduce(
  (sum, item) => ({ raw: sum.raw + item.raw, gzip: sum.gzip + item.gzip }),
  { raw: 0, gzip: 0 },
)

console.log(`Web JS/CSS total: ${kib(totals.raw)} raw, ${kib(totals.gzip)} gzip`)
console.table(
  assets.slice(0, 10).map((item) => ({
    asset: item.path,
    raw: kib(item.raw),
    gzip: kib(item.gzip),
  })),
)
