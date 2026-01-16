const mongoose = require('mongoose');

const tempVoiceSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true, unique: true },
  createdChannels: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TempVoice', tempVoiceSchema);