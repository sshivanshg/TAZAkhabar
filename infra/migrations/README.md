# EF Core migrations

Migrations for `NewsFeed.Api` are generated into this folder and compiled into the API assembly.

Development and test API boots apply pending relational migrations automatically. Production does **not** auto-apply migrations on API startup; schema changes are an explicit release step.

CI generates an idempotent SQL artifact (`backend-migration-sql`) with:

```bash
dotnet ef migrations script \
  --project apps/api/NewsFeed.Api.csproj \
  --idempotent \
  --output artifacts/newsfeed-migrations.sql
```

Review that SQL before merging schema-changing PRs. To apply production migrations, run the `Migrate Production Database` GitHub workflow manually after the reviewed SQL is accepted. It uses `PRODUCTION_DATABASE_CONNECTION_STRING` from production environment secrets.

You can still run migrations manually against a local or staging database:

```bash
dotnet ef database update --project apps/api/NewsFeed.Api.csproj
```

## Add a new migration

From the repo root:

```bash
dotnet ef migrations add <Name> \
  --project apps/api/NewsFeed.Api.csproj \
  --output-dir ../../infra/migrations \
  --namespace NewsFeed.Api.Migrations
```

After generating, confirm **all** of these landed in this folder (not under `apps/api/...`):

- `*_Name.cs`
- `*_Name.Designer.cs`
- `AppDbContextModelSnapshot.cs`

If the snapshot was written under a nested `NewsFeed/Api/Migrations` path, move it here before committing.

## Rules

- Never edit a migration that has already been applied or merged to `main`.
- Always add a **new** migration for schema changes.
- Do not use `dotnet ef migrations remove` against shared/applied history — prefer a forward-fix migration.
