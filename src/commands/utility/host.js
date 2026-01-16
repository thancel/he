import { SlashCommandBuilder } from 'discord.js';
import { createEmbed, getRandomColor } from '../../utils/embedBuilder.js';
import si from 'systeminformation';
import os from 'os';

export default {
  data: new SlashCommandBuilder()
    .setName('host')
    .setDescription('View host statistics (Owner only)'),

  async execute(interaction) {
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: '❌ This command is only available to the bot owner!',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const [cpuData, memData, fsData, osData] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.osInfo()
      ]);

      const cpuUsage = cpuData.currentLoad.toFixed(2);
      
      const totalMemGB = (memData.total / (1024 ** 3)).toFixed(2);
      const usedMemGB = (memData.used / (1024 ** 3)).toFixed(2);
      const memPercentage = ((memData.used / memData.total) * 100).toFixed(2);

      let totalDiskGB = 0;
      let usedDiskGB = 0;
      fsData.forEach(disk => {
        totalDiskGB += disk.size;
        usedDiskGB += disk.used;
      });
      totalDiskGB = (totalDiskGB / (1024 ** 3)).toFixed(2);
      usedDiskGB = (usedDiskGB / (1024 ** 3)).toFixed(2);
      const diskPercentage = ((usedDiskGB / totalDiskGB) * 100).toFixed(2);

      const ping = interaction.client.ws.ping;
      const nodeVersion = process.version;
      const osVersion = `${osData.platform} ${osData.release}`;

      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const embed = createEmbed({
        title: '🖥️ Host Statistics',
        fields: [
          {
            name: '💻 CPU Usage',
            value: `${cpuUsage}%`,
            inline: true
          },
          {
            name: '🧠 RAM Usage',
            value: `${usedMemGB}GB / ${totalMemGB}GB (${memPercentage}%)`,
            inline: true
          },
          {
            name: '💾 Disk Usage',
            value: `${usedDiskGB}GB / ${totalDiskGB}GB (${diskPercentage}%)`,
            inline: true
          },
          {
            name: '📡 Ping',
            value: `${ping}ms`,
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value: uptimeStr,
            inline: true
          },
          {
            name: '🟢 Node.js Version',
            value: nodeVersion,
            inline: true
          },
          {
            name: '🖥️ OS',
            value: osVersion,
            inline: false
          }
        ],
        color: getRandomColor()
      });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error getting host stats:', error);
      await interaction.editReply({
        content: '❌ Failed to retrieve host statistics!',
        ephemeral: true
      });
    }
  }
};