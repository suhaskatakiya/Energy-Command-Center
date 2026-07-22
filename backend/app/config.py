import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env file from root of backend if exists
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "EnergyGuard AI Backend"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./energyguard.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    class Config:
        case_sensitive = True

settings = Settings()
