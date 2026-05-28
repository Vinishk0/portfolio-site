import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── Config ──────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || "fw_portfolio_secret_2026_xK9mP";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  // Default: "firewolf2026" — change via env in production
  "$2a$12$LZwG9mBhv5MRkCpI.q8h1.fT8j8M9Kt3R2Y7N0pL5cXqmPdVzReuW";

// Uploads directory
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── Multer ───────────────────────────────────────────────────────────────────
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = /image\/(jpeg|jpg|png|gif|webp)|video\/(mp4|webm|ogg)/;
    cb(null, allowed.test(file.mimetype));
  },
});

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ─── Seed demo projects ───────────────────────────────────────────────────────
function seedDemoProjects() {
  const existing = storage.getAllProjects();
  if (existing.length > 0) return;

  const demos = [
    {
      title: "VR Archery Simulator",
      shortDescription: "Иммерсивный тренажёр по стрельбе из лука в VR с реалистичной физикой",
      fullDescription:
        "Проект разрабатывался как учебный VR-тренажёр для формирования правильной техники стрельбы из лука. Реализована кастомная физическая модель полёта стрелы с учётом гравитации, сопротивления воздуха и вращения. Система скоринга отслеживает точность, консистентность стойки и прогресс пользователя между сессиями.",
      role: "Lead Unity Developer / VR Architect",
      stack: JSON.stringify(["Unity 2022 LTS", "C#", "OpenXR", "Meta SDK", "XR Interaction Toolkit", "Shader Graph"]),
      context: "Учебный проект — демонстрация возможностей VR-симуляции для спортивного обучения",
      result:
        "Полноценный VR-тренажёр с тремя режимами игры, системой прогресса и поддержкой Meta Quest 2/3",
      githubUrl: "https://github.com/firewolffirewolf20",
      youtubeUrl: null,
      category: "vr",
      featured: true,
      published: true,
      sortOrder: 1,
    },
    {
      title: "AR Navigation Indoor",
      shortDescription: "AR-система навигации внутри зданий с якорями в реальном пространстве",
      fullDescription:
        "Система дополненной реальности для навигации в закрытых помещениях, где GPS неэффективен. Использует ARCore/ARKit для отслеживания положения, а пространственные якоря сохраняются в облаке между сессиями. Пользователь видит в камере телефона стрелки и метки поверх реального мира.",
      role: "Unity AR Developer",
      stack: JSON.stringify(["Unity", "C#", "ARCore", "ARKit", "AR Foundation", "Azure Spatial Anchors"]),
      context: "Исследовательский проект по indoor-навигации для торговых центров и кампусов",
      result:
        "Рабочий прототип с точностью позиционирования < 0.5м и поддержкой постоянных якорей",
      githubUrl: "https://github.com/firewolffirewolf20",
      youtubeUrl: null,
      category: "ar",
      featured: true,
      published: true,
      sortOrder: 2,
    },
    {
      title: "Procedural Dungeon Generator",
      shortDescription: "Процедурная генерация подземелий с гарантированной проходимостью и биомами",
      fullDescription:
        "Система процедурной генерации уровней для roguelike-игры. Алгоритм BSP-разбиения создаёт уникальные подземелья каждый раз, гарантируя проходимость через breadth-first search. Реализованы биомы с уникальными тайлсетами, врагами и лутом. Используется ECS-архитектура для масштабируемости.",
      role: "Gameplay Programmer / Systems Architect",
      stack: JSON.stringify(["Unity 2023", "C#", "Unity ECS", "Burst Compiler", "Job System", "Cinemachine"]),
      context: "Личный проект — изучение процедурной генерации и Unity DOTS/ECS",
      result:
        "Генератор создаёт 10,000-тайловое подземелье за < 100мс благодаря Burst Compiler",
      githubUrl: "https://github.com/firewolffirewolf20",
      youtubeUrl: null,
      category: "unity",
      featured: false,
      published: true,
      sortOrder: 3,
    },
    {
      title: "TestFlow — QA Management Tool",
      shortDescription: "Инструмент управления тест-кейсами и баг-трекинга для небольших команд",
      fullDescription:
        "Web-приложение для управления процессом QA: создание тест-планов, выполнение тест-кейсов с отметками pass/fail, автоматическая генерация отчётов о покрытии. Интегрируется с GitHub Issues для автоматического создания баг-репортов в нужном формате.",
      role: "Full-stack Developer / QA Architect",
      stack: JSON.stringify([".NET 8", "C#", "ASP.NET Core", "Entity Framework", "React", "TypeScript", "PostgreSQL"]),
      context: "Инструмент разработан для упрощения QA-процесса в маленьких геймдев-командах",
      result:
        "Сокращение времени на составление QA-отчётов на 60%, интеграция с GitHub",
      githubUrl: "https://github.com/firewolffirewolf20",
      youtubeUrl: null,
      category: "dotnet",
      featured: false,
      published: true,
      sortOrder: 4,
    },
  ];

  for (const demo of demos) {
    storage.createProject(demo as any);
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────
export async function registerRoutes(httpServer: Server, app: Express) {
  // Serve uploads
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  const expressStatic = (await import("express")).static;
  app.use("/uploads", expressStatic(UPLOADS_DIR));

  // Seed demo data
  seedDemoProjects();

  // ── Public: About ─────────────────────────────────────────────────────
  app.get("/api/about", (_req, res) => {
    try {
      const bio1 = storage.getConfig("about_bio1") || "Unity / VR / AR разработчик с опытом в создании иммерсивных интерактивных опытов — от VR-тренажёров до AR-навигации.";
      const bio2 = storage.getConfig("about_bio2") || "Специализируюсь на игровых механиках, пространственных интерфейсах и оптимизации производительности GPU. Пишу на C# и .NET, использую Python для автоматизации.";
      const bio3 = storage.getConfig("about_bio3") || "Выпускник ОКЭИ (2025). Умею видеть продукт целиком: от игровой архитектуры до QA-методологии.";
      const photoUrl = storage.getConfig("about_photo") || null;
      res.json({ bio1, bio2, bio3, photoUrl });
    } catch {
      res.status(500).json({ error: "Failed" });
    }
  });

  // ── Admin: About ─────────────────────────────────────────────────────
  app.patch("/api/admin/about", requireAdmin, (req, res) => {
    const { bio1, bio2, bio3 } = req.body;
    if (bio1 !== undefined) storage.setConfig("about_bio1", bio1);
    if (bio2 !== undefined) storage.setConfig("about_bio2", bio2);
    if (bio3 !== undefined) storage.setConfig("about_bio3", bio3);
    res.json({ ok: true });
  });

  // Upload about photo
  app.post("/api/admin/about/photo", requireAdmin, upload.single("photo"), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file" });
    const photoUrl = `/uploads/${file.filename}`;
    storage.setConfig("about_photo", photoUrl);
    res.json({ photoUrl });
  });

  // ── Public API ────────────────────────────────────────────────────────────
  app.get("/api/projects", (_req, res) => {
    try {
      const projects = storage.getPublishedProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ error: "Failed to load projects" });
    }
  });

  app.get("/api/projects/:id", (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const project = storage.getProjectById(id);
    if (!project || !project.published) {
      return res.status(404).json({ error: "Not found" });
    }
    res.json(project);
  });

  // ── Admin Auth ─────────────────────────────────────────────────────────────
  // Secret login endpoint — not linked anywhere in the UI
  app.post("/api/auth/c0mmand-center", async (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password required" });

    // Default password hash for "firewolf2026"
    const hashToCheck =
      process.env.ADMIN_PASSWORD_HASH ||
      "$2a$12$gQv8kPNwW7dT3h6J0mVRDe4ZrX5YbC1iAuF9L8tK2pMqN0dH7eWjS";

    // In dev mode, allow plain comparison; in production use bcrypt hash from env
    let valid = false;
    if (process.env.ADMIN_PASSWORD_HASH) {
      valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    } else {
      // Default dev password — change in production via ADMIN_PASSWORD_HASH env var
      valid = password === "firewolf2026";
    }

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
  });

  // Verify token
  app.get("/api/auth/verify", requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });

  // ── Admin: Projects CRUD ──────────────────────────────────────────────────
  app.get("/api/admin/projects", requireAdmin, (_req, res) => {
    res.json(storage.getAllProjects());
  });

  app.post("/api/admin/projects", requireAdmin, (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const project = storage.createProject(parsed.data);
    res.json(project);
  });

  app.patch("/api/admin/projects/:id", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const updated = storage.updateProject(id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/admin/projects/:id", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const deleted = storage.deleteProject(id);
    res.json({ success: deleted });
  });

  // ── Admin: Media Upload ───────────────────────────────────────────────────
  app.post(
    "/api/admin/projects/:id/media",
    requireAdmin,
    upload.array("files", 10),
    (req, res) => {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) return res.status(400).json({ error: "Invalid ID" });

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0)
        return res.status(400).json({ error: "No files" });

      const added = files.map((file, i) =>
        storage.addProjectMedia({
          projectId,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sortOrder: i,
        })
      );
      res.json(added);
    }
  );

  app.delete("/api/admin/media/:id", requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const deleted = storage.deleteProjectMedia(id);
    res.json({ success: deleted });
  });
}
