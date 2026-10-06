"""Per-IP rate limiting as a small pure-ASGI middleware.

Built directly on `limits` (the engine slowapi wraps) instead of slowapi's
SlowAPIMiddleware, which finds the matched route by walking `app.routes` —
FastAPI >= 0.14x wraps included routers in opaque objects, so that lookup
finds nothing and slowapi silently stops limiting. Counting by client IP
needs no route knowledge, so this can't break that way.
"""

import json

from limits import parse
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter


class RateLimitMiddleware:
    def __init__(self, app, limit: str, exempt_paths: tuple[str, ...] = ()):
        self.app = app
        self.item = parse(limit)
        self.limiter = MovingWindowRateLimiter(MemoryStorage())
        self.exempt_paths = exempt_paths
        self.limit_text = limit

    async def __call__(self, scope, receive, send):
        # CORS preflights (OPTIONS) and exempt paths (e.g. uptime pings)
        # shouldn't spend the budget.
        if (
            scope["type"] != "http"
            or scope["method"] == "OPTIONS"
            or scope["path"] in self.exempt_paths
        ):
            return await self.app(scope, receive, send)

        client_ip = scope["client"][0] if scope.get("client") else "unknown"
        if self.limiter.hit(self.item, client_ip):
            return await self.app(scope, receive, send)

        retry_after = max(1, int(self.item.get_expiry()))
        body = json.dumps({"error": f"Rate limit exceeded: {self.limit_text}"}).encode()
        await send(
            {
                "type": "http.response.start",
                "status": 429,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode()),
                    (b"retry-after", str(retry_after).encode()),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body})
