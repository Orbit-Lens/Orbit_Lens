import os
import json
import numpy as np
import time
from typing import List, Dict, Any, Tuple

from app.algorithms.pipeline.orchestrator import OrbitLensOrchestrator
from app.algorithms.pipeline.config import PipelineConfig

def find_overlapping_pairs(manifest: List[Dict[str, Any]]) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    pairs = []
    for i in range(len(manifest)):
        for j in range(i + 1, len(manifest)):
            prod_a = manifest[i]
            prod_b = manifest[j]
            if prod_a['instrument'] != prod_b['instrument']:
                pairs.append((prod_a, prod_b))
    return pairs

def run_tuning_and_tests():
    manifest_path = "backend/processing-service/data/manifest.json"
    if not os.path.exists(manifest_path):
        print("Manifest not found.")
        return

    with open(manifest_path, 'r') as f:
        manifest = json.load(f)

    pairs = find_overlapping_pairs(manifest)
    if not pairs:
        print("No cross-instrument pairs found.")
        return

    # We will test both Classical and AI modes
    modes = ["classical", "detector_free"]
    final_results = {}

    for mode in modes:
        print(f"\\n--- Evaluating Mode: {mode} ---")
        config = PipelineConfig()
        config.mode = mode if mode != "classical" else "homography" # orchestrator expects model type for classical
        if mode == "detector_free":
            config.mode = "detector_free"

        orchestrator = OrbitLensOrchestrator(config)

        pair_results = []
        for src, ref in pairs:
            try:
                transform, report = orchestrator.register(src['raw_path'], ref['raw_path'])
                pair_results.append({
                    "pair": f"{src['instrument']} <-> {ref['instrument']}",
                    "rmse": report.rmse,
                    "coverage": report.spatial_coverage,
                    "success": report.registration_success
                })
            except Exception as e:
                print(f"Error registering pair: {e}")

        # Calculate aggregate metrics
        if pair_results:
            avg_rmse = np.mean([r["rmse"] for r in pair_results if r["rmse"] != float('inf')])
            success_rate = sum(1 for r in pair_results if r["success"]) / len(pair_results)
            avg_coverage = np.mean([r["coverage"] for r in pair_results])

            final_results[mode] = {
                "avg_rmse": avg_rmse,
                "success_rate": success_rate,
                "avg_coverage": avg_coverage
            }

            print(f"Results for {mode}:")
            print(f"  - Avg RMSE: {avg_rmse:.4f} px")
            print(f"  - Success Rate: {success_rate*100:.1f}%")
            print(f"  - Avg Coverage: {avg_coverage*100:.1f}%")
        else:
            print(f"No successful registrations in {mode} mode.")

    print("\n" + "="*40)
    print("FINAL PERFORMANCE REPORT")
    print("="*40)
    for mode, res in final_results.items():
        print(f"Mode: {mode}")
        print(f"  RMSE: {res['avg_rmse']:.4f} (Target: <= 0.5)")
        print(f"  Success Rate: {res['success_rate']*100:.1f}% (Target: >= 90%)")
        print(f"  Coverage: {res['avg_coverage']*100:.1f}% (Target: >= 75%)")
        print("-" * 20)

if __name__ == "__main__":
    run_tuning_and_tests()
