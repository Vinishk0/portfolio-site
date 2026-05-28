import { useState, useEffect, useRef } from "react";
import type { StaticProject } from "@/lib/projects";
import { getAllProjects, projectAssetUrl } from "@/lib/projects";
import ProjectModal from "@/components/ProjectModal";

// ─── SVG Logo ──────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg
      aria-label="Никита Курлаев — Portfolio"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-9 h-9"
    >
      <path d="M20 4 L34 30 H6 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M13 22 L27 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="4" r="2" fill="currentColor" />
    </svg>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  unity: "Unity", vr: "VR", ar: "AR", dotnet: ".NET", other: "Other",
};

// ─── Cursor Glow — Fixed, tracks clientX/Y directly ──────────────────────────
function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ tx: -500, ty: -500, cx: -500, cy: -500 });
  const raf = useRef(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      const p = pos.current;
      p.cx += (p.tx - p.cx) * 0.09;
      p.cy += (p.ty - p.cy) * 0.09;
      if (ref.current) {
        // Use left/top instead of transform to avoid the -50% offset issue
        ref.current.style.left = `${p.cx}px`;
        ref.current.style.top = `${p.cy}px`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        // centered on cursor: shift by half glow size (250px)
        marginLeft: "-250px",
        marginTop: "-250px",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,168,56,0.09) 0%, rgba(232,168,56,0.04) 40%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        willChange: "left, top",
        mixBlendMode: "screen",
        // start off-screen
        left: "-500px",
        top: "-500px",
      }}
    />
  );
}

// ─── Animated Background — grid + drifting orbs + seamless hero→content ───────
function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
    >
      {/* Fine grid — full page */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)",
        backgroundSize: "72px 72px",
      }} />

      {/* Seamless hero-to-content gradient — fades from bg color at top to transparent */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "110vh",
        background: "linear-gradient(to bottom, var(--color-bg) 0%, var(--color-bg) 60%, transparent 100%)",
        pointerEvents: "none",
      }} />

      {/* Drifting amber orb — top right */}
      <div style={{
        position: "absolute", top: "8%", left: "62%",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,168,56,0.06) 0%, transparent 70%)",
        animation: "drift1 20s ease-in-out infinite",
        filter: "blur(4px)",
      }} />
      {/* Drifting blue orb — mid left */}
      <div style={{
        position: "absolute", top: "50%", left: "8%",
        width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(91,143,185,0.05) 0%, transparent 70%)",
        animation: "drift2 25s ease-in-out infinite",
        filter: "blur(4px)",
      }} />
      {/* Drifting amber orb — bottom right */}
      <div style={{
        position: "absolute", top: "78%", left: "68%",
        width: "220px", height: "220px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,168,56,0.04) 0%, transparent 70%)",
        animation: "drift3 28s ease-in-out infinite",
        filter: "blur(3px)",
      }} />

      <style>{`
        @keyframes drift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-50px,35px) scale(1.08); }
          66%      { transform: translate(35px,-25px) scale(0.95); }
        }
        @keyframes drift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(55px,-40px) scale(1.1); }
          70%      { transform: translate(-25px,25px) scale(0.93); }
        }
        @keyframes drift3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-35px,-45px) scale(1.15); }
        }
      `}</style>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({
  project,
  featured,
  onClick,
}: {
  project: StaticProject;
  featured?: boolean;
  onClick: () => void;
}) {
  const catLabel = CATEGORY_LABELS[project.category] ?? project.category;
  const coverSrc = project.cover ? projectAssetUrl(project.id, project.cover) : null;
  const hasMedia = !!coverSrc || !!project.youtubeUrl;

  return (
    <article
      className="project-card reveal"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      data-testid={`project-card-${project.id}`}
    >
      {/* Visual area */}
      <div className="relative overflow-hidden" style={{ aspectRatio: featured ? "16/8" : "16/9" }}>
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={project.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : project.youtubeUrl ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--color-surface-offset)" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2" style={{ color: "var(--color-primary)" }}>▶</div>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Смотреть видео</p>
            </div>
          </div>
        ) : (
          /* No media — typographic placeholder */
          <div
            className="w-full h-full relative grid-bg flex items-end"
            style={{ background: "var(--color-surface-2)" }}
          >
            <div className="p-6 w-full">
              <span
                className="font-display font-bold select-none"
                aria-hidden="true"
                style={{
                  fontSize: "clamp(2.5rem, 5vw, 5rem)",
                  color: "rgba(255,255,255,0.04)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  display: "block",
                }}
              >
                {project.title.split(" ")[0]}
              </span>
            </div>
            <div className="absolute top-4 left-4">
              <span className="tag tag-primary">{catLabel}</span>
            </div>
          </div>
        )}

        {/* Gradient overlay */}
        {hasMedia && (
          <>
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }}
            />
            <div className="absolute top-4 left-4">
              <span className="tag tag-primary">{catLabel}</span>
            </div>
          </>
        )}
      </div>

      {/* Text content */}
      <div className="p-5">
        <h3
          className="font-display font-semibold mb-2"
          style={{ fontSize: "var(--text-lg)", lineHeight: 1.2 }}
        >
          {project.title}
        </h3>
        <p
          style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", lineHeight: 1.6 }}
          className="mb-4"
        >
          {project.shortDescription}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Роль
          </span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-primary)", fontWeight: 500 }}>
            {project.role}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
          {project.stack.length > 4 && (
            <span className="tag" style={{ color: "var(--color-text-faint)" }}>
              +{project.stack.length - 4}
            </span>
          )}
        </div>
        <div
          className="mt-4 flex items-center gap-1.5"
          style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}
        >
          <span style={{ color: "var(--color-primary)", opacity: 0.7 }}>→</span>
          Подробнее о проекте
        </div>
      </div>
    </article>
  );
}

