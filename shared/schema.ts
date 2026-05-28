import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  role: text("role").notNull(),
  stack: text("stack").notNull(), // JSON array of strings
  context: text("context"), // задача / контекст
  result: text("result"), // что получилось
  githubUrl: text("github_url"),
  youtubeUrl: text("youtube_url"),
  category: text("category").default("unity"), // unity | dotnet | vr | ar | other
  featured: integer("featured", { mode: "boolean" }).default(false),
  published: integer("published", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const projectMedia = sqliteTable("project_media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const adminConfig = sqliteTable("admin_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// Insert schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertProjectMediaSchema = createInsertSchema(projectMedia).omit({
  id: true,
});

// Types
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectMedia = typeof projectMedia.$inferSelect;
export type InsertProjectMedia = z.infer<typeof insertProjectMediaSchema>;

// Extended project type with media
export type ProjectWithMedia = Project & {
  media: ProjectMedia[];
};
