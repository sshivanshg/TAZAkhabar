# apps/

- **Reader:** Expo universal app at [`apps/app`](./app) (web + iOS + Android). See [`apps/app/README.md`](./app/README.md) and the [root README](../README.md).
- **Admin:** Vite editorial SPA at [`apps/admin`](./admin) (internal; ADR-006). Separate Cloudflare Pages origin from the reader.
- **API:** .NET 8 Minimal API at [`apps/api`](./api).

Product name placeholder: **TazaKhabar**. Do not add a separate Vite/CRA **reader** — web is exported from Expo (`docs/adr/003-expo-universal-client.md`). Admin Vite is the narrow exception (`docs/adr/006-internal-admin-spa.md`).

Living architecture: [`docs/architecture/`](../docs/architecture/).
