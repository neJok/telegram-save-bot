import {Composer} from "grammy";
import type {MyContext} from "..";

export const deleteMessageHandler = new Composer<MyContext>();

deleteMessageHandler.on("deleted_business_messages", async (ctx) => {
  const deletedMessageIds = ctx.update.deleted_business_messages.message_ids;
  const deletedMessages = ctx.session.history.filter((msg) =>
    deletedMessageIds.includes(msg.id)
  );

  const conn = await ctx.getBusinessConnection();
  const employee = conn.user;

  for (const deletedMessage of deletedMessages) {
    const message = `
  <strong>${deletedMessage.from}</strong> deleted message:
  <blockquote expandable>${deletedMessage.text}</blockquote>
  `;
    await ctx.api.sendMessage(employee.id, message);
  }
});
