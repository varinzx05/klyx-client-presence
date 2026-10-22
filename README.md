# KLYX client presence

This small HTTP service tracks active client XUIDs for 90 seconds. A client
heartbeats every 30 seconds and checks only the XUIDs in its current player
list. The current Combined build uses the live HTTPS service at
`https://klyx-client-presence.onrender.com`. A custom URL can be set in
`%LOCALAPPDATA%\VincentCombined\AuroraESP.ini` as:

```ini
[Presence]
Url=https://klyx-client-presence.onrender.com
```

Restart Minecraft and inject the new Combined DLL after changing the URL.

Run `node server.mjs` (localhost port 8787 by default) and
`node --test server.test.mjs`. Set `HOST=0.0.0.0` and `PORT` when deploying
behind an HTTPS reverse proxy.
The included Dockerfile listens on port 8787. Use one instance because
presence is held in process memory. `/healthz` is available for a load
balancer. Do not expose the plain HTTP port directly to clients.
The service stores presence only in memory, so a restart clears it until clients
heartbeat again. It does not authenticate Minecraft accounts; the badge is
cosmetic and a modified client can claim another XUID.

## Deploy on Render

This repository is deployed as a single Free Docker web service in Singapore,
linked to the `main` branch. The included `render.yaml` describes equivalent
settings for a new workspace. The existing service was created directly, so
applying the Blueprint in its workspace would create a second service.
A Free service may sleep when idle, so the first heartbeat after an idle period
can be delayed.
