import os
import numpy as np
import cv2
import json
import time
from typing import List, Dict, Any
from tests.data_gen.synthetic_pairs import create_synthetic_pair

# Import the actual registration pipeline
try:
    from app.workers.tasks import run_registration_pipeline
except ImportError:
    print(\"Pipeline not yet accessible via python path. Ensure PYTHONPATH is set to backend/processing-service\")

def compute_rmse(H_est, H_gt):
    \"\"\"
    Computes RMSE between estimated and ground truth homographies
    using a grid of test points.
    \"\"\"
    h, w = 512, 512 # Standard test resolution
    points = np.array([[x, y, 1] for x in range(0, w, 64) for y in range(0, h, 64)]).T

    p_gt = H_gt @ points
    p_gt /= p_gt[2]

    p_est = H_est @ points
    p_est /= p_est[2]

    rmse = np.sqrt(np.mean(np.sum((p_gt - p_est)**2, axis=0)))
    return rmse

def run_test_suite():
    print(\"🚀 Starting OrbitLens Registration Validation Suite\")

    # Setup directories
    data_dir = \"data/synthetic_tests\"
    os.makedirs(data_dir, exist_ok=True)

    # We need at least one image to start with.
    # For now, we generate a synthetic 'crater' image if none exists.
    base_img_path = \"data/base_lunar.tif\"
    if not os.path.exists(base_img_path):
        print(\"Generating base synthetic lunar image...\")
        base_img = np.zeros((512, 512), dtype=np.uint8)
        # Draw some random 'craters'
        for _ in range(15):
            cx, cy = random.randint(50, 450), random.randint(50, 450)
            r = random.randint(10, 40)
            cv2.circle(base_img, (cx, cy), r, 180, -1)
            cv2.circle(base_img, (cx, cy), r, 255, 2)
        cv2.GaussianBlur(base_img, (5, 5), 0, dst=base_img)
        os.makedirs(\"data\", exist_ok=True)
        cv2.imwrite(base_img_path, base_img)

    # Generate 10 synthetic pairs
    results = []
    for i in range(10):
        pair_id = f\"syn_pair_{i}\"
        pair_data = create_synthetic_pair(base_img_path, data_dir, pair_id)

        # Mocking the job payload for the pipeline
        payload = {
            \"jobId\": pair_id,
            \"sourceImageStorageKey\": pair_data[\"source\"],
            \"referenceImageStorageKey\": pair_data[\"reference\"],
            \"algorithm\": \"classical\",
            \"transformModel\": \"homography\",
            \"parameters\": {
                \"ratioThreshold\": 0.75,
                \"ransacReprojThreshold\": 3.0
            }
        }

        # Note: In a real run, we would await run_registration_pipeline(payload)
        # Here we are setting up the harness for the upcoming refactor.
        print(f\"✅ Generated {pair_id} | GT Scale: {pair_data['params']['scale']:.2f}\")
        results.append(pair_data)

    print(\"\\n📊 Validation Summary\")
    print(\"--------------------------------------------------\")
    print(\"Metric             | Target   | Status\")
    print(\"--------------------------------------------------\")
    print(\"RMSE               | <= 0.5px | PENDING (Implementation)\")
    print(\"Inlier Ratio       | >= 75%   | PENDING (Implementation)\")
    print(\"Spatial Coverage   | >= 75%   | PENDING (Implementation)\")
    print(\"--------------------------------------------------\")

if __name__ == \"__main__\":
    import random
    run_test_suite()
