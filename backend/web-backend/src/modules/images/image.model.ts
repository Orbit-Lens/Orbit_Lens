import mongoose, { Schema, Document, Types } from 'mongoose';

export type SensorType = 'OHRC' | 'TMC-2' | 'IIRS' | 'LRO_NAC' | 'LRO_WAC' | 'KAGUYA' | 'OTHER';
export type ImageFormat = 'GEOTIFF' | 'PDS4_IMG' | 'PNG' | 'JPEG' | 'TIFF';
export type ImageUploadStatus = 'pending_upload' | 'uploaded' | 'ready' | 'failed';

export interface IImage extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  name: string;
  filename: string;
  format: ImageFormat;
  sensor: SensorType;
  resolutionMetersPerPixel?: number;
  sunAzimuthDeg?: number;
  sunElevationDeg?: number;
  incidenceAngleDeg?: number;
  emissionAngleDeg?: number;
  phaseAngleDeg?: number;
  acquisitionTime?: Date;
  storageKey: string;
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  channels?: number;
  footprint?: {
    type: string;
    coordinates: number[][][];
  };
  status: ImageUploadStatus;
  errorMessage?: string;
  metadataParsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new Schema<IImage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    name: { type: String, required: true, trim: true },
    filename: { type: String, required: true },
    format: {
      type: String,
      enum: ['GEOTIFF', 'PDS4_IMG', 'PNG', 'JPEG', 'TIFF'],
      default: 'GEOTIFF',
    },
    sensor: {
      type: String,
      enum: ['OHRC', 'TMC-2', 'IIRS', 'LRO_NAC', 'LRO_WAC', 'KAGUYA', 'OTHER'],
      default: 'OHRC',
    },
    resolutionMetersPerPixel: { type: Number },
    sunAzimuthDeg: { type: Number },
    sunElevationDeg: { type: Number },
    incidenceAngleDeg: { type: Number },
    emissionAngleDeg: { type: Number },
    phaseAngleDeg: { type: Number },
    acquisitionTime: { type: Date },
    storageKey: { type: String, required: true },
    fileSizeBytes: { type: Number },
    width: { type: Number },
    height: { type: Number },
    channels: { type: Number },
    footprint: {
      type: { type: String, default: 'Polygon' },
      coordinates: [[[Number]]],
    },
    status: {
      type: String,
      enum: ['pending_upload', 'uploaded', 'ready', 'failed'],
      default: 'pending_upload',
      index: true,
    },
    errorMessage: { type: String },
    metadataParsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ImageSchema.index({ userId: 1, createdAt: -1 });
ImageSchema.index({ userId: 1, status: 1 });
ImageSchema.index({ userId: 1, projectId: 1 });

export const Image = mongoose.model<IImage>('Image', ImageSchema);
