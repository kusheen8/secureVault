import mongoose, { Schema } from 'mongoose'

const VaultItemSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  encrypted: { type: String, required: true }, // base64 or hex blob
  iv: { type: String, required: true },
  salt: { type: String, required: true },
  tag: { type: String },
  meta: { type: Object },
}, { timestamps: true })

export default mongoose.models.VaultItem || mongoose.model('VaultItem', VaultItemSchema)
