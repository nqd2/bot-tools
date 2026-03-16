const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('getID', (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message?.message_thread_id || 'N/A';
  ctx.reply(`Chat ID: ${chatId}\nTopic ID: ${topicId}`);
});

const processUpdate = async (body) => {
  return await bot.handleUpdate(body);
};

module.exports = {
  processUpdate,
};

