import mongoose from 'mongoose';

const tempVoiceSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },
  channelId: {
    type: String,
    required: true
  },
  createdChannels: [{
    type: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('TempVoice', tempVoiceSchema);