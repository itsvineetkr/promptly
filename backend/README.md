# Promptly — Backend

FastAPI service that handles auth, website scraping, vector indexing, and serving the embeddable chatbot widget. See the [root README](../README.md) for the full project overview and Docker setup.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API docs: `http://127.0.0.1:8000/api/v1/docs`

You also need a running **Typesense** instance (easiest: `docker compose up typesense` from the repo root) and reachable **MongoDB**. When running outside Docker, set `TYPESENSE_HOST="localhost"` in `env/.env`.

## Configuration

All settings load from `env/.env` via pydantic-settings (`src/config.py`). Real environment variables override the file — that's how docker-compose injects values. Required keys: `SECRET_KEY`, `MONGODB_URI`, `MONGODB_DB_NAME`, `GEMINI_API_KEY`, `TYPESENSE_*`, `BACKEND_URL` — see the root README for a full template.

## Layout

```
main.py                     # App factory, CORS middleware, routers, startup hook
src/
├── config.py               # Settings (pydantic-settings, env/.env)
├── cors.py                 # DynamicCORSMiddleware + allowlist refresh
├── database/mongo.py       # Motor (async Mongo) client and db handle
├── auth/
│   ├── router.py           # /token, /users/ endpoints
│   ├── utils.py            # JWT creation/validation, password hashing
│   ├── models.py           # User pydantic models
│   └── validators.py       # Password strength rules
└── routes/chatbot/
    ├── router.py           # /chatbot/scrape, /ask, /websites, /{color}/{collection}.js
    ├── chatbot_collection.py  # Typesense collection create/import + vector search
    ├── utils.py            # Website crawler, Gemini answer generation
    ├── models.py           # QueryRequest, Mongo chatbot_collection handle
    ├── constants.py        # Widget script loading + init code template
    └── scripts/            # Themed widget JS (black, violet, red, yellow, green)
```

## Flow notes

- **Scraping** (`POST /chatbot/scrape`): crawls the site, chunks content (LangChain splitter, 1000/100 overlap), creates a Typesense collection named `{user_id}_chatbot_{formatted_url}` with auto-embedding (`ts/all-MiniLM-L12-v2`), mirrors the chunks into Mongo, and returns the script tag. Re-scraping the same site replaces its collection.
- **Answering** (`POST /chatbot/ask`, unauthenticated — called by the widget): vector search in Typesense → top chunks fed to `gemini-2.5-flash` with the conversation history.
- **Dynamic CORS** (`src/cors.py`): origins recorded at scrape time are loaded from Mongo at startup and refreshed on each new scrape, so embedded widgets can call the API from customer domains without a restart.
- **Widget serving**: `GET /chatbot/{color}/{collection}.js` concatenates a themed script from `scripts/` with an init snippet pointing at `BACKEND_URL`.

## Data stores

| Store | What lives there |
|---|---|
| MongoDB `users` | Accounts (bcrypt-hashed passwords) |
| MongoDB `chatbot_collection` | Scraped content chunks (source of truth) |
| MongoDB `allowed_origins_collection` | Origins allowed to call the widget API |
| Typesense | Per-website vector collections used for search |
