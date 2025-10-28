import type { Inspection } from "@/types/inspections";

export const mockInspections: Inspection[] = [
  {
    id: "b61f1cba-7b0a-4de9-b1a7-1fdfa3348a01",
    title: "Haus Müllerstraße 12",
    date: "2025-10-20",
    status: "geplant",
  },
  {
    id: "8a9d4b25-5b79-4a7e-bc2e-3f523f94727e",
    title: "Wohnanlage Gartenweg",
    date: "2025-10-24",
    status: "inBearbeitung",
  },
  {
    id: "ea42c394-23d4-4f8f-91a0-6eddb4c919c8",
    title: "Altbau Lindenstraße",
    date: "2025-09-12",
    status: "abgeschlossen",
  },
];
