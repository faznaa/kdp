import { BookProject, KDPSettings } from "./types";
import { DEFAULT_SETTINGS } from "./kdp-rules";
import { createDefaultFrontMatter, createDefaultBackMatter } from "./book-matter";

const STORAGE_KEY = "kdp-formatter-project";

export function loadProject(): BookProject | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const project = JSON.parse(data) as BookProject;

    // Migration: add fields missing from older saved projects
    if (!project.authorName) {
      project.authorName = "";
    }
    if (!project.frontMatter) {
      project.frontMatter = createDefaultFrontMatter(project.title, project.authorName);
    }
    if (!project.backMatter) {
      project.backMatter = createDefaultBackMatter(project.authorName);
    }

    return project;
  } catch {
    return null;
  }
}

export function saveProject(project: BookProject): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export function clearProject(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function createDefaultProject(): BookProject {
  const title = "Untitled Book";
  const author = "";
  return {
    id: Math.random().toString(36).substring(2, 10),
    title,
    authorName: author,
    rawText: "",
    chapters: [],
    settings: { ...DEFAULT_SETTINGS },
    frontMatter: createDefaultFrontMatter(title, author),
    backMatter: createDefaultBackMatter(author),
    updatedAt: Date.now(),
  };
}

export function loadSettings(): KDPSettings {
  const project = loadProject();
  return project?.settings ?? { ...DEFAULT_SETTINGS };
}
