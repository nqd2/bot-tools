const { Telegraf } = require('telegraf');
const config = require('../config/env.config');

const bot = new Telegraf(config.telegram.botToken);

bot.command('getid', (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message?.message_thread_id || 'N/A';
  ctx.reply(`Chat_ID: ${chatId}\nTopic_ID: ${topicId}`);
});

const processUpdate = async (body) => {
  return await bot.handleUpdate(body);
};

module.exports = {
  processUpdate,
};

