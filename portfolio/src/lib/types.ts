export interface MediaItem {
  id: string;
  name: string;
  ext: string;
  mime: string;
  size: number;
}

export interface Work {
  id: string;
  title: string;
  description: string;
  category: string;
  client: string;
  year: number | null;
  tags: string[];
  /** קישור חי לאתר/מערכת — אופציונלי */
  link: string;
  media: MediaItem[];
  coverIndex: number;
  featured: boolean;
  published: boolean;
  order: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type NewWork = Omit<Work, "id" | "views" | "createdAt" | "updatedAt">;

export interface WorkPatch {
  title?: string;
  description?: string;
  category?: string;
  client?: string;
  year?: number | null;
  tags?: string[];
  link?: string;
  coverIndex?: number;
  featured?: boolean;
  published?: boolean;
  order?: number;
  media?: MediaItem[];
}

export const isVideo = (m: MediaItem) => m.mime.startsWith("video");
export const isImage = (m: MediaItem) => m.mime.startsWith("image");
export const coverOf = (w: Work): MediaItem | null => w.media[w.coverIndex] ?? w.media[0] ?? null;
