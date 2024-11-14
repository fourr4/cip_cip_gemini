import { auth } from "@/app/(auth)/auth";
import { editChatMessage, deleteChatMessage } from "@/db/queries";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { action, chatId, messageIndex, newContent } = await request.json();

    console.log("Request body:", { action, chatId, messageIndex, newContent });

    if (typeof chatId !== "string" || typeof messageIndex !== "number") {
      return new Response("Invalid chatId or messageIndex", { status: 400 });
    }

    let result;
    if (action === "edit") {
      if (typeof newContent !== "string") {
        return new Response("Invalid newContent for edit action", {
          status: 400,
        });
      }
      result = await editChatMessage({ chatId, messageIndex, newContent });
    } else if (action === "delete") {
      result = await deleteChatMessage({ chatId, messageIndex });
    } else {
      return new Response("Invalid action", { status: 400 });
    }

    console.log("Operation result:", result);

    if (result && result.success) {
      return new Response(`Message ${action}ed successfully`, { status: 200 });
    } else {
      return new Response(`Failed to ${action} message`, { status: 500 });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(`Failed to process request: ${error.message}`, {
      status: 500,
    });
  }
}
