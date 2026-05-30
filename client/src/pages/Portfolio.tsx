import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import type { StaticProject } from "@/lib/projects";
import { getAllProjects, projectAssetUrl } from "@/lib/projects";
import ProjectModal from "@/components/ProjectModal";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SiteConfig {
  features: Record<string, boolean>;
  hero: { typingWords: string[]; typingSpeed: number; typingPause: number };
  cv: { filename: string };
  openGraph: { title: string; description: string; image: string };
}
interface AboutData {
  bio1: string; bio2: string; bio3: string;
  photos: string[];
  facts: { icon: string; label: string; value: string }[];
  timeline: { year: string; title: string; description: string; type: "education"|"work"|"project" }[];
  hobbies: { icon: string; title: string; description: string }[];
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────
function useSiteConfig() {
  const [cfg, setCfg] = useState<SiteConfig>({
    features: { customCursor:true, scrollProgress:true, noiseTexture:true, parallaxHero:true,
      typingEffect:true, cardHoverZoom:true, cardEnterAnimation:true, cursorGlow:true,
      floatingOrbs:true, gridBackground:true, hero3D:true,
      timeline:true, hobbiesAccordion:true, downloadCV:true },
    hero: { typingWords:["Unity Developer","VR Developer","AR Developer",".NET Developer"], typingSpeed:80, typingPause:2000 },
    cv: { filename:"Kurlaev_CV.pdf" },
    openGraph: { title:"", description:"", image:"" },
  });
  useEffect(() => {
    fetch("/site.config.json").then(r=>r.json()).then(setCfg).catch(()=>{});
  }, []);
  return cfg;
}

function useAboutData() {
  const [data, setData] = useState<AboutData>({
    bio1:"", bio2:"", bio3:"", photos:[],
    facts:[], timeline:[], hobbies:[],
  });
  useEffect(() => {
    fetch("/about/about.json").then(r=>r.json()).then(setData).catch(()=>{});
  }, []);
  return data;
}

// ─── Logo ──────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg aria-label="Никита Курлаев" viewBox="0 0 40 40" fill="none" className="w-9 h-9">
      <path d="M20 4 L34 30 H6 Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M13 22 L27 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="20" cy="4" r="2" fill="currentColor"/>
    </svg>
  );
}

// ─── Custom Cursor ─────────────────────────────────────────────────────────────
function CustomCursor({ enabled }: { enabled: boolean }) {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ tx:0, ty:0, cx:0, cy:0 });
  const raf = useRef(0);
  const hovered = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    document.body.style.cursor = "none";

    const onMove = (e: MouseEvent) => {
      pos.current.tx = e.clientX;
      pos.current.ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top  = `${e.clientY}px`;
      }
    };
    const onEnter = () => { hovered.current = true; };
    const onLeave = () => { hovered.current = false; };

    const tick = () => {
      const p = pos.current;
      p.cx += (p.tx - p.cx) * 0.12;
      p.cy += (p.ty - p.cy) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.left = `${p.cx}px`;
        ringRef.current.style.top  = `${p.cy}px`;
        const s = hovered.current ? "2.5" : "1";
        ringRef.current.style.transform = `translate(-50%,-50%) scale(${s})`;
        ringRef.current.style.opacity = hovered.current ? "0.4" : "1";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive:true });
    document.querySelectorAll("a,button,[role=button]").forEach(el => {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    });
    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <>
      <div ref={dotRef} style={{
        position:"fixed", width:"6px", height:"6px", borderRadius:"50%",
        background:"var(--color-primary)", pointerEvents:"none", zIndex:9999,
        transform:"translate(-50%,-50%)", transition:"transform 0.1s",
        left:"-100px", top:"-100px",
      }}/>
      <div ref={ringRef} style={{
        position:"fixed", width:"32px", height:"32px", borderRadius:"50%",
        border:"1.5px solid var(--color-primary)", pointerEvents:"none", zIndex:9998,
        transform:"translate(-50%,-50%)", transition:"transform 0.25s cubic-bezier(.16,1,.3,1), opacity 0.25s",
        left:"-100px", top:"-100px",
      }}/>
    </>
  );
}

// ─── Scroll Progress ───────────────────────────────────────────────────────────
function ScrollProgress({ enabled }: { enabled: boolean }) {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const onScroll = () => {
      const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      if (barRef.current) barRef.current.style.width = `${Math.min(pct, 100)}%`;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, height:"2px", zIndex:100, background:"rgba(255,255,255,0.06)" }}>
      <div ref={barRef} style={{
        height:"100%", width:"0%",
        background:"linear-gradient(90deg, var(--color-primary), #f5d06e)",
        transition:"width 0.1s linear",
        boxShadow:"0 0 8px rgba(232,168,56,0.6)",
      }}/>
    </div>
  );
}

