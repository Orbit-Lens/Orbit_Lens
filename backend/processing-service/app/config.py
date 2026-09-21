from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = "development"
    port: int = 8000
    host: str = "0.0.0.0"

    internal_api_key: str = "shared_internal_orbitlens_secret_key_123"
    web_backend_url: str = "http://localhost:5000"

    redis_url: str = "redis://localhost:6379"

    s3_endpoint: str = "https://s3.amazonaws.com"
    s3_bucket: str = "orbitlens-imagery"
    s3_access_key_id: str = "test-access-key"
    s3_secret_access_key: str = "test-secret-key"
    s3_region: str = "ap-south-1"
    s3_force_path_style: bool = False

    default_matcher: str = "classical"  # classical | learned
    use_gpu: bool = False
    model_weights_uri: Optional[str] = None
    sentry_dsn: Optional[str] = None

settings = Settings()
