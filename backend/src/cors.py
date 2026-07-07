from urllib.parse import urlsplit

from fastapi.middleware.cors import CORSMiddleware

from src.database.mongo import allowed_origins_collection


# Origins registered at scrape time, loaded from Mongo and kept in memory so
# the embedded chatbot widget can call the API from those websites.
dynamic_origins: set[str] = set()


def normalize_origin(url: str) -> str:
    """Reduce a stored URL to a browser Origin (scheme://host[:port])."""
    parts = urlsplit(url)
    if parts.scheme and parts.netloc:
        return f"{parts.scheme}://{parts.netloc}"
    return url.rstrip("/")


async def refresh_allowed_origins() -> None:
    """Reload the dynamic CORS allowlist from the allowed_origins collection."""
    origins = await allowed_origins_collection.distinct("origin")
    dynamic_origins.clear()
    dynamic_origins.update(normalize_origin(origin) for origin in origins if origin)


class DynamicCORSMiddleware(CORSMiddleware):
    """CORSMiddleware that also allows origins of scraped websites."""

    def is_allowed_origin(self, origin: str) -> bool:
        return super().is_allowed_origin(origin) or origin in dynamic_origins
