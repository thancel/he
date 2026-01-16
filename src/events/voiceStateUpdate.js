import TempVoice from '../models/TempVoice.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';

export default {
  name: 'voiceStateUpdate',
  async execute(oldState, newState) {
    try {
      const tempVoiceData = await TempVoice.findOne({ guildId: newState.guild.id });
      
      if (!tempVoiceData) return;

      // User joined the temp voice creator channel
      if (newState.channelId === tempVoiceData.channelId && !oldState.channelId) {
        const member = newState.member;
        
        const tempChannel = await newState.guild.channels.create({
          name: ${member.user.username}'s Channel,
          type: ChannelType.GuildVoice,
          parent: newState.channel.parent,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers]
            }
          ]
        });

        await member.voice.setChannel(tempChannel);
        
        tempVoiceData.createdChannels.push(tempChannel.id);
        await tempVoiceData.save();
      }

      // User left a temp voice channel
      if (oldState.channelId && tempVoiceData.createdChannels.includes(oldState.channelId)) {
        const channel = oldState.channel;
        
        if (channel && channel.members.size === 0) {
          await channel.delete();
          
          tempVoiceData.createdChannels = tempVoiceData.createdChannels.filter(
            id => id !== oldState.channelId
          );
          await tempVoiceData.save();
        }
      }
    } catch (error) {
      console.error('Error in voiceStateUpdate:', error);
    }
  }
};