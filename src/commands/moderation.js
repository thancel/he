const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server')
      .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick'))
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member.kickable) {
        return interaction.reply({ content: '❌ I cannot kick this user!', ephemeral: true });
      }
      
      await member.kick(reason);
      
      const embed = new EmbedBuilder()
        .setTitle('👢 Member Kicked')
        .setDescription(`**${user.tag}** has been kicked from the server!`)
        .addFields({ name: 'Reason', value: reason })
        .setColor('#FF9900')
        .setFooter({ text: `Kicked by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server')
      .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
      .addStringOption(opt => opt.setName('duration').setDescription('Duration (1s, 1m, 1h, 1d) or permanent'))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      if (member && !member.bannable) {
        return interaction.reply({ content: '❌ I cannot ban this user!', ephemeral: true });
      }
      
      await interaction.guild.members.ban(user.id, { reason });
      
      let durationText = 'permanently';
      if (duration) {
        const time = ms(duration);
        if (time) {
          durationText = `for ${ms(time, { long: true })}`;
          setTimeout(async () => {
            await interaction.guild.members.unban(user.id).catch(() => null);
          }, time);
        }
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🔨 Member Banned')
        .setDescription(`**${user.tag}** has been banned ${durationText}!`)
        .addFields({ name: 'Reason', value: reason })
        .setColor('#FF0000')
        .setFooter({ text: `Banned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('unban')
      .setDescription('Unban a user from the server')
      .addStringOption(opt => opt.setName('userid').setDescription('User ID to unban').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for unban'))
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      try {
        await interaction.guild.members.unban(userId, reason);
        
        const embed = new EmbedBuilder()
          .setTitle('✅ User Unbanned')
          .setDescription(`User with ID **${userId}** has been successfully unbanned!`)
          .addFields({ name: 'Reason', value: reason })
          .setColor('#00FF00')
          .setFooter({ text: `Unbanned by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        await interaction.reply({ content: '❌ Could not unban this user!', ephemeral: true });
      }
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('mute')
      .setDescription('Timeout a member')
      .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
      .addStringOption(opt => opt.setName('duration').setDescription('Duration (1s, 1m, 1h, 1d)').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id);
      
      const time = ms(duration);
      if (!time || time > 2419200000) {
        return interaction.reply({ content: '❌ Invalid duration! Max 28 days.', ephemeral: true });
      }
      
      if (!member.moderatable) {
        return interaction.reply({ content: '❌ I cannot mute this user!', ephemeral: true });
      }
      
      await member.timeout(time, reason);
      
      const embed = new EmbedBuilder()
        .setTitle('🔇 Member Muted')
        .setDescription(`**${user.tag}** has been muted for ${ms(time, { long: true })}!`)
        .addFields({ name: 'Reason', value: reason })
        .setColor('#FFA500')
        .setFooter({ text: `Muted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('unmute')
      .setDescription('Remove timeout from a member')
      .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
      .addStringOption(opt => opt.setName('reason').setDescription('Reason for unmute'))
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id);
      
      if (!member.moderatable) {
        return interaction.reply({ content: '❌ I cannot unmute this user!', ephemeral: true });
      }
      
      await member.timeout(null, reason);
      
      const embed = new EmbedBuilder()
        .setTitle('🔊 Member Unmuted')
        .setDescription(`**${user.tag}** has been successfully unmuted!`)
        .addFields({ name: 'Reason', value: reason })
        .setColor('#00FF00')
        .setFooter({ text: `Unmuted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  }
];