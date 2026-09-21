from fastapi import APIRouter, BackgroundTasks, HTTPException, Header, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import hmac
import logging

from app.config import settings
from app.workers.tasks import run_registration_pipeline
from app.storage.s3_client import download_file_to_temp
from app.pipeline.ingest import read_raster_image

logger = logging.getLogger("orbitlens.api")
router = APIRouter(prefix="/internal", tags=["Internal"])

class JobParametersSchema(BaseModel):
    coverageTargetCells: int = 64
    ratioThreshold: float = 0.75
    ransacReprojThreshold: float = 3.0
    maxPyramidLevels: int = 4
    illuminationCorrection: bool = True

class DispatchJobRequest(BaseModel):
    jobId: str
    sourceImageStorageKey: str
    referenceImageStorageKey: str
    sourceSensor: str
    referenceSensor: str
    sourceResolution: Optional[float] = None
    referenceResolution: Optional[float] = None
    algorithm: str = "classical"
    transformModel: str = "homography"
    parameters: Optional[JobParametersSchema] = Field(default_factory=JobParametersSchema)

class MetadataExtractRequest(BaseModel):
    imageId: str
    storageKey: str

def verify_internal_key(x_internal_key: Optional[str] = Header(None)):
    if not x_internal_key or not hmac.compare_digest(x_internal_key, settings.internal_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal service API key",
        )

@router.post("/jobs", status_code=status.HTTP_202_ACCEPTED)
async def submit_job(
    request: DispatchJobRequest,
    background_tasks: BackgroundTasks,
    x_internal_key: Optional[str] = Header(None)
):
    """
    Submits a registration job to be processed asynchronously in the worker pool.
    """
    verify_internal_key(x_internal_key)
    
    logger.info(f"Received internal registration job request for job #{request.jobId}")
    background_tasks.add_task(run_registration_pipeline, request.model_dump())

    return {
        "success": True,
        "message": "Job accepted and queued for processing",
        "jobId": request.jobId,
    }

@router.post("/metadata/extract")
async def extract_metadata(
    request: MetadataExtractRequest,
    x_internal_key: Optional[str] = Header(None)
):
    """
    Parses raster header and any associated PDS4 XML label to retrieve dimensions and metadata.
    """
    verify_internal_key(x_internal_key)

    try:
        temp_path = download_file_to_temp(request.storageKey)
        _, metadata = read_raster_image(temp_path, max_dimension=None)
        return {"success": True, "data": metadata}
    except Exception as e:
        logger.warning(f"Failed to extract metadata for {request.storageKey}: {e}")
        return {"success": False, "error": str(e)}
