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
    (message) => message.content.length > 0
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

You are an advanced e-commerce analytics assistant named 'CIP-CIP'. Your primary goal is to provide data-driven insights, actionable recommendations, and detailed analyses to assist users with their e-commerce needs.

## Core Identity
- **Name:** CIP-CIP
- **Role:** E-commerce Analytics Expert
- **Purpose:** Empower users by analyzing data, identifying trends, and delivering insights that support better decision-making.

## Interaction Guidelines
1. **Response Structure:**
   - Provide answers using bullet points, tables, or concise paragraphs for clarity.
   - When applicable, include detailed analyses highlighting trends, patterns, or actionable insights.

2. **User Engagement:**
   - Clarify only when provided information is insufficient.
   - Proceed directly with tasks when enough details are given.
   - Avoid unnecessary questions; assume defaults (e.g., page 1 for pagination) if not specified.

3. **Marketing Insights:**
   - Include relevant marketing strategies or observations to enhance the user's understanding and decision-making.

4. **Capabilities Overview:**
   - When describing your capabilities, avoid exposing internal function names.
   - Clearly explain functionality using user-friendly terms.

5. **Tool and API Usage:**
   - Leverage available tools and APIs to fetch data.
   - Always analyze and interpret the retrieved data to deliver meaningful insights.
## Available Tools
- BLIBLIgetListProductByKeyword
- BLIBLIgetListSellerByKeyword
- BLIBLIgetProductDetail
- BLIBLIgetSellerDetail
- BLIBLIgetListProductBySeller
- TOKOPEDIAgetListSellerByKeyword
- TOKOPEDIAgetProductList
- TOKOPEDIAgetShopDetail
- TOKOPEDIAgetProductDetail
- BLIBLI_getSentimentAnalysis
- TOKOPEDIA_getSentimentAnalysis


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
              "Pagination page to retrieve. Any positive number can be used; defaults to 1 if not specified."
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
          console.log(data)
          return { data }; // Return the JSON data
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
          return { data };
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
          return { data };
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
          return { data };
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
          return { data };
        },
      },
      TOKOPEDIAgetListSellerByKeyword: {
        description: "Search for sellers based on a keyword for Tokopedia",
        parameters: z.object({
          searchSellerList: z.string().describe("Keyword to search for"),
          page: z.number().default(1).describe("Pagination page to retrieve"),
        }),
        execute: async ({ searchSellerList, page = 1 }) => {
          const results = await fetch(`${blibliAPI}/seller`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ searchSellerList, page }),
          });
          const data = await results.json();
          return {  data };
        },
      },
      TOKOPEDIAgetProductList: {
        description: "Get list of products based on the keyword for Tokopedia",
        parameters: z.object({
          keyword: z.string().describe("Keyword to search for"),
          page: z.number().default(1).describe("Pagination page to retrieve"),
        }),
        execute: async ({ keyword, page = 1 }) => {
          const results = await fetch(`${blibliAPI}/productByKeyword`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ keyword, page }),
          });
          const data = await results.json();
          return { data };
        },
      },
      TOKOPEDIAgetShopDetail: {
        description: "Get shop details based on the shop URL for Tokopedia",
        parameters: z.object({
          sellerURL: z.string().describe("Name of the shop"),
        }),
        execute: async ({ sellerURL }) => {
          const results = await fetch(`${blibliAPI}/infoShop`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sellerURL }),
          });
          const data = await results.json();
          return { data };
        },
      },
      TOKOPEDIAgetProductDetail: {
        description:
          "Get product details based on the product URL for Tokopedia",
        parameters: z.object({
          productURL: z.string().describe("URL of the product"),
        }),
        execute: async ({ productURL }) => {
          const results = await fetch(`${blibliAPI}/productInfo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ productURL }),
          });
          const data = await results.json();
          return { data };
        },
      },
      BLIBLI_getSentimentAnalysis: {
        description: "Get sentiment analysis of the product",
        parameters: z.object({
          URL: z.string().describe("URL of the product"),
        }),
        execute: async ({ URL }) => {
          const results = await fetch(`${blibliAPI}/sentiment_blibli`, {
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
      TOKOPEDIA_getSentimentAnalysis: {
        description: "Get sentiment analysis of the product",
        parameters: z.object({
          URL: z.string().describe("URL of the product"),
        }),
        execute: async ({ URL }) => {
          const results = await fetch(`${blibliAPI}/sentiment_tokped`, {
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
