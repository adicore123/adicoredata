export const MODULE_IDS = ["recordings", "images", "documents"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

export interface Item {
  id: string;
  module: ModuleId;
  title: string;
  /** שם הקובץ המקורי */
  name: string;
  /** סיומת עם נקודה, למשל ".pdf" */
  ext: string;
  mime: string;
  size: number;
  createdAt: string;
}

export type NewItem = Omit<Item, "id" | "createdAt">;

export const isModule = (v: unknown): v is ModuleId =>
  typeof v === "string" && (MODULE_IDS as readonly string[]).includes(v);
