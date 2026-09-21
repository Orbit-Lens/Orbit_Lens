from abc import ABC, abstractmethod
from typing import Tuple, Optional, Union
import numpy as np
from app.algorithms.types import FeatureSet

class Matcher(ABC):
    @abstractmethod
    def match(self, feat_src: Union[FeatureSet, np.ndarray], feat_ref: Union[FeatureSet, np.ndarray]) -> Tuple[np.ndarray, np.ndarray]:
        pass
