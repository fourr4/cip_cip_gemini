import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiFlashModel } from "@/ai";
import { auth } from "@/app/(auth)/auth";
import {
  createReservation,
  deleteChatById,
  getChatById,
  getReservationById,
  saveChat,
} from "@/db/queries";
import { generateUUID } from "@/lib/utils";

const blibliAPI = "http://100.80.37.91:8000";

export async function POST(request: Request) {
  const { id, messages }: { id: string; messages: Array<Message> } =
    await request.json();

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const coreMessages = convertToCoreMessages(messages).filter(
    (message) => message.content.length > 0,
  );
  // Menemukan indeks dari 'resetcontext' terakhir
  const lastResetIndex = coreMessages
    .map((message) => message.content)
    .lastIndexOf("resetcontext");

  // Jika 'resetcontext' terakhir ditemukan, mulai dari pesan setelahnya
  const relevantMessages =
    lastResetIndex >= 0 ? coreMessages.slice(lastResetIndex + 1) : coreMessages;
  console.log(relevantMessages);

  // Cek apakah pesan terakhir adalah 'resetcontext' untuk menghentikan eksekusi model
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.content === "resetcontext") {
    console.log("Konteks telah di-reset.");
    return new Response("Konteks telah di-reset", { status: 200 });
  }

  const result = await streamText({
    model: geminiFlashModel,
    system: `\n
 # System Prompt for E-Commerce Analytics Assistant - CIP-CIP

You are an advanced e-commerce analytics assistant named 'CIP-CIP'. Your main role is to deliver data-driven insights, actionable recommendations, and analyses. Here’s how to operate effectively:

## Core Identity
- **Name:** CIP-CIP
- **Role:** E-commerce Analytics Expert

## Interaction Guidelines
- **Response Format:** Provide responses in bullet points or tables for clarity. If necessary, use an alternative format.
- **Marketing Insights:** Include relevant marketing insights in your analyses to aid user decision-making and support in-depth data analysis.
- **Analytical Capability:** Perform analyses in every response where applicable. Highlight trends, patterns, or insights derived from the provided data.
- **Clarifications:** Only request clarification if the provided information is insufficient.
- **Task Execution:** Proceed with the task directly if all necessary information is available.
- **Default Page:** If the user doesn’t specify a page, default to page 1 and avoid further inquiries about pagination.
- **Chatbot Capabilities:** When asked about capabilities, explain without revealing the specific function names.
- **Function Usage:** Utilize the appropriate functions based on user queries.

## Available Tools
- BLIBLIgetListProductByKeyword
- BLIBLIgetListSellerByKeyword
      `,
    messages: relevantMessages,
    tools: {
      BLIBLIgetListProductByKeyword: {
        description: "Search for products based on a keyword",
        parameters: z.object({
          category_code: z
            .string()
            .describe("Keyword to search for, example: Iphone 13"),
          page: z
            .number()
            .default(1)
            .describe(
              "Pagination page to retrieve. Any positive number can be used; defaults to 1 if not specified.",
            ),
        }),
        execute: async ({ category_code, page = 1 }) => {
          const results = await fetch(`${blibliAPI}/getListProductByKeyword`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ category_code, page }),
          });

          // Wait for the response to be converted to JSON
          const data = await results.json();
          return { data: data.data }; // Return the JSON data
        },
      },
      BLIBLIgetListSellerByKeyword: {
        description: "Search for sellers based on a keyword",
        parameters: z.object({
          keyword_seller: z.string().describe("Keyword to search for"),
          page: z.number().default(1).describe("Pagination page to retrieve"),
        }),
        execute: async ({ keyword_seller, page = 1 }) => {
          const results = await fetch(`${blibliAPI}/getListSeller`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keyword_seller, page }),
          });
          const data = await results.json();
          console.log(data);
          return { data: data };
        },
      },
      BLIBLIgetProductDetail: {
        description: "Get product details based on the product URL",
        parameters: z.object({
          URL: z.string().describe("URL of the product"),
        }),
        execute: async ({ URL }) => {
          const results = await fetch(`${blibliAPI}/getDetailProduct`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ URL }),
          });
          const data = await results.json();
          return { data: data };
        },
      },
      BLIBLIgetSellerDetail: {
        description: "Get seller details based on the seller Name",
        parameters: z.object({
          namaToko: z.string().describe("Name of the seller"),
        }),
        execute: async ({ namaToko }) => {
          const results = await fetch(`${blibliAPI}/getInfoShop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ namaToko }),
          });
          const data = await results.json();
          return { data: data };
        },
      },
      BLIBLIgetListProductBySeller: {
        description: "Get list of products based on the seller Name",
        parameters: z.object({
          namaToko: z.string().describe("Name of the seller"),
          page: z.number().default(1).describe("Pagination page to retrieve"),
        }),
        execute: async ({ namaToko, page = 1 }) => {
          const results = await fetch(`${blibliAPI}/getListProductByShop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ namaToko, page }),
          });
          const data = await results.json();
          return { data: data };
        },
      },
    },
    onFinish: async ({ responseMessages }) => {
      if (session.user && session.user.id) {
        try {
          await saveChat({
            id,
            messages: [...coreMessages, ...responseMessages],
            userId: session.user.id,
          });
        } catch (error) {
          console.error("Failed to save chat");
        }
      }
    },
    experimental_telemetry: {
      isEnabled: true,
      functionId: "stream-text",
    },
  });

  return result.toDataStreamResponse({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
