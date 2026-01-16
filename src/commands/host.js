const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const si = require('systeminformation');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host')
    .setDescription('Check bot host statistics (Owner only)'),
  async execute(interaction, client) {
    if (interaction.user.id !== client.config.ownerId) {
      return interaction.reply({ content: '❌ This command is owner only!', ephemeral: true });
    }
    
    await interaction.deferReply();
    
    try {
      const [cpu, mem, fsSize, osInfo] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.osInfo()
      ]);
      
      const cpuUsage = cpu.currentLoad.toFixed(2);
      const totalMem = (mem.total / 1024 / 1024 / 1024).toFixed(2);
      const usedMem = (mem.used / 1024 / 1024 / 1024).toFixed(2);
      const memUsage = ((mem.used / mem.total) * 100).toFixed(2);
      
      const disk = fsSize[0] || {};
      const totalDisk = (disk.size / 1024 / 1024 / 1024).toFixed(2);
      const usedDisk = (disk.used / 1024 / 1024 / 1024).toFixed(2);
      const diskUsage = disk.use ? disk.use.toFixed(2) : '0.00';
      
      const ping = interaction.client.ws.ping;
      const nodeVersion = process.version;
      const osVersion = `${osInfo.platform} ${osInfo.release}`;
      
      const embed = new EmbedBuilder()
        .setTitle('📊 Host Statistics')
        .addFields(
          { name: '🖥️ CPU Usage', value: `${cpuUsage}%`, inline: true },
          { name: '💾 RAM Usage', value: `${usedMem}GB / ${totalMem}GB (${memUsage}%)`, inline: true },
          { name: '💿 Disk Usage', value: `${usedDisk}GB / ${totalDisk}GB (${diskUsage}%)`, inline: true },
          { name: '🏓 Ping', value: `${ping}ms`, inline: true },
          { name: '📦 Node.js', value: nodeVersion, inline: true },
          { name: '🖧 OS', value: osVersion, inline: true }
        )
        .setColor('#5865F2')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error fetching host statistics!' });
    }
  }
};