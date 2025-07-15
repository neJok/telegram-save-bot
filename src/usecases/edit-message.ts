import { Composer, InputFile } from "grammy";
import type { MyContext } from "..";

export const editMessageHandler = new Composer<MyContext>();

const mediaSenders: Record<
  string,
  (ctx: MyContext, employeeId: number, file: InputFile) => Promise<void>
> = {
  photo: (ctx, id, file) => ctx.api.sendPhoto(id, file),
  video: (ctx, id, file) => ctx.api.sendVideo(id, file),
  voice: (ctx, id, file) => ctx.api.sendVoice(id, file),
  video_note: (ctx, id, file) => ctx.api.sendVideoNote(id, file),
  audio: (ctx, id, file) => ctx.api.sendAudio(id, file),
  document: (ctx, id, file) => ctx.api.sendDocument(id, file),
  animation: (ctx, id, file) => ctx.api.sendAnimation(id, file),
};

async function downloadAndSend(
  ctx: MyContext,
  employeeId: number,
  fileId: string,
  sendFunc: (ctx: MyContext, employeeId: number, file: InputFile) => Promise<void>,
  label: string,
  from: string,
  caption: string
) {
  const file = await ctx.api.getFile(fileId);
  const tempPath = await file.download();
  await sendFunc(ctx, employeeId, new InputFile(tempPath));
  await ctx.api.sendMessage(employeeId, `Оригинальный ${label} от <strong>${from}</strong>${caption}`, {
    parse_mode: "HTML",
  });
}

editMessageHandler.on("edited_business_message", async (ctx) => {
  const editedMessage = ctx.update.edited_business_message;
  const oldMsg = ctx.session.history.find((msg) => msg.id === editedMessage.message_id);

  const conn = await ctx.getBusinessConnection();
  const employee = conn.user;

  if (employee.id === editedMessage.from.id) return;
  if (!oldMsg) return;

  const from = oldMsg.from;
  const caption = oldMsg.caption ? `\n\n<blockquote expandable>${oldMsg.caption}</blockquote>` : "";

  for (const [type, sender] of Object.entries(mediaSenders)) {
    const fileId = (oldMsg as any)[type];
    if (fileId) {
      await downloadAndSend(ctx, employee.id, fileId, sender, type, from, caption);
    }
  }

  if (oldMsg.sticker) {
    await ctx.api.sendSticker(employee.id, oldMsg.sticker);
    await ctx.api.sendMessage(
      employee.id,
      `Оригинальный стикер от <strong>${from}</strong>${oldMsg.sticker_emoji ? ` ${oldMsg.sticker_emoji}` : ""}`,
      { parse_mode: "HTML" }
    );
  }

  if (oldMsg.contact) {
    await ctx.api.sendContact(employee.id, oldMsg.contact.phone_number, oldMsg.contact.first_name, {
      last_name: oldMsg.contact.last_name,
    });
    await ctx.api.sendMessage(employee.id, `Оригинальный контакт от <strong>${from}</strong>`, { parse_mode: "HTML" });
  }

  if (oldMsg.location) {
    await ctx.api.sendLocation(employee.id, oldMsg.location.latitude, oldMsg.location.longitude);
    await ctx.api.sendMessage(employee.id, `Оригинальная локация от <strong>${from}</strong>`, { parse_mode: "HTML" });
  }

  if (oldMsg.venue) {
    await ctx.api.sendVenue(
      employee.id,
      oldMsg.venue.location.latitude,
      oldMsg.venue.location.longitude,
      oldMsg.venue.title,
      oldMsg.venue.address
    );
    await ctx.api.sendMessage(employee.id, `Оригинальное место от <strong>${from}</strong>`, { parse_mode: "HTML" });
  }

  if (oldMsg.poll) {
    await ctx.api.sendMessage(employee.id, `Оригинальный опрос от <strong>${from}</strong>: <i>${oldMsg.poll.question}</i>`, {
      parse_mode: "HTML",
    });
  }

  if (oldMsg.text || editedMessage.text) {
    const message = `
<strong>${editedMessage.from.username}</strong> изменил сообщение:
${oldMsg.text ? `<blockquote expandable>${oldMsg.text}</blockquote>` : ""}
Обновленный текст: <blockquote expandable>${editedMessage.text}</blockquote>
    `;
    await ctx.api.sendMessage(employee.id, message.trim(), { parse_mode: "HTML" });
  }
});
