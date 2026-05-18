function formatMongoError(error) {
  const msg = error?.message || String(error);

  if (
    msg.includes('SSL')
    || msg.includes('tls')
    || msg.includes('alert internal error')
    || msg.includes('0A000438')
  ) {
    return [
      'Lỗi kết nối MongoDB (SSL). Thường do Atlas chặn IP Vercel:',
      '',
      '1. Atlas → Network Access → ADD IP → Allow 0.0.0.0/0',
      '2. MONGODB_URI: mật khẩu phải URL-encode (@→%40, #→%23...)',
      '3. Copy lại URI từ Atlas → Connect → Drivers → Node.js',
      '4. Redeploy Vercel sau khi sửa env',
    ].join('\n');
  }

  if (msg.includes('authentication failed') || msg.includes('bad auth')) {
    return 'Sai user/password MongoDB. Kiểm tra MONGODB_URI trên Vercel.';
  }

  if (msg.includes('ENOTFOUND') || msg.includes('querySrv')) {
    return 'Không resolve được host MongoDB. Kiểm tra MONGODB_URI (mongodb+srv://...).';
  }

  if (msg.includes('MONGODB_URI is not configured')) {
    return 'Chưa cấu hình MONGODB_URI trên Vercel.';
  }

  return msg;
}

module.exports = {
  formatMongoError,
};
