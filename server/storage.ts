import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, asc, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  Project,
  InsertProject,
  ProjectMedia,
  InsertProjectMedia,
  ProjectWithMedia,
} from "@shared/schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data.db");
const db = drizzle(new Database(DB_PATH), { schema });

// Initialize tables
function initDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      role TEXT NOT NULL,
      stack TEXT NOT NULL,
      context TEXT,
      result TEXT,
      github_url TEXT,
      youtube_url TEXT,
      category TEXT DEFAULT 'unity',
      featured INTEGER DEFAULT 0,
      published INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS project_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS admin_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
  `);
  sqlite.close();
}

initDb();

export interface IStorage {
  // Projects
  getAllProjects(): ProjectWithMedia[];
  getPublishedProjects(): ProjectWithMedia[];
  getProjectById(id: number): ProjectWithMedia | undefined;
  createProject(data: InsertProject): Project;
  updateProject(id: number, data: Partial<InsertProject>): Project | undefined;
  deleteProject(id: number): boolean;

  // Media
  addProjectMedia(data: InsertProjectMedia): ProjectMedia;
  deleteProjectMedia(id: number): boolean;
  getProjectMedia(projectId: number): ProjectMedia[];

  // Admin config
  getConfig(key: string): string | undefined;
  setConfig(key: string, value: string): void;
}

function attachMedia(projects: Project[]): ProjectWithMedia[] {
  return projects.map((p) => {
    const media = db
      .select()
      .from(schema.projectMedia)
      .where(eq(schema.projectMedia.projectId, p.id))
      .orderBy(asc(schema.projectMedia.sortOrder))
      .all();
    return { ...p, media };
  });
}

export const storage: IStorage = {
  getAllProjects() {
    const rows = db
      .select()
      .from(schema.projects)
      .orderBy(asc(schema.projects.sortOrder), desc(schema.projects.createdAt))
      .all();
    return attachMedia(rows);
  },

  getPublishedProjects() {
    const rows = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.published, true))
      .orderBy(asc(schema.projects.sortOrder), desc(schema.projects.createdAt))
      .all();
    return attachMedia(rows);
  },

  getProjectById(id: number) {
    const row = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .get();
    if (!row) return undefined;
    const media = db
      .select()
      .from(schema.projectMedia)
      .where(eq(schema.projectMedia.projectId, id))
      .orderBy(asc(schema.projectMedia.sortOrder))
      .all();
    return { ...row, media };
  },

  createProject(data: InsertProject) {
    return db
      .insert(schema.projects)
      .values({ ...data, createdAt: new Date() })
      .returning()
      .get();
  },

  updateProject(id: number, data: Partial<InsertProject>) {
    return db
      .update(schema.projects)
      .set(data)
      .where(eq(schema.projects.id, id))
      .returning()
      .get();
  },

  deleteProject(id: number) {
    // Also delete media files
    const media = db
      .select()
      .from(schema.projectMedia)
      .where(eq(schema.projectMedia.projectId, id))
      .all();
    for (const m of media) {
      const fp = path.join(process.cwd(), "uploads", m.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    db.delete(schema.projectMedia)
      .where(eq(schema.projectMedia.projectId, id))
      .run();
    const result = db
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .run();
    return result.changes > 0;
  },

  addProjectMedia(data: InsertProjectMedia) {
    return db.insert(schema.projectMedia).values(data).returning().get();
  },

  deleteProjectMedia(id: number) {
    const media = db
      .select()
      .from(schema.projectMedia)
      .where(eq(schema.projectMedia.id, id))
      .get();
    if (media) {
      const fp = path.join(process.cwd(), "uploads", media.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    const result = db
      .delete(schema.projectMedia)
      .where(eq(schema.projectMedia.id, id))
      .run();
    return result.changes > 0;
  },

  getProjectMedia(projectId: number) {
    return db
      .select()
      .from(schema.projectMedia)
      .where(eq(schema.projectMedia.projectId, projectId))
      .orderBy(asc(schema.projectMedia.sortOrder))
      .all();
  },

  getConfig(key: string) {
    const row = db
      .select()
      .from(schema.adminConfig)
      .where(eq(schema.adminConfig.key, key))
      .get();
    return row?.value;
  },

  setConfig(key: string, value: string) {
    const existing = db
      .select()
      .from(schema.adminConfig)
      .where(eq(schema.adminConfig.key, key))
      .get();
    if (existing) {
      db.update(schema.adminConfig)
        .set({ value })
        .where(eq(schema.adminConfig.key, key))
        .run();
    } else {
      db.insert(schema.adminConfig).values({ key, value }).run();
    }
  },
};
