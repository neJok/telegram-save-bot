import {Composer} from "grammy";
import type {MyContext} from "..";

export const editMessageHandler = new Composer<MyContext>();

editMessageHandler.on("edited_business_message", async (ctx) => {
  const editedMessage = ctx.update.edited_business_message;
  const oldEditedMessage = ctx.session.history.find(
    (msg) => msg.id === editedMessage.message_id
  );

  const conn = await ctx.getBusinessConnection();
  const employee = conn.user;

  const message = `
  <strong>${editedMessage.from.username}</strong> edited message:
  <blockquote expandable>${
    oldEditedMessage?.text ?? "Error: no old edited text found"
  }</blockquote>
  Обновленный текст:
  <blockquote expandable>${editedMessage.text}</blockquote>
  `;

  await ctx.api.sendMessage(employee.id, message, {parse_mode: "HTML"});
});
