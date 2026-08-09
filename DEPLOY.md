# Deploying Drakehaven Island

The game is **static files**. `index.html` plus `css/` and `js/`. There is
nothing to compile, nothing to install, and no database. You can double-click
`index.html` and play it with no server at all.

That simplicity is why deploy settings are the only thing that can go wrong.

---

## The one rule

A **web service** must start a process that *keeps running* and *listens on
`$PORT`*. A command that finishes — `npm install`, `npm ci`, `pip install`,
`npm run build` — is a **build** command. Used as a start command it exits
successfully, the host reports **"Application exited early"**, and restarts it
forever.

That is the whole failure mode. Build commands finish; start commands don't.

---

## Render

### Option A — Static Site (recommended, nothing can exit early)

| Field | Value |
|---|---|
| Service type | **Static Site** |
| Branch | `main` |
| Build Command | *(empty)* |
| Publish Directory | `.` |

There is no start command, so there is no process to crash. `render.yaml` in
this repo declares exactly this if you create the service from a Blueprint.

`dist` also works as a Publish Directory — it holds the single-file build.

### Option B — Web Service

| Field | Value |
|---|---|
| Runtime | **Node** |
| Branch | `main` |
| Build Command | *(empty)* — or `npm ci`, which installs nothing |
| **Start Command** | **`node server.js`** |

Leaving Start Command empty also works: Render falls back to `npm start`,
which this repo defines as `node server.js`.

A healthy deploy log ends with the server announcing itself and then staying
quiet:

```
==> Deploying...
Drakehaven Island → http://localhost:10000
==> Your service is live 🎉
```

If instead you see `npm install` → `up to date, audited 1 package` →
`Application exited early`, the Start Command field contains a build command.
Change it to `node server.js`.

### Python, if you'd rather

| Start Command | Notes |
|---|---|
| `python server.py` | standard library only |
| `python app.py` | same server, WSGI-shaped |
| `gunicorn app:app` | `gunicorn.conf.py` binds `0.0.0.0:$PORT` for you |

`requirements.txt` exists only for that last one. The game needs no packages.

---

## Anywhere else

| Host | What to do |
|---|---|
| GitHub Pages | Push `main`, enable Pages on the repo root. Works from a subpath. |
| Netlify / Cloudflare Pages / Vercel | Build command empty, publish directory `.` |
| Railway / Fly / Heroku | Start command `node server.js` |
| Plain VPS / nginx | Point the document root at the repo. No process needed. |
| No host at all | Open `index.html`, or send someone `dist/drakehaven-island.html` — one file, whole game. |

---

## Verifying before you deploy

```bash
node tools/audit.js        # 256 line-level checks for host-only bugs
bash tools/deploycheck.sh  # clones main, runs EVERY build and start command
```

`deploycheck.sh` exists so a deploy never fails on plumbing again. From a
clean clone it runs all three build commands, all five start commands and both
static publish paths, and probes each one for the page, the JS, the CSS, the
correct MIME type, unknown-path fallback, and path-traversal leaks.

```
ALL 21 DEPLOY CHECKS PASSED
```

Every configuration above is covered by that suite. If a host still fails, the
deploy **log** names the command it ran — that line is the diagnosis.
