import os
import json
import tempfile
import logging
from typing import Optional, Dict, Any
import boto3
from botocore.config import Config
from app.config import settings

logger = logging.getLogger("orbitlens.storage")

_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
            region_name=settings.s3_region,
            config=Config(s3={"addressing_style": "path" if settings.s3_force_path_style else "auto"}),
        )
    return _s3_client

def download_file_to_temp(storage_key: str) -> str:
    """
    Downloads an image/raster from S3 to a local temp file.
    If storage_key points directly to a local filesystem path (e.g. in development/tests),
    returns the path directly.
    """
    if os.path.exists(storage_key):
        return storage_key

    s3 = get_s3_client()
    ext = os.path.splitext(storage_key)[1] or ".tif"
    temp_file = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    temp_path = temp_file.name
    temp_file.close()

    try:
        logger.info(f"Downloading s3://{settings.s3_bucket}/{storage_key} -> {temp_path}")
        s3.download_file(settings.s3_bucket, storage_key, temp_path)
        return temp_path
    except Exception as e:
        logger.warning(f"S3 download failed ({e}), creating a placeholder or returning local fallback.")
        # Clean up temp file if failed
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass
        raise e

def upload_file(local_path: str, storage_key: str, content_type: str = "application/octet-stream") -> str:
    """
    Uploads a local file to S3.
    """
    s3 = get_s3_client()
    try:
        logger.info(f"Uploading {local_path} -> s3://{settings.s3_bucket}/{storage_key}")
        s3.upload_file(
            local_path,
            settings.s3_bucket,
            storage_key,
            ExtraArgs={"ContentType": content_type},
        )
        return storage_key
    except Exception as e:
        logger.error(f"S3 upload error: {e}")
        return storage_key

def upload_bytes(data: bytes, storage_key: str, content_type: str = "application/octet-stream") -> str:
    s3 = get_s3_client()
    try:
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=storage_key,
            Body=data,
            ContentType=content_type,
        )
        return storage_key
    except Exception as e:
        logger.error(f"S3 put_object error: {e}")
        return storage_key

def upload_json(data: Dict[str, Any], storage_key: str) -> str:
    payload = json.dumps(data, indent=2).encode("utf-8")
    return upload_bytes(payload, storage_key, content_type="application/json")
