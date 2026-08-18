import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voterId: text("voter_id").notNull(),
  choice: text("choice").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex("idx_votes_voter_id").on(table.voterId)]);
