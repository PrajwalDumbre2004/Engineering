import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    loginId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'customer'], required: true },
    // Required for customers, null for the admin
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
      required: function () {
        return this.role === 'customer';
      },
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    // Never serialise the hash, even on freshly created documents
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export default mongoose.model('User', userSchema);
