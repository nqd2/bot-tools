/** Giới hạn body JSON (Express) — hardcoded, không qua env */
const JSON_BODY_LIMIT = '15mb';

/** Trên ngưỡng này: lưu MongoDB, Telegram chỉ gửi tóm tắt */
const TELEGRAM_INLINE_MAX_CHARS = 1500;

const TELEGRAM_MAX_MESSAGE = 4096;

module.exports = {
  JSON_BODY_LIMIT,
  TELEGRAM_INLINE_MAX_CHARS,
  TELEGRAM_MAX_MESSAGE,
};
