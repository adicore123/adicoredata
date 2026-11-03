import { Mic, Image as ImageIcon, FileText, type LucideIcon } from "lucide-react";
import type { ModuleId } from "./types";

export interface ModuleMeta {
  label: string;
  icon: LucideIcon;
  hint: string;
}

export const MODULES: Record<ModuleId, ModuleMeta> = {
  recordings: { label: "הקלטות", icon: Mic, hint: "הקלטות קול, הודעות וואטסאפ, פודקאסטים" },
  images: { label: "תמונות", icon: ImageIcon, hint: "תמונות, צילומי מסך וסרטונים" },
  documents: { label: "מסמכים", icon: FileText, hint: "PDF, Word, Excel וכל קובץ אחר" },
};

const AUDIO_RE = /\.(mp3|m4a|aac|wav|ogg|opus|amr|flac|wma)$/i;
const IMAGE_RE = /\.(jpe?g|png|webp|gif|heic|avif|bmp|svg)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|mkv|3gp|avi|m4v)$/i;

/** מזהה לפי סוג הקבצים את המודול המתאים ביותר — אודיו גובר, אחר כך מדיה חזותית (תמונה/וידאו), אחרת מסמכים. */
export function detectModule(files: { type: string; name: string }[]): ModuleId {
  if (files.some((f) => f.type.startsWith("audio") || AUDIO_RE.test(f.name))) return "recordings";
  if (
    files.some(
      (f) => f.type.startsWith("image") || f.type.startsWith("video") || IMAGE_RE.test(f.name) || VIDEO_RE.test(f.name),
    )
  ) {
    return "images";
  }
  return "documents";
}
