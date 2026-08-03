# EF Core migrations

Migrations for `NewsFeed.Api` are generated into this folder and compiled into the API assembly.

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
