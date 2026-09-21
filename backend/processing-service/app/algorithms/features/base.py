from abc import ABC, abstractmethod
from typing import Optional
import numpy as np
from app.algorithms.types import FeatureSet

class FeatureExtractor(ABC):
    @abstractmethod
    def extract(self, image: np.ndarray, mask: Optional[np.ndarray] = None) -> FeatureSet:
        pass
