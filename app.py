"""WSGI entry point, so a host whose start command is `gunicorn app:app` works.

Drakehaven Island is static files — it needs no application server at all. This
exists only so that the common Python defaults resolve to something real:

    gunicorn app:app      # gunicorn.conf.py binds it to $PORT for you
    python app.py         # runs the standard-library server instead
    python server.py      # the same thing, under its own name

Standard library only. `gunicorn` is the sole entry in requirements.txt, and it
is needed only if your host's start command names it.
"""

import os
import mimetypes
import posixpath
from urllib.parse import unquote

ROOT = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")

# Everything the game is allowed to serve. Anything else is not part of the site.
SERVE_DIRS = ("css", "js", "dist")
SERVE_FILES = ("index.html", "README.md", "DESIGN.md")


def _resolve(url_path):
    """Map a URL path to a real file inside ROOT, or None if it escapes."""
    path = unquote(url_path.split("?", 1)[0].split("#", 1)[0])
    if path in ("", "/"):
        path = "/index.html"

    # normalise away '.', '..' and duplicate slashes before touching the disk
    parts = [p for p in posixpath.normpath(path).split("/") if p not in ("", ".", "..")]
    if not parts:
        parts = ["index.html"]

    candidate = os.path.realpath(os.path.join(ROOT, *parts))
    root = os.path.realpath(ROOT)
    if candidate != root and not candidate.startswith(root + os.sep):
        return None                      # attempted to climb out
    if not os.path.isfile(candidate):
        return None
    top = parts[0]
    if top not in SERVE_FILES and top not in SERVE_DIRS:
        return None                      # not part of the published site
    return candidate


def app(environ, start_response):
    method = environ.get("REQUEST_METHOD", "GET")
    if method not in ("GET", "HEAD"):
        start_response("405 Method Not Allowed",
                       [("Content-Type", "text/plain; charset=utf-8"),
                        ("Allow", "GET, HEAD")])
        return [b"method not allowed"]

    target = _resolve(environ.get("PATH_INFO", "/"))
    if target is None:
        # unknown path: hand back the game rather than a bare 404
        target = os.path.join(ROOT, "index.html")

    ctype = mimetypes.guess_type(target)[0] or "application/octet-stream"
    if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
        ctype += "; charset=utf-8"

    with open(target, "rb") as fh:
        body = fh.read()

    start_response("200 OK", [
        ("Content-Type", ctype),
        ("Content-Length", str(len(body))),
        ("Cache-Control", "no-cache"),
    ])
    return [] if method == "HEAD" else [body]


if __name__ == "__main__":
    from wsgiref.simple_server import make_server, WSGIRequestHandler

    class Quiet(WSGIRequestHandler):
        def log_message(self, fmt, *args):
            print("%s %s" % (self.address_string(), fmt % args), flush=True)

    port = int(os.environ.get("PORT", "8000"))
    print("Drakehaven Island -> http://localhost:%d" % port, flush=True)
    make_server("0.0.0.0", port, app, handler_class=Quiet).serve_forever()