// ─── Cursor Glow ───────────────────────────────────────────────────────────────
function CursorGlow({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ tx:-9999, ty:-9999, cx:-9999, cy:-9999 });
  const rafId = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => { pos.current.tx = e.clientX; pos.current.ty = e.clientY; };
    window.addEventListener("mousemove", onMove, { passive:true });
    const tick = () => {
      const p = pos.current;
      p.cx += (p.tx - p.cx) * 0.08; p.cy += (p.ty - p.cy) * 0.08;
      if (ref.current) { ref.current.style.left=`${p.cx-300}px`; ref.current.style.top=`${p.cy-300}px`; }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId.current); };
  }, [enabled]);
  if (!enabled) return null;
  return (
    <div ref={ref} aria-hidden="true" style={{
      position:"fixed", width:"600px", height:"600px", borderRadius:"50%",
      background:"radial-gradient(circle, rgba(232,168,56,0.10) 0%, rgba(232,168,56,0.04) 40%, transparent 70%)",
      pointerEvents:"none", zIndex:1, mixBlendMode:"screen", left:"-9999px", top:"-9999px",
    }}/>
  );
}

// ─── Noise Texture ─────────────────────────────────────────────────────────────
function NoiseTexture({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <div aria-hidden="true" style={{
      position:"fixed", inset:0, pointerEvents:"none", zIndex:2, opacity:0.035,
      backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat:"repeat", backgroundSize:"256px 256px",
    }}/>
  );
}

// ─── Animated Background ───────────────────────────────────────────────────────
function AnimatedBackground({ showOrbs, showGrid }: { showOrbs: boolean; showGrid: boolean }) {
  return (
    <div aria-hidden="true" style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {showGrid && (
        <div style={{
          position:"absolute", inset:0,
          backgroundImage:"linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize:"80px 80px",
        }}/>
      )}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"100vh",
        background:"linear-gradient(to bottom, var(--color-bg) 0%, var(--color-bg) 55%, transparent 100%)" }}/>
      {showOrbs && (<>
        <div style={{ position:"absolute", top:"5%", left:"60%", width:"500px", height:"500px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(232,168,56,0.07) 0%, transparent 70%)",
          animation:"orb1 22s ease-in-out infinite", filter:"blur(8px)" }}/>
        <div style={{ position:"absolute", top:"35%", left:"-5%", width:"420px", height:"420px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(91,143,185,0.06) 0%, transparent 70%)",
          animation:"orb2 28s ease-in-out infinite", filter:"blur(8px)" }}/>
        <div style={{ position:"absolute", top:"70%", left:"65%", width:"350px", height:"350px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(232,168,56,0.05) 0%, transparent 70%)",
          animation:"orb3 32s ease-in-out infinite", filter:"blur(6px)" }}/>
        <div style={{ position:"absolute", top:"75%", left:"10%", width:"280px", height:"280px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(91,143,185,0.05) 0%, transparent 70%)",
          animation:"orb4 25s ease-in-out infinite", filter:"blur(6px)" }}/>
        <div style={{ position:"absolute", top:"50%", left:"45%", width:"200px", height:"200px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(232,168,56,0.04) 0%, transparent 70%)",
          animation:"orb5 18s ease-in-out infinite", filter:"blur(4px)" }}/>
        <div style={{ position:"absolute", top:"15%", left:"20%", width:"250px", height:"250px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(91,143,185,0.04) 0%, transparent 70%)",
          animation:"orb6 35s ease-in-out infinite", filter:"blur(5px)" }}/>
      </>)}
      <style>{`
        @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(-60px,50px) scale(1.1)}66%{transform:translate(40px,-30px) scale(0.93)}}
        @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(80px,-60px) scale(1.12)}70%{transform:translate(-30px,40px) scale(0.9)}}
        @keyframes orb3{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,-70px) scale(1.15)}}
        @keyframes orb4{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(60px,-40px) scale(1.08)}70%{transform:translate(-20px,50px) scale(0.95)}}
        @keyframes orb5{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,30px) scale(1.2)}}
        @keyframes orb6{0%,100%{transform:translate(0,0) scale(1)}30%{transform:translate(50px,60px) scale(1.05)}60%{transform:translate(-60px,-20px) scale(0.92)}}
      `}</style>
    </div>
  );
}

// ─── Three.js Hero Scene ───────────────────────────────────────────────────────
function HeroScene({ enabled }: { enabled: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled || !mountRef.current) return;
    const el = mountRef.current;
    const w = el.clientWidth, h = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100);
    camera.position.set(0, 0, 5);

    const geo = new THREE.IcosahedronGeometry(1.3, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xe8a838, wireframe: true, opacity: 0.35, transparent: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);

    const geo2 = new THREE.OctahedronGeometry(0.85, 2);
    const mat2 = new THREE.MeshStandardMaterial({
      color: 0x5b8fb9, wireframe: true, opacity: 0.2, transparent: true,
    });
    const mesh2 = new THREE.Mesh(geo2, mat2);
    scene.add(mesh2);

    const particleCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i*3]   = (Math.random()-0.5)*8;
      positions[i*3+1] = (Math.random()-0.5)*8;
      positions[i*3+2] = (Math.random()-0.5)*8;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({ color:0xe8a838, size:0.025, transparent:true, opacity:0.5 });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dLight = new THREE.DirectionalLight(0xe8a838, 1.5);
    dLight.position.set(3, 3, 3);
    scene.add(dLight);
    const pLight = new THREE.PointLight(0x5b8fb9, 1, 10);
    pLight.position.set(-3, -2, 2);
    scene.add(pLight);

    const mouse = { x:0, y:0 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse, { passive:true });

    let animId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      mesh.rotation.x  = t * 0.18 + mouse.y * 0.3;
      mesh.rotation.y  = t * 0.22 + mouse.x * 0.3;
      mesh2.rotation.x = -t * 0.12 + mouse.y * 0.2;
      mesh2.rotation.y = t * 0.15  - mouse.x * 0.2;
      particles.rotation.y = t * 0.04;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth, nh = el.clientHeight;
      camera.aspect = nw/nh; camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div ref={mountRef} style={{
      position:"absolute", right:0, top:0, bottom:0, width:"50%",
      pointerEvents:"none", zIndex:0, opacity:0.85,
    }}/>
  );
}

