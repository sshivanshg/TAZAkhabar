---
name: khabro-database
description: Change or review Khabro's EF Core data model, migrations in infra/migrations, seed catalogs, indexes and Neon Postgres queries.
---

# Khabro Database

Source: [docs/architecture/03-data-model.md](../../../docs/architecture/03-data-model.md).

- EF Core `apps/api/Data/AppDbContext.cs`, entities in `apps/api/Data/Entities/`; Neon Postgres in prod, Postgres 16 via `docker-compose.yml` locally.
- Migrations are compiled into the API from `infra/migrations/**/*.cs`. Generate with:
  `dotnet ef migrations add <Name> --project apps/api/TazaKhabar.Api.csproj --output-dir ../../infra/migrations --namespace TazaKhabar.Api.Migrations`
- Never edit an applied/merged migration; add a new one (seed catalog changes included).
- Production applies pending migrations on API boot; CI uploads a migration SQL artifact - review it before merging schema PRs. Manual `.github/workflows/migrate-production.yml` exists for pre-deploy applies.
- Add indexes for new filters; keep feed queries bounded by retention (`ArticleRetention__Days`) and paging.
- Unique `Article.SourceUrl` dedupe exists; preserve it.
- Backups are Neon-managed; before risky migrations confirm retention and prefer a Neon branch for rehearsal (see 08-hosting-and-ci.md).
- Update `03-data-model.md` in the same change.
