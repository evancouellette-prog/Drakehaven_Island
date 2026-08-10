# Deploying Drakehaven Island

The game is **static files**. `index.html` plus `css/` and `js/`. There is
nothing to compile, nothing to install, and no database. You can double-click
`index.html` and play it with no server at all.

That simplicity is why deploy settings are the only thing that can go wrong.

---

## The two rules

### 1. Never add a catch-all rewrite

If your host has a Redirects/Rewrites setting, **leave it empty.** The usual
single-page rule looks harmless:

```
Source  /*        Destination  /index.html        Action  Rewrite
```

`/*` matches everything — including `/js/util.js` and `/css/style.css`. Every
script request is answered with the HTML page, so the browser reports

```
Uncaught SyntaxError: Unexpected token '<'
```

`window.DH` is never defined and **you get a blank page** — while the deploy
reports success, because `/` really did return 200. This is the "deployed fine,
page is broken" failure, and `tools/hostsim.js` reproduces it on demand.

Drakehaven has no client-side routing to protect. It is one page at `/`. The
rule buys nothing and can only break the site. Delete it.

(The servers in this repo — `server.js`, `server.py`, `app.py` — do fall back
to `index.html`, but only *after* looking for the file and not finding it. That
is the safe order, and it is why they work.)

### 2. A start command has to keep running

A **web service** must start a process that *keeps running* and *listens on
`$PORT`*. A command that finishes — `npm install`, `npm ci`, `pip install`,
`npm run build` — is a **build** command. Used as a start command it exits
successfully, the host reports **"Application exited early"**, and restarts it
forever.

Build commands finish; start commands don't.

---

## Reading the two failures apart

| Symptom | Cause | Fix |
|---|---|---|
| Deploy log: `Application exited early`, restarting | Start Command is a build command | Start Command → `node server.js` |
| Deploy succeeds, page is blank, console says `Unexpected token '<'` | Catch-all rewrite is serving HTML for your scripts | Delete the `/*` → `/index.html` rule |
| Deploy succeeds, page is blank, console says `DH is not defined` | Same cause as above, or a script 404 | Open DevTools → Network, look for a script that isn't `200` + `text/javascript` |

In every case the browser console names the cause. Open the deployed page,
press F12, and read the first red line.

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
