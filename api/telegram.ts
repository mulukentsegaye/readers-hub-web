/**
 * Telegram Webhook Serverless Endpoint for LiRead
 * Route: /api/telegram
 * 
 * Handles Telegram webhook updates when users interact with the LiRead bot.
 * When a user starts the bot with a payload (e.g., /start 12 from "Get PDF on Telegram"),
 * it fetches the book PDF from the vault channel via copyMessage and delivers it instantly.
 */

interface TelegramChat {
  id: number | string;
  type?: string;
  first_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  from?: {
    id: number;
    first_name?: string;
    username?: string;
  };
  chat: TelegramChat;
  date: number;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

const WELCOME_MESSAGE =
  "📚 Welcome to LiRead! Browse books at https://liread.vercel.app/ and click 'Get PDF on Telegram' on any book to download it instantly!";

const NOT_AVAILABLE_MESSAGE = "Sorry, this book PDF isn't available yet.";

async function sendTelegramMessage(
  token: string,
  chatId: number | string,
  text: string
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const data = await res.json().catch(() => null);
    return Boolean(data && data.ok);
  } catch (err) {
    console.error('[telegram-webhook] Error in sendMessage:', err);
    return false;
  }
}

async function copyTelegramMessage(
  token: string,
  chatId: number | string,
  fromChatId: number | string,
  messageId: number
): Promise<boolean> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/copyMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        from_chat_id: fromChatId,
        message_id: messageId,
      }),
    });
    const data = await res.json().catch(() => null);
    return Boolean(data && data.ok);
  } catch (err) {
    console.error('[telegram-webhook] Error in copyMessage:', err);
    return false;
  }
}

// Universal response helper supporting both Node (res.status().json()) and Web Response (Edge/Fetch API)
function respondOk(res?: any) {
  if (res && typeof res.status === 'function') {
    return res.status(200).json({ ok: true });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req: any, res?: any) {
  // Support quick health-check via GET
  if (req.method === 'GET') {
    const info = {
      ok: true,
      service: 'LiRead Telegram Bot Webhook',
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_VAULT_CHANNEL_ID),
    };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(info);
    }
    return new Response(JSON.stringify(info), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Telegram sends webhook updates via POST
  if (req.method !== 'POST') {
    return respondOk(res);
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const vaultChannelId = process.env.TELEGRAM_VAULT_CHANNEL_ID;

    // Parse request body safely
    let update: TelegramUpdate | null = null;
    if (typeof req.body === 'object' && req.body !== null) {
      update = req.body as TelegramUpdate;
    } else if (typeof req.body === 'string') {
      try {
        update = JSON.parse(req.body) as TelegramUpdate;
      } catch {
        update = null;
      }
    } else if (typeof req.json === 'function') {
      update = (await req.json().catch(() => null)) as TelegramUpdate;
    }

    if (!update || !update.message || !update.message.chat) {
      return respondOk(res);
    }

    const message = update.message;
    const chatId = message.chat.id;
    const rawText = (message.text || '').trim();

    if (!rawText) {
      return respondOk(res);
    }

    if (!botToken) {
      console.warn('[telegram-webhook] Warning: TELEGRAM_BOT_TOKEN environment variable is not set.');
      return respondOk(res);
    }

    // Check for deep-link: /start <payload>
    // e.g., "/start 12" or "/start@MyBot 12"
    const startWithPayloadMatch = rawText.match(/^\/start(?:@\w+)?\s+(\S+)/i);

    if (startWithPayloadMatch) {
      const payload = startWithPayloadMatch[1].trim();
      const messageId = Number(payload);

      // Validate that payload is a positive integer
      if (Number.isInteger(messageId) && messageId > 0 && vaultChannelId) {
        // Resolve channel ID: numeric strings become numbers, @handles stay strings
        const formattedFromChatId =
          !isNaN(Number(vaultChannelId)) && !vaultChannelId.startsWith('@')
            ? Number(vaultChannelId)
            : vaultChannelId;

        const copySuccess = await copyTelegramMessage(
          botToken,
          chatId,
          formattedFromChatId,
          messageId
        );

        if (!copySuccess) {
          // If copyMessage fails (e.g. message doesn't exist in vault channel or permissions missing)
          await sendTelegramMessage(botToken, chatId, NOT_AVAILABLE_MESSAGE);
        }
      } else {
        // Payload not a valid integer or vault channel not configured
        await sendTelegramMessage(botToken, chatId, NOT_AVAILABLE_MESSAGE);
      }
    } else {
      // User sent "/start" with no payload, or any other command / text
      await sendTelegramMessage(botToken, chatId, WELCOME_MESSAGE);
    }
  } catch (err) {
    console.error('[telegram-webhook] Unhandled error during update processing:', err);
  }

  // Always return HTTP 200 OK so Telegram considers the update delivered
  return respondOk(res);
}
