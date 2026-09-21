import time
import os
import tempfile
import logging
import httpx
import cv2
import numpy as np
from typing import Dict, Any, Optional

from app.config import settings
from app.storage.s3_client import download_file_to_temp, upload_file, upload_json
from app.pipeline.ingest import read_raster_image
from app.pipeline.preprocess import preprocess_image
from app.pipeline.pyramid import calculate_pyramid_levels, build_gaussian_pyramid
from app.pipeline.detectors.classical import extract_classical_features
from app.pipeline.detectors.learned import extract_learned_features
from app.pipeline.matching import match_descriptors, extract_match_points
from app.pipeline.geometry import estimate_transform
from app.pipeline.coverage import filter_uniform_coverage
from app.pipeline.warp import warp_source_to_reference, create_preview_composite, save_geotiff
from app.pipeline.metrics import compute_metrics, format_match_points_geojson

logger = logging.getLogger("orbitlens.worker")

async def report_progress_to_backend(
    job_id: str,
    status: str,
    progress: int,
    status_message: str,
    metrics: Optional[Dict[str, Any]] = None,
    artifacts: Optional[Dict[str, Any]] = None,
    error_code: Optional[str] = None,
    error_message: Optional[str] = None
):
    """
    Sends internal authenticated progress/results callback to Node.js backend.
    """
    url = f"{settings.web_backend_url}/api/v1/jobs/{job_id}/status-internal"
    payload = {
        "status": status,
        "progress": progress,
        "statusMessage": status_message,
        "metrics": metrics,
        "artifacts": artifacts,
        "errorCode": error_code,
        "errorMessage": error_message,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"X-Internal-Key": settings.internal_api_key},
            )
            if response.status_code != 200:
                logger.warning(f"Backend status update returned status {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Failed to post progress to web backend: {e}")

async def run_registration_pipeline(job_payload: Dict[str, Any]):
    """
    Executes the full 10-stage Chandrayaan-2 lunar image registration pipeline.
    """
    job_id = job_payload["jobId"]
    start_time = time.time()
    temp_files_to_clean = []

    try:
        logger.info(f"Starting registration pipeline for job {job_id}")

        from app.algorithms.pipeline.orchestrator import OrbitLensOrchestrator
from app.algorithms.pipeline.config import PipelineConfig

# ... other imports ...

# Initialize the orchestrator with default config
orchestrator = OrbitLensOrchestrator(PipelineConfig())

async def run_registration_pipeline(job_payload: Dict[str, Any]):
    # ... inside the try block, replace the manual stages with:

    # The orchestrator now handles all 10 stages internally
    try:
        # ── Stage 1: Ingestion & Download ──────────────────────────────
        await report_progress_to_backend(job_id, "preprocessing", 15, "Downloading imagery and parsing metadata")

        src_temp = download_file_to_temp(job_payload["sourceImageStorageKey"])
        ref_temp = download_file_to_temp(job_payload["referenceImageStorageKey"])
        temp_files_to_clean.extend([src_temp, ref_temp])

        # ── Stage 2: High-Precision Registration ────────────────────────
        await report_progress_to_backend(job_id, "matching", 50, "Executing sub-pixel registration pipeline")

        # Use the new modular orchestrator
        transform, report = orchestrator.register(src_temp, ref_temp)

        if not report.registration_success:
            await report_progress_to_backend(
                job_id, "failed", 100, "Registration failed to meet target metrics",
                error_code="REGISTRATION_LOW_CONFIDENCE",
                error_message=f"RMSE: {report.rmse:.2f}px, Coverage: {report.spatial_coverage:.2f}"
            )
            return

        # ── Stage 3: Artifact Generation ──────────────────────────────
        await report_progress_to_backend(job_id, "warping", 90, "Generating registered product and preview")

        # Load images for warping
        src_raw = cv2.imread(src_temp, cv2.IMREAD_GRAYSCALE)
        ref_raw = cv2.imread(ref_temp, cv2.IMREAD_GRAYSCALE)

        from app.algorithms.registration.warp import warp_source_to_reference, create_preview_composite

        warped_src = warp_source_to_reference(src_raw, transform, ref_raw.shape)

        # We can't easily get the points back from the orchestrator in this simplified version,
        # so we'll generate a preview without points or implement a point-return in orchestrator.
        preview_img = create_preview_composite(warped_src, ref_raw, np.empty((0,2)), np.empty((0,2)))

        # Save and Upload
        temp_dir = tempfile.mkdtemp()
        warped_path = os.path.join(temp_dir, f"registered_{job_id}.tif")
        preview_path = os.path.join(temp_dir, f"preview_{job_id}.png")

        cv2.imwrite(warped_path, warped_src)
        cv2.imwrite(preview_path, preview_img)

        reg_s3_key = f"artifacts/{job_id}/registered_product.tif"
        prev_s3_key = f"artifacts/{job_id}/preview_overlay.png"

        upload_file(warped_path, reg_s3_key, content_type="image/tiff")
        upload_file(preview_path, prev_s3_key, content_type="image/png")

        # ── Stage 4: Complete & Notify ───────────────────────────────
        metrics = {
            "rmse": report.rmse,
            "inlierCount": report.inlier_count,
            "inlierRatio": report.inlier_ratio,
            "meanReprojectionError": report.reprojection_error_mean,
            "coverageUniformityScore": report.spatial_coverage,
            "processingTimeMs": (time.time() - start_time) * 1000.0
        }

        artifacts = {
            "registeredImageStorageKey": reg_s3_key,
            "previewOverlayStorageKey": prev_s3_key,
        }

        await report_progress_to_backend(
            job_id, "complete", 100,
            f"Success: RMSE {report.rmse:.2f}px",
            metrics=metrics, artifacts=artifacts
        )
        logger.info(f"Job {job_id} completed successfully. RMSE: {report.rmse:.2f}px")
    except Exception as e:
        # ...

    except Exception as e:
        logger.exception(f"Unhandled error in registration pipeline for job {job_id}: {e}")
        await report_progress_to_backend(
            job_id,
            "failed",
            100,
            "Pipeline error occurred during registration",
            error_code="INTERNAL_ERROR",
            error_message=str(e),
        )
    finally:
        # Clean up temporary disk files
        for p in temp_files_to_clean:
            if os.path.exists(p):
                try:
                    os.unlink(p)
                except Exception:
                    pass
