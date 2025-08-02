from pathlib import Path
from functools import lru_cache
from typing import Annotated, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, BeforeValidator, AnyUrl


# Utility function to parse comma-separated string or list of strings
def parse_comma_separated_list(v: Any) -> list[str] | str:
    """Parse comma-separated string or list of strings into a list of strings."""
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    def __init__(self, _env_file, _env_file_encoding):
        base_path = Path.cwd()
        env_path = "{0}/env/{1}".format(base_path, _env_file)
        super(Settings, self).__init__(
            _env_file=env_path, _env_file_encoding=_env_file_encoding
        )

    model_config = SettingsConfigDict(
        extra="ignore", env_file_encoding="utf-8", env_ignore_empty=True
    )

    PROJECT_NAME: str
    API_STR: str = "api"
    API_VERSION: str


    FRONTEND_URL: AnyUrl = "http://localhost:3000"
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_comma_separated_list)
    ] = []

    @computed_field
    @property
    def API_BASE_PATH(self) -> str:
        return f"/{self.API_STR}/{self.API_VERSION}"

    @computed_field
    @property
    def ALL_CORS_ORIGINS(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_URL
        ]

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    SERVICE_PORT: int
    MONGODB_URI: str
    MONGODB_DB_NAME: str

    GEMINI_API_KEY: str

    TYPESENSE_API_KEY: str
    TYPESENSE_HOST: str

@lru_cache
def get_settings():
    """Create global settings for the application."""
    return Settings(_env_file=".env", _env_file_encoding="utf-8")
