-- Create the "User" table with additional fields
CREATE TABLE IF NOT EXISTS "User" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" varchar(64) NOT NULL,
  "password" varchar(64),
  "accountType" boolean DEFAULT false NOT NULL, 
  "expiredAt" timestamp NOT NULL
);

-- Create the "Chat" table with a foreign key reference to "User"
CREATE TABLE IF NOT EXISTS "Chat" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" timestamp NOT NULL,
  "messages" json NOT NULL,
  "userId" uuid NOT NULL,
  CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Create the "Reservation" table with a foreign key reference to "User"
CREATE TABLE IF NOT EXISTS "Reservation" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "createdAt" timestamp NOT NULL,
  "details" json NOT NULL,
  "hasCompletedPayment" boolean DEFAULT false NOT NULL,
  "userId" uuid NOT NULL,
  CONSTRAINT "Reservation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
