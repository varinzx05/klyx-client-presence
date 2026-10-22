# KLYX client presence

This small HTTP service tracks active client XUIDs for 90 seconds. A client
heartbeats every 30 seconds and checks only the XUIDs in its current player
list. Deploy it behind HTTPS, then put the public base URL in the client's
`%LOCALAPPDATA%\VincentCombined\AuroraESP.ini` as:

```ini
[Presence]
Url=https://your-host.example
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

Publish this `Presence` folder as the root of a GitHub, GitLab, or Bitbucket
repository. Connect that repository to a new Render Blueprint. The included
`render.yaml` creates one free Docker web service and checks `/healthz`.
After it becomes live, set `Presence.Url` in the client INI to the service's
HTTPS `onrender.com` URL, without a trailing slash. A free service may sleep
when idle, so the first heartbeat after an idle period can be delayed.
