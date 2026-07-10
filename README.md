# Promptly

**Plug-and-play AI chatbots for any website.**

Promptly scrapes your website, builds a knowledge base from its content, and gives you a chatbot you can embed with a single `<script>` tag. No backend code, no training pipelines — visitors ask questions, and the bot answers from your own pages.

- **Live app:** http://promptly.vineetkr.me
- **API:** https://promptlyback.vineetkr.me
- **Source:** https://github.com/itsvineetkr/promptly

---

## How it works

1. **Scrape** — Sign up, enter your website URL. Promptly crawls your pages and extracts their content.
2. **Index** — The content is chunked, embedded, and stored in a Typesense vector collection (plus a copy in MongoDB).
3. **Embed** — You get a script tag like:

   ```html
   <script src="https://promptlyback.vineetkr.me/api/v1/chatbot/BL/<collection>.js"></script>
   ```

   Paste it into your site's HTML and a chat widget appears in the bottom-right corner.
4. **Answer** — When a visitor asks a question, the widget calls the API, which runs a vector search over your content and generates an answer with Gemini.

The dashboard also lets you **test the widget live** before touching your site, switch between five widget themes (black, violet, red, yellow, green), and re-fetch script tags for previously scraped sites.

## Architecture

```
┌─────────────┐        ┌──────────────────┐       ┌───────────────┐
│  React SPA  │──────▶ │  FastAPI backend  │─────▶│   Typesense   │
│  (Vite)     │  REST  │  /api/v1          │vector │ (embeddings + │
└─────────────┘        │                   │search │  search)      │
                       │                   │       └───────────────┘
┌─────────────┐        │                   │       ┌───────────────┐
│ Customer    │──────▶ │                   │─────▶│    MongoDB    │
│ website     │ widget │                   │       │ (users, chunks│
│ + widget.js │  /ask  │                   │       │  origins)     │
└─────────────┘        └──────────────────┘       └───────────────┘
                                │
                                ▼
                         Google Gemini
                        (answer generation)
```

**Tech stack**

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, shadcn/ui, Axios |
| Backend | FastAPI (async), Motor (MongoDB), Typesense, LangChain text splitter |
| LLM | Google Gemini (`gemini-2.5-flash`) |
| Auth | OAuth2 password flow + JWT (python-jose, bcrypt) |
| Vector search | Typesense with `ts/all-MiniLM-L12-v2` auto-embedding |
| Infra | Docker Compose, Nginx (production) |

## Getting started

### Prerequisites

- Docker & Docker Compose
- A MongoDB instance (Atlas or local) and a [Gemini API key](https://aistudio.google.com/apikey)

### 1. Configure environment

Create `backend/env/.env`:

```env
PROJECT_NAME="Promptly"
API_STR="api"
API_VERSION="v1"

BACKEND_URL="http://localhost:1001"
FRONTEND_URL="http://localhost:1002"
BACKEND_CORS_ORIGINS="http://localhost:1002"

SECRET_KEY="<generate-a-long-random-string>"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="30"
SERVICE_PORT="8000"

MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/"
MONGODB_DB_NAME="promptly_backend_db"

GEMINI_API_KEY="<your-gemini-api-key>"

TYPESENSE_API_KEY="xyz"
TYPESENSE_HOST="typesense"
TYPESENSE_PORT="8108"
TYPESENSE_PROTOCOL="http"
```

> Environment variables set in `docker-compose.yml` override values from this file (pydantic-settings precedence).

### 2. Run with Docker

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:1002 |
| Backend API | http://localhost:1001 |
| API docs (Swagger) | http://localhost:1001/api/v1/docs |
| Typesense | http://localhost:8108 |

### 3. Run manually (without Docker)

```bash
# Backend (from backend/)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (from frontend/)
npm install
npm run dev
```

You'll still need a running Typesense instance; the easiest way is `docker compose up typesense`. Point `TYPESENSE_HOST` at `localhost` when running the backend outside Docker, and update `baseURL` in `frontend/src/lib/api.js` if your backend port differs.

### Production

`docker-compose.prod.yml` builds the frontend as static files served by Nginx (see `nginx.conf`) and runs the backend without hot reload:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## API reference

Base path: `/api/v1` — interactive docs at `/api/v1/docs`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/token` | — | OAuth2 password login, returns JWT |
| POST | `/users/` | — | Register (validates password strength) |
| GET | `/users/me/` | Bearer | Current user's profile |
| PUT | `/users/me/` | Bearer | Update profile / password |

### Chatbot

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/chatbot/scrape` | Bearer | Crawl `website_url`, build the vector collection, return the script tag. Query params: `website_url`, `origin_url`, `max_depth`, `max_urls` |
| GET | `/chatbot/websites` | Bearer | List the caller's scraped sites with their script tags |
| POST | `/chatbot/ask` | — | Answer a visitor question. Body: `query`, `collection_name`, `conversation_history` |
| GET | `/chatbot/{color}/{collection}.js` | — | Serve the themed widget script (`BL`, `VI`, `RE`, `YE`, `GR`) |
| GET | `/health` | — | Health check |

## CORS for embedded widgets

Static origins (the dashboard frontend) come from `BACKEND_CORS_ORIGINS` / `FRONTEND_URL`. On top of that, every scraped website's origin is stored in MongoDB and loaded into a **dynamic CORS allowlist** (`backend/src/cors.py`) at startup — and refreshed immediately when a new site is scraped — so the widget can call `/chatbot/ask` from customer sites without a backend restart.

## Project structure

```
├── frontend/                  # React + Vite SPA
│   └── src/
│       ├── pages/             # Home, Login, Signup, Profile, Integration (dashboard)
│       ├── components/        # Navbar, shadcn/ui primitives
│       └── lib/api.js         # Axios instance + auth token handling
├── backend/
│   ├── main.py                # FastAPI app, CORS, routers
│   ├── env/.env               # Configuration (not committed)
│   └── src/
│       ├── config.py          # pydantic-settings
│       ├── cors.py            # Dynamic CORS allowlist
│       ├── auth/              # JWT auth, user CRUD
│       ├── database/mongo.py  # Motor client
│       └── routes/chatbot/
│           ├── router.py      # scrape / ask / websites / widget endpoints
│           ├── chatbot_collection.py  # Typesense indexing & vector search
│           ├── utils.py       # Crawler + Gemini response generation
│           └── scripts/       # Themed widget JS (black, violet, red, …)
├── docker-compose.yml         # Dev: backend, frontend, typesense, mongodb
├── docker-compose.prod.yml    # Prod: nginx-served frontend
└── DockerFile                 # Multi-stage build (backend & frontend targets)
```

## Author

Built by [Vineet Kumar](https://github.com/itsvineetkr). Contributions and issues welcome on [GitHub](https://github.com/itsvineetkr/promptly).
