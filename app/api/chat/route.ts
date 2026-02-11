import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { google } from "@ai-sdk/google";
import z from "zod";
import { db } from "@/db/db";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const SYSTEM_PROMPT = `
    Act as an expert SQL Developer/Assistant.
    Your task is to help users to query the database using natural language.

    You can call the following tools:
      1. db tool - call this tool to query the database
      2. schema tool - call this tool to get the database schema which will help you to query the database.


    You are allowed to follow on the below rules:
      - Generate only SELECT queries, reject all the other queries (INSERT, DELETE, UPDATE, ALTER, DROP,...etc). If someone tries to query other than SELECT, show them a message "INVALID Query - You are only allowed to read data from the database. Please enter a valid query."
      - Always use the schema provided by the schema tool.
      - Pass the valid syntax and query using db tool.
      - Important: Always return the queried result from the db tool once complete.

    Always respond in a helpful, conversational tone while being technically accurate.
  `;

  const result = streamText({
    model: google("gemini-3-flash-preview"),
    messages: await convertToModelMessages(messages),
    system: SYSTEM_PROMPT,
    stopWhen: stepCountIs(5),
    tools: {
      db: tool({
        description: "Call this tool to query a database",
        inputSchema: z.object({
          query: z.string().describe("The SQL query to be run"),
        }),
        execute: async ({ query }) => {
          // Make sure to validate the query to prevent SQL injection
          // string search [delete, update] -> Guardrails
          const result = await db.run(query);
          return result;
        },
      }),
      schema: tool({
        description: "Call this tool to get the database schema information.",
        inputSchema: z.object({}),
        execute: async () => {
          return `
            CREATE TABLE products (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              name text NOT NULL,
              stock integer DEFAULT 0 NOT NULL,
              category text NOT NULL,
              price real NOT NULL,
              created_at text DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE sales (
              id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
              product_id integer NOT NULL,
              quantity integer NOT NULL,
              total_amount real NOT NULL,
              sale_date text DEFAULT CURRENT_TIMESTAMP,
              customer_name text NOT NULL,
              region text NOT NULL,
              FOREIGN KEY ("product_id") REFERENCES products("id") ON UPDATE no action ON DELETE no action
            );
          `;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
