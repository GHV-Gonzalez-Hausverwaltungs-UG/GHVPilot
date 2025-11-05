// lib/localdb.ts
import Dexie, { Table } from "dexie";

// ---- Types ----
export type LocalInspection = {
  id: string; // = Supabase inspection.id
  data: {
    // exakt die Struktur der Supabase inspections Tabelle
    id?: string;
    object_id?: string | null; // ✅ nicht "object"
    object?: any;
    floor?: string | null;
    entrance?: string | null;
    responsibility?: string | null;
    inspector?: string | null;
    shortage?: string | null;
    measures?: string | null;
    priority?: string | null;
    date?: string | null;
    time?: string | null;
    notes?: string | null;
    status?: string | null;
    updatedat?: string | null;
    createdat?: string | null;
  };
  // lokale Zusatzdaten:
  photosToAdd?: File[]; // offline noch nicht hochgeladene Fotos
  status: "pending" | "synced" | "error"; // sync state
  updatedAt?: string;
};

export class LocalDatabase extends Dexie {
  inspections!: Table<LocalInspection, string>;

  constructor() {
    super("LocalDatabase");

    this.version(1).stores({
      inspections: "id, status, updatedAt", // index fields
    });
  }
}

export const localDB = new LocalDatabase();
