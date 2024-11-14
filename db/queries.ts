import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { user, chat, User, reservation } from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}`);
let db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}
function safeJSONParse(str: string) {
  try {
    // Only parse if it's a string, otherwise return the value directly
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch (error) {
    console.error("Failed to parse JSON:", str);
    return null;
  }
}

export async function editChatMessage({
  chatId,
  messageIndex,
  newContent,
}: {
  chatId: string;
  messageIndex: number;
  newContent: string;
}) {
  try {
    const [chatRecord] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId));

    if (!chatRecord) {
      throw new Error("Chat not found");
    }

    console.log("Chat record:", chatRecord);

    // Directly handle the messages as parsed objects
    const messages = safeJSONParse(chatRecord.messages);
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid message format");
    }

    if (messages.length > messageIndex) {
      messages[messageIndex].content = newContent;

      await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages), // Store the updated messages as a string
        })
        .where(eq(chat.id, chatId));

      return { success: true };
    } else {
      throw new Error("Message index out of bounds");
    }
  } catch (error) {
    console.error("Failed to edit chat message", error);
    throw error;
  }
}

export async function deleteChatMessage({
  chatId,
  messageIndex,
}: {
  chatId: string;
  messageIndex: number;
}) {
  try {
    // Fetch the chat record from the database
    const [chatRecord] = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId));

    if (!chatRecord) {
      throw new Error("Chat not found");
    }

    // Parse the messages JSON to handle complex structures
    const messages = safeJSONParse(chatRecord.messages);
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid message format");
    }

    // Check if the specified index is within bounds
    if (messageIndex < 0 || messageIndex >= messages.length) {
      throw new Error("Message index out of bounds");
    }

    // Delete the message at the specified index, including 'tool' or other roles
    messages.splice(messageIndex, 1);

    // Update the database with the modified messages array
    await db
      .update(chat)
      .set({
        messages: JSON.stringify(messages), // Serialize back to JSON string
      })
      .where(eq(chat.id, chatId));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete chat message", error);
    throw error;
  }
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  return await db.insert(reservation).values({
    id,
    createdAt: new Date(),
    userId,
    hasCompletedPayment: false,
    details: JSON.stringify(details),
  });
}

export async function getReservationById({ id }: { id: string }) {
  const [selectedReservation] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id));

  return selectedReservation;
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  return await db
    .update(reservation)
    .set({
      hasCompletedPayment,
    })
    .where(eq(reservation.id, id));
}
