import {Bot, session, type Context, type SessionFlavor} from "grammy";
import {type FileFlavor, hydrateFiles} from "@grammyjs/files";
import "dotenv/config";
import {ignoreOld} from "grammy-middlewares";
import {editMessageHandler} from "./usecases/edit-message";
import {deleteMessageHandler} from "./usecases/delete-message";
import {businessMessageHandler} from "./usecases/recieve-message";

export interface SavedMessage {
  id: number;
  from: string;
  text: string;
}

interface SessionData {
  history: SavedMessage[];
}

function initial(): SessionData {
  return {history: []};
}

export type MyContext = FileFlavor<Context> & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(process.env.TELEGRAM_API_KEY ?? "");

bot.api.config.use(hydrateFiles(bot.token));
bot.use(ignoreOld());
bot.use(session({initial}));

bot.use(editMessageHandler);
bot.use(deleteMessageHandler);
bot.use(businessMessageHandler);

bot.start();
