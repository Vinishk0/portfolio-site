import { useEffect, useRef, useState, useCallback } from "react";
import type { StaticProject } from "@/lib/projects";
import { projectAssetUrl } from "@/lib/projects";

interface Props {
  project: StaticProject;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  unity: "Unity", vr: "VR", ar: "AR", dotnet: ".NET", other: "Other",
};

// ─── YouTube embed ────────────────────────────────────────────────────────────
function YouTubeEmbed({ url }: { url: string }) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return (
    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "var(--radius-md)", overflow: "hidden" }}>
      <iframe
        src={`https://www.youtube.com/embed/${match[1]}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        title="Project video"
      />
    </div>
  );
}

// ─── Media block ──────────────────────────────────────────────────────────────
function MediaBlock({ project }: { project: StaticProject }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // Build media list: local images first, then video
  const imageFiles = project.images ?? (project.cover ? [project.cover] : []);
  const hasLocalMedia = imageFiles.length > 0 || !!project.videoUrl;

  if (!hasLocalMedia && !project.youtubeUrl) return null;

  if (project.youtubeUrl && !hasLocalMedia) {
    return <div className="mb-6"><YouTubeEmbed url={project.youtubeUrl} /></div>;
  }

  const allItems: { type: "image" | "video"; src: string }[] = [
    ...imageFiles.map((f) => ({ type: "image" as const, src: projectAssetUrl(project.id, f) })),
    ...(project.videoUrl ? [{ type: "video" as const, src: projectAssetUrl(project.id, project.videoUrl) }] : []),
  ];

  const current = allItems[activeIdx];

  return (
    <div className="mb-6">
      <div style={{
        borderRadius: "var(--radius-md)", overflow: "hidden", aspectRatio: "16/9",
        background: "var(--color-surface-offset)", marginBottom: allItems.length > 1 ? "var(--space-3)" : 0,
      }}>
        {current.type === "image" ? (
          <img src={current.src} alt={project.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <video src={current.src} controls
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      {allItems.length > 1 && (
        <div className="flex gap-2" style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          {allItems.map((item, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} style={{
              flexShrink: 0, width: "60px", height: "60px", borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              border: i === activeIdx ? "2px solid var(--color-primary)" : "2px solid transparent",
              opacity: i === activeIdx ? 1 : 0.5,
              transition: "all var(--transition-interactive)",
              background: "var(--color-surface-offset)",
            }} aria-label={`Слайд ${i + 1}`}>
              {item.type === "image" ? (
                <img src={item.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontSize: "1.2rem" }}>▶</div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── No-media typographic hero ────────────────────────────────────────────────
function TypographicHero({ project }: { project: StaticProject }) {
  const catLabel = CATEGORY_LABELS[project.category] ?? project.category;
  return (
    <div className="mb-6 relative overflow-hidden" style={{
      borderRadius: "var(--radius-md)", background: "var(--color-surface-2)",
      border: "1px solid var(--color-border)", padding: "var(--space-8) var(--space-6)",
      minHeight: "180px", display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div className="absolute top-0 right-0 font-display font-bold select-none pointer-events-none"
        aria-hidden="true" style={{
          fontSize: "clamp(4rem, 10vw, 8rem)", lineHeight: 0.85,
          color: "rgba(255,255,255,0.03)", letterSpacing: "-0.05em", paddingRight: "var(--space-4)",
        }}>
        {project.title.split(" ").slice(0, 2).join("\n")}
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <span className="tag tag-primary">{catLabel}</span>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{project.role}</span>
      </div>
    </div>
  );
}

// ─── Project Modal ────────────────────────────────────────────────────────────
export default function ProjectModal({ project, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stack = project.stack ?? [];
  const catLabel = CATEGORY_LABELS[project.category] ?? project.category;
  const hasMedia =
    (project.images && project.images.length > 0) ||
    !!project.cover ||
    !!project.videoUrl ||
    !!project.youtubeUrl;

  const handleClose = useCallback(() => {
    if (panelRef.current) {
      panelRef.current.style.transform = "scale(0.96) translateY(16px)";
      panelRef.current.style.opacity = "0";
    }
    if (backdropRef.current) backdropRef.current.style.opacity = "0";
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (backdropRef.current) backdropRef.current.style.opacity = "1";
      if (panelRef.current) {
        panelRef.current.style.transform = "scale(1) translateY(0)";
        panelRef.current.style.opacity = "1";
      }
    });
  }, []);

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      style={{ opacity: 0, transition: "opacity 0.3s var(--ease-out)" }}
      onClick={(e) => e.target === backdropRef.current && handleClose()}
      role="dialog" aria-modal="true" aria-label={project.title}
      data-testid="project-modal"
    >
      <div
        ref={panelRef}
        className="modal-panel"
        style={{
          opacity: 0,
          transform: "scale(0.94) translateY(20px)",
          transition: "opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "var(--space-5) var(--space-6)",
          borderBottom: "1px solid var(--color-border)", flexShrink: 0,
        }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="tag tag-primary">{catLabel}</span>
            <h2 className="font-display font-semibold truncate"
              style={{ fontSize: "var(--text-lg)", lineHeight: 1.2 }}>
              {project.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Закрыть"
            data-testid="modal-close"
            style={{
              width: "36px", height: "36px", display: "flex", alignItems: "center",
              justifyContent: "center", borderRadius: "var(--radius-md)",
              color: "var(--color-text-muted)", background: "transparent",
              border: "1px solid var(--color-border)", fontSize: "1.1rem", flexShrink: 0,
              transition: "all var(--transition-interactive)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-offset)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "var(--space-6)", flex: 1 }}>
          {/* Media or typographic placeholder */}
          {hasMedia ? <MediaBlock project={project} /> : <TypographicHero project={project} />}

          {/* Meta: role + category */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div style={{
              padding: "var(--space-4)", background: "var(--color-surface-2)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            }}>
              <div className="admin-label mb-1">Моя роль</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", fontWeight: 500 }}>
                {project.role}
              </div>
            </div>
            <div style={{
              padding: "var(--space-4)", background: "var(--color-surface-2)",
              borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
            }}>
              <div className="admin-label mb-1">Категория</div>
              <div className="flex items-center gap-2" style={{ marginTop: "4px" }}>
                <span className="tag tag-primary" style={{ fontSize: "11px" }}>{catLabel}</span>
                {project.featured && (
                  <span className="tag" style={{
                    fontSize: "11px", color: "var(--color-primary)",
                    borderColor: "rgba(232,168,56,0.3)", background: "var(--color-primary-dim)",
                  }}>★ featured</span>
                )}
              </div>
            </div>
          </div>

          {/* Short description */}
          <p style={{
            fontSize: "var(--text-lg)", color: "var(--color-text-muted)",
            fontWeight: 300, lineHeight: 1.5, marginBottom: "var(--space-5)",
          }}>{project.shortDescription}</p>

          {/* Context */}
          {project.context && (
            <div className="mb-5">
              <div className="admin-label mb-2">Контекст / задача</div>
              <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.65 }}>
                {project.context}
              </p>
            </div>
          )}

          {/* Full description */}
          <div className="mb-5">
            <div className="admin-label mb-2">Описание</div>
            <p style={{ fontSize: "var(--text-base)", color: "var(--color-text-muted)", lineHeight: 1.7 }}>
              {project.fullDescription}
            </p>
          </div>

          {/* Result */}
          {project.result && (
            <div className="mb-6" style={{
              padding: "var(--space-4) var(--space-5)",
              background: "var(--color-primary-dim)",
              border: "1px solid rgba(232,168,56,0.2)",
              borderRadius: "var(--radius-md)",
            }}>
              <div className="admin-label mb-2" style={{ color: "rgba(232,168,56,0.6)" }}>Результат</div>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 500, lineHeight: 1.6 }}>
                {project.result}
              </p>
            </div>
          )}

          {/* Full stack */}
          {stack.length > 0 && (
            <div className="mb-5">
              <div className="admin-label mb-3">Стек технологий</div>
              <div className="flex flex-wrap gap-2">
                {stack.map((tech) => <span key={tech} className="tag">{tech}</span>)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap pt-2">
            {project.githubUrl && (
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                className="btn-ghost" data-testid="modal-github">
                <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                GitHub
              </a>
            )}
            {project.youtubeUrl && (
              <a href={project.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="btn-primary" data-testid="modal-youtube">
                ▶ Смотреть на YouTube
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
