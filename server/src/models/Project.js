import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    projectNo: { type: String, required: true, trim: true },
    title: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

// Project numbers are unique within a company, not globally
projectSchema.index({ companyId: 1, projectNo: 1 }, { unique: true });

export default mongoose.model('Project', projectSchema);
