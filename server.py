"""A dependency-free static server, for hosts configured as a Python service.

The game needs no server at all — you can open index.html directly — but a
platform that wants a Python start command wants this. Standard library only.

    python server.py              -> http://localhost:8000
    PORT=3000 python server.py    -> http://localhost:3000
"""

import os
import sys
import mimetypes
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8000"))

# Some minimal images ship these as text/plain otherwise.
mimetypes.add_type("text/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("text/html", ".html")


class Handler(SimpleHTTPRequestHandler):
    """Serves the project root, falling back to the game for unknown paths."""

    def send_head(self):
        # SimpleHTTPRequestHandler.translate_path already strips '..' segments
        # and confines everything to the served directory.
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if not os.path.exists(index):
                self.path = "/index.html"
        elif not os.path.exists(path):
            self.path = "/index.html"
        return super().send_head()

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stdout.write("%s %s\n" % (self.address_string(), fmt % args))
        sys.stdout.flush()


if __name__ == "__main__":
    handler = partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), handler)
    print("Drakehaven Island -> http://localhost:%d" % PORT, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()
