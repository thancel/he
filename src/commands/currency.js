const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const User = require('../models/User');

module.exports = [
  {
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Check currency balance')
      .addUserOption(opt => opt.setName('user').setDescription('User to check')),
    async execute(interaction, client) {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      let user = await User.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
      if (!user) {
        user = new User({ userId: targetUser.id, guildId: interaction.guild.id, balance: 0 });
        await user.save();
      }
      
      const embed = new EmbedBuilder()
        .setTitle(`${client.config.currencyEmoji} Balance`)
        .setDescription(`**${targetUser.tag}**\n\nBalance: ${client.config.currencyEmoji} ${user.balance}`)
        .setColor('#FFD700')
        .setThumbnail(targetUser.displayAvatarURL())
        .setFooter({ text: `Requested by ${interaction.user.tag} at ${new Date().toLocaleTimeString()}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('daily')
      .setDescription('Claim your daily reward'),
    async execute(interaction, client) {
      let user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (!user) {
        user = new User({ userId: interaction.user.id, guildId: interaction.guild.id });
      }
      
      const now = new Date();
      const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
      
      if (lastDaily) {
        const diff = now - lastDaily;
        const hours = diff / (1000 * 60 * 60);
        
        if (hours < 24) {
          const remaining = 24 - hours;
          const hrs = Math.floor(remaining);
          const mins = Math.floor((remaining - hrs) * 60);
          
          return interaction.reply({ 
            content: `❌ You already claimed your daily! Come back in **${hrs}h ${mins}m**`, 
            ephemeral: true 
          });
        }
        
        if (hours < 48) {
          user.dailyStreak += 1;
        } else {
          user.dailyStreak = 1;
        }
      } else {
        user.dailyStreak = 1;
      }
      
      const baseReward = Math.floor(Math.random() * 251) + 500;
      const bonus = Math.floor(baseReward * ((user.dailyStreak - 1) * 0.1));
      const totalReward = baseReward + bonus;
      
      user.balance += totalReward;
      user.lastDaily = now;
      await user.save();
      
      const embed = new EmbedBuilder()
        .setTitle(`${client.config.currencyEmoji} Daily Reward`)
        .setDescription(`You received ${client.config.currencyEmoji} **${totalReward}**!\n\n🔥 Streak: **${user.dailyStreak} day(s)**${bonus > 0 ? `\n💰 Bonus: ${client.config.currencyEmoji} ${bonus}` : ''}\n\nNew Balance: ${client.config.currencyEmoji} ${user.balance}`)
        .setColor('#00FF00')
        .setFooter({ text: `Requested by ${interaction.user.tag} at ${new Date().toLocaleTimeString()}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription('Play coinflip')
      .addIntegerOption(opt => 
        opt.setName('amount')
          .setDescription('Amount to bet')
          .setRequired(true)
          .setMinValue(1)
      ),
    async execute(interaction, client) {
      const amount = interaction.options.getInteger('amount');
      
      let user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (!user || user.balance < amount) {
        return interaction.reply({ content: '❌ Insufficient balance!', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🪙 Coinflip')
        .setDescription(`Choose Heads or Tails!\n\nBet Amount: ${client.config.currencyEmoji} ${amount}`)
        .setColor('#FFD700')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`coinflip_heads_${amount}_${interaction.user.id}`)
          .setLabel('Heads')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🪙'),
        new ButtonBuilder()
          .setCustomId(`coinflip_tails_${amount}_${interaction.user.id}`)
          .setLabel('Tails')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🪙')
      );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('slot')
      .setDescription('Play slot machine')
      .addIntegerOption(opt =>
        opt.setName('amount')
          .setDescription('Amount to bet')
          .setRequired(true)
          .setMinValue(1)
      ),
    async execute(interaction, client) {
      const amount = interaction.options.getInteger('amount');
      
      let user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (!user || user.balance < amount) {
        return interaction.reply({ content: '❌ Insufficient balance!', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('🎰 Slot Machine')
        .setDescription(`Ready to spin?\n\nBet Amount: ${client.config.currencyEmoji} ${amount}`)
        .setColor('#FF1493')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`slot_start_${amount}_${interaction.user.id}`)
          .setLabel('Spin')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🎰'),
        new ButtonBuilder()
          .setCustomId(`slot_end_${amount}_${interaction.user.id}`)
          .setLabel('End')
          .setStyle(ButtonStyle.Danger)
      );
      
      await interaction.reply({ embeds: [embed], components: [row] });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('give')
      .setDescription('Give currency to another user')
      .addIntegerOption(opt =>
        opt.setName('amount')
          .setDescription('Amount to give')
          .setRequired(true)
          .setMinValue(1)
      )
      .addUserOption(opt =>
        opt.setName('user')
          .setDescription('User to give to')
          .setRequired(true)
      ),
    async execute(interaction, client) {
      const amount = interaction.options.getInteger('amount');
      const targetUser = interaction.options.getUser('user');
      
      if (targetUser.id === interaction.user.id) {
        return interaction.reply({ content: '❌ You cannot give currency to yourself!', ephemeral: true });
      }
      
      if (targetUser.bot) {
        return interaction.reply({ content: '❌ You cannot give currency to bots!', ephemeral: true });
      }
      
      let sender = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
      if (!sender || sender.balance < amount) {
        return interaction.reply({ content: '❌ Insufficient balance!', ephemeral: true });
      }
      
      let receiver = await User.findOne({ userId: targetUser.id, guildId: interaction.guild.id });
      if (!receiver) {
        receiver = new User({ userId: targetUser.id, guildId: interaction.guild.id });
      }
      
      sender.balance -= amount;
      receiver.balance += amount;
      
      await sender.save();
      await receiver.save();
      
      const embed = new EmbedBuilder()
        .setTitle(`${client.config.currencyEmoji} Transfer Complete`)
        .setDescription(`**${interaction.user.tag}** gave ${client.config.currencyEmoji} **${amount}** to **${targetUser.tag}**!`)
        .setColor('#00FF00')
        .setFooter({ text: `Requested by ${interaction.user.tag} at ${new Date().toLocaleTimeString()}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    }
  }
];