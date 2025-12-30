import { pgTable, text, timestamp, boolean, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'closed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  senderType: varchar("sender_type", { length: 10 }).notNull(), // 'user' or 'admin'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
