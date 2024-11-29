import Image from "next/image";
import Link from "next/link";
import { auth, signOut, getInfo } from "@/app/(auth)/auth";
import { History } from "./history";
import { SlashIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

export const Navbar = async () => {
  let session = await auth();
  let accountType;
  
  // Ensure session exists before attempting to access user info
  if (session?.user?.email) {
    const users = await getInfo(session.user.email);
    // Ensure there is at least one user before accessing accountType
    if (users.length > 0) {
      // @ts-ignore
      accountType = users[0].accountType;
      // Adjust the account type based on the value
      accountType = accountType ? "pro" : "basic";
    } else {
      // Handle case when no user is returned
      console.error("No user found.");
    }
  } else {
    console.error("No session or user email found.");
  }

  return (
    <>
      <div className="bg-background absolute top-0 left-0 w-dvw py-2 px-3 justify-between flex flex-row items-center z-30">
        <div className="flex flex-row gap-3 items-center">
          <History user={session?.user} />
          <div className="flex flex-row gap-2 items-center">
            <Image
              src="/images/gemini-logo.png"
              height={20}
              width={20}
              alt="gemini logo"
            />
            <div className="text-zinc-500">
              <SlashIcon size={16} />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm dark:text-zinc-300 truncate w-28 md:w-fit">
                Chatbot E-Commerce Analyst
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  accountType === "pro"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {accountType}
              </span>
            </div>
          </div>
        </div>
        
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="py-1.5 px-2 h-fit font-normal"
                variant="secondary"
              >
                {session.user?.email}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ThemeToggle />
              </DropdownMenuItem>
              
              {/* Upgrade Account button for basic accounts */}
              {accountType === "basic" && (
                <>
                  <DropdownMenuItem>
                    <Link 
                      href="http://10.15.42.102:3441/payment" 
                      className="w-full"
                    >
                      Upgrade Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem className="p-1 z-50">
                <form
                  className="w-full"
                  action={async () => {
                    "use server";
                    await signOut({
                      redirectTo: "/",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="w-full text-left px-1 py-0.5 text-red-500"
                  >
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="py-1.5 px-2 h-fit font-normal text-white" asChild>
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  );
};