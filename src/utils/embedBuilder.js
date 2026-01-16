import { EmbedBuilder } from 'discord.js';

export function getRandomColor() {
  return Math.floor(Math.random() * 16777215);
}

export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || getRandomColor())
    .setTimestamp();

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.footer) embed.setFooter(options.footer);
  if (options.author) embed.setAuthor(options.author);
  if (options.fields) embed.addFields(options.fields);

  return embed;
}

export function getFooterText(user, customText = '') {
  const text = customText ? ${customText} |  : '';
  return {
    text: ${text}Requested by ,
    iconURL: user.displayAvatarURL()
  };
}

export function getRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 24) {
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? 'just now' : ${minutes} minute ago;
    }
    return ${hours} hour ago;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return ${year}//;
}