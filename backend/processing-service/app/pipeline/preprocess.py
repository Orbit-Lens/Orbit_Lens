import cv2
import numpy as np
import logging

logger = logging.getLogger("orbitlens.pipeline.preprocess")

def apply_radiometric_normalization(
    img: np.ndarray,
    clip_limit: float = 2.5,
    tile_grid_size: tuple = (8, 8)
) -> np.ndarray:
    """
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization)
    to reveal low-contrast lunar crater topography and regolith structures.
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    equalized = clahe.apply(gray)
    return equalized

def apply_illumination_correction(img: np.ndarray) -> np.ndarray:
    """
    Shadow and sun-angle invariant enhancement using a Retinex / high-pass
    gradient approach to eliminate low-frequency illumination gradients across the lunar scene.
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    # Convert to log domain to separate illumination from reflectance (I = L * R -> log(I) = log(L) + log(R))
    img_float = gray.astype(np.float32) + 1.0
    log_img = np.log(img_float)

    # Estimate low-frequency illumination field via large Gaussian blur
    kernel_size = max(15, (min(gray.shape) // 16) | 1)
    illumination_field = cv2.GaussianBlur(log_img, (kernel_size, kernel_size), 0)

    # High-pass reflectance component
    reflectance = log_img - illumination_field

    # Normalize back to 0-255 uint8 range
    norm_reflectance = cv2.normalize(reflectance, None, 0, 255, cv2.NORM_MINMAX)
    return norm_reflectance.astype(np.uint8)

def preprocess_image(
    img: np.ndarray,
    illumination_correction: bool = True,
    denoise: bool = True
) -> np.ndarray:
    """
    Full preprocessing pipeline:
    Denoising -> Illumination invariance -> Radiometric CLAHE normalization.
    """
    processed = img.copy()

    if denoise:
        # Fast bilateral filter preserves crater edges while smoothing regolith noise
        processed = cv2.bilateralFilter(processed, d=5, sigmaColor=35, sigmaSpace=35)

    if illumination_correction:
        processed = apply_illumination_correction(processed)

    processed = apply_radiometric_normalization(processed)

    return processed
