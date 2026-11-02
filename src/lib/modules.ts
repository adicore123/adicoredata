import { Mic, Image as ImageIcon, FileText, type LucideIcon } from "lucide-react";
import type { ModuleId } from "./types";

export interface ModuleMeta {
  label: string;
  icon: LucideIcon;
  hint: string;
}

export const MODULES: Record<ModuleId, ModuleMeta> = {
  recordings: { label: "הקלטות", icon: Mic, hint: "הקלטות קול, הודעות וואטסאפ, פודקאסטים" },
  images: { label: "תמונות", icon: ImageIcon, hint: "תמונות וצילומי מסך" },
  documents: { label: "מסמכים", icon: FileText, hint: "PDF, Word, Excel וכל קובץ אחר" },
};
