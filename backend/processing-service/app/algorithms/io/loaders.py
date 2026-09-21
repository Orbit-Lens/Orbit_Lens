import cv2
import numpy as np
from typing import Tuple

def load_image(path: str) -> Tuple[np.ndarray, any]:
    img = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Could not load image at {path}")
    from app.algorithms.types import ImageMeta
    meta = ImageMeta(path=path)
    return img, meta

def to_grayscale(image: np.ndarray) -> np.ndarray:
    if len(image.shape) == 2:
        return image
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

def normalize_intensity(image: np.ndarray) -> np.ndarray:
    img_float = image.astype(np.float32)
    min_val = np.min(img_float)
    max_val = np.max(img_float)
    if max_val - min_val == 0:
        return np.zeros_like(img_float)
    return (img_float - min_val) / (max_val - min_val)
