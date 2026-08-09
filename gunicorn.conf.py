"""Gunicorn settings, loaded automatically when gunicorn starts.

Render (and most platforms) inject a PORT environment variable and expect the
process to listen on it. Bare `gunicorn app:app` would default to 127.0.0.1:8000
and never be reachable, so bind explicitly here — that way the start command can
stay as short as `gunicorn app:app`.
"""

import os

bind = "0.0.0.0:" + os.environ.get("PORT", "8000")
workers = 2
threads = 4
timeout = 60
accesslog = "-"
errorlog = "-"
