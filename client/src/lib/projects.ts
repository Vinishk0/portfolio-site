// ─── Static project loader ─────────────────────────────────────────────────
// Projects live in client/public/projects/<slug>/meta.json
// Images/videos live alongside: client/public/projects/<slug>/cover.jpg etc.

export interface StaticProject {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  role: string;
  stack: string[];
  context?: string;
  result?: string;
  category: "unity" | "vr" | "ar" | "dotnet" | "simulator" | "other" | string;
  featured: boolean;
  cover?: string;          // filename inside the project folder, e.g. "cover.jpg"
  images?: string[];       // additional image filenames
  videoUrl?: string;       // filename of a local video, e.g. "demo.mp4"
  githubUrl?: string;
  youtubeUrl?: string;
  sortOrder?: number;
}

// Vite glob — loads all meta.json files at build time (no runtime fetch needed)
const metaModules = import.meta.glob("/public/projects/*/meta.json", {
  eager: true,
  import: "default",
}) as Record<string, StaticProject>;

function slugFromPath(path: string): string {
  // "/public/projects/vr-archery/meta.json" → "vr-archery"
  const parts = path.split("/");
  return parts[parts.length - 2];
}

export function getAllProjects(): StaticProject[] {
  const projects = Object.entries(metaModules).map(([path, meta]) => ({
    ...meta,
    id: meta.id ?? slugFromPath(path),
  }));

  return projects.sort((a, b) => {
    // Featured first, then by sortOrder, then by title
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

// Helper: get the public URL for a project asset
export function projectAssetUrl(projectId: string, filename: string): string {
  return `/projects/${projectId}/${filename}`;
}
