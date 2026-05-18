const { Telegraf } = require('telegraf');
const config = require('../config/env.config');
const { FEATURES } = require('../config/features');
const homesService = require('./homes.service');
const logsService = require('./logs.service');
const { formatMongoError } = require('../utils/mongo-error');

function createBot() {
  if (!config.telegram.botToken) {
    throw new Error('BOT_TOKEN is not configured on server');
  }
  return new Telegraf(config.telegram.botToken);
}

const bot = createBot();

function isAdmin(userId) {
  const admins = config.telegram.adminIds;
  if (!admins.length) {
    return true;
  }
  return admins.includes(String(userId));
}

function replyOptions(ctx, extra = {}) {
  const options = { ...extra };
  const threadId = ctx.message?.message_thread_id;
  if (threadId) {
    options.message_thread_id = threadId;
  }
  return options;
}

async function replyInContext(ctx, text, extra = {}) {
  return ctx.reply(text, replyOptions(ctx, extra));
}

function parseCommandArgs(ctx) {
  const text = ctx.message?.text || '';
  const parts = text.trim().split(/\s+/).slice(1);
  return parts.map((part) => part.split('@')[0].toLowerCase()).filter(Boolean);
}

function formatIdReply(ctx) {
  const chatId = ctx.chat.id;
  const userId = ctx.from?.id ?? 'N/A';
  const topicId = ctx.message?.message_thread_id;
  const chatType = ctx.chat.type;

  const lines = [
    `Chat_ID: ${chatId}`,
    `User_ID: ${userId}`,
    `Chat type: ${chatType}`,
  ];

  if (topicId) {
    lines.push(`Topic_ID: ${topicId}`);
  } else {
    lines.push('Topic_ID: N/A');
  }

  if (chatType === 'private') {
    lines.push(
      '',
      'Chat riêng: Chat_ID = ID cuộc trò chuyện với bot.',
      'Dùng User_ID nếu cần whitelist BOT_ADMIN_IDS.',
    );
  } else {
    lines.push(
      '',
      'Group có nhiều bot: dùng /getid@ten_bot',
      'Forum topic: gửi lệnh trong topic cần nhận tin.',
    );
  }

  return lines.join('\n');
}

function formatStartReply(ctx) {
  const botUsername = ctx.botInfo?.username;
  const suffix = botUsername ? `@${botUsername}` : '';
  const inGroup = ctx.chat.type !== 'private';

  return [
    '👋 <b>bot-tools</b>',
    '',
    `<b>/getid${suffix}</b> — Chat ID, User ID, Topic ID`,
    `<b>/sethome${suffix} openrouter</b> — nhận trace OpenRouter tại chat/topic này`,
    `<b>/sethome${suffix} list</b> — xem cấu hình đã lưu`,
    '',
    inGroup
      ? '⚠️ Group nhiều bot: thêm @tên_bot sau lệnh (như trên).'
      : '💬 Chat riêng: gõ / rồi chọn lệnh, hoặc gõ trực tiếp /getid',
  ].join('\n');
}

function logContext(ctx) {
  return {
    userId: ctx.from?.id ?? null,
    chatId: ctx.chat?.id ?? null,
  };
}

bot.catch(async (error, ctx) => {
  console.error('Telegram bot error:', error);
  try {
    await replyInContext(
      ctx,
      `⚠️ Lỗi: ${error.message || 'unknown error'}`,
    );
  } catch {
    // cannot reply
  }
  logsService.writeLog({
    level: 'error',
    source: 'telegram',
    event: 'bot_error',
    message: error.message,
    meta: { stack: error.stack },
    ...logContext(ctx),
  });
});

bot.start(async (ctx) => {
  try {
    await replyInContext(ctx, formatStartReply(ctx), { parse_mode: 'HTML' });
    logsService.writeLog({
      level: 'info',
      source: 'telegram',
      event: 'command_start',
      message: '/start',
      ...logContext(ctx),
    });
  } catch (error) {
    console.error('/start error:', error);
    await replyInContext(ctx, `⚠️ Lỗi: ${error.message}`);
  }
});

bot.command('getid', async (ctx) => {
  try {
    const reply = formatIdReply(ctx);
    await replyInContext(ctx, reply);
    logsService.writeLog({
      level: 'info',
      source: 'telegram',
      event: 'command_getid',
      message: reply,
      ...logContext(ctx),
    });
  } catch (error) {
    console.error('/getid error:', error);
    await replyInContext(ctx, `⚠️ Lỗi: ${error.message}`);
  }
});

bot.command('sethome', async (ctx) => {
  try {
    if (!isAdmin(ctx.from?.id)) {
      await replyInContext(ctx, 'You are not allowed to use /sethome.');
      logsService.writeLog({
        level: 'warn',
        source: 'telegram',
        event: 'sethome_denied',
        message: 'Unauthorized /sethome',
        ...logContext(ctx),
      });
      return;
    }

    const args = parseCommandArgs(ctx);
    const ctxLog = logContext(ctx);

    if (args.length === 0 || args[0] === 'list') {
      const homes = await homesService.listHomes();
      return replyInContext(ctx, homesService.formatHomesList(homes), {
        parse_mode: 'HTML',
      });
    }

    if (args[0] === 'clear') {
      const feature = args[1];
      if (!feature || !homesService.isValidFeature(feature)) {
        return replyInContext(
          ctx,
          `Usage: /sethome clear <feature>\nFeatures: ${Object.keys(FEATURES).join(', ')}`,
        );
      }
      await homesService.clearHome(feature, ctxLog);
      return replyInContext(ctx, `Cleared home for <code>${feature}</code>.`, {
        parse_mode: 'HTML',
      });
    }

    const feature = args[0];
    if (!homesService.isValidFeature(feature)) {
      return replyInContext(
        ctx,
        `Unknown feature <code>${feature}</code>.\nAvailable: ${Object.keys(FEATURES).join(', ')}`,
        { parse_mode: 'HTML' },
      );
    }

    const chatId = ctx.chat.id;
    const topicId = ctx.message?.message_thread_id ?? null;
    const title =
      ctx.chat.title || ctx.chat.username || ctx.chat.first_name || null;

    await homesService.setHome(feature, { chatId, topicId, title }, ctxLog);

    const topicLabel = topicId ?? '(main)';
    return replyInContext(
      ctx,
      [
        `✅ <b>${FEATURES[feature].label}</b>`,
        `Feature: <code>${feature}</code>`,
        `Chat: <code>${chatId}</code>`,
        `Topic: <code>${topicLabel}</code>`,
      ].join('\n'),
      { parse_mode: 'HTML' },
    );
  } catch (error) {
    console.error('/sethome error:', error);
    await replyInContext(
      ctx,
      `⚠️ Không lưu được cấu hình.\n\n${formatMongoError(error)}`,
    );
  }
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
