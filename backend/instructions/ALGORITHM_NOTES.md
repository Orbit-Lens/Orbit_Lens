# OrbitLens — Algorithm & Registration Math Notes

## 1. Multi-Modal Scale Bridging (OHRC, TMC-2, IIRS)

Chandrayaan-2 carries three distinct optical and hyperspectral payloads with wide spatial resolution ratios:
- **OHRC (Orbiter High Resolution Camera):** ~0.25 m/pixel
- **TMC-2 (Terrain Mapping Camera):** ~5.0 m/pixel (scale ratio: 20:1 relative to OHRC)
- **IIRS (Imaging IR Spectrometer):** ~80.0 m/pixel (scale ratio: 320:1 relative to OHRC)

### Scale Pyramid Strategy
To bridge large resolution differences:
1. Octave-scaled Gaussian pyramids are constructed with $L = \min(L_{\max}, \lfloor \log_2(\text{ratio}) + 1 \rfloor)$ levels.
2. SIFT/AKAZE features are extracted across scale space.
3. Correspondences are matched coarse-to-fine, mapping intermediate coordinates back to the full reference frame by scaling:
   $$P_{\text{ref}} = \frac{p_{\text{ref, level}}}{s_{\text{level}}}$$

---

## 2. Illumination & Sun-Angle Invariance

The lunar surface undergoes extreme photometric changes under different sun azimuth ($\phi$) and sun elevation ($\theta$) angles.

### Preprocessing Pipeline:
1. **Bilateral Filtering:** Smooths high-frequency sensor regolith noise while preserving sharp crater rim gradients.
2. **Retinex-Inspired Log-Domain Decomposition:**
   $$I(x,y) = L(x,y) \cdot R(x,y) \implies \log I(x,y) = \log L(x,y) + \log R(x,y)$$
   A large Gaussian spatial filter ($\sigma \ge 15$) estimates the low-frequency illumination field $L(x,y)$, and subtracting it yields the illumination-invariant reflectance $R(x,y)$.
3. **Contrast-Limited Adaptive Histogram Equalization (CLAHE):**
   Amplifies localized topographic terrain contrast without blowing out sunlit crater walls.

---

## 3. Geometric Transformation & Outlier Rejection

Given candidate correspondences $(x_i, y_i) \leftrightarrow (u_i, v_i)$:
- **Affine Model (6 DOF):**
  $$\begin{bmatrix} u \\ v \end{bmatrix} = \begin{bmatrix} a_{11} & a_{12} \\ a_{21} & a_{22} \end{bmatrix} \begin{bmatrix} x \\ y \end{bmatrix} + \begin{bmatrix} t_x \\ t_y \end{bmatrix}$$
- **Planar Homography Model (8 DOF):**
  $$\begin{bmatrix} u' \\ v' \\ w' \end{bmatrix} = \mathbf{H} \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}, \quad u = \frac{u'}{w'}, \quad v = \frac{v'}{w'}$$

Outlier rejection uses USAC_MAGSAC/RANSAC with a maximum reprojection threshold of $3.0\text{ px}$.

---

## 4. Uniform Grid Coverage Enforcement

To prevent keypoints from clustering on a single high-contrast crater while leaving the rest of the overlapping scene unconstrained:
1. The reference bounding box is partitioned into an $N \times N$ spatial grid (default: 64 cells, $8 \times 8$).
2. A maximum of $k=5$ inliers with the lowest reprojection residual are retained per cell.
3. The **Coverage Uniformity Score** is reported as:
   $$S_{\text{coverage}} = \frac{|\text{Active Cells}|}{N^2}$$

---

## 5. Evaluation Metrics & Sub-Pixel Target

- **Root Mean Square Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{M} \sum_{j=1}^M \| \mathbf{H}(p_j) - q_j \|^2}$$
  **Target:** $\text{RMSE} \le 1.0\text{ pixel}$ on valid overlapping imagery.
- **Inlier Ratio:** $\frac{M_{\text{inliers}}}{N_{\text{candidates}}}$
- **Reprojection Error Distribution:** Mean, Median, and Max residuals reported in JSON metrics report.
