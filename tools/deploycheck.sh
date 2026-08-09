#!/usr/bin/env bash
# Verify every deployment configuration a host might pick, from a clean clone.
#
# The game is static files, but hosts guess: some build with pip, some with npm,
# some start gunicorn, some run a static file server. This checks all of them
# actually serve a working page, so a deploy never fails on plumbing again.
#
#   bash tools/deploycheck.sh
set -u

REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
PASS=0
FAIL=0

cleanup() { rm -rf "$WORK"; }
trap cleanup EXIT

say()  { printf '\n\033[1m%s\033[0m\n' "$*"; }
good() { printf '  \033[32mok\033[0m    %s\n' "$*"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$*"; FAIL=$((FAIL+1)); }

# Ask a running server for the pages that matter. $1 = base url, $2 = label
probe() {
  local base="$1" label="$2" ok=1
  local root js css unknown
  root=$(curl -s -o /dev/null -w '%{http_code}' "$base/" || echo 000)
  js=$(curl -s -o /dev/null -w '%{http_code}' "$base/js/main.js" || echo 000)
  css=$(curl -s -o /dev/null -w '%{http_code}' "$base/css/style.css" || echo 000)
  unknown=$(curl -s -o /dev/null -w '%{http_code}' "$base/no/such/path" || echo 000)
  local jstype
  jstype=$(curl -s -o /dev/null -w '%{content_type}' "$base/js/main.js" || echo none)
  local markup
  markup=$(curl -s "$base/" | grep -c 'id="screen"' || true)
  local leak
  leak=$(curl -s --path-as-is "$base/../../../etc/passwd" | grep -c 'root:x:' || true)

  [ "$root" = "200" ]    || { bad "$label: / returned $root"; ok=0; }
  [ "$js" = "200" ]      || { bad "$label: /js/main.js returned $js"; ok=0; }
  [ "$css" = "200" ]     || { bad "$label: /css/style.css returned $css"; ok=0; }
  [ "$unknown" = "200" ] || { bad "$label: unknown path returned $unknown (want the game)"; ok=0; }
  case "$jstype" in *javascript*) ;; *) bad "$label: js served as '$jstype'"; ok=0;; esac
  [ "$markup" -ge 1 ]    || { bad "$label: page has no game markup"; ok=0; }
  [ "$leak" = "0" ]      || { bad "$label: LEAKS FILES outside the project"; ok=0; }

  [ "$ok" = "1" ] && good "$label serves the game"
}

# Start a command in the clone, wait for the port, probe it, kill it.
# $1 = label, $2 = port, $3.. = command
serve_and_probe() {
  local label="$1" port="$2"; shift 2
  # setsid so the whole tree can be killed: `npm start` spawns node as a child
  ( cd "$WORK/clone" && PORT="$port" exec setsid "$@" >"$WORK/$port.log" 2>&1 ) &
  local pid=$!
  local up=0
  for _ in $(seq 1 40); do
    if curl -s -o /dev/null "http://localhost:$port/" 2>/dev/null; then up=1; break; fi
    sleep 0.25
  done
  if [ "$up" = "0" ]; then
    bad "$label never opened port $port"
    printf '        --- log ---\n'; sed 's/^/        /' "$WORK/$port.log" | head -12
  else
    probe "http://localhost:$port" "$label"
  fi
  # kill the group, then make sure the port is really free
  kill -TERM -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null
  wait $pid 2>/dev/null
  sleep 0.2
}

say "cloning main exactly as a host would"
git clone -q --branch main "$REPO" "$WORK/clone" || { bad "clone failed"; exit 1; }
cd "$WORK/clone" || exit 1
good "clone has $(git ls-files | wc -l | tr -d ' ') tracked files"

say "the files a host looks for"
for f in index.html requirements.txt package.json package-lock.json \
         server.py server.js app.py gunicorn.conf.py render.yaml; do
  [ -f "$f" ] && good "$f present" || bad "$f MISSING"
done

say "build commands"
if pip install -r requirements.txt >"$WORK/pip.log" 2>&1; then
  good "pip install -r requirements.txt"
else
  bad "pip install -r requirements.txt"; sed 's/^/        /' "$WORK/pip.log" | tail -6
fi
if npm ci >"$WORK/npmci.log" 2>&1; then
  good "npm ci"
else
  bad "npm ci"; sed 's/^/        /' "$WORK/npmci.log" | tail -6
fi
if npm run build >"$WORK/npmbuild.log" 2>&1; then
  good "npm run build"
else
  bad "npm run build"; sed 's/^/        /' "$WORK/npmbuild.log" | tail -6
fi
[ -f dist/index.html ] && good "dist/ is a site root too" || bad "dist/index.html missing"

say "start commands"
serve_and_probe "python server.py"   8401 python3 server.py
serve_and_probe "python app.py"      8402 python3 app.py
serve_and_probe "node server.js"     8403 node server.js
serve_and_probe "npm start"          8404 npm start
if command -v gunicorn >/dev/null 2>&1; then
  serve_and_probe "gunicorn app:app" 8405 gunicorn app:app
else
  bad "gunicorn not on PATH — cannot verify 'gunicorn app:app'"
fi

say "static publish paths (what a Static Site serves)"
static_probe() {          # $1 = label, $2 = port, $3 = directory to publish
  ( cd "$WORK/clone/$3" && exec setsid python3 -m http.server "$2" --bind 127.0.0.1 \
      >"$WORK/static$2.log" 2>&1 ) &
  local pid=$! up=0
  for _ in $(seq 1 40); do
    if curl -s -o /dev/null "http://localhost:$2/" 2>/dev/null; then up=1; break; fi
    sleep 0.25
  done
  if [ "$up" = "0" ]; then
    bad "$1 never opened port $2"
  else
    local code markup
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$2/")
    markup=$(curl -s "http://localhost:$2/" | grep -c 'id="screen"' || true)
    if [ "$code" = "200" ] && [ "$markup" -ge 1 ]; then good "$1 serves the game"
    else bad "$1: / returned $code, markup hits $markup"; fi
  fi
  kill -TERM -"$pid" 2>/dev/null || kill "$pid" 2>/dev/null
  wait $pid 2>/dev/null
  sleep 0.2
}
static_probe "publish path '.'"    8406 .
static_probe "publish path 'dist'" 8407 dist

printf '\n%s\n' "===================================================="
if [ "$FAIL" = "0" ]; then
  printf 'ALL %s DEPLOY CHECKS PASSED\n' "$PASS"
else
  printf '%s of %s DEPLOY CHECKS FAILED\n' "$FAIL" "$((PASS+FAIL))"
fi
printf '%s\n' "===================================================="
[ "$FAIL" = "0" ]
