import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    // Short code used to build member login IDs, e.g. ACME -> acme-01
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, match: /^[A-Z0-9]{2,10}$/ },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