// ─── Tech stack tiles ──────────────────────────────────────────────────────────
const TECH_STACK = [
  { label: "Unity", note: "основной движок" },
  { label: "C# / .NET", note: "разработка" },
  { label: "OpenXR", note: "VR/AR платформа" },
  { label: "ARCore / ARKit", note: "мобильный AR" },
  { label: "HLSL / Shader Graph", note: "шейдеры" },
  { label: "Git / GitHub", note: "контроль версий" },
  { label: "Python", note: "автоматизация" },
  { label: "QA методологии", note: "тестирование" },
];

// ─── About data — static (editable directly in this file or via JSON) ─────────
const ABOUT = {
  bio1: "Unity / VR / AR разработчик с опытом в создании иммерсивных интерактивных опытов — от VR-тренажёров до AR-навигации.",
  bio2: "Специализируюсь на игровых механиках, пространственных интерфейсах и оптимизации производительности GPU. Пишу на C# и .NET, использую Python для автоматизации.",
  bio3: "Выпускник ОКЭИ (2025). Умею видеть продукт целиком: от игровой архитектуры до QA-методологии.",
};

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const projects = getAllProjects();
  const [selectedProject, setSelectedProject] = useState<StaticProject | null>(null);
  const [navVisible, setNavVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const featuredProjects = projects.filter((p) => p.featured);
  const regularProjects = projects.filter((p) => !p.featured);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setNavVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div style={{ background: "var(--color-bg)", color: "var(--color-text)", minHeight: "100vh", position: "relative" }}>
      <CursorGlow />
      <AnimatedBackground />

      {/* ── Sticky Nav ──────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: navVisible ? "rgba(13,13,15,0.92)" : "transparent",
          backdropFilter: navVisible ? "blur(16px)" : "none",
          borderBottom: navVisible ? "1px solid var(--color-border)" : "none",
        }}
      >
        <div className="container flex items-center justify-between" style={{ paddingBlock: "var(--space-4)" }}>
          <button onClick={() => scrollTo("hero")} style={{ color: "var(--color-primary)" }} aria-label="На главную">
            <Logo />
          </button>
          <div className="hidden md:flex items-center gap-8">
            {[["about", "Обо мне"], ["projects", "Проекты"], ["contact", "Контакты"]].map(([id, label]) => (
              <button key={id} className="nav-link" onClick={() => scrollTo(id)} data-testid={`nav-${id}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={() => scrollTo("contact")} style={{ fontSize: "var(--text-xs)" }}>
              Связаться
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        id="hero"
        ref={heroRef}
        className="relative flex items-center"
        style={{ minHeight: "100dvh", overflow: "hidden" }}
      >
        {/* Vertical accent lines */}
        <div aria-hidden="true" style={{
          position: "absolute", top: 0, right: "28%", width: "1px", height: "100%",
          background: "linear-gradient(to bottom, transparent, rgba(232,168,56,0.12) 30%, rgba(232,168,56,0.08) 70%, transparent)",
        }} />
        <div aria-hidden="true" style={{
          position: "absolute", top: 0, right: "55%", width: "1px", height: "100%",
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.03) 40%, transparent)",
        }} />

        <div className="container relative z-10">
          <div className="max-w-5xl">
            <div className="hero-enter hero-enter-1 flex items-center gap-3 mb-8">
              <div style={{ width: "40px", height: "1px", background: "var(--color-primary)" }} />
              <span style={{
                fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.15em",
                textTransform: "uppercase", color: "var(--color-primary)",
              }}>
                Unity · VR · AR · .NET
              </span>
            </div>

            <h1
              className="hero-enter hero-enter-2 font-display font-bold"
              style={{
                fontSize: "var(--text-hero)", lineHeight: 0.95,
                letterSpacing: "-0.03em", color: "var(--color-text)",
                marginBottom: "var(--space-6)",
              }}
            >
              Никита<br />
              <span style={{ color: "var(--color-primary)" }} className="text-glow">Курлаев</span>
            </h1>

            <p
              className="hero-enter hero-enter-3"
              style={{
                fontSize: "var(--text-xl)", color: "var(--color-text-muted)",
                fontFamily: "var(--font-body)", fontWeight: 300,
                maxWidth: "560px", lineHeight: 1.4, marginBottom: "var(--space-10)",
              }}
            >
              Разрабатываю иммерсивные опыты и игровые системы,
              которые ощущаются живыми.
            </p>

            <div className="hero-enter hero-enter-4 flex flex-wrap gap-4">
              <button className="btn-primary" onClick={() => scrollTo("projects")}>
                <span>Посмотреть работы</span><span>↓</span>
              </button>
              <a
                href="https://github.com/Vinishk0"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "var(--color-text-faint)", fontSize: "var(--text-xs)" }}
          aria-hidden="true"
        >
          <div style={{
            width: "1px", height: "48px",
            background: "linear-gradient(to bottom, var(--color-primary), transparent)",
            animation: "pulse-line 2s ease-in-out infinite",
          }} />
        </div>
        <style>{`@keyframes pulse-line { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
      </section>

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section
        id="about"
        className="section-padding"
        style={{ position: "relative", zIndex: 1 }}
        aria-labelledby="about-heading"
      >
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--color-primary)",
            }}>Обо мне</span>
          </div>
          <hr className="hr-amber mb-12 reveal" />

          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div className="flex flex-col gap-6">
              <div>
                <h2
                  id="about-heading"
                  className="reveal font-display font-bold mb-6"
                  style={{ fontSize: "var(--text-2xl)", lineHeight: 1.1 }}
                >
                  Я строю миры<br />
                  <span style={{ color: "var(--color-primary)" }}>из кода</span>
                </h2>
                <div
                  className="reveal space-y-4"
                  style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)" }}
                >
                  <p>{ABOUT.bio1}</p>
                  <p>{ABOUT.bio2}</p>
                  <p>{ABOUT.bio3}</p>
                </div>
              </div>
            </div>

            <div>
              <h3
                className="reveal font-display font-semibold mb-6"
                style={{ fontSize: "var(--text-lg)", color: "var(--color-text-muted)" }}
              >
                Стек
              </h3>
              <ul className="reveal grid grid-cols-2 gap-3" role="list">
                {TECH_STACK.map((tech) => (
                  <li
                    key={tech.label}
                    style={{
                      padding: "var(--space-4)", background: "var(--color-surface)",
                      border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: "2px" }}>
                      {tech.label}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)" }}>
                      {tech.note}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ────────────────────────────────────────────────────── */}
      <section
        id="projects"
        className="section-padding"
        style={{ position: "relative", zIndex: 1 }}
        aria-labelledby="projects-heading"
      >
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--color-primary)",
            }}>Проекты</span>
          </div>
          <hr className="hr-amber mb-4 reveal" />

          <div className="reveal flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2
              id="projects-heading"
              className="font-display font-bold"
              style={{ fontSize: "var(--text-2xl)", lineHeight: 1.1 }}
            >
              Избранные работы
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", maxWidth: "360px" }}>
              Каждый проект — решённая задача с конкретным результатом
            </p>
          </div>

          {projects.length === 0 ? (
            <div
              className="flex items-center justify-center"
              style={{
                height: "320px", background: "var(--color-surface)",
                borderRadius: "var(--radius-lg)", border: "1px dashed var(--color-border)",
              }}
            >
              <div className="text-center">
                <div style={{ fontSize: "var(--text-xl)", marginBottom: "var(--space-3)", color: "var(--color-primary)" }}>⬡</div>
                <p style={{ color: "var(--color-text-muted)" }}>Проекты скоро появятся</p>
              </div>
            </div>
          ) : (
            <>
              {featuredProjects.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {featuredProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} featured onClick={() => setSelectedProject(p)} />
                  ))}
                </div>
              )}
              {regularProjects.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {regularProjects.map((p) => (
                    <ProjectCard key={p.id} project={p} onClick={() => setSelectedProject(p)} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section
        id="contact"
        className="section-padding"
        style={{ position: "relative", zIndex: 1 }}
        aria-labelledby="contact-heading"
      >
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{
              fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "0.12em",
              textTransform: "uppercase", color: "var(--color-primary)",
            }}>Контакты</span>
          </div>
          <hr className="hr-amber mb-10 reveal" />

          <div className="reveal flex flex-col items-start gap-6">
            <h2
              id="contact-heading"
              className="font-display font-bold"
              style={{ fontSize: "var(--text-2xl)", lineHeight: 1.1 }}
            >
              Открыт к новым<br />
              <span style={{ color: "var(--color-primary)" }}>возможностям</span>
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-base)", maxWidth: "440px" }}>
              Ищу позицию Unity / VR / AR разработчика. Готов к фулл-тайму или проектному сотрудничеству.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:kurlaevnikita82@gmail.com" className="btn-primary"
                target="_blank" rel="noopener noreferrer" data-testid="contact-email">
                ✉ Email
              </a>
              <a href="https://t.me/Vinishk000" className="btn-ghost"
                target="_blank" rel="noopener noreferrer" data-testid="contact-tg">
                Telegram
              </a>
              <a href="https://vk.com/vinishk0o0" className="btn-ghost"
                target="_blank" rel="noopener noreferrer" data-testid="contact-vk">
                VK
              </a>
              <a href="https://github.com/Vinishk0" className="btn-ghost"
                target="_blank" rel="noopener noreferrer" data-testid="contact-github">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--color-border)",
        padding: "var(--space-8) 0",
        position: "relative", zIndex: 1,
      }}>
        <div
          className="container flex flex-wrap items-center justify-between gap-4"
          style={{ color: "var(--color-text-faint)", fontSize: "var(--text-xs)" }}
        >
          <div className="flex items-center gap-3">
            <Logo />
            <span>Никита Курлаев · Unity / VR / AR Developer</span>
          </div>
          <span>Оренбург, 2026</span>
        </div>
      </footer>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}
