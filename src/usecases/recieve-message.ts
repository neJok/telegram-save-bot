import { Composer, Context, InputFile } from "grammy";
import type { MyContext, SavedMessage } from "..";

export const businessMessageHandler = new Composer<MyContext>();

businessMessageHandler.on("business_message", async (ctx) => {
  const msg = ctx.msg;

  const savedMessage: SavedMessage = {
    id: ctx.msgId,
    from_id: msg.from.id,
    from: msg.from.username ?? String(msg.from.id),
    text: msg.text,
    caption: msg.caption,
    voice: msg.voice?.file_id,
    video_note: msg.video_note?.file_id,
    video: msg.video?.file_id,
    photo: msg.photo?.at(-1)?.file_id,
    audio: msg.audio?.file_id,
    document: msg.document?.file_id,
    animation: msg.animation?.file_id,
    sticker: msg.sticker?.file_id,
    contact: msg.contact ? {
      phone_number: msg.contact.phone_number,
      first_name: msg.contact.first_name,
      last_name: msg.contact.last_name,
    } : undefined,
    location: msg.location ? {
      latitude: msg.location.latitude,
      longitude: msg.location.longitude,
    } : undefined,
    venue: msg.venue ? {
      location: {
        latitude: msg.venue.location.latitude,
        longitude: msg.venue.location.longitude,
      },
      title: msg.venue.title,
      address: msg.venue.address,
    } : undefined,
    poll: msg.poll ? {
      question: msg.poll.question,
    } : undefined,
    sticker_emoji: msg.sticker?.emoji,
  };

  ctx.session.history.push(savedMessage);

  const conn = await ctx.getBusinessConnection();
  const employee = conn.user;

  if (ctx.from.id !== employee.id) return;

  const reply = msg.reply_to_message;
  if (!reply || !reply.has_protected_content) return;

  const fromReply = reply.from?.username ?? String(reply.from?.id);

  // === PHOTO ===
  const photo = reply.photo?.at(-1)?.file_id;
  if (photo) {
    const file = await ctx.api.getFile(photo);
    const tempPath = await file.download();
    await ctx.api.sendPhoto(ctx.from.id, new InputFile(tempPath), {
      caption: `Фото от <strong>${fromReply}</strong>`,
      parse_mode: "HTML",
    });
  }

  // === VIDEO ===
  if (reply.video) {
    await ctx.api.sendVideo(ctx.from.id, reply.video.file_id, {
      caption: `Видео от <strong>${fromReply}</strong>\n\n${reply.caption || ""}`.trim(),
      parse_mode: "HTML",
    });
  }

  // === VOICE ===
  if (reply.voice) {
    await ctx.api.sendVoice(ctx.from.id, reply.voice.file_id, {
      caption: `Аудио от <strong>${fromReply}</strong>\n\n${reply.caption || ""}`.trim(),
      parse_mode: "HTML",
    });
  }

  // === AUDIO ===
  if (reply.audio) {
    await ctx.api.sendAudio(ctx.from.id, reply.audio.file_id, {
      caption: `Аудиофайл от <strong>${fromReply}</strong>\n\n${reply.caption || ""}`.trim(),
      parse_mode: "HTML",
    });
  }

  // === DOCUMENT ===
  if (reply.document) {
    await ctx.api.sendDocument(ctx.from.id, reply.document.file_id, {
      caption: `Документ от <strong>${fromReply}</strong>\n\n${reply.caption || ""}`.trim(),
      parse_mode: "HTML",
    });
  }

  // === ANIMATION ===
  if (reply.animation) {
    await ctx.api.sendAnimation(ctx.from.id, reply.animation.file_id, {
      caption: `GIF от <strong>${fromReply}</strong>\n\n${reply.caption || ""}`.trim(),
      parse_mode: "HTML",
    });
  }

  // === STICKER ===
  if (reply.sticker) {
    await ctx.api.sendSticker(ctx.from.id, reply.sticker.file_id);
    await ctx.api.sendMessage(ctx.from.id, `Стикер от <strong>${fromReply}</strong>`, {
      parse_mode: "HTML",
    });
  }

  // === VIDEO_NOTE ===
  if (reply.video_note) {
    const file = await ctx.api.getFile(reply.video_note.file_id);
    const tempPath = await file.download();
    await ctx.api.sendVideoNote(ctx.from.id, new InputFile(tempPath));
    await ctx.api.sendMessage(ctx.from.id, `Кружочек от <strong>${fromReply}</strong>`, {
      parse_mode: "HTML",
    });
  }

  // === CONTACT ===
  if (reply.contact) {
    await ctx.api.sendContact(
      ctx.from.id,
      reply.contact.phone_number,
      reply.contact.first_name,
      { last_name: reply.contact.last_name }
    );
    await ctx.api.sendMessage(ctx.from.id, `Контакт от <strong>${fromReply}</strong>`, {
      parse_mode: "HTML",
    });
  }

  // === LOCATION ===
  if (reply.location) {
    await ctx.api.sendLocation(ctx.from.id, reply.location.latitude, reply.location.longitude);
    await ctx.api.sendMessage(ctx.from.id, `Локация от <strong>${fromReply}</strong>`, {
      parse_mode: "HTML",
    });
  }

  // === VENUE ===
  if (reply.venue) {
    await ctx.api.sendVenue(
      ctx.from.id,
      reply.venue.location.latitude,
      reply.venue.location.longitude,
      reply.venue.title,
      reply.venue.address
    );
    await ctx.api.sendMessage(ctx.from.id, `Место от <strong>${fromReply}</strong>`, {
      parse_mode: "HTML",
    });
  }

  // === POLL ===
  if (reply.poll) {
    await ctx.api.sendMessage(
      ctx.from.id,
      `Опрос от <strong>${fromReply}</strong>: <i>${reply.poll.question}</i>`,
      { parse_mode: "HTML" }
    );
  }

  // === TEXT ===
  if (reply.text) {
    await ctx.api.sendMessage(ctx.from.id, `
<strong>${fromReply}</strong> написал сообщение:
<blockquote expandable>${reply.text}</blockquote>
    `.trim(), {
      parse_mode: "HTML",
    });
  }
});
