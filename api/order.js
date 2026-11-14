// Серверная функция (Vercel): принимает заказ с сайта и отправляет его в Telegram.
// Токен бота и Chat ID хранятся в переменных окружения хостинга, а не в коде сайта.
//   TELEGRAM_BOT_TOKEN — токен от @BotFather
//   TELEGRAM_CHAT_ID   — ваш Chat ID (куда приходят заказы)

const MAX_LEN = 500;

const esc = (value) =>
  String(value ?? '').slice(0, MAX_LEN).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const money = (n) => Number(n || 0).toLocaleString('ru-RU') + ' ₽';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram не настроен' });
  }

  const order = req.body || {};
  const items = Array.isArray(order.items) ? order.items.slice(0, 50) : [];
  if (!order.name || !order.phone || !order.address || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Не все поля заполнены' });
  }

  const itemsText = items
    .map((i) => `• ${esc(i.name)} × ${Number(i.qty) || 1} — ${money(Number(i.price) * (Number(i.qty) || 1))}`)
    .join('\n');

  const text =
    `<b>Новый заказ № ${esc(order.number)}</b>\n\n` +
    `<b>Имя:</b> ${esc(order.name)}\n` +
    `<b>Телефон:</b> ${esc(order.phone)}\n` +
    `<b>Адрес:</b> ${esc(order.address)}\n\n` +
    `<b>Товары:</b>\n${itemsText}\n\n` +
    `<b>Итого:</b> ${money(order.total)}\n` +
    `<i>${esc(order.date)}</i>`;

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    if (!tg.ok) {
      return res.status(502).json({ ok: false, error: 'Telegram не принял сообщение' });
    }
  } catch {
    return res.status(502).json({ ok: false, error: 'Нет связи с Telegram' });
  }

  return res.status(200).json({ ok: true });
}
