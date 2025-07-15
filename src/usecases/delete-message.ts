import { Composer } from "grammy";
import type { MyContext } from "..";

export const deleteMessageHandler = new Composer<MyContext>();

function buildCaption(type: string, from: string, originalCaption?: string): string {
  const safeCaption = originalCaption?.trim() || "";
  const header = `${type} от <strong>${from}</strong>`;
  return safeCaption ? `${header}\n\n<blockquote expandable>${safeCaption}</blockquote>` : header;
}

const mediaHandlers: Record<
  string,
  (ctx: MyContext, employeeId: number, content: any, caption: string) => Promise<void>
> = {
  voice: async (ctx, id, fileId, caption) => {
    await ctx.api.sendVoice(id, fileId, { caption, parse_mode: "HTML" });
  },
  video: async (ctx, id, fileId, caption) => {
    await ctx.api.sendVideo(id, fileId, { caption, parse_mode: "HTML" });
  },
  video_note: async (ctx, id, fileId, caption) => {
    await ctx.api.sendVideoNote(id, fileId);
    if (caption) await ctx.api.sendMessage(id, caption, { parse_mode: "HTML" });
  },
  photo: async (ctx, id, fileId, caption) => {
    await ctx.api.sendPhoto(id, fileId, { caption, parse_mode: "HTML" });
  },
  animation: async (ctx, id, fileId, caption) => {
    await ctx.api.sendAnimation(id, fileId, { caption, parse_mode: "HTML" });
  },
  document: async (ctx, id, fileId, caption) => {
    await ctx.api.sendDocument(id, fileId, { caption, parse_mode: "HTML" });
  },
  sticker: async (ctx, id, fileId, caption) => {
    await ctx.api.sendSticker(id, fileId);
    if (caption) await ctx.api.sendMessage(id, caption, { parse_mode: "HTML" });
  },
  audio: async (ctx, id, fileId, caption) => {
    await ctx.api.sendAudio(id, fileId, { caption, parse_mode: "HTML" });
  },
  contact: async (ctx, id, contact, caption) => {
    await ctx.api.sendContact(id, contact.phone_number, contact.first_name, {
      last_name: contact.last_name,
    });
    if (caption) await ctx.api.sendMessage(id, caption, { parse_mode: "HTML" });
  },
  location: async (ctx, id, location, caption) => {
    await ctx.api.sendLocation(id, location.latitude, location.longitude);
    if (caption) await ctx.api.sendMessage(id, caption, { parse_mode: "HTML" });
  },
  venue: async (ctx, id, venue, caption) => {
    await ctx.api.sendVenue(id, venue.location.latitude, venue.location.longitude, venue.title, venue.address);
    if (caption) await ctx.api.sendMessage(id, caption, { parse_mode: "HTML" });
  },
  poll: async (ctx, id, poll, caption) => {
    await ctx.api.sendMessage(
      id,
      `Пользователь <strong>${caption}</strong> удалил опрос: <i>${poll.question}</i>`,
      { parse_mode: "HTML" }
    );
  },
};

deleteMessageHandler.on("deleted_business_messages", async (ctx) => {
  const deletedMessageIds = ctx.update.deleted_business_messages.message_ids;
  const deletedMessages = ctx.session.history.filter((msg) => deletedMessageIds.includes(msg.id));

  const conn = await ctx.getBusinessConnection();
  const employee = conn.user;

  for (const deletedMessage of deletedMessages) {
    if (employee.id === deletedMessage.from_id) continue;

    for (const [type, handler] of Object.entries(mediaHandlers)) {
      const content = (deletedMessage as any)[type];
      if (content) {
        const caption = type === "poll" ? deletedMessage.from : buildCaption(type, deletedMessage.from, deletedMessage.caption);
        await handler(ctx, employee.id, content, caption);
      }
    }

    if (deletedMessage.text) {
      await ctx.api.sendMessage(
        employee.id,
        `<strong>${deletedMessage.from}</strong> удалил сообщение:\n<blockquote expandable>${deletedMessage.text}</blockquote>`,
        { parse_mode: "HTML" }
      );
    }
  }
});
