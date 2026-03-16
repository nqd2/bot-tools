// Service xử lý logic Discord Interactions (slash commands, v.v.)

const handleInteraction = async (interaction) => {
  if (interaction.type !== 2 && !interaction.isChatInputCommand) {
    return null;
  }

  const commandName =
    interaction.commandName ||
    (interaction.data && interaction.data.name);

  if (commandName === 'getid') {
    const channelId = interaction.channel_id || interaction.channelId;
    const guildId = interaction.guild_id || interaction.guildId;

    const content = `Channel ID: ${channelId}\nServer ID: ${guildId}`;

    // Với Webhook Interactions, ta trả về JSON response
    return {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content,
      },
    };
  }

  return null;
};

module.exports = {
  handleInteraction,
};

