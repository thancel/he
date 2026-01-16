import mongoose from 'mongoose';

const muteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  guildId: {
    type: String,
    required: true
  },
  unmuteAt: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  }
}, {
  timestamps: true
});

muteSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default mongoose.model('Mute', muteSchema);