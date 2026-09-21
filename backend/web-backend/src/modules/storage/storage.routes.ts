import { Router } from 'express';
import {
  handleLocalUpload,
  handleLocalDownload,
  handleStorageStatus,
} from './storage.controller.js';

const router = Router();

// Storage service status / metadata
router.get('/status', handleStorageStatus);

// Direct binary PUT to storage (handles wildcard path for keys like imagery/userId/filename.tif)
router.put('/upload/*', handleLocalUpload);

// Direct binary GET from storage
router.get('/download/*', handleLocalDownload);

export default router;