// ─── Typing Effect ─────────────────────────────────────────────────────────────
function TypingText({ words, speed, pause, enabled }: { words:string[]; speed:number; pause:number; enabled:boolean }) {
  const [display, setDisplay] = useState("");
  const [wIdx, setWIdx]       = useState(0);
  const [cIdx, setCIdx]       = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || words.length === 0) { setDisplay(words[0] ?? ""); return; }
    const word = words[wIdx];
    if (!deleting && cIdx < word.length) {
      const t = setTimeout(() => { setDisplay(word.slice(0, cIdx+1)); setCIdx(c=>c+1); }, speed);
      return () => clearTimeout(t);
    }
    if (!deleting && cIdx === word.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && cIdx > 0) {
      const t = setTimeout(() => { setDisplay(word.slice(0, cIdx-1)); setCIdx(c=>c-1); }, speed/2);
      return () => clearTimeout(t);
    }
    if (deleting && cIdx === 0) {
      setDeleting(false); setWIdx(i => (i+1) % words.length);
    }
  }, [cIdx, deleting, wIdx, words, speed, pause, enabled]);

  return (
    <span style={{ color:"var(--color-primary)" }}>
      {display}<span style={{ borderRight:"2px solid var(--color-primary)", animation:"blink 1s step-end infinite", marginLeft:"2px" }}/>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </span>
  );
}

// ─── Timeline Slider ───────────────────────────────────────────────────────────
// Горизонтальный слайдер — любое количество пунктов из JSON, прокручивается отдельно
const TYPE_COLORS: Record<string, string> = {
  education:"var(--color-primary)", work:"var(--color-secondary)", project:"rgba(255,255,255,0.4)"
};
const TYPE_LABELS: Record<string, string> = {
  education:"Образование", work:"Работа", project:"Проект"
};

