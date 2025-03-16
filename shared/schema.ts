import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  lastActive: timestamp("last_active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username").notNull(),
  ip: text("ip"),
  keystroke: text("keystroke"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username").notNull(),
  ip: text("ip"),
  screenshot: text("screenshot").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  resolution: text("resolution"),
});

export const clipboardLogs = pgTable("clipboard_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username").notNull(),
  ip: text("ip"),
  clipboard: text("clipboard").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isSensitive: boolean("is_sensitive").default(false),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username"),
  type: text("type").notNull(),  // "sensitive_data", "unusual_behavior", "security"
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  severity: text("severity").notNull(), // "low", "medium", "high"
  isRead: boolean("is_read").default(false),
});

export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  username: text("username"),
  analysisType: text("analysis_type").notNull(), // "keystroke", "behavior", "threat"
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  dateRangeStart: timestamp("date_range_start"),
  dateRangeEnd: timestamp("date_range_end"),
  riskLevel: text("risk_level"), // "low", "medium", "high"
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertLogSchema = createInsertSchema(logs).pick({
  userId: true,
  username: true,
  ip: true,
  keystroke: true,
  timestamp: true,
});

export const insertScreenshotSchema = createInsertSchema(screenshots).pick({
  userId: true,
  username: true,
  ip: true,
  screenshot: true,
  timestamp: true,
  resolution: true,
});

export const insertClipboardLogSchema = createInsertSchema(clipboardLogs).pick({
  userId: true,
  username: true,
  ip: true,
  clipboard: true,
  timestamp: true,
  isSensitive: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  userId: true,
  username: true,
  type: true,
  message: true,
  timestamp: true,
  severity: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalysis).pick({
  userId: true,
  username: true,
  analysisType: true,
  results: true,
  dateRangeStart: true,
  dateRangeEnd: true,
  riskLevel: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type Screenshot = typeof screenshots.$inferSelect;
export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;

export type ClipboardLog = typeof clipboardLogs.$inferSelect;
export type InsertClipboardLog = z.infer<typeof insertClipboardLogSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type AIAnalysis = typeof aiAnalysis.$inferSelect;
export type InsertAIAnalysis = z.infer<typeof insertAiAnalysisSchema>;
