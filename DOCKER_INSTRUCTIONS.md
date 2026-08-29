# TazaKhabar Docker Instructions

This guide is for development on a restricted laptop where Node.js, pnpm,
.NET, Java, Gradle, or Android Studio cannot be installed. Only Git and Docker
Desktop are required on the laptop.

## 1. Before you start

Ask the company IT team to confirm that Docker Desktop is permitted. The first
run must be able to download packages and images from Docker Hub, npm, Google
Android, Gradle, Maven Central, and Google's Maven repository.

Recommended resources for the Android build:

- At least 8 GB RAM available to Docker Desktop
- At least 20 GB free disk space for images, the Android SDK, NDK, and caches

Confirm Docker is running:

```bash
docker version
docker compose version
```

Both commands must succeed before continuing. Run all commands below from the
repository root—the directory containing `docker-compose.yml`.

## 2. Run the reader application

Start the reader, API, and local PostgreSQL database:

```bash
docker compose up --build
```

The first startup is slower because Docker downloads images and pnpm installs
the frontend packages inside its container.

Open these addresses after the services have started:

| Service | Address |
|---------|---------|
| Reader | http://localhost:19006 |
| API health | http://localhost:8080/api/health |
| OpenAPI | http://localhost:8080/openapi/v1.json |
| PostgreSQL | `localhost:5432` |

Keep the terminal open while developing. Changes made under `apps/app` are
bind-mounted into the reader container and should hot-reload in the browser.

Press `Ctrl+C` to stop the foreground process, then remove the stopped
containers:

```bash
docker compose down
```

Database data and dependency caches remain available for the next startup.

## 3. Run the complete local stack

The admin and marketing site are optional tools. Start them together with the
reader, API, and database using:

```bash
docker compose --profile tools up --build
```

| Additional service | Address |
|--------------------|---------|
| Admin | http://localhost:5173 |
| Marketing site | http://localhost:5174 |

The local admin credentials come from `.env.example` and are only development
values. Never use or deploy them as production credentials.

## 4. Daily development commands

Start in the background:

```bash
docker compose up --build --detach
```

View service status:

```bash
docker compose ps
```

Follow reader and API logs:

```bash
docker compose logs --follow reader api
```

Restart one service:

```bash
docker compose restart reader
```

Stop the stack without deleting local data:

```bash
docker compose down
```

## 5. Build an Android APK

The APK builder contains Node, pnpm, JDK 17, Android API 36, the Android NDK,
and Gradle. Nothing from that toolchain needs to be installed on the laptop.

Build the APK:

```bash
docker compose run --build --rm apk
```

The first Android build can take a long time and download several gigabytes.
Later builds reuse Docker's build cache.

The finished file is written to:

```text
artifacts/android/tazakhabar-release.apk
```

The default APK connects to the hosted TazaKhabar API. This is intentional:
`localhost` inside an APK installed on a phone refers to the phone, not the
development laptop.

To compile a different reachable API address into the APK:

macOS, Linux, Git Bash, or WSL:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.example.com docker compose run --build --rm apk
```

Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "https://api.example.com"
docker compose run --build --rm apk
```

`EXPO_PUBLIC_*` values are visible in the compiled application. Never put API
keys, passwords, database connections, or other secrets in them.

### Install the APK on a phone

1. Transfer `artifacts/android/tazakhabar-release.apk` to the Android phone.
2. Allow the Files/browser application to install unknown apps when Android
   prompts for permission.
3. Open the APK and select **Install**.
4. Revoke the unknown-app installation permission afterward if it is no longer
   needed.

This APK uses the generated debug keystore and is intended for internal testing
and sideloading. It is not the final Google Play artifact. Google Play delivery
requires a properly signed Android App Bundle (`.aab`), created using the
production EAS profile and production signing credentials.

## 6. Troubleshooting

### A port is already in use

Find the conflicting port in `docker-compose.yml`. Change only the host-side
number on the left. For example, change `"19006:19006"` to `"19007:19006"`,
then open http://localhost:19007.

### Frontend dependencies are stale

Reset containers, the local database, and all dependency caches:

```bash
docker compose down --volumes
docker compose up --build
```

Warning: `--volumes` deletes the local Docker PostgreSQL data. It does not
delete production data.

### Rebuild images without cache

```bash
docker compose build --no-cache reader api
docker compose up
```

### Reader cannot call the API

Check the API and database logs:

```bash
docker compose logs api postgres
```

Confirm http://localhost:8080/api/health works in the laptop's browser.

### APK build runs out of memory

Increase the memory allocated to Docker Desktop, close other heavy programs,
and retry:

```bash
docker compose run --build --rm apk
```

### Company network blocks downloads

The company firewall or proxy must allow Docker Hub, npm, Android SDK, Gradle,
and Maven downloads. If IT cannot allow these domains or Docker Desktop itself,
run builds in GitHub Actions or EAS Build instead of on the restricted laptop.

## 7. Files used by this workflow

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local reader, API, PostgreSQL, admin, site, and APK services |
| `infra/docker/Dockerfile.frontend-dev` | Node/pnpm development container |
| `infra/docker/Dockerfile.api` | .NET API container |
| `infra/docker/Dockerfile.android` | Android SDK and APK build container |
| `scripts/docker-build-apk.sh` | Optional macOS/Linux APK convenience wrapper |
| `.dockerignore` | Keeps local dependencies, builds, secrets, and Git metadata out of Docker contexts |