function TimelineSlider({ items, enabled }: { items: AboutData["timeline"]; enabled: boolean }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (!enabled || items.length === 0) return null;

  const goTo = (i: number) => {
    setActive(i);
  };

  const prev = () => setActive(a => Math.max(0, a - 1));
  const next = () => setActive(a => Math.min(items.length - 1, a + 1));

  return (
    <div className="reveal">
      {/* Track — горизонтальная лента карточек */}
      <div style={{ position:"relative", overflow:"hidden" }}>
        <div
          ref={trackRef}
          style={{
            display:"flex",
            gap:"var(--space-4)",
            transition:"transform 0.55s cubic-bezier(0.16,1,0.3,1)",
            transform:`translateX(calc(-${active} * (100% + var(--space-4))))`,
          }}
        >
          {items.map((item, i) => {
            const color = TYPE_COLORS[item.type] ?? "var(--color-primary)";
            const isActive = i === active;
            return (
              <div
                key={i}
                style={{
                  minWidth:"100%",
                  padding:"var(--space-6)",
                  background: isActive
                    ? "linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%)"
                    : "var(--color-surface)",
                  border:`1px solid ${isActive ? color : "var(--color-border)"}`,
                  borderRadius:"var(--radius-lg)",
                  transition:"border-color 0.4s, background 0.4s",
                  boxShadow: isActive ? `0 0 24px ${color}22` : "none",
                }}
              >
                {/* Тип + год */}
                <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)", marginBottom:"var(--space-4)" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    padding:"2px 10px", borderRadius:"var(--radius-full)",
                    background:`${color}22`, border:`1px solid ${color}55`,
                    fontSize:"10px", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
                    color,
                  }}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </span>
                  <span style={{
                    fontSize:"var(--text-xs)", color:"var(--color-text-faint)",
                    fontFamily:"var(--font-mono, monospace)", fontWeight:600,
                    letterSpacing:"0.06em",
                  }}>
                    {item.year}
                  </span>
                </div>

                {/* Заголовок */}
                <div style={{
                  fontSize:"var(--text-lg)", fontWeight:700,
                  fontFamily:"var(--font-display)", color:"var(--color-text)",
                  marginBottom:"var(--space-3)", lineHeight:1.2,
                }}>
                  {item.title}
                </div>

                {/* Описание */}
                <div style={{
                  fontSize:"var(--text-sm)", color:"var(--color-text-muted)",
                  lineHeight:1.7,
                }}>
                  {item.description}
                </div>

                {/* Цветной accent-bar снизу */}
                <div style={{
                  marginTop:"var(--space-5)", height:"2px", borderRadius:"1px",
                  background:`linear-gradient(90deg, ${color}, transparent)`,
                  opacity: isActive ? 1 : 0,
                  transition:"opacity 0.4s",
                }}/>
              </div>
            );
          })}
        </div>
      </div>

      {/* Навигация: точки + стрелки */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginTop:"var(--space-4)", gap:"var(--space-3)",
      }}>
        <button
          onClick={prev}
          disabled={active === 0}
          style={{
            width:"32px", height:"32px", borderRadius:"50%",
            border:"1px solid var(--color-border)", background:"none",
            color: active === 0 ? "var(--color-text-faint)" : "var(--color-primary)",
            cursor: active === 0 ? "default" : "pointer",
            fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}
          aria-label="Предыдущий"
        >‹</button>

        {/* Точки */}
        <div style={{ display:"flex", gap:"6px", flex:1, justifyContent:"center", flexWrap:"wrap" }}>
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? "20px" : "6px",
                height:"6px", borderRadius:"3px",
                background: i === active ? "var(--color-primary)" : "var(--color-border)",
                border:"none", cursor:"pointer", padding:0,
                transition:"all 0.35s cubic-bezier(0.16,1,0.3,1)",
              }}
              aria-label={`Пункт ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={active === items.length - 1}
          style={{
            width:"32px", height:"32px", borderRadius:"50%",
            border:"1px solid var(--color-border)", background:"none",
            color: active === items.length - 1 ? "var(--color-text-faint)" : "var(--color-primary)",
            cursor: active === items.length - 1 ? "default" : "pointer",
            fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}
          aria-label="Следующий"
        >›</button>
      </div>

      {/* Счётчик */}
      <div style={{
        textAlign:"center", marginTop:"var(--space-2)",
        fontSize:"10px", color:"var(--color-text-faint)",
        letterSpacing:"0.08em", fontFamily:"var(--font-mono, monospace)",
      }}>
        {String(active + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
      </div>
    </div>
  );
}

// ─── Facts counter ─────────────────────────────────────────────────────────────
function FactsRow({ facts }: { facts: AboutData["facts"] }) {
  if (facts.length === 0) return null;
  return (
    <div className="reveal grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
      {facts.map((f,i) => (
        <div key={i} style={{
          padding:"var(--space-4)", background:"var(--color-surface)",
          border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
          textAlign:"center",
        }}>
          <div style={{ fontSize:"1.4rem", marginBottom:"4px" }}>{f.icon}</div>
          <div className="font-display font-bold" style={{ fontSize:"var(--text-xl)", color:"var(--color-primary)", lineHeight:1 }}>
            {f.value}
          </div>
          <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", marginTop:"2px" }}>{f.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── About Visual — constellation, адаптивный, под «Не только код» ─────────────
function AboutVisual() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas  = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let rafId = 0;
    let t = 0;

    interface Node { x: number; y: number; vx: number; vy: number; r: number }
    let nodes: Node[] = [];
    const LINK_DIST = 130;

    const init = (w: number, h: number) => {
      W = w; H = h;
      canvas.width  = W;
      canvas.height = H;
      const count = Math.round(30 + (W / 400) * 18); // больше узлов на широком экране
      nodes = Array.from({ length: count }, () => ({
        x:  20 + Math.random() * (W - 40),
        y:  20 + Math.random() * (H - 40),
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r:  1.5 + Math.random() * 2,
      }));
    };

    const draw = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      // Лёгкий фоновый градиент по центру
      const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.min(W, H) * 0.5);
      grad.addColorStop(0, "rgba(232,168,56,0.05)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Двигаем узлы
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 10 || n.x > W - 10) n.vx *= -1;
        if (n.y < 10 || n.y > H - 10) n.vy *= -1;
      }

      // Линии
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK_DIST) {
            const alpha = (1 - d / LINK_DIST) * 0.22;
            ctx.strokeStyle = `rgba(232,168,56,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Точки
      for (const n of nodes) {
        const pulse = Math.sin(t * 0.04 + n.x * 0.05) * 0.3 + 0.7;
        ctx.shadowColor = "#e8a838";
        ctx.shadowBlur  = 7;
        ctx.fillStyle   = `rgba(232,168,56,${0.65 * pulse})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Пульсирующий акцент по центру
      const pr = 20 + Math.sin(t * 0.05) * 5;
      const cg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, pr);
      cg.addColorStop(0, "rgba(232,168,56,0.28)");
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(W/2, H/2, pr, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = "#e8a838";
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = "#e8a838";
      ctx.beginPath();
      ctx.arc(W/2, H/2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      rafId = requestAnimationFrame(draw);
    };

    // ResizeObserver — реагирует на реальный размер колонки
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        cancelAnimationFrame(rafId);
        init(Math.round(width), Math.round(height));
        rafId = requestAnimationFrame(draw);
      }
    });
    ro.observe(wrapper);

    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, []);

  // Орбитальные кольца — центрированы через flex
  const ringSize = "min(260px, 90%)";
  return (
    <div className="reveal" style={{ position:"relative", width:"100%" }}>
      {/* Canvas на всю ширину */}
      <div
        ref={wrapperRef}
        style={{
          position:"relative", width:"100%", height:"180px",
          overflow:"hidden",
          background:"radial-gradient(ellipse at center, rgba(232,168,56,0.04) 0%, transparent 70%)",
          borderRadius:"var(--radius-lg)",
          border:"1px solid var(--color-border)",
        }}
      >
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}/>

        {/* Кольца по центру поверх canvas */}
        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
        }}>
          <div style={{
            position:"absolute",
            width:ringSize, height:ringSize,
            borderRadius:"50%",
            border:"1px solid rgba(232,168,56,0.16)",
            animation:"spin-slow 20s linear infinite",
          }}/>
          <div style={{
            position:"absolute",
            width:`calc(${ringSize} - 32px)`, height:`calc(${ringSize} - 32px)`,
            borderRadius:"50%",
            border:"1px dashed rgba(91,143,185,0.13)",
            animation:"spin-slow 30s linear infinite reverse",
          }}/>
        </div>
      </div>
      <style>{`
        @keyframes spin-slow { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── Hobbies Accordion ─────────────────────────────────────────────────────────
function HobbiesAccordion({ hobbies, enabled }: { hobbies: AboutData["hobbies"]; enabled: boolean }) {
  const [open, setOpen] = useState<number|null>(null);
  const [expanded, setExpanded] = useState(false);
  if (!enabled || hobbies.length === 0) return null;
  return (
    <div className="reveal">
      <button
        onClick={() => setExpanded(e=>!e)}
        style={{
          display:"flex", alignItems:"center", gap:"var(--space-3)",
          color:"var(--color-text-muted)", fontSize:"var(--text-sm)", fontWeight:600,
          background:"none", border:"none", cursor:"pointer", padding:"var(--space-3) 0",
          letterSpacing:"0.04em",
        }}
      >
        <span style={{
          display:"inline-flex", width:"20px", height:"20px", alignItems:"center",
          justifyContent:"center", borderRadius:"4px", border:"1px solid var(--color-border)",
          fontSize:"10px", transition:"transform 0.3s",
          transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
          color:"var(--color-primary)",
        }}>+</span>
        Не только код
      </button>

      <div style={{
        overflow:"hidden",
        maxHeight: expanded ? "800px" : "0",
        transition:"max-height 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ paddingTop:"var(--space-3)", display:"flex", flexDirection:"column", gap:"var(--space-2)" }}>
          {hobbies.map((h,i) => (
            <div key={i} style={{
              border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
              background:"var(--color-surface)", overflow:"hidden",
            }}>
              <button
                onClick={() => setOpen(open===i ? null : i)}
                style={{
                  width:"100%", display:"flex", alignItems:"center", gap:"var(--space-3)",
                  padding:"var(--space-3) var(--space-4)", background:"none", border:"none",
                  cursor:"pointer", textAlign:"left",
                }}
              >
                <span style={{ fontSize:"1.2rem" }}>{h.icon}</span>
                <span style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--color-text)", flex:1 }}>{h.title}</span>
                <span style={{
                  color:"var(--color-primary)", fontSize:"var(--text-xs)", fontWeight:700,
                  transition:"transform 0.3s", display:"inline-block",
                  transform: open===i ? "rotate(180deg)" : "rotate(0deg)",
                }}>▾</span>
              </button>
              <div style={{
                maxHeight: open===i ? "200px" : "0",
                overflow:"hidden",
                transition:"max-height 0.35s cubic-bezier(0.16,1,0.3,1)",
              }}>
                <p style={{
                  padding:"0 var(--space-4) var(--space-4)",
                  fontSize:"var(--text-xs)", color:"var(--color-text-muted)", lineHeight:1.65,
                }}>{h.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ──────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string,string> = {
  unity:"Unity", vr:"VR", ar:"AR", dotnet:".NET", other:"Other",
};

function ProjectCard({ project, featured, onClick, hoverZoom }: {
  project:StaticProject; featured?:boolean; onClick:()=>void; hoverZoom:boolean;
}) {
  const catLabel = CATEGORY_LABELS[project.category] ?? project.category;
  const coverSrc = project.cover ? projectAssetUrl(project.id, project.cover) : null;
  const hasMedia = !!coverSrc || !!project.youtubeUrl;
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="project-card reveal"
      onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e)=>e.key==="Enter"&&onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={`project-card-${project.id}`}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: featured ? "16/8" : "16/9" }}>
        {coverSrc ? (
          <img src={coverSrc} alt={project.title} className="w-full h-full"
            style={{ objectFit:"cover", transition:"transform 0.6s cubic-bezier(0.16,1,0.3,1)",
              transform: hoverZoom && hovered ? "scale(1.07)" : "scale(1)" }}
            loading="lazy"/>
        ) : project.youtubeUrl ? (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background:"var(--color-surface-offset)" }}>
            <div className="text-center">
              <div className="text-4xl mb-2" style={{ color:"var(--color-primary)" }}>▶</div>
              <p className="text-sm" style={{ color:"var(--color-text-muted)" }}>Смотреть видео</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative grid-bg flex items-end"
            style={{ background:"var(--color-surface-2)" }}>
            <div className="p-6 w-full">
              <span className="font-display font-bold select-none" aria-hidden="true" style={{
                fontSize:"clamp(2.5rem,5vw,5rem)", color:"rgba(255,255,255,0.04)",
                lineHeight:1, letterSpacing:"-0.04em", display:"block",
              }}>{project.title.split(" ")[0]}</span>
            </div>
            <div className="absolute top-4 left-4"><span className="tag tag-primary">{catLabel}</span></div>
          </div>
        )}
        {hasMedia && (
          <>
            <div className="absolute inset-0"
              style={{ background:"linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 55%)" }}/>
            <div className="absolute top-4 left-4"><span className="tag tag-primary">{catLabel}</span></div>
          </>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display font-semibold mb-2" style={{ fontSize:"var(--text-lg)", lineHeight:1.2 }}>
          {project.title}
        </h3>
        <p style={{ fontSize:"var(--text-sm)", color:"var(--color-text-muted)", lineHeight:1.6 }} className="mb-4">
          {project.shortDescription}
        </p>
        <div className="flex items-center gap-2 mb-4">
          <span style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)", letterSpacing:"0.06em", textTransform:"uppercase" }}>Роль</span>
          <span style={{ fontSize:"var(--text-xs)", color:"var(--color-primary)", fontWeight:500 }}>{project.role}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {project.stack.slice(0,4).map(t=><span key={t} className="tag">{t}</span>)}
          {project.stack.length>4&&<span className="tag" style={{ color:"var(--color-text-faint)" }}>+{project.stack.length-4}</span>}
        </div>
        <div className="mt-4 flex items-center gap-1.5" style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>
          <span style={{ color:"var(--color-primary)", opacity:0.7 }}>→</span> Подробнее о проекте
        </div>
      </div>
    </article>
  );
}

const TECH_STACK = [
  { label:"Unity", note:"основной движок" }, { label:"C# / .NET", note:"разработка" },
  { label:"OpenXR", note:"VR/AR платформа" }, { label:"ARCore / ARKit", note:"мобильный AR" },
  { label:"HLSL / Shader Graph", note:"шейдеры" }, { label:"Git / GitHub", note:"контроль версий" },
  { label:"Python", note:"автоматизация" }, { label:"QA методологии", note:"тестирование" },
];

// ─── About Carousel (фото) ────────────────────────────────────────────────────
function AboutCarousel({ photos }: { photos:string[] }) {
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    if(photos.length<=1)return;
    const t=setInterval(()=>setIdx(i=>(i+1)%photos.length),5000);
    return()=>clearInterval(t);
  },[photos.length]);
  if(photos.length===0)return null;
  const prev=()=>setIdx(i=>(i-1+photos.length)%photos.length);
  const next=()=>setIdx(i=>(i+1)%photos.length);
  return (
    <div className="reveal" style={{ position:"relative", width:"100%" }}>
      <div style={{ width:"100%", height:"260px", borderRadius:"var(--radius-lg)", overflow:"hidden",
        border:"1px solid var(--color-border)", position:"relative" }}>
        {photos.map((photo,i)=>(
          <img key={photo} src={`/about/${photo}`} alt={`Фото ${i+1}`} style={{
            position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
            opacity:i===idx?1:0,transition:"opacity 0.6s ease",
          }}/>
        ))}
        {photos.length>1&&(
          <>
            <button onClick={prev} style={{ position:"absolute",left:0,top:0,bottom:0,width:"40%",background:"transparent",border:"none",cursor:"pointer",zIndex:2 }} aria-label="Назад"/>
            <button onClick={next} style={{ position:"absolute",right:0,top:0,bottom:0,width:"40%",background:"transparent",border:"none",cursor:"pointer",zIndex:2 }} aria-label="Вперёд"/>
            <div style={{ position:"absolute",bottom:"8px",left:0,right:0,display:"flex",justifyContent:"center",gap:"5px",zIndex:3 }}>
              {photos.map((_,i)=>(
                <button key={i} onClick={()=>setIdx(i)} style={{
                  width:i===idx?"16px":"6px",height:"6px",borderRadius:"3px",
                  background:i===idx?"var(--color-primary)":"rgba(255,255,255,0.4)",
                  border:"none",cursor:"pointer",padding:0,transition:"all 0.3s ease",
                }} aria-label={`Фото ${i+1}`}/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const projects  = getAllProjects();
  const cfg       = useSiteConfig();
  const about     = useAboutData();
  const feat      = cfg.features;

  const [selectedProject, setSelectedProject] = useState<StaticProject|null>(null);
  const [navVisible, setNavVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const featuredProjects = projects.filter(p=>p.featured);
  const regularProjects  = projects.filter(p=>!p.featured);

  // Parallax
  const heroContentRef = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!feat.parallaxHero)return;
    const onScroll=()=>{
      if(heroContentRef.current) heroContentRef.current.style.transform=`translateY(${window.scrollY*0.18}px)`;
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return()=>window.removeEventListener("scroll",onScroll);
  },[feat.parallaxHero]);

  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>setNavVisible(!e.isIntersecting),{threshold:0.1});
    if(heroRef.current)obs.observe(heroRef.current);
    return()=>obs.disconnect();
  },[]);

  function scrollTo(id:string){ document.getElementById(id)?.scrollIntoView({behavior:"smooth"}); }

  return (
    <div style={{ background:"var(--color-bg)", color:"var(--color-text)", minHeight:"100vh", position:"relative" }}>
      <ScrollProgress enabled={feat.scrollProgress} />
      <CustomCursor   enabled={feat.customCursor} />
      <CursorGlow     enabled={feat.cursorGlow} />
      <NoiseTexture   enabled={feat.noiseTexture} />
      <AnimatedBackground showOrbs={feat.floatingOrbs} showGrid={feat.gridBackground} />

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{
        background:navVisible?"rgba(13,13,15,0.92)":"transparent",
        backdropFilter:navVisible?"blur(16px)":"none",
        borderBottom:navVisible?"1px solid var(--color-border)":"none",
      }}>
        <div className="container flex items-center justify-between" style={{ paddingBlock:"var(--space-4)" }}>
          <button onClick={()=>scrollTo("hero")} style={{ color:"var(--color-primary)" }} aria-label="На главную"><Logo/></button>
          <div className="hidden md:flex items-center gap-8">
            {[["about","Обо мне"],["projects","Проекты"],["contact","Контакты"]].map(([id,label])=>(
              <button key={id} className="nav-link" onClick={()=>scrollTo(id)}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {feat.downloadCV && (
              <a href={`/${cfg.cv.filename}`} download className="btn-ghost"
                style={{ fontSize:"var(--text-xs)" }}>↓ Скачать CV</a>
            )}
            <button className="btn-primary" onClick={()=>scrollTo("contact")} style={{ fontSize:"var(--text-xs)" }}>
              Связаться
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section id="hero" ref={heroRef} className="relative flex items-center"
        style={{ minHeight:"100dvh", overflow:"hidden" }}>
        <HeroScene enabled={feat.hero3D} />
        <div ref={heroContentRef} className="container relative z-10">
          <div className="max-w-2xl">
            <div className="hero-enter hero-enter-1 flex items-center gap-3 mb-8">
              <div style={{ width:"40px", height:"1px", background:"var(--color-primary)" }}/>
              <span style={{ fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--color-primary)" }}>
                Unity · VR · AR · .NET
              </span>
            </div>
            <h1 className="hero-enter hero-enter-2 font-display font-bold" style={{
              fontSize:"var(--text-hero)", lineHeight:0.95, letterSpacing:"-0.03em", marginBottom:"var(--space-4)",
            }}>
              Никита<br/>
              <span style={{ color:"var(--color-primary)" }} className="text-glow">Курлаев</span>
            </h1>
            <div className="hero-enter hero-enter-3 mb-8" style={{ fontSize:"var(--text-xl)", color:"var(--color-text-muted)", fontWeight:300, minHeight:"2rem" }}>
              <TypingText words={cfg.hero.typingWords} speed={cfg.hero.typingSpeed} pause={cfg.hero.typingPause} enabled={feat.typingEffect}/>
            </div>
            <div className="hero-enter hero-enter-4 flex flex-wrap gap-4">
              <button className="btn-primary" onClick={()=>scrollTo("projects")}>
                <span>Посмотреть работы</span><span>↓</span>
              </button>
              <a href="https://github.com/Vinishk0" target="_blank" rel="noopener noreferrer" className="btn-ghost">GitHub</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="section-padding" style={{ position:"relative", zIndex:1 }}>
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{ fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--color-primary)" }}>Обо мне</span>
          </div>
          <hr className="hr-amber mb-10 reveal"/>

          {/* Facts */}
          <FactsRow facts={about.facts}/>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left col */}
            <div className="flex flex-col gap-5">
              {/* Фото над заголовком — строго квадратное */}
              {about.photos.length > 0 && (
                <div className="reveal" style={{
                  width:"50%",
                  aspectRatio:"1 / 1",
                  borderRadius:"var(--radius-lg)",
                  overflow:"hidden",
                  border:"1px solid var(--color-border)",
                  position:"relative",
                }}>
                  {about.photos.map((photo, i) => (
                    <img
                      key={photo}
                      src={`/about/${photo}`}
                      alt="Фото"
                      style={{
                        position:"absolute", inset:0,
                        width:"100%", height:"100%",
                        objectFit:"cover",
                        objectPosition:"center top",
                      }}
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <div>
                <h2 className="reveal font-display font-bold mb-5" style={{ fontSize:"var(--text-2xl)", lineHeight:1.1 }}>
                  Я строю миры<br/><span style={{ color:"var(--color-primary)" }}>из кода</span>
                </h2>
                <div className="reveal space-y-3" style={{ color:"var(--color-text-muted)", fontSize:"var(--text-base)" }}>
                  <p>{about.bio1}</p><p>{about.bio2}</p><p>{about.bio3}</p>
                </div>
              </div>
              <HobbiesAccordion hobbies={about.hobbies} enabled={feat.hobbiesAccordion}/>
              {/* Созвездие — только если фото нет */}
              {about.photos.length === 0 && <AboutVisual />}
            </div>

            {/* Right col — Стек + Timeline */}
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="reveal font-display font-semibold mb-6"
                  style={{ fontSize:"var(--text-lg)", color:"var(--color-text-muted)" }}>Стек</h3>
                <ul className="reveal grid grid-cols-2 gap-3" role="list">
                  {TECH_STACK.map(tech=>(
                    <li key={tech.label} style={{ padding:"var(--space-4)", background:"var(--color-surface)",
                      border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)" }}>
                      <div style={{ fontSize:"var(--text-sm)", fontWeight:600, color:"var(--color-text)", marginBottom:"2px" }}>{tech.label}</div>
                      <div style={{ fontSize:"var(--text-xs)", color:"var(--color-text-faint)" }}>{tech.note}</div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="reveal font-display font-semibold mb-6"
                  style={{ fontSize:"var(--text-lg)", color:"var(--color-text-muted)" }}>Путь</h3>
                <TimelineSlider items={about.timeline} enabled={feat.timeline}/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section id="projects" className="section-padding" style={{ position:"relative", zIndex:1 }}>
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{ fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--color-primary)" }}>Проекты</span>
          </div>
          <hr className="hr-amber mb-4 reveal"/>
          <div className="reveal flex items-end justify-between mb-12 flex-wrap gap-4">
            <h2 className="font-display font-bold" style={{ fontSize:"var(--text-2xl)", lineHeight:1.1 }}>Избранные работы</h2>
            <p style={{ color:"var(--color-text-muted)", fontSize:"var(--text-sm)", maxWidth:"360px" }}>
              Каждый проект — решённая задача с конкретным результатом
            </p>
          </div>
          {projects.length===0 ? (
            <div className="flex items-center justify-center" style={{ height:"320px", background:"var(--color-surface)",
              borderRadius:"var(--radius-lg)", border:"1px dashed var(--color-border)" }}>
              <p style={{ color:"var(--color-text-muted)" }}>Проекты скоро появятся</p>
            </div>
          ) : (<>
            {featuredProjects.length>0&&(
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {featuredProjects.map(p=>(
                  <ProjectCard key={p.id} project={p} featured hoverZoom={feat.cardHoverZoom} onClick={()=>setSelectedProject(p)}/>
                ))}
              </div>
            )}
            {regularProjects.length>0&&(
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {regularProjects.map(p=>(
                  <ProjectCard key={p.id} project={p} hoverZoom={feat.cardHoverZoom} onClick={()=>setSelectedProject(p)}/>
                ))}
              </div>
            )}
          </>)}
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="section-padding" style={{ position:"relative", zIndex:1 }}>
        <div className="container">
          <div className="reveal mb-3 flex items-center gap-3">
            <span style={{ fontSize:"var(--text-xs)", fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--color-primary)" }}>Контакты</span>
          </div>
          <hr className="hr-amber mb-10 reveal"/>
          <div className="reveal flex flex-col items-start gap-6">
            <h2 className="font-display font-bold" style={{ fontSize:"var(--text-2xl)", lineHeight:1.1 }}>
              Открыт к новым<br/><span style={{ color:"var(--color-primary)" }}>возможностям</span>
            </h2>
            <p style={{ color:"var(--color-text-muted)", fontSize:"var(--text-base)", maxWidth:"440px" }}>
              Ищу позицию Unity / VR / AR разработчика. Готов к фулл-тайму или проектному сотрудничеству.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:kurlaevnikita82@gmail.com" className="btn-primary">✉ Email</a>
              <a href="https://t.me/Vinishk000" className="btn-ghost" target="_blank" rel="noopener noreferrer">Telegram</a>
              <a href="https://vk.com/vinishk0o0" className="btn-ghost" target="_blank" rel="noopener noreferrer">VK</a>
              <a href="https://github.com/Vinishk0" className="btn-ghost" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop:"1px solid var(--color-border)", padding:"var(--space-8) 0", position:"relative", zIndex:1 }}>
        <div className="container flex flex-wrap items-center justify-between gap-4"
          style={{ color:"var(--color-text-faint)", fontSize:"var(--text-xs)" }}>
          <div className="flex items-center gap-3"><Logo/><span>Никита Курлаев · Unity / VR / AR Developer</span></div>
          <span>Оренбург, 2026</span>
        </div>
      </footer>

      {selectedProject&&<ProjectModal project={selectedProject} onClose={()=>setSelectedProject(null)}/>}
    </div>
  );
}
