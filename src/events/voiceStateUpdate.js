const TempVoice = require('../models/TempVoice');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    // User joined a voice channel
    if (!oldState.channelId && newState.channelId) {
      const tempVoice = await TempVoice.findOne({ 
        guildId: newState.guild.id, 
        channelId: newState.channelId 
      });
      
      if (tempVoice) {
        try {
          const channel = await newState.guild.channels.create({
            name: `${newState.member.user.username}'s Channel`,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent,
            userLimit: newState.channel.userLimit,
            permissionOverwrites: [
              {
                id: newState.member.id,
                allow: [
                  PermissionFlagsBits.ManageChannels,
                  PermissionFlagsBits.MoveMembers
                ]
              }
            ]
          });
          
          await newState.member.voice.setChannel(channel);
          
          tempVoice.createdChannels.push(channel.id);
          await tempVoice.save();
        } catch (err) {
          console.error('Error creating temp voice:', err);
        }
      }
    }
    
    // User left a voice channel
    if (oldState.channelId && !newState.channelId) {
      const tempVoice = await TempVoice.findOne({
        guildId: oldState.guild.id,
        createdChannels: oldState.channelId
      });
      
      if (tempVoice && oldState.channel.members.size === 0) {
        try {
          await oldState.channel.delete();
          tempVoice.createdChannels = tempVoice.createdChannels.filter(
            id => id !== oldState.channelId
          );
          await tempVoice.save();
        } catch (err) {
          console.error('Error deleting temp voice:', err);
        }
      }
    }
  }
};