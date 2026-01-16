const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
  giveawayId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  hostId: { type: String, required: true },
  prize: { type: String, required: true },
  winners: { type: Number, required: true },
  endTime: { type: Date, required: true },
  participants: { type: [String], default: [] },
  ended: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Giveaway', giveawaySchema);