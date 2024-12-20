import { Attachment, Message as AIMessage, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { DownloadData } from "./download";
import { Pencil, Trash2, X, Check } from "lucide-react";

interface MessageProps {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  messageIndex: number;
  accountType: string;
}

export const Message: React.FC<MessageProps> = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
  messageIndex,
  accountType
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content as string);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const MESSAGE_LIMIT = 5;

  // Check message limit only for basic accounts
   // 1. Menambahkan state untuk melacak perubahan messageIndex
   const [messageCount, setMessageCount] = useState(messageIndex);

   // 2. Memperbarui messageCount setiap kali messageIndex berubah
   useEffect(() => {
     setMessageCount(messageIndex); // Update messageCount ketika messageIndex berubah
   }, [messageIndex]);
 
   // 3. Menampilkan modal jika messageCount mencapai batas
   useEffect(() => {
     if (accountType === "basic" && messageCount >= MESSAGE_LIMIT) {
       setIsModalOpen(true); // Modal akan muncul jika messageCount >= MESSAGE_LIMIT
     }
   }, [messageCount, accountType]);

  const handleMessageUpdate = async (action: "edit" | "delete") => {
    if (
      action === "delete" &&
      !confirm("Are you sure you want to delete this message?")
    ) {
      return;
    }

    setIsLoading(true);
    const url = "/api/roomchat";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          chatId,
          messageIndex,
          newContent: action === "edit" ? editedContent : undefined,
        }),
      });

      if (response.ok) {
        if (action === "edit") {
          setIsEditing(false);
        }
        window.location.reload();
      } else {
        const error = await response.text();
        alert(`Failed to ${action} message: ${error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} message:`, error);
      alert(`Failed to ${action} message. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (role === "user" && content === "resetcontext") {
    return (
      <div className="w-full flex items-center gap-3 px-4 md:w-[500px] md:px-0 py-4">
        <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
          New Context
        </span>
        <div className="h-[1px] flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  if (
    toolInvocations &&
    toolInvocations.some((inv) => {
      return inv.state === "partial-call" || inv.state === "call";
    })
  ) {
    return (
      <div className="flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0">
        <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
          <BotIcon />
        </div>
        <div className="w-full h-8 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20 relative group">
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        <div className="absolute left-[-65px] top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 bg-white dark:bg-zinc-800 p-1 rounded-lg shadow-sm">
          {/* {role === "user" && content !== "resetcontext" && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-md dark:hover:bg-blue-900/20 disabled:opacity-50"
              disabled={isLoading}
              title="Edit message"
            >
              <Pencil size={16} />
            </button>
          )} */}
          {/* <button
            onClick={() => handleMessageUpdate("delete")}
            className="p-1.5 text-red-500 hover:bg-red-100 rounded-md dark:hover:bg-red-900/20 disabled:opacity-50"
            disabled={isLoading}
            title="Delete message"
          >
            <Trash2 size={16} />
          </button> */}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 min-h-[100px]"
              disabled={isLoading}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleMessageUpdate("edit")}
                className="p-1.5 text-green-500 hover:bg-green-100 rounded-md dark:hover:bg-green-900/20 disabled:opacity-50"
                disabled={isLoading}
                title="Save changes"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-red-500 hover:bg-red-100 rounded-md dark:hover:bg-red-900/20 disabled:opacity-50"
                disabled={isLoading}
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            <Markdown>{content as string}</Markdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "BLIBLIgetListProductByKeyword" ? (
                      <DownloadData data={result} isLoading={false} />
                    ) : toolName === "BLIBLIgetListSellerByKeyword" ? (
                      <DownloadData data={result} />
                    ) : toolName === "BLIBLIgetProductDetail" ? (
                      <DownloadData data={result} />
                    ) : toolName === "BLIBLIgetSellerDetail" ? (
                      <DownloadData data={result} />
                    ) : toolName === "BLIBLIgetListProductBySeller" ? (
                      <DownloadData data={result} />
                    ) : toolName === "TOKOPEDIAgetListSellerByKeyword" ? (
                      <DownloadData data={result} />
                    ) :toolName === "TOKOPEDIAgetProductList" ? (
                      <DownloadData data={result} />
                    ) :toolName === "TOKOPEDIAgetShopDetail" ? (
                      <DownloadData data={result} />
                    ) :toolName === "TOKOPEDIAgetProductDetail" ? (
                      <DownloadData data={result} />
                    ) : (
                      <div>{JSON.stringify(result, null, 2)}</div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "BLIBLIgetListProductByKeyword" ? (
                      <DownloadData isLoading={true} />
                    ) : toolName === "BLIBLIgetListSellerByKeyword" ? (
                      <DownloadData isLoading={true} />
                    ) : toolName === "BLIBLIgetProductDetail" ? (
                      <DownloadData isLoading={true} />
                    ) : toolName === "BLIBLIgetSellerDetail" ? (
                      <DownloadData isLoading={true} />
                    ) : toolName === "BLIBLIgetListProductBySeller" ? (
                      <DownloadData isLoading={true} />
                    ) :toolName === "TOKOPEDIAgetListSellerByKeyword" ? (
                      <DownloadData isLoading={true} />
                    ) :toolName === "TOKOPEDIAgetProductList" ? (
                      <DownloadData isLoading={true} />
                    ) :toolName === "TOKOPEDIAgetShopDetail" ? (
                      <DownloadData isLoading={true} />
                    ) :toolName === "TOKOPEDIAgetProductDetail" ? (
                      <DownloadData isLoading={true} />
                    ) : null}
                  </div>
                );
              }
            })}
          </div>
        )}

        {attachments && (
          <div className="flex flex-row gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>

      {/* Modal for message limit (only shows for basic accounts) */}
      {isModalOpen && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full bg-opacity-50 bg-black flex justify-center items-center z-50"
          onClick={() => {
            setIsModalOpen(false);
            window.location.href = '/';
          }}
        >
          <motion.div
            className="bg-white dark:bg-zinc-800 p-6 rounded-lg"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <h2>Message Limit Reached</h2>
            <p>You've reached the limit of {MESSAGE_LIMIT} messages. To continue, start a new conversation or upgrade to Pro for unlimited access.</p>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-all"
            >
              OK
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};