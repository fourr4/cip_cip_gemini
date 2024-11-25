import { CoreMessage } from "ai";
import { notFound } from "next/navigation";

import { auth,getInfo } from "@/app/(auth)/auth";
import { Chat as PreviewChat } from "@/components/custom/chat";
import { getChatById } from "@/db/queries";
import { Chat } from "@/db/schema";
import { convertToUIMessages } from "@/lib/utils";

export default async function Page({ params }: { params: any }) {
  const { id } = params;
  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  // type casting and converting messages to UI messages
  const chat: Chat = {
    ...chatFromDb,
    messages: convertToUIMessages(chatFromDb.messages as Array<CoreMessage>),
  };

  const session = await auth();
  // @ts-ignore
  const users = await getInfo(session?.user?.email);
  // @ts-ignore
  let accountType = users[0].accountType;
  if (accountType === false) {
    accountType = "basic";
  } else {
    accountType = "pro";
  }

  console.log(accountType);

  if (!session || !session.user) {
    return notFound();
  }

  if (session.user.id !== chat.userId) {
    return notFound();
  }

  return <PreviewChat id={chat.id} initialMessages={chat.messages} accountType={accountType} />;
}
