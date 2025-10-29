"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase/supabaseclient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SaveIcon, TrashIcon } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [filterField, setFilterField] = React.useState<
    "object" | "date" | "status" | "none"
  >("none");
  const [filterValue, setFilterValue] = React.useState("");

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

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(inspections.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  }

  // Einzelne Checkbox togglen
  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6">
      <Card className="bg-[#111] border border-[#1f1f1f] shadow-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <h1 className="text-xl font-semibold text-blue-400">
            🗂 Alle Besichtigungen
          </h1>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select
              value={filterField}
              onValueChange={(val) => setFilterField(val as any)}
            >
              <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs w-[160px]">
                <SelectValue placeholder="Filterfeld" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100 text-xs">
                <SelectItem value="none">Kein Filter</SelectItem>
                <SelectItem value="object">Objekt</SelectItem>
                <SelectItem value="date">Datum</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {filterField !== "none" && (
              <input
                type="text"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                placeholder={`Nach ${filterField} filtern...`}
                className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs rounded-md w-[200px]"
              />
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white text-xs"
              onClick={() => {
                setFilterValue("");
                setFilterField("none");
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
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
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              layout
              key="bulk-actions"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex w-full gap-2 my-4 overflow-hidden"
            >
              <Button
                className="text-red-400 hover:bg-red-400/10 cursor-pointer"
                onClick={async () => {
                  const sicher = confirm(
                    `${selectedIds.length} Besichtigung(en) löschen?`
                  );
                  if (!sicher) return;

                  for (const id of selectedIds) {
                    await handleDelete(id);
                  }
                  setSelectedIds([]);
                }}
              >
                <TrashIcon />
                Auswahl Löschen
              </Button>

              <Button
                className="text-emerald-400 hover:bg-emerald-400/10 cursor-pointer"
                onClick={() => {
                  if (selectedIds.length === 0)
                    return alert("Keine Besichtigungen ausgewählt.");

                  const url = `/api/combinePdf?ids=${selectedIds.join(",")}`;
                  window.open(url, "_blank");
                }}
              >
                <SaveIcon />
                Auswahl Exportieren
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="text-left bg-[#1a1a1a] text-gray-300">
                <Th>
                  <Checkbox
                    className="cursor-pointer"
                    id="select-all"
                    checked={
                      inspections.length > 0 &&
                      selectedIds.length === inspections.length
                    }
                    onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                  />
                </Th>
                <Th>Objekt</Th>
                <Th>Adresse</Th>
                <Th>Datum</Th>
                <Th>Uhrzeit</Th>
                <Th>Dringlichkeit</Th>
                <Th>Mangel</Th>
                <Th>Status</Th>
                <Th className="text-right pr-6">Details</Th>
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
                inspections
                  .filter((row) => {
                    if (filterField === "none" || !filterValue.trim())
                      return true;

                    const val = filterValue.toLowerCase();
                    if (filterField === "object")
                      return (
                        row.object?.strasse?.toLowerCase().includes(val) ||
                        row.object?.ort?.toLowerCase().includes(val) ||
                        String(row.object?.objektnr ?? "").includes(val)
                      );

                    if (filterField === "date")
                      return (row.date ?? "").toLowerCase().includes(val);

                    if (filterField === "status")
                      return (row.status ?? "").toLowerCase().includes(val);

                    return true;
                  })
                  .map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a]"
                    >
                      <Td>
                        <Checkbox
                          className="cursor-pointer"
                          checked={selectedIds.includes(row.id)}
                          onCheckedChange={() => toggleOne(row.id)}
                        />
                      </Td>
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
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs"
                          onClick={() =>
                            (window.location.href = `/inspections/${row.id}`)
                          }
                        >
                          Details
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
