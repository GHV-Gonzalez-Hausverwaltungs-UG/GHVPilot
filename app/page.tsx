"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/supabaseclient";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type InspectionRow = {
  id: string;
  date: string | null;
  time: string | null;
  priority: string | null;
  status: string | null;
  shortage: string | null;
  object: {
    objektnr: number;
    strasse: string;
    ort: string;
  } | null;
};

export default function InspectionsPage() {
  const [inspections, setInspections] = React.useState<InspectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  // 1. Daten laden
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("inspections")
        .select(
          `
          id,
          date,
          time,
          priority,
          status,
          shortage,
          object:objects!inspections_object_id_fkey (
            objektnr,
            strasse,
            ort
          )
        `
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Fehler beim Laden der inspections:", error);
      } else {
        // Supabase liefert object als Array → wir normalisieren es
        const normalized = (data || []).map((row: any) => ({
          ...row,
          object: Array.isArray(row.object) ? row.object[0] : row.object,
        }));

        // Explizit auf unknown casten, dann auf InspectionRow[]
        setInspections(normalized as unknown as InspectionRow[]);
      }
      setLoading(false);
    }

    load();
  }, []);

  // 2. Status ändern
  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);

    const { error } = await supabase
      .from("inspections")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Update:", error);
    } else {
      // lokal updaten für snappy UI
      setInspections((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
      );
    }

    setUpdatingId(null);
  }

  // 3. Löschen
  async function handleDelete(id: string) {
    const sicher = confirm(
      "Willst du diese Besichtigung wirklich löschen? (Fotos bleiben im Storage erstmal bestehen)"
    );
    if (!sicher) return;

    setDeletingId(id);

    // erst photos löschen (DB) -> dann inspection löschen
    const { error: photosError } = await supabase
      .from("photos")
      .delete()
      .eq("inspection_id", id);

    if (photosError) {
      console.error("Fehler beim Löschen der Fotos:", photosError);
    }

    const { error: inspError } = await supabase
      .from("inspections")
      .delete()
      .eq("id", id);

    if (inspError) {
      console.error("Fehler beim Löschen der Inspection:", inspError);
    } else {
      // lokal rauswerfen
      setInspections((prev) => prev.filter((row) => row.id !== id));
    }

    setDeletingId(null);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <Card className="bg-[#111] border border-[#1f1f1f] shadow-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-xl font-semibold text-blue-400">
            🗂 Alle Besichtigungen
          </h1>

          <Button
            className="bg-blue-600 text-white hover:bg-blue-500"
            onClick={() => {
              // später: Router.push("/besichtigung/neue")
              window.location.href = "/besichtigung/neue";
            }}
          >
            + Neue Besichtigung
          </Button>
        </div>

        <Separator className="bg-[#222] mb-4" />

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="text-left bg-[#1a1a1a] text-gray-300">
                <Th>Objekt</Th>
                <Th>Adresse</Th>
                <Th>Datum</Th>
                <Th>Uhrzeit</Th>
                <Th>Dringlichkeit</Th>
                <Th>Mangel</Th>
                <Th>Status</Th>
                <Th className="text-right">Aktionen</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    Lädt …
                  </td>
                </tr>
              ) : inspections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-500">
                    Noch keine Besichtigungen erfasst.
                  </td>
                </tr>
              ) : (
                inspections.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a]"
                  >
                    {/* Objekt / Objektnr */}
                    <Td className="font-medium text-gray-100">
                      {row.object?.objektnr ?? "—"}
                    </Td>

                    {/* Adresse */}
                    <Td className="text-gray-400">
                      <div className="leading-tight">
                        <div>{row.object?.strasse ?? "—"}</div>
                        <div className="text-xs text-gray-500">
                          {row.object?.ort ?? "—"}
                        </div>
                      </div>
                    </Td>

                    {/* Datum */}
                    <Td className="text-gray-300">{row.date ?? "—"}</Td>

                    {/* Uhrzeit */}
                    <Td className="text-gray-300">{row.time ?? "—"}</Td>

                    {/* Dringlichkeit */}
                    <Td>
                      <span
                        className={
                          row.priority === "hoch"
                            ? "text-red-400 bg-red-900/30 text-xs px-2 py-1 rounded"
                            : row.priority === "mittel"
                            ? "text-yellow-300 bg-yellow-900/30 text-xs px-2 py-1 rounded"
                            : "text-green-300 bg-green-900/30 text-xs px-2 py-1 rounded"
                        }
                      >
                        {row.priority ?? "—"}
                      </span>
                    </Td>

                    {/* Mangel */}
                    <Td className="max-w-[200px] text-gray-300">
                      <div className="truncate">{row.shortage ?? "—"}</div>
                    </Td>

                    {/* Status (editable) */}
                    <Td>
                      <Select
                        value={row.status ?? "offen"}
                        onValueChange={(newStatus) =>
                          handleStatusChange(row.id, newStatus)
                        }
                        disabled={updatingId === row.id}
                      >
                        <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100 text-xs">
                          <SelectItem value="offen">offen</SelectItem>
                          <SelectItem value="in_bearbeitung">
                            in Bearbeitung
                          </SelectItem>
                          <SelectItem value="erledigt">erledigt</SelectItem>
                        </SelectContent>
                      </Select>
                    </Td>

                    {/* Aktionen */}
                    <Td className="text-right">
                      <Button
                        variant="ghost"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs mr-2"
                        onClick={() =>
                          (window.location.href = `/inspections/${row.id}`)
                        }
                      >
                        Details
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                      >
                        {deletingId === row.id ? "…" : "Löschen"}
                      </Button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

// Kleine Helpers für schlankeres JSX
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`py-2 px-3 font-medium text-xs uppercase tracking-wide ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`py-3 px-3 align-top text-sm ${className}`}>{children}</td>
  );
}
