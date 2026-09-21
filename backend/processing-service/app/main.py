from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

from app.config import settings
from app.api.routes_jobs import router as jobs_router

logging.basicConfig(
    level=logging.INFO if settings.env == "production" else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("orbitlens.main")

app = FastAPI(
    title="OrbitLens CV/ML Processing Service",
    description="Internal computer vision and deep-learning registration engine for Chandrayaan-2 lunar imagery",
    version="1.0.0",
    docs_url="/docs" if settings.env != "production" else None,
    redoc_url=None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "orbitlens-processing-service",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "env": settings.env,
    }

@app.get("/ready")
async def readiness_check():
    return {
        "status": "ready",
        "s3_endpoint": settings.s3_endpoint,
        "default_matcher": settings.default_matcher,
        "use_gpu": settings.use_gpu,
        "timestamp": datetime.utcnow().isoformat(),
    }

app.include_router(jobs_router)

@app.on_event("startup")
async def startup_event():
    logger.info("🛰️ OrbitLens Processing Service initialized successfully.")
    logger.info(f"🔧 Default Matcher: {settings.default_matcher} | GPU Enabled: {settings.use_gpu}")
