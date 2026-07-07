import uvicorn
from fastapi import FastAPI

from src.auth.router import router as auth_router
from src.routes.chatbot.router import router as chatbot_router
from src.cors import DynamicCORSMiddleware, refresh_allowed_origins
from src.config import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url=f"{settings.API_BASE_PATH}/docs",
    openapi_url=f"{settings.API_BASE_PATH}/openapi.json",
    redoc_url=f"{settings.API_BASE_PATH}/redoc",
    version=settings.API_VERSION,
    description=f"APIs for {settings.PROJECT_NAME}",
)

app.add_middleware(
    DynamicCORSMiddleware,
    allow_origins=settings.ALL_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def load_allowed_origins():
    """Load the scraped websites' origins into the CORS allowlist."""
    try:
        await refresh_allowed_origins()
    except Exception as e:
        print(f"Warning: could not load allowed origins from MongoDB: {e}")


app.include_router(
    auth_router, tags=["Authentication"], prefix=f"{settings.API_BASE_PATH}"
)
app.include_router(
    chatbot_router, tags=["Chatbot"], prefix=f"{settings.API_BASE_PATH}"
)


@app.get(f"{settings.API_BASE_PATH}/health", tags=["health"])
async def health_check():
    """Health check endpoint"""
    return {
        "message": f"Yes, Healthy!",
    }


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=settings.SERVICE_PORT, reload=True)
