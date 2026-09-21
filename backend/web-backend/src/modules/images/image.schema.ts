import { z } from 'zod';

export const requestUploadUrlSchema = z.object({
  name: z.string().min(1, 'Image display name is required'),
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().default('image/tiff'),
  format: z.enum(['GEOTIFF', 'PDS4_IMG', 'PNG', 'JPEG', 'TIFF']).default('GEOTIFF'),
  sensor: z.enum(['OHRC', 'TMC-2', 'IIRS', 'LRO_NAC', 'LRO_WAC', 'KAGUYA', 'OTHER']).default('OHRC'),
  projectId: z.string().optional(),
  resolutionMetersPerPixel: z.number().positive().optional(),
  sunAzimuthDeg: z.number().min(0).max(360).optional(),
  sunElevationDeg: z.number().min(-90).max(90).optional(),
  acquisitionTime: z.string().datetime().optional(),
});

export const confirmUploadSchema = z.object({
  fileSizeBytes: z.number().positive().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  channels: z.number().positive().optional(),
  resolutionMetersPerPixel: z.number().positive().optional(),
  sunAzimuthDeg: z.number().min(0).max(360).optional(),
  sunElevationDeg: z.number().min(-90).max(90).optional(),
});

export const updateImageSchema = z.object({
  name: z.string().min(1).optional(),
  sensor: z.enum(['OHRC', 'TMC-2', 'IIRS', 'LRO_NAC', 'LRO_WAC', 'KAGUYA', 'OTHER']).optional(),
  resolutionMetersPerPixel: z.number().positive().optional(),
  sunAzimuthDeg: z.number().min(0).max(360).optional(),
  sunElevationDeg: z.number().min(-90).max(90).optional(),
  projectId: z.string().optional(),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
export type UpdateImageInput = z.infer<typeof updateImageSchema>;
