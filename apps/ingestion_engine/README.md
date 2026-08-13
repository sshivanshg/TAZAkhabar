# NewsFeed extraction worker

Python multi-tier article extractor (newspaper4k → trafilatura → Playwright) that POSTs into the .NET API. The API owns Postgres, Claude summaries, and feed publishing.

## Setup

```bash
cd apps/ingestion_engine
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
playwright install chromium
```

Env (see repo `.env.example`):

- `API_BASE_URL` — e.g. `http://localhost:8080`
- `INGEST_KEY` — same as `RssIngest__Secret`
- `WORKER_HOST` / `WORKER_PORT` — default `127.0.0.1:8090`
- API must set `ExtractionWorker__BaseUrl=http://127.0.0.1:8090`

## Run HTTP worker (admin “Run now”)

```bash
export API_BASE_URL=http://localhost:8080
export INGEST_KEY=dev-ingest-key
python -m ingestion_engine.server
# or: python -m ingestion_engine.main --serve
```

Keep this process running, then use Admin → Sources → **Run now** on a Scrape source.

## CLI

```bash
python -m ingestion_engine.main --source-id 8 --limit 10
python -m ingestion_engine.main --all --dry-run
```

## Tests

```bash
pytest
```
