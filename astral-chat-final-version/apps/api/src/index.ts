import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { db, conversations, messages, eq } from "@astral-chat/db";

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")
  .get("/conversations", async () => {
    return await db.query.conversations.findMany({
        with: {
            messages: {
                limit: 1,
                orderBy: (messages, { desc }) => [desc(messages.createdAt)]
            }
        },
        orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)]
    });
  })
  .post("/conversations", async () => {
    const [newConv] = await db.insert(conversations).values({}).returning();
    app.server?.publish("dashboard", JSON.stringify({ type: "new_conversation", data: newConv }));
    return newConv;
  })
  .get("/conversations/:id/messages", async ({ params: { id } }) => {
    return await db.query.messages.findMany({
      where: eq(messages.conversationId, id),
      orderBy: (messages, { desc }) => [desc(messages.createdAt)],
    });
  })
  .post("/conversations/:id/read", async ({ params: { id } }) => {
    await db.update(messages)
      .set({ isRead: true })
      .where(
        eq(messages.conversationId, id)
      );
    return { success: true };
  })
  .ws("/ws", {
    body: t.Object({
        type: t.String(),
        data: t.Any()
    }),
    open(ws) {
        console.log("WS Open", ws.id);
    },
    message(ws, message) {
        const { type, data } = message;
        
        if (type === "join_room") {
            ws.subscribe(data.conversationId);
            console.log(`Joined room ${data.conversationId}`);
        } else if (type === "join_dashboard") {
            ws.subscribe("dashboard");
            console.log("Joined dashboard");
        } else if (type === "send_message") {
            const { conversationId, content, senderType } = data;
            
            // Save to DB
            db.insert(messages).values({
                conversationId,
                content,
                senderType,
                isRead: senderType === 'admin'
            }).returning().then(([newMsg]) => {
                // Update conversation timestamp
                db.update(conversations)
                  .set({ updatedAt: new Date() })
                  .where(eq(conversations.id, conversationId))
                  .then(() => console.log(`Updated timestamp for ${conversationId}`))
                  .catch(console.error);

                 // Broadcast to room
                ws.publish(conversationId, JSON.stringify({ type: "new_message", data: newMsg }));
                // Notify dashboard
                ws.publish("dashboard", JSON.stringify({ type: "conversation_updated", data: { conversationId, lastMessage: newMsg } }));
            }).catch(e => console.error(e));
        }
    }
  })
  .listen(4000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
