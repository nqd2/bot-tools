const {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} = require('discord-interactions');
const { handleInteraction } = require('../services/discord.service');

async function handleDiscordWebhook(req, res) {
  const signature = req.headers['x-signature-ed25519'];
  const timestamp = req.headers['x-signature-timestamp'];
  const rawBody = JSON.stringify(req.body);

  const isValidRequest = verifyKey(
    rawBody,
    signature,
    timestamp,
    process.env.DISCORD_PUBLIC_KEY,
  );

  if (!isValidRequest) {
    return res.status(401).send('Bad request signature');
  }

  const interaction = req.body;

  if (interaction.type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const response = await handleInteraction(interaction);

    if (response) {
      return res.send(response);
    }

    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: 'Unknown command.' },
    });
  }

  return res.status(400).send('Unhandled interaction type');
}

module.exports = {
  handleDiscordWebhook,
};

