import {Composer, Context, InputFile} from "grammy";
import type {MyContext, SavedMessage} from "..";

export const businessMessageHandler = new Composer<MyContext>();

async function sendFileTo(userId: number, fileUrl: string, ctx: MyContext) {
  const file = await ctx.api.getFile(fileUrl);
  const temporaryFilePath = await file.download();
  await ctx.api.sendPhoto(userId, new InputFile(temporaryFilePath));
}

businessMessageHandler.on("business_message", async (ctx) => {
  const savedMessage: SavedMessage = {
    id: ctx.msgId,
    from: ctx.msg.from.username ?? String(ctx.msg.from.id),
    text: ctx.msg.text ?? "Not a text",
  };
  ctx.session.history.push(savedMessage);

  const conn = await ctx.getBusinessConnection();

  const employee = conn.user;
  if (ctx.from.id !== employee.id) {
    return;
  }

  const reply = ctx.msg.reply_to_message;
  if (!reply) {
    return;
  }

  const fileUrl = reply.photo?.at(-1)?.file_id;
  if (fileUrl) {
    sendFileTo(ctx.msg.from.id, fileUrl, ctx);
  }
});
