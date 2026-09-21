import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Project } from '../modules/projects/project.model.js';
import { Image } from '../modules/images/image.model.js';
import { Job } from '../modules/jobs/job.model.js';
import { putStorageObject } from '../config/storage.js';
import { logger } from '../utils/logger.js';

// Minimal 1x1 valid TIFF buffer header to provide real valid image binaries
const SAMPLE_TIFF_BYTES = Buffer.from([
  0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x01,
  0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

async function runSeed() {
  logger.info('🌱 Starting OrbitLens database seed...');
  await connectDB();

  // 1. Clear existing seed data if present
  logger.info('Cleaning prior seed collections...');
  await Promise.all([
    User.deleteMany({ email: { $in: ['sakthivel@orbitlens.app', 'sarah.chen@lunar-institute.org'] } }),
  ]);

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123', salt);

  // 2. Create Primary Admin User
  logger.info('Creating User 1 (Admin): Sakthivel Prakash...');
  const user1 = await User.create({
    name: 'Sakthivel Prakash',
    email: 'sakthivel@orbitlens.app',
    passwordHash: defaultPasswordHash,
    role: 'admin',
    institution: 'OrbitLens Research Lab / ISRO SAC',
    storageQuotaBytes: 20 * 1024 * 1024 * 1024, // 20 GB
    storageUsedBytes: 0,
    isVerified: true,
    lastLoginAt: new Date(),
  });

  // 3. Create Secondary Researcher User (to test user isolation)
  logger.info('Creating User 2 (Researcher): Dr. Sarah Chen...');
  const user2 = await User.create({
    name: 'Dr. Sarah Chen',
    email: 'sarah.chen@lunar-institute.org',
    passwordHash: defaultPasswordHash,
    role: 'researcher',
    institution: 'Lunar & Planetary Science Institute',
    storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB
    storageUsedBytes: 0,
    isVerified: true,
    lastLoginAt: new Date(),
  });

  // 4. Create Projects for User 1
  logger.info('Creating projects for Sakthivel...');
  const proj1 = await Project.create({
    userId: user1._id,
    name: 'Chandrayaan-2 South Pole Crater Alignment',
    description: 'High-resolution sub-pixel registration and radiometric normalization of OHRC 25cm and TMC 5m images.',
    tags: ['chandrayaan-2', 'ohrc', 'lunar-crater', 'south-pole'],
  });

  const proj2 = await Project.create({
    userId: user1._id,
    name: 'Boguslawsky Crater Multi-Temporal Study',
    description: 'Sub-pixel temporal change analysis using LRO NAC and OHRC imagery.',
    tags: ['boguslawsky', 'lro', 'temporal-matching'],
  });

  // 5. Create Projects for User 2
  logger.info('Creating projects for Dr. Sarah Chen...');
  const proj3 = await Project.create({
    userId: user2._id,
    name: 'Shackleton Crater Rim Topography Mapping',
    description: 'Co-registration of TMC stereo pairs and LOLA elevation datasets.',
    tags: ['shackleton', 'tmc', 'stereo-matching'],
  });

  // 6. Create Images & Bucket Files for User 1
  logger.info('Creating images & populating storage bucket files for Sakthivel...');
  const img1StorageKey = `imagery/${user1._id}/ch2_ohrc_south_pole_ref_001.tif`;
  const img2StorageKey = `imagery/${user1._id}/ch2_tmc_south_pole_src_001.tif`;

  // Write binaries to storage bucket (S3 or local bucket)
  await putStorageObject(img1StorageKey, SAMPLE_TIFF_BYTES, 'image/tiff');
  await putStorageObject(img2StorageKey, SAMPLE_TIFF_BYTES, 'image/tiff');

  const img1 = await Image.create({
    userId: user1._id,
    projectId: proj1._id,
    name: 'Chandrayaan-2 OHRC South Pole Reference',
    filename: 'ch2_ohrc_south_pole_ref_001.tif',
    format: 'GEOTIFF',
    sensor: 'OHRC',
    resolutionMetersPerPixel: 0.25,
    sunAzimuthDeg: 145.2,
    sunElevationDeg: 32.5,
    storageKey: img1StorageKey,
    fileSizeBytes: 10485760, // 10 MB
    width: 4096,
    height: 4096,
    channels: 1,
    status: 'ready',
    metadataParsed: true,
  });

  const img2 = await Image.create({
    userId: user1._id,
    projectId: proj1._id,
    name: 'Chandrayaan-2 TMC-2 South Pole Source',
    filename: 'ch2_tmc_south_pole_src_001.tif',
    format: 'GEOTIFF',
    sensor: 'TMC-2',
    resolutionMetersPerPixel: 5.0,
    sunAzimuthDeg: 148.0,
    sunElevationDeg: 30.1,
    storageKey: img2StorageKey,
    fileSizeBytes: 4194304, // 4 MB
    width: 2048,
    height: 2048,
    channels: 1,
    status: 'ready',
    metadataParsed: true,
  });

  // 7. Create Images & Bucket Files for User 2
  logger.info('Creating images & storage bucket files for Dr. Sarah Chen...');
  const img3StorageKey = `imagery/${user2._id}/sarah_shackleton_tmc_01.tif`;
  await putStorageObject(img3StorageKey, SAMPLE_TIFF_BYTES, 'image/tiff');

  const img3 = await Image.create({
    userId: user2._id,
    projectId: proj3._id,
    name: 'Shackleton Rim TMC Ortho',
    filename: 'sarah_shackleton_tmc_01.tif',
    format: 'GEOTIFF',
    sensor: 'TMC-2',
    resolutionMetersPerPixel: 5.0,
    storageKey: img3StorageKey,
    fileSizeBytes: 5242880, // 5 MB
    width: 2048,
    height: 2048,
    channels: 1,
    status: 'ready',
    metadataParsed: true,
  });

  // 8. Create Registration Jobs & Artifacts for User 1
  logger.info('Creating sample registration jobs & artifacts for Sakthivel...');
  const sampleJobId = new Types.ObjectId();
  const registeredImageKey = `imagery/${user1._id}/jobs/${sampleJobId}_registered.tif`;
  const matchPointsKey = `imagery/${user1._id}/jobs/${sampleJobId}_matchpoints.json`;
  const metricsReportKey = `imagery/${user1._id}/jobs/${sampleJobId}_metrics.json`;

  const sampleMatchPoints = JSON.stringify({
    inlierMatches: 412,
    points: [
      { src: [1024.4, 512.8], dst: [1024.0, 512.5], error: 0.35 },
      { src: [1500.2, 800.1], dst: [1499.9, 799.8], error: 0.32 },
    ],
  });
  const sampleMetricsReport = JSON.stringify({
    rmse: 0.38,
    inlierCount: 412,
    inlierRatio: 0.71,
    subPixelAccuracy: true,
    homographyMatrix: [
      [1.0002, -0.0001, 14.2],
      [0.0001, 1.0003, -8.7],
      [0.0, 0.0, 1.0],
    ],
  });

  await putStorageObject(registeredImageKey, SAMPLE_TIFF_BYTES, 'image/tiff');
  await putStorageObject(matchPointsKey, sampleMatchPoints, 'application/json');
  await putStorageObject(metricsReportKey, sampleMetricsReport, 'application/json');

  await Job.create({
    _id: sampleJobId,
    userId: user1._id,
    projectId: proj1._id,
    sourceImageId: img2._id,
    referenceImageId: img1._id,
    algorithm: 'classical',
    transformModel: 'homography',
    parameters: {
      coverageTargetCells: 64,
      ratioThreshold: 0.75,
      ransacReprojThreshold: 3.0,
      maxPyramidLevels: 4,
      illuminationCorrection: true,
    },
    status: 'complete',
    progress: 100,
    statusMessage: 'Sub-pixel registration completed successfully with RMSE 0.38px',
    metrics: {
      rmse: 0.38,
      inlierCount: 412,
      totalCandidateMatches: 580,
      inlierRatio: 0.71,
      meanReprojectionError: 0.34,
      medianReprojectionError: 0.31,
      coverageUniformityScore: 0.89,
      processingTimeMs: 1240,
      sunAngleDeltaAzimuth: 2.8,
      sunAngleDeltaElevation: 2.4,
      confidenceWarning: false,
    },
    artifacts: {
      registeredImageStorageKey: registeredImageKey,
      matchPointsStorageKey: matchPointsKey,
      metricsReportStorageKey: metricsReportKey,
    },
  });

  // 9. Update users' tracked storage
  user1.storageUsedBytes = 10485760 + 4194304 + SAMPLE_TIFF_BYTES.length;
  await user1.save();

  user2.storageUsedBytes = 5242880;
  await user2.save();

  logger.info('===========================================================');
  logger.info('🎉 SEED COMPLETED SUCCESSFULLY!');
  logger.info('===========================================================');
  logger.info('👤 User 1 (Admin):');
  logger.info('   Email:    sakthivel@orbitlens.app');
  logger.info('   Password: Password123');
  logger.info('   Projects: 2 created');
  logger.info('   Images:   2 created & stored in bucket');
  logger.info('   Jobs:     1 completed registration job with sub-pixel RMSE 0.38');
  logger.info('-----------------------------------------------------------');
  logger.info('👤 User 2 (Researcher):');
  logger.info('   Email:    sarah.chen@lunar-institute.org');
  logger.info('   Password: Password123');
  logger.info('   Projects: 1 created');
  logger.info('   Images:   1 created & stored in bucket (isolated from User 1)');
  logger.info('===========================================================');

  await disconnectDB();
  process.exit(0);
}

runSeed().catch(async (err) => {
  logger.error('Seed error:', err);
  await disconnectDB();
  process.exit(1);
});
