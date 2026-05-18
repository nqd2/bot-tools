const { Telegraf } = require('telegraf');
const config = require('../config/env.config');
const { FEATURES } = require('../config/features');
const homesService = require('./homes.service');

const bot = new Telegraf(config.telegram.botToken);

function isAdmin(userId) {
  const admins = config.telegram.adminIds;
  if (!admins.length) {
    return true;
  }
  return admins.includes(String(userId));
}

bot.command('getid', (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message?.message_thread_id || 'N/A';
  ctx.reply(`Chat_ID: ${chatId}\nTopic_ID: ${topicId}`);
});

bot.command('sethome', async (ctx) => {
  if (!isAdmin(ctx.from?.id)) {
    return ctx.reply('You are not allowed to use /sethome.');
  }

  const args = (ctx.message?.text || '').split(/\s+/).slice(1);

  if (args.length === 0 || args[0] === 'list') {
    const homes = await homesService.listHomes();
    return ctx.reply(homesService.formatHomesList(homes), { parse_mode: 'HTML' });
  }

  if (args[0] === 'clear') {
    const feature = args[1];
    if (!feature || !homesService.isValidFeature(feature)) {
      return ctx.reply(`Usage: /sethome clear <feature>\nFeatures: ${Object.keys(FEATURES).join(', ')}`);
    }
    await homesService.clearHome(feature);
    return ctx.reply(`Cleared home for <code>${feature}</code>.`, { parse_mode: 'HTML' });
  }

  const feature = args[0];
  if (!homesService.isValidFeature(feature)) {
    return ctx.reply(
      `Unknown feature <code>${feature}</code>.\nAvailable: ${Object.keys(FEATURES).join(', ')}`,
      { parse_mode: 'HTML' },
    );
  }

  const chatId = ctx.chat.id;
  const topicId = ctx.message?.message_thread_id ?? null;
  const title = ctx.chat.title || ctx.chat.username || ctx.chat.first_name || null;

  await homesService.setHome(feature, { chatId, topicId, title });

  const topicLabel = topicId ?? '(main)';
  return ctx.reply(
    [
      `✅ <b>${FEATURES[feature].label}</b>`,
      `Feature: <code>${feature}</code>`,
      `Chat: <code>${chatId}</code>`,
      `Topic: <code>${topicLabel}</code>`,
    ].join('\n'),
    { parse_mode: 'HTML' },
  );
});

const processUpdate = async (body) => {
  return await bot.handleUpdate(body);
};

async function sendToFeature(feature, text) {
  if (!config.telegram.botToken) {
    throw new Error('BOT_TOKEN is not configured');
  }

  const home = await homesService.getHome(feature);
  if (!home) {
    throw new Error(
      `No home for "${feature}". Run /sethome ${feature} in the target chat/topic.`,
    );
  }

  const options = { parse_mode: 'HTML' };
  if (home.topicId) {
    options.message_thread_id = home.topicId;
  }

  return bot.telegram.sendMessage(home.chatId, text, options);
}

module.exports = {
  processUpdate,
  sendToFeature,
};
