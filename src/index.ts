import { Bot, session, type Context, type SessionFlavor } from "grammy";
import { type FileFlavor, hydrateFiles } from "@grammyjs/files";
import "dotenv/config";
import { editMessageHandler } from "./usecases/edit-message";
import { deleteMessageHandler } from "./usecases/delete-message";
import { businessMessageHandler } from "./usecases/recieve-message";
import { startHandler } from "./usecases/start";

export type SavedMessage = {
  id: number;
  from: string;
  from_id: number;

  text?: string;
  caption?: string;

  photo?: string;
  video?: string;
  voice?: string;
  video_note?: string;
  audio?: string;
  document?: string;
  animation?: string;
  sticker?: string;
  sticker_emoji?: string;

  contact?: {
    phone_number: string;
    first_name: string;
    last_name?: string;
  };

  location?: {
    latitude: number;
    longitude: number;
  };

  venue?: {
    location: {
      latitude: number;
      longitude: number;
    };
    title: string;
    address: string;
  };

  poll?: {
    question: string;
  };
};

interface SessionData {
  history: SavedMessage[];
}

function initial(): SessionData {
  return { history: [] };
}

export type MyContext = FileFlavor<Context> & SessionFlavor<SessionData>;

const bot = new Bot<MyContext>(process.env.TELEGRAM_API_KEY ?? "");

bot.api.config.use(hydrateFiles(bot.token));
bot.use(session({ initial }));

bot.use(startHandler);
bot.use(editMessageHandler);
bot.use(deleteMessageHandler);
bot.use(businessMessageHandler);

bot.start();
