import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { ProjectWithMedia, InsertProject } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "unity", label: "Unity" },
  { value: "vr", label: "VR" },
  { value: "ar", label: "AR" },
  { value: "dotnet", label: ".NET" },
  { value: "other", label: "Other" },
];

function authHeaders() {
  const token = (window as any).__fw_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6em 0.9em",
  background: "var(--color-surface-offset)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text)",
  fontFamily: "var(--font-body)",
  fontSize: "var(--text-sm)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-text-muted)",
  marginBottom: "6px",
};

// ─── About Section ─────────────────────────────────────────────────────────────
function AboutSection() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [bio, setBio] = useState({ bio1: "", bio2: "", bio3: "" });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch current about data
  const { data: aboutData, isLoading } = useQuery<{
    bio1: string; bio2: string; bio3: string; photoUrl: string | null;
  }>({
    queryKey: ["/api/about"],
    queryFn: () => apiRequest("GET", "/api/about"),
  });

  useEffect(() => {
    if (aboutData && !loaded) {
      setBio({
        bio1: aboutData.bio1 || "",
        bio2: aboutData.bio2 || "",
        bio3: aboutData.bio3 || "",
      });
      setPhotoPreview(aboutData.photoUrl || null);
      setLoaded(true);
    }
  }, [aboutData, loaded]);

  async function handleSaveBio() {
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/admin/about", bio, {
        headers: authHeaders(),
      });
      await qc.invalidateQueries({ queryKey: ["/api/about"] });
      toast({ title: "Раздел 'Обо мне' обновлён" });
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("photo", file);
    try {
      const res = await fetch("/api/admin/about/photo", {
        method: "POST",
        headers: authHeaders() as Record<string, string>,
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPhotoPreview(data.photoUrl);
      await qc.invalidateQueries({ queryKey: ["/api/about"] });
      toast({ title: "Фото загружено" });
    } catch {
      toast({ title: "Ошибка загрузки фото", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (isLoading) {
    return (
      <div style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-12)" }}>
        Загрузка...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      {/* Photo upload */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
        }}
      >
        <h3
          className="font-display font-semibold"
          style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}
        >
          Фотография
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
          {/* Photo preview */}
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "var(--color-surface-offset)",
              border: "2px solid var(--color-border)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Фото профиля"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                data-testid="about-photo-preview"
              />
            ) : (
              <span style={{ fontSize: "2rem", color: "var(--color-text-faint)" }}>👤</span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
              Рекомендуемый размер: 400×400 px. Форматы: JPG, PNG, WebP.
            </p>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
              data-testid="about-photo-input"
            />
            <button
              className="btn-ghost"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              style={{ fontSize: "var(--text-xs)" }}
              data-testid="about-photo-btn"
            >
              {uploadingPhoto ? "Загрузка..." : photoPreview ? "Заменить фото" : "Загрузить фото"}
            </button>
          </div>
        </div>
      </div>

      {/* Bio editing */}
      <div
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
        }}
      >
        <h3
          className="font-display font-semibold"
          style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}
        >
          Текст о себе
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div>
            <label style={labelStyle}>Первый абзац</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              value={bio.bio1}
              onChange={(e) => setBio((prev) => ({ ...prev, bio1: e.target.value }))}
              placeholder="Привет! Я Unity / VR / AR разработчик..."
              data-testid="about-bio1"
            />
          </div>
          <div>
            <label style={labelStyle}>Второй абзац</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              value={bio.bio2}
              onChange={(e) => setBio((prev) => ({ ...prev, bio2: e.target.value }))}
              placeholder="Специализируюсь на..."
              data-testid="about-bio2"
            />
          </div>
          <div>
            <label style={labelStyle}>Третий абзац</label>
            <textarea
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              value={bio.bio3}
              onChange={(e) => setBio((prev) => ({ ...prev, bio3: e.target.value }))}
              placeholder="В свободное время..."
              data-testid="about-bio3"
            />
          </div>
        </div>

        <div style={{ marginTop: "var(--space-5)" }}>
          <button
            className="btn-primary"
            onClick={handleSaveBio}
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
            data-testid="about-save-btn"
          >
            {saving ? "Сохранение..." : "Сохранить текст"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Form ─────────────────────────────────────────────────────────────
interface ProjectFormProps {
  project?: ProjectWithMedia;
  onSave: () => void;
  onCancel: () => void;
}

function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: project?.title || "",
    shortDescription: project?.shortDescription || "",
    fullDescription: project?.fullDescription || "",
    role: project?.role || "",
    stack: project ? JSON.parse(project.stack || "[]").join(", ") : "",
    context: project?.context || "",
    result: project?.result || "",
    githubUrl: project?.githubUrl || "",
    youtubeUrl: project?.youtubeUrl || "",
    category: project?.category || "unity",
    featured: project?.featured ?? false,
    published: project?.published ?? false,
    sortOrder: project?.sortOrder ?? 0,
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function update(key: string, val: unknown) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!form.title || !form.shortDescription || !form.fullDescription || !form.role) {
      toast({ title: "Заполни обязательные поля", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      stack: JSON.stringify(form.stack.split(",").map((s) => s.trim()).filter(Boolean)),
    };
    try {
      if (project) {
        await apiRequest("PATCH", `/api/admin/projects/${project.id}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await apiRequest("POST", "/api/admin/projects", payload, {
          headers: authHeaders(),
        });
      }
      await qc.invalidateQueries({ queryKey: ["/api/projects"] });
      await qc.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: project ? "Проект обновлён" : "Проект создан" });
      onSave();
    } catch {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !project) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/media`, {
        method: "POST",
        headers: authHeaders() as Record<string, string>,
        body: fd,
      });
      if (!res.ok) throw new Error();
      await qc.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Медиа загружено" });
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(mediaId: number) {
    try {
      await apiRequest("DELETE", `/api/admin/media/${mediaId}`, undefined, {
        headers: authHeaders(),
      });
      await qc.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Медиа удалено" });
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Title */}
      <div>
        <label style={labelStyle}>Название *</label>
        <input
          type="text"
          style={inputStyle}
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="VR Archery Simulator"
          data-testid="form-title"
        />
      </div>

      {/* Short desc */}
      <div>
        <label style={labelStyle}>Краткое описание *</label>
        <input
          type="text"
          style={inputStyle}
          value={form.shortDescription}
          onChange={(e) => update("shortDescription", e.target.value)}
          placeholder="Иммерсивный VR-тренажёр..."
          data-testid="form-short-desc"
        />
      </div>

      {/* Full desc */}
      <div>
        <label style={labelStyle}>Полное описание *</label>
        <textarea
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
          value={form.fullDescription}
          onChange={(e) => update("fullDescription", e.target.value)}
          placeholder="Подробное описание проекта..."
          data-testid="form-full-desc"
        />
      </div>

      {/* Role */}
      <div>
        <label style={labelStyle}>Роль *</label>
        <input
          type="text"
          style={inputStyle}
          value={form.role}
          onChange={(e) => update("role", e.target.value)}
          placeholder="Lead Unity Developer"
          data-testid="form-role"
        />
      </div>

      {/* Stack */}
      <div>
        <label style={labelStyle}>Стек (через запятую)</label>
        <input
          type="text"
          style={inputStyle}
          value={form.stack}
          onChange={(e) => update("stack", e.target.value)}
          placeholder="Unity, C#, OpenXR, Meta SDK"
          data-testid="form-stack"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Context */}
        <div>
          <label style={labelStyle}>Контекст / задача</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            value={form.context}
            onChange={(e) => update("context", e.target.value)}
            placeholder="Учебный проект..."
          />
        </div>

        {/* Result */}
        <div>
          <label style={labelStyle}>Результат</label>
          <textarea
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            value={form.result}
            onChange={(e) => update("result", e.target.value)}
            placeholder="Рабочий прототип..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* GitHub */}
        <div>
          <label style={labelStyle}>GitHub URL</label>
          <input
            type="url"
            style={inputStyle}
            value={form.githubUrl}
            onChange={(e) => update("githubUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>

        {/* YouTube */}
        <div>
          <label style={labelStyle}>YouTube URL</label>
          <input
            type="url"
            style={inputStyle}
            value={form.youtubeUrl}
            onChange={(e) => update("youtubeUrl", e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Category */}
        <div>
          <label style={labelStyle}>Категория</label>
          <select
            style={inputStyle}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div>
          <label style={labelStyle}>Порядок</label>
          <input
            type="number"
            style={inputStyle}
            value={form.sortOrder}
            onChange={(e) => update("sortOrder", parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-3 justify-end">
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update("featured", e.target.checked)}
              data-testid="form-featured"
            />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Избранный</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
              data-testid="form-published"
            />
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Опубликован</span>
          </label>
        </div>
      </div>

      {/* Media upload (only for existing projects) */}
      {project && (
        <div>
          <label style={labelStyle}>Медиа файлы</label>
          <div
            style={{
              border: "1px dashed var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
            }}
          >
            {/* Existing media */}
            {project.media && project.media.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {project.media.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      position: "relative",
                      width: "72px",
                      height: "72px",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      background: "var(--color-surface-offset)",
                    }}
                  >
                    {m.mimeType?.startsWith("image/") ? (
                      <img
                        src={`/uploads/${m.filename}`}
                        alt={m.originalName}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontSize: "1.5rem" }}>
                        ▶
                      </div>
                    )}
                    <button
                      onClick={() => deleteMedia(m.id)}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.8)",
                        color: "#fff",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      aria-label="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost"
              disabled={uploading}
              style={{ fontSize: "var(--text-xs)" }}
            >
              {uploading ? "Загрузка..." : "+ Добавить фото / видео"}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          data-testid="form-save-btn"
          style={{ opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Сохранение..." : project ? "Сохранить" : "Создать"}
        </button>
        <button className="btn-ghost" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────
function ProjectRow({
  project,
  onEdit,
  onDelete,
}: {
  project: ProjectWithMedia;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stack = JSON.parse(project.stack || "[]") as string[];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-4) var(--space-5)",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
      }}
      data-testid={`admin-project-row-${project.id}`}
    >
      {/* Status dot */}
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: project.published ? "var(--color-success)" : "var(--color-text-faint)",
          flexShrink: 0,
        }}
        title={project.published ? "Опубликован" : "Скрыт"}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "2px" }}>
          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, fontFamily: "var(--font-display)" }}>
            {project.title}
          </span>
          {project.featured && (
            <span className="tag tag-primary" style={{ fontSize: "9px" }}>★ featured</span>
          )}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
          {project.role} · {stack.slice(0, 3).join(", ")}
          {stack.length > 3 ? ` +${stack.length - 3}` : ""}
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", flexShrink: 0 }}>
        <button
          className="btn-ghost"
          onClick={onEdit}
          style={{ padding: "0.4em 0.9em", fontSize: "var(--text-xs)" }}
          data-testid={`edit-project-${project.id}`}
        >
          Ред.
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: "0.4em 0.9em",
            fontSize: "var(--text-xs)",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            color: "var(--color-error)",
            background: "transparent",
            border: "1px solid rgba(224, 82, 82, 0.25)",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
          }}
          data-testid={`delete-project-${project.id}`}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"projects" | "about">("projects");
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingProject, setEditingProject] = useState<ProjectWithMedia | null>(null);

  // Auth check
  useEffect(() => {
    const token = (window as any).__fw_token;
    if (!token) {
      navigate("/admin/c0mmand-center");
      return;
    }
    // Verify token
    fetch("/api/auth/verify", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) navigate("/admin/c0mmand-center"); })
      .catch(() => navigate("/admin/c0mmand-center"));
  }, [navigate]);

  const { data: projects = [], isLoading } = useQuery<ProjectWithMedia[]>({
    queryKey: ["/api/admin/projects"],
    queryFn: () =>
      apiRequest("GET", "/api/admin/projects", undefined, {
        headers: authHeaders(),
      }),
  });

  async function deleteProject(id: number) {
    if (!confirm("Удалить проект? Это действие нельзя отменить.")) return;
    try {
      await apiRequest("DELETE", `/api/admin/projects/${id}`, undefined, {
        headers: authHeaders(),
      });
      await qc.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      await qc.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Проект удалён" });
    } catch {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    }
  }

  function logout() {
    (window as any).__fw_token = null;
    navigate("/");
  }

  // Tab style helper
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "0.45em 1.1em",
    fontSize: "var(--text-xs)",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    background: active ? "var(--color-primary)" : "transparent",
    color: active ? "#0d0d0f" : "var(--color-text-muted)",
    border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    transition: "all 180ms cubic-bezier(0.16, 1, 0.3, 1)",
  });

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        padding: "var(--space-6)",
      }}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--space-6)",
            paddingBottom: "var(--space-5)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div>
            <h1
              className="font-display font-bold"
              style={{ fontSize: "var(--text-xl)", marginBottom: "4px" }}
            >
              Command Center
            </h1>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Управление портфолио · Никита Курлаев
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/"
              className="btn-ghost"
              style={{ fontSize: "var(--text-xs)" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              ↗ Сайт
            </a>
            <button
              className="btn-ghost"
              onClick={logout}
              style={{ fontSize: "var(--text-xs)", color: "var(--color-error)", borderColor: "rgba(224,82,82,0.25)" }}
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Tab switcher — only shown in list/about view, not in create/edit */}
        {(view === "list") && (
          <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
            <button
              style={tabStyle(tab === "projects")}
              onClick={() => setTab("projects")}
              data-testid="tab-projects"
            >
              Проекты
            </button>
            <button
              style={tabStyle(tab === "about")}
              onClick={() => setTab("about")}
              data-testid="tab-about"
            >
              Обо мне
            </button>
          </div>
        )}

        {/* ── Projects tab ── */}
        {tab === "projects" && view === "list" && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Всего проектов", value: projects.length },
                { label: "Опубликовано", value: projects.filter((p) => p.published).length },
                { label: "Избранных", value: projects.filter((p) => p.featured).length },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                  }}
                >
                  <div
                    className="font-display font-bold"
                    style={{ fontSize: "var(--text-2xl)", color: "var(--color-primary)", lineHeight: 1 }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Projects list */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--space-4)",
              }}
            >
              <h2
                className="font-display font-semibold"
                style={{ fontSize: "var(--text-lg)" }}
              >
                Проекты
              </h2>
              <button
                className="btn-primary"
                onClick={() => { setEditingProject(null); setView("create"); }}
                style={{ fontSize: "var(--text-xs)" }}
                data-testid="create-project-btn"
              >
                + Новый проект
              </button>
            </div>

            {isLoading ? (
              <div style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "var(--space-12)" }}>
                Загрузка...
              </div>
            ) : projects.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "var(--space-12)",
                  color: "var(--color-text-muted)",
                  border: "1px dashed var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <p style={{ marginBottom: "var(--space-4)" }}>Нет проектов</p>
                <button
                  className="btn-primary"
                  onClick={() => { setEditingProject(null); setView("create"); }}
                >
                  Создать первый
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    onEdit={() => { setEditingProject(project); setView("edit"); }}
                    onDelete={() => deleteProject(project.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── About tab ── */}
        {tab === "about" && view === "list" && <AboutSection />}

        {/* ── Create / Edit form ── */}
        {(view === "create" || view === "edit") && (
          <div>
            {/* Back button */}
            <button
              onClick={() => { setView("list"); setEditingProject(null); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                marginBottom: "var(--space-6)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← Назад к списку
            </button>

            <h2
              className="font-display font-bold mb-6"
              style={{ fontSize: "var(--text-xl)" }}
            >
              {view === "create" ? "Новый проект" : `Редактировать: ${editingProject?.title}`}
            </h2>

            <div
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-6)",
              }}
            >
              <ProjectForm
                project={editingProject ?? undefined}
                onSave={() => setView("list")}
                onCancel={() => { setView("list"); setEditingProject(null); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
