import mongoose from 'mongoose';

export const PART_STATUSES = ['QUEUED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'COMPLETED', 'DISPATCHED', 'ON_HOLD'];
export const DONE_STATUSES = ['COMPLETED', 'DISPATCHED'];

const partSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    // Denormalised from the project so customer queries can filter by company directly
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    partNo: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, validate: Number.isInteger },
    status: { type: String, enum: PART_STATUSES, default: 'QUEUED' },
  },
  { timestamps: true }
);

partSchema.index({ projectId: 1, partNo: 1 }, { unique: true });

export default mongoose.model('Part', partSchema);
