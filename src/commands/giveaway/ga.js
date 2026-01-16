import { SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createEmbed } from '../../utils/embedBuilder.js';
import Giveaway from '../../models/Giveaway.js';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('ga')
    .setDescription('Manage giveaways')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption(option =>
          option
            .setName('duration')
            .setDescription('Duration (e.g., 1d, 1h, 1m)')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('winners')
            .setDescription('Number of winners')
            .setRequired(true)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('prize')
            .setDescription('Prize description')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('end')
        .setDescription('End a giveaway immediately')
        .addStringOption(option =>
          option
            .setName('id')
            .setDescription('Giveaway ID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all active giveaways')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'start') {
      await handleStart(interaction);
    } else if (subcommand === 'end') {
      await handleEnd(interaction);
    } else if (subcommand === 'list') {
      await handleList(interaction);
    }
  }
};

async function handleStart(interaction) {
  const durationStr = interaction.options.getString('duration');
  const winners = interaction.options.getInteger('winners');
  const prize = interaction.options.getString('prize');

  const duration = ms(durationStr);
  if (!duration) {
    return interaction.reply({
      content: '❌ Invalid duration format! Use formats like: 1d, 1h, 1m',
      ephemeral: true
    });
  }

  const giveawayId = generateId();
  const endTime = new Date(Date.now() + duration);

  const embed = createEmbed({
    title: '🎉 GIVEAWAY 🎉',
    description: `**Prize:** ${prize}\n\n**Winners:** ${winners}\n**Hosted by:** <@${interaction.user.id}>\n\nClick the button below to join!`,
    color: 0xFFD700,
    footer: {
      text: `${interaction.user.username} | ID: ${giveawayId} | Ends at ${formatDate(endTime, interaction.user)}`,
      iconURL: interaction.user.displayAvatarURL()
    }
  });

  const joinButton = new ButtonBuilder()
    .setCustomId(`giveaway_join_${giveawayId}`)
    .setLabel('🎉 Join')
    .setStyle(ButtonStyle.Success);

  const leaveButton = new ButtonBuilder()
    .setCustomId(`giveaway_leave_${giveawayId}`)
    .setLabel('❌ Leave')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(joinButton, leaveButton);

  const message = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  await Giveaway.create({
    giveawayId,
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    messageId: message.id,
    hostId: interaction.user.id,
    prize,
    winners,
    endTime,
    participants: []
  });

  // Set up button collectors
  const collector = message.createMessageComponentCollector({
    time: duration
  });

  collector.on('collect', async (i) => {
    const giveaway = await Giveaway.findOne({ giveawayId });
    if (!giveaway || giveaway.ended) {
      return i.reply({
        content: '❌ This giveaway has ended!',
        ephemeral: true
      });
    }

    if (i.customId === `giveaway_join_${giveawayId}`) {
      if (giveaway.participants.includes(i.user.id)) {
        return i.reply({
          content: '❌ You already joined this giveaway!',
          ephemeral: true
        });
      }

      giveaway.participants.push(i.user.id);
      await giveaway.save();

      await i.reply({
        content: '✅ Successfully joined the giveaway!',
        ephemeral: true
      });
    } else if (i.customId === `giveaway_leave_${giveawayId}`) {
      if (!giveaway.participants.includes(i.user.id)) {
        return i.reply({
          content: '❌ You are not in this giveaway!',
          ephemeral: true
        });
      }

      giveaway.participants = giveaway.participants.filter(id => id !== i.user.id);
      await giveaway.save();

      await i.reply({
        content: '✅ Successfully left the giveaway!',
        ephemeral: true
      });
    }
  });
}

async function handleEnd(interaction) {
  const giveawayId = interaction.options.getString('id');

  const giveaway = await Giveaway.findOne({ giveawayId });

  if (!giveaway) {
    return interaction.reply({
      content: '❌ Giveaway not found!',
      ephemeral: true
    });
  }

  if (giveaway.ended) {
    return interaction.reply({
      content: '❌ This giveaway has already ended!',
      ephemeral: true
    });
  }

  if (giveaway.hostId !== interaction.user.id && interaction.user.id !== process.env.OWNER_ID) {
    return interaction.reply({
      content: '❌ Only the giveaway host can end it!',
      ephemeral: true
    });
  }

  try {
    const channel = await interaction.client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(giveaway.messageId);

    if (giveaway.participants.length < giveaway.winners) {
      const embed = createEmbed({
        title: '🎉 Giveaway Ended',
        description: `**Prize:** ${giveaway.prize}\n\n❌ Not enough participants!`,
        color: 0xFF0000
      });

      await message.edit({ embeds: [embed], components: [] });
      await interaction.reply({ content: '✅ Giveaway ended!', ephemeral: true });
    } else {
      const winners = [];
      const participants = [...giveaway.participants];

      for (let i = 0; i < giveaway.winners && participants.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
      }

      const winnerMentions = winners.map(id => `<@${id}>`).join(', ');

      const embed = createEmbed({
        title: '🎉 Giveaway Ended',
        description: `**Prize:** ${giveaway.prize}\n\n**Winners:** ${winnerMentions}\n\nCongratulations! 🎊`,
        color: 0x00FF00
      });

      await message.edit({ embeds: [embed], components: [] });
      await channel.send(`🎉 Congratulations ${winnerMentions}! You won **${giveaway.prize}**!`);

      for (const winnerId of winners) {
        try {
          const user = await interaction.client.users.fetch(winnerId);
          const dmEmbed = createEmbed({
            title: '🎉 You Won a Giveaway!',
            description: `Congratulations! You won **${giveaway.prize}** in ${channel.guild.name}!`,
            color: 0xFFD700
          });
          await user.send({ embeds: [dmEmbed] });
        } catch (error) {
          console.error(`Could not DM winner ${winnerId}`);
        }
      }

      giveaway.winnerIds = winners;
      await interaction.reply({ content: '✅ Giveaway ended!', ephemeral: true });
    }

    giveaway.ended = true;
    await giveaway.save();
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: '❌ Failed to end the giveaway!',
      ephemeral: true
    });
  }
}

async function handleList(interaction) {
  const giveaways = await Giveaway.find({
    guildId: interaction.guild.id,
    ended: false
  });

  if (giveaways.length === 0) {
    return interaction.reply({
      content: '❌ No active giveaways!',
      ephemeral: true
    });
  }

  const description = giveaways.map(g => {
    return `**ID:** ${g.giveawayId}\n**Prize:** ${g.prize}\n**Ends:** <t:${Math.floor(g.endTime.getTime() / 1000)}:R>\n**Participants:** ${g.participants.length}`;
  }).join('\n\n');

  const embed = createEmbed({
    title: '🎉 Active Giveaways',
    description,
    color: 0xFFD700
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

function generateId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function formatDate(date, user) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}