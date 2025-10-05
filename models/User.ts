import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // server doesn't store user encryption keys; only password hash and auth
}, { timestamps: true })

export default mongoose.models.User || mongoose.model('User', UserSchema)
