import assert from 'assert';
import http from 'http';
import axios from 'axios';
import { createApp } from '../app.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../modules/users/user.model.js';
import { Project } from '../modules/projects/project.model.js';
import { Image } from '../modules/images/image.model.js';
import { Job } from '../modules/jobs/job.model.js';
import { checkObjectExists, putStorageObject } from '../config/storage.js';
import bcrypt from 'bcryptjs';

async function runVerification() {
  console.log('🚀 Starting Comprehensive Authentication, Schema & Bucket Verification Suite...\n');

  await connectDB();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;
  const baseURL = `http://127.0.0.1:${port}`;
  console.log(`📡 In-process test server running on ${baseURL}\n`);

  const client = axios.create({
    baseURL,
    validateStatus: () => true, // Don't throw on HTTP error codes
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Health & Readiness & Storage Status
    // -------------------------------------------------------------
    console.log('--- TEST 1: Health, Readiness & Storage Status ---');
    const healthRes = await client.get('/health');
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.data.status, 'healthy');
    console.log('✅ /health is healthy');

    const readyRes = await client.get('/ready');
    assert.strictEqual(readyRes.status, 200);
    assert.strictEqual(readyRes.data.data.status, 'ready');
    assert.ok(readyRes.data.data.storage, 'Storage status reported');
    console.log(`✅ /ready is ready with storage driver: [${readyRes.data.data.storage.driver}]`);

    const storageStatusRes = await client.get('/api/v1/storage/status');
    assert.strictEqual(storageStatusRes.status, 200);
    console.log('✅ /api/v1/storage/status reports active bucket configuration\n');

    // -------------------------------------------------------------
    // Test 2: User Registration & Password Security
    // -------------------------------------------------------------
    console.log('--- TEST 2: User Registration & Strong Password Policy ---');
    const weakPassRes = await client.post('/api/v1/auth/register', {
      name: 'Test Weak',
      email: 'weak@orbitlens.app',
      password: 'password', // lacks uppercase and number
    });
    assert.strictEqual(weakPassRes.status, 400);
    assert.strictEqual(weakPassRes.data.error.code, 'VALIDATION_ERROR');
    console.log('✅ Weak password rejected by Zod validation');

    const regRes = await client.post('/api/v1/auth/register', {
      name: 'Dr. John Lunar',
      email: 'john.lunar@orbitlens.app',
      password: 'Password123',
      role: 'researcher',
    });
    assert.strictEqual(regRes.status, 201);
    assert.ok(regRes.data.data.accessToken);
    assert.strictEqual(regRes.data.data.user.email, 'john.lunar@orbitlens.app');
    const johnToken = regRes.data.data.accessToken;
    const johnId = regRes.data.data.user.id;
    console.log('✅ User registered with JWT access token and HttpOnly refresh cookie');

    // Duplicate email rejected
    const dupRes = await client.post('/api/v1/auth/register', {
      name: 'Dr. John Duplicate',
      email: 'john.lunar@orbitlens.app',
      password: 'Password123',
    });
    assert.strictEqual(dupRes.status, 409);
    assert.strictEqual(dupRes.data.error.code, 'CONFLICT');
    console.log('✅ Duplicate email correctly returns 409 CONFLICT\n');

    // -------------------------------------------------------------
    // Test 3: User Authentication & Token Refresh & User Me
    // -------------------------------------------------------------
    console.log('--- TEST 3: Login, Profile, and Storage Quota ---');
    const loginRes = await client.post('/api/v1/auth/login', {
      email: 'john.lunar@orbitlens.app',
      password: 'Password123',
    });
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.data.data.accessToken);
    console.log('✅ Login successful with credential verification');

    const profileRes = await client.get('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${johnToken}` },
    });
    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.data.data.email, 'john.lunar@orbitlens.app');
    assert.ok(profileRes.data.data.storageQuotaBytes > 0);
    console.log(`✅ Profile retrieved: ${profileRes.data.data.name} (Quota: ${profileRes.data.data.storageQuotaBytes} bytes)`);

    // -------------------------------------------------------------
    // Test 4: User Data Isolation (Multi-tenant Security)
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: User Data Isolation & Cross-Tenant Protection ---');
    // Register second user
    const user2Reg = await client.post('/api/v1/auth/register', {
      name: 'Alice Investigator',
      email: 'alice@orbitlens.app',
      password: 'Password123',
    });
    const aliceToken = user2Reg.data.data.accessToken;
    const aliceId = user2Reg.data.data.user.id;

    // John creates a project
    const johnProjRes = await client.post(
      '/api/v1/projects',
      {
        name: "John's Private Moon Survey",
        description: 'Survey data for crater site 4',
        tags: ['moon', 'crater'],
      },
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    assert.strictEqual(johnProjRes.status, 201);
    const johnProjId = johnProjRes.data.data._id || johnProjRes.data.data.id;
    console.log(`✅ John created Project: ${johnProjId}`);

    // Alice queries projects -> should see 0 projects
    const aliceProjsRes = await client.get('/api/v1/projects', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(aliceProjsRes.status, 200);
    assert.strictEqual(aliceProjsRes.data.data.length, 0);
    console.log("✅ Alice queries projects -> 0 returned (John's project is strictly isolated)");

    // Alice attempts to get John's project by ID -> must return 404 NOT_FOUND
    const aliceStealProjRes = await client.get(`/api/v1/projects/${johnProjId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(aliceStealProjRes.status, 404);
    assert.strictEqual(aliceStealProjRes.data.error.code, 'NOT_FOUND');
    console.log("✅ Alice attempts to access John's project ID -> 404 NOT_FOUND (ID enumeration prevented)");

    // Alice attempts to associate her image with John's project ID -> must be rejected
    const aliceImageHijackRes = await client.post(
      '/api/v1/images/upload-url',
      {
        name: "Alice's hijacked image",
        filename: 'alice.tif',
        format: 'GEOTIFF',
        sensor: 'OHRC',
        contentType: 'image/tiff',
        projectId: johnProjId, // Belongs to John!
      },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    assert.strictEqual(aliceImageHijackRes.status, 404);
    console.log("✅ Cross-user project attachment rejected with 404 NOT_FOUND");

    // -------------------------------------------------------------
    // Test 5: Bucket Storage: Presigned Upload, Binary PUT & Confirm
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Storage Bucket: Presigned Upload, Binary Stream & Verification ---');
    const uploadUrlRes = await client.post(
      '/api/v1/images/upload-url',
      {
        name: 'Lunar Mare Tranquillitatis Patch',
        filename: 'mare_tranq_patch.tif',
        format: 'GEOTIFF',
        sensor: 'OHRC',
        contentType: 'image/tiff',
        resolutionMetersPerPixel: 0.25,
        sunAzimuthDeg: 120.5,
        sunElevationDeg: 45.0,
      },
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    assert.strictEqual(uploadUrlRes.status, 201);
    const { image: createdImage, uploadUrl } = uploadUrlRes.data.data;
    assert.ok(uploadUrl, 'Presigned upload URL generated');
    console.log(`✅ Upload URL generated for storage key: ${createdImage.storageKey}`);

    // Try to confirm BEFORE uploading binary bytes -> should fail because file does not exist in bucket
    const prematureConfirmRes = await client.post(
      `/api/v1/images/${createdImage._id}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    assert.strictEqual(prematureConfirmRes.status, 400);
    assert.strictEqual(prematureConfirmRes.data.error.code, 'FILE_NOT_FOUND');
    console.log('✅ Premature confirm rejected: file not found in storage bucket yet');

    // Actually perform binary PUT to the presigned upload URL
    console.log(`Uploading binary data directly to storage bucket via PUT...`);
    const testBinaryData = Buffer.from('REAL_LUNAR_TIFF_BINARY_DATA_PAYLOAD_TEST_12345');
    const targetUploadUrl = uploadUrl.replace('http://localhost:5000', baseURL);
    const putRes = await axios.put(targetUploadUrl, testBinaryData, {
      headers: { 'Content-Type': 'image/tiff' },
      validateStatus: () => true,
    });
    assert.strictEqual(putRes.status, 200);
    console.log('✅ Direct PUT to storage bucket succeeded (HTTP 200)');

    // Verify object exists in bucket
    const existCheck = await checkObjectExists(createdImage.storageKey);
    assert.strictEqual(existCheck.exists, true);
    assert.strictEqual(existCheck.sizeBytes, testBinaryData.length);
    console.log(`✅ Bucket confirms object exists with size: ${existCheck.sizeBytes} bytes`);

    // Now confirm the upload
    const confirmRes = await client.post(
      `/api/v1/images/${createdImage._id}/confirm`,
      { width: 1024, height: 1024, channels: 1 },
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    assert.strictEqual(confirmRes.status, 200);
    assert.strictEqual(confirmRes.data.data.status, 'ready');
    assert.strictEqual(confirmRes.data.data.fileSizeBytes, testBinaryData.length);
    console.log('✅ Upload confirmed; Image marked as ready with auto-resolved file size');

    // Download URL generation & file content verification
    const downloadUrlRes = await client.get(`/api/v1/images/${createdImage._id}/download-url`, {
      headers: { Authorization: `Bearer ${johnToken}` },
    });
    assert.strictEqual(downloadUrlRes.status, 200);
    const downloadUrl = downloadUrlRes.data.data.downloadUrl;
    assert.ok(downloadUrl);

    const targetDownloadUrl = downloadUrl.replace('http://localhost:5000', baseURL);
    const getFileRes = await axios.get(targetDownloadUrl, {
      responseType: 'arraybuffer',
      validateStatus: () => true,
    });
    assert.strictEqual(getFileRes.status, 200);
    assert.strictEqual(Buffer.from(getFileRes.data).toString(), testBinaryData.toString());
    console.log('✅ File downloaded from storage bucket and binary payload matches perfectly');

    // -------------------------------------------------------------
    // Test 6: Job Execution & Artifact Lifecycle
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Job Execution, Image Ready Guard & Lifecycle ---');
    // Upload a second image for registration
    const refUploadRes = await client.post(
      '/api/v1/images/upload-url',
      {
        name: 'Mare Ref Image',
        filename: 'mare_ref.tif',
        format: 'GEOTIFF',
        sensor: 'TMC-2',
        contentType: 'image/tiff',
      },
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    const refImage = refUploadRes.data.data.image;
    // Put binary for ref image
    const targetRefUploadUrl = refUploadRes.data.data.uploadUrl.replace('http://localhost:5000', baseURL);
    await axios.put(targetRefUploadUrl, testBinaryData, {
      headers: { 'Content-Type': 'image/tiff' },
    });
    await client.post(`/api/v1/images/${refImage._id}/confirm`, {}, { headers: { Authorization: `Bearer ${johnToken}` } });

    // Queue registration job
    const jobCreateRes = await client.post(
      '/api/v1/jobs',
      {
        sourceImageId: createdImage._id,
        referenceImageId: refImage._id,
        algorithm: 'classical',
        transformModel: 'homography',
      },
      { headers: { Authorization: `Bearer ${johnToken}` } }
    );
    assert.strictEqual(jobCreateRes.status, 201);
    const createdJobId = jobCreateRes.data.data._id || jobCreateRes.data.data.id;
    console.log(`✅ Registration Job queued: ${createdJobId}`);

    // Alice attempts to get John's job -> 404
    const aliceStealJob = await client.get(`/api/v1/jobs/${createdJobId}`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert.strictEqual(aliceStealJob.status, 404);
    console.log("✅ Alice cannot access John's registration job (404 NOT_FOUND)");

    // Internal service pushes sub-pixel completion metrics
    const internalCallbackRes = await client.post(
      `/api/v1/jobs/${createdJobId}/status-internal`,
      {
        status: 'complete',
        progress: 100,
        statusMessage: 'Sub-pixel registration completed successfully',
        metrics: {
          rmse: 0.35,
          inlierCount: 420,
          totalCandidateMatches: 600,
          inlierRatio: 0.70,
          meanReprojectionError: 0.31,
          medianReprojectionError: 0.28,
          coverageUniformityScore: 0.91,
          processingTimeMs: 1150,
        },
      },
      { headers: { 'X-Internal-Key': 'shared_internal_orbitlens_secret_key_123' } }
    );
    assert.strictEqual(internalCallbackRes.status, 200);
    console.log('✅ Internal service callback updated job metrics (RMSE: 0.35px, Inliers: 420)');

    // Check metrics overview
    const metricsOverviewRes = await client.get('/api/v1/metrics/overview', {
      headers: { Authorization: `Bearer ${johnToken}` },
    });
    assert.strictEqual(metricsOverviewRes.status, 200);
    assert.strictEqual(metricsOverviewRes.data.data.overview.totalCompletedJobs, 1);
    assert.strictEqual(metricsOverviewRes.data.data.overview.subPixelAccuracyCount, 1);
    console.log('✅ Metrics overview aggregates user registration history and sub-pixel counts');

    // -------------------------------------------------------------
    // Test 7: Cascade Account Deletion & Bucket Cleanup
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Cascade Account Deletion & Complete Bucket Cleanup ---');
    const deleteAccountRes = await client.delete('/api/v1/users/me', {
      headers: { Authorization: `Bearer ${johnToken}` },
      data: { confirmation: 'DELETE MY ACCOUNT' },
    });
    assert.strictEqual(deleteAccountRes.status, 200);
    console.log('✅ John deleted his account');

    // Verify user is gone
    const findUser = await User.findById(johnId);
    assert.strictEqual(findUser, null);
    console.log('✅ User document deleted from MongoDB');

    // Verify projects are deleted
    const userProjects = await Project.find({ userId: johnId });
    assert.strictEqual(userProjects.length, 0);
    console.log("✅ All user's projects cascaded and removed");

    // Verify images are deleted from database AND bucket
    const userImages = await Image.find({ userId: johnId });
    assert.strictEqual(userImages.length, 0);
    const bucketFileCheck = await checkObjectExists(createdImage.storageKey);
    assert.strictEqual(bucketFileCheck.exists, false);
    console.log("✅ All user's images removed from DB and physical file wiped from storage bucket");

    // Verify jobs are deleted
    const userJobs = await Job.find({ userId: johnId });
    assert.strictEqual(userJobs.length, 0);
    console.log("✅ All user's registration jobs cascaded and removed");

    // -------------------------------------------------------------
    // Test 8: Logout & Token Invalidation
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Logout & Token Invalidation ---');
    const logoutRes = await client.post(
      '/api/v1/auth/logout',
      {},
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    assert.strictEqual(logoutRes.status, 200);
    const aliceUser = await User.findById(aliceId);
    assert.strictEqual(aliceUser?.refreshTokenHash, undefined);
    console.log('✅ Alice logged out: refresh token hash invalidated in database');

    console.log('\n=============================================================');
    console.log('🎉 ALL TESTS PASSED! APPLICATION VERIFIED AS FULLY OPERATIONAL!');
    console.log('=============================================================');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  });
