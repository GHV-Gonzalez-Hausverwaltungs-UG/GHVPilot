"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  CalendarClockIcon,
  Clock3Icon,
  LogOut,
  PlusCircleIcon,
  SaveIcon,
  TrashIcon,
} from "lucide-react";

import Image from "next/image";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// COMPONENT IMPORTS:
import {
  InspectionFilterBar,
  type InspectionFilterState,
} from "@/components/filter/InspectionFilterBar";

// TYPE IMPORTS:
import type { Tables } from "@/types/supabase";

// Types:
type InspectionRow = Tables<"inspections"> & {
  object: Pick<Tables<"objects">, "objektnr" | "strasse" | "ort"> | null;
  created_by_profile?: Pick<
    Tables<"profiles">,
    "first_name" | "last_name" | "avatar_url"
  > | null;
  assigned_to_profile?: Pick<
    Tables<"profiles">,
    "first_name" | "last_name" | "avatar_url"
  > | null;
};

export default function InspectionsPage() {
  // Filter-State (einziger Filter-State)
  const [filters, setFilters] = React.useState<InspectionFilterState>({
    search: "",
    statuses: [],
    priorities: [],
    dateFrom: null,
    dateTo: null,
    creatorId: null,
    assigneeId: null,
  });

  // Restliche States:
  const [inspections, setInspections] = React.useState<InspectionRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Optionen für Ersteller / Zugewiesen (aus den bereits geladenen Daten)
  const creatorOptions = React.useMemo(() => {
    const map = new Map<string, string>();

    inspections.forEach((row) => {
      if (row.created_by && row.created_by_profile) {
        const label =
          `${row.created_by_profile.first_name ?? ""} ${
            row.created_by_profile.last_name ?? ""
          }`.trim() || row.created_by;
        map.set(row.created_by, label);
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [inspections]);

  const assigneeOptions = React.useMemo(() => {
    const map = new Map<string, string>();

    inspections.forEach((row) => {
      if (row.assigned_to && row.assigned_to_profile) {
        const label =
          `${row.assigned_to_profile.first_name ?? ""} ${
            row.assigned_to_profile.last_name ?? ""
          }`.trim() || row.assigned_to;
        map.set(row.assigned_to, label);
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [inspections]);

  const filteredInspections = React.useMemo(() => {
    return inspections.filter((row) => {
      // 1) Status
      if (filters.statuses.length > 0) {
        const status = row.status ?? "offen";
        if (!filters.statuses.includes(status)) return false;
      }

      // 2) Priorität
      if (filters.priorities.length > 0) {
        const prio = row.priority ?? "";
        if (!filters.priorities.includes(prio)) return false;
      }

      // 3) Zeitraum (wir gehen von YYYY-MM-DD im String aus)
      const rowDate = row.date?.slice(0, 10) ?? null;
      if (filters.dateFrom && rowDate && rowDate < filters.dateFrom)
        return false;
      if (filters.dateTo && rowDate && rowDate > filters.dateTo) return false;

      // 4) Ersteller
      if (filters.creatorId && row.created_by !== filters.creatorId)
        return false;

      // 5) Zugewiesen
      if (filters.assigneeId && row.assigned_to !== filters.assigneeId)
        return false;

      // 6) Volltext-Suche
      const term = filters.search.trim().toLowerCase();
      if (term) {
        const haystack = [
          row.object?.strasse,
          row.object?.ort,
          String(row.object?.objektnr ?? ""),
          row.shortage,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(term)) return false;
      }

      return true;
    });
  }, [inspections, filters]);

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
          created_by,
          assigned_to,
          object:objects!inspections_object_id_fkey (
            objektnr,
            strasse,
            ort
          ),
          created_by_profile:profiles!inspections_created_by_fkey (
            first_name,
            last_name,
            avatar_url
          ),
          assigned_to_profile:profiles!inspections_assigned_to_fkey (
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .order("date", { ascending: false });

      if (error) {
        console.error("Fehler beim Laden der inspections:", error);
      } else {
        const normalized = (data || []).map((row: any) => ({
          ...row,
          object: Array.isArray(row.object) ? row.object[0] : row.object,
        }));

        setInspections(normalized as unknown as InspectionRow[]);
      }
      setLoading(false);
    }

    load();
  }, []);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);

    const { error } = await supabase
      .from("inspections")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Update:", error);
    } else {
      setInspections((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
      );
    }

    setUpdatingId(null);
  }

  async function handleDelete(id: string) {
    const sicher = confirm(
      "Willst du diese Besichtigung wirklich löschen? (Fotos bleiben im Storage erstmal bestehen)"
    );
    if (!sicher) return;

    setDeletingId(id);

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
      setInspections((prev) => prev.filter((row) => row.id !== id));
    }

    setDeletingId(null);
  }

  function toggleAll(checked: boolean) {
    if (checked) {
      setSelectedIds(filteredInspections.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const hasSelection = selectedIds.length > 0;

  return (
    <main
      className={`min-h-screen mx-auto bg-[#0a0a0a] text-gray-100  md:p-6 ${
        hasSelection ? "pt-16 md:pt-20" : ""
      }`}
    >
      {/* FIXED Bulk-Actions-Bar */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            key="bulk-actions-bar"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4"
          >
            {/* Nur dieser innere Container ist klickbar */}
            <div className="pointer-events-auto flex w-full max-w-3xl gap-2 rounded-b-lg border border-[#2a2a2a] bg-[#111] px-3 py-2 shadow-lg">
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
                <TrashIcon className="mr-1 h-4 w-4" />
                Auswahl löschen
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
                <SaveIcon className="mr-1 h-4 w-4" />
                Auswahl exportieren
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="relative bg-[#111] border border-[#1f1f1f] shadow-xl p-4">
        <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,4fr)_minmax(0,1fr)] md:items-start">
          {/* FilterBar – auf Mobile full width, über dem Button */}
          <div className="flex w-full items-center md:mb-0">
            <InspectionFilterBar
              value={filters}
              onChange={setFilters}
              creatorOptions={creatorOptions}
              assigneeOptions={assigneeOptions}
            />
          </div>

          {/* Button – auf Mobile full width unterhalb */}
          <div className="flex justify-end md:justify-end">
            <Button
              className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
              onClick={() => {
                window.location.href = "/besichtigung/neue";
              }}
            >
              <PlusCircleIcon className="h-4 w-4 mr-2" />
              Neue Besichtigung
            </Button>
          </div>
        </div>

        <Separator className="bg-[#222] mb-4" />

        {/* Bulk-Actions */}

        {/* Desktop-Tabelle */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[900px]">
            <thead>
              <tr className="text-left bg-[#1a1a1a] text-gray-300">
                <Th>
                  <Checkbox
                    className="cursor-pointer"
                    id="select-all"
                    checked={
                      filteredInspections.length > 0 &&
                      selectedIds.length === filteredInspections.length
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
                <Th>Erstellt von</Th>
                <Th>Zugewiesen an</Th>
                <Th className="text-right pr-6">Details</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-500">
                    Lädt …
                  </td>
                </tr>
              ) : filteredInspections.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-gray-500">
                    Noch keine Besichtigungen erfasst.
                  </td>
                </tr>
              ) : (
                filteredInspections.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[#1f1f1f] hover:bg-[#1a1a1a]"
                    onDoubleClick={() =>
                      (window.location.href = `/inspections/${row.id}`)
                    }
                  >
                    <Td>
                      <Checkbox
                        className="cursor-pointer"
                        checked={selectedIds.includes(row.id)}
                        onCheckedChange={() => toggleOne(row.id)}
                      />
                    </Td>
                    <Td className="font-medium text-gray-100">
                      {row.object?.objektnr ?? "—"}
                    </Td>
                    <Td className="text-gray-400">
                      <div className="leading-tight">
                        <div>{row.object?.strasse ?? "—"}</div>
                        <div className="text-xs text-gray-500">
                          {row.object?.ort ?? "—"}
                        </div>
                      </div>
                    </Td>
                    <Td className="text-gray-300">{row.date ?? "—"}</Td>
                    <Td className="text-gray-300">{row.time ?? "—"}</Td>
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
                    <Td className="max-w-[200px] text-gray-300">
                      <div className="truncate">{row.shortage ?? "—"}</div>
                    </Td>
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

                    {/* Ersteller */}
                    <Td className="text-gray-300">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image
                            src={
                              row.created_by_profile?.avatar_url ??
                              "/avatar_placeholder.png"
                            }
                            alt="User Icon"
                            width={24}
                            height={24}
                            className="rounded inline-block mr-1 mb-1"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {row.created_by_profile
                              ? `${row.created_by_profile.first_name ?? ""} ${
                                  row.created_by_profile.last_name ?? ""
                                }`.trim() || "Unbekannt"
                              : "Unbekannt"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Td>

                    {/* Zugewiesen an */}
                    <Td className="text-gray-300">
                      {row.assigned_to_profile ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Image
                              src={
                                row.assigned_to_profile.avatar_url ??
                                "/avatar_placeholder.png"
                              }
                              alt="Assigned User"
                              width={24}
                              height={24}
                              className="rounded inline-block mr-1 mb-1"
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {`${row.assigned_to_profile.first_name ?? ""} ${
                                row.assigned_to_profile.last_name ?? ""
                              }`.trim() || "Unbekannt"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </Td>

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

        {/* Mobile Cards – hier auch filteredInspections verwenden */}
        {/* Mobile Cards – hier auch filteredInspections verwenden */}
        <div className="flex flex-col gap-3 md:hidden">
          {filteredInspections.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              Noch keine Besichtigungen.
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-500 py-8">Lädt …</div>
          )}

          {!loading &&
            filteredInspections.map((row) => (
              <Card
                key={row.id}
                className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-lg"
              >
                {/* Header: Objekt + Checkbox + Badges */}
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      Objekt
                    </div>
                    <div className="text-blue-400 text-base font-semibold">
                      {row.object?.objektnr ?? "—"}
                    </div>
                    <div className="mt-1 text-sm text-gray-300">
                      {row.object?.strasse ?? "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {row.object?.ort ?? "—"}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Checkbox
                      checked={selectedIds.includes(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      className="mt-1"
                    />

                    {/* Priorität */}
                    <span
                      className={
                        row.priority === "hoch"
                          ? "text-red-400 bg-red-900/40 text-[11px] px-2 py-1 rounded-full"
                          : row.priority === "mittel"
                          ? "text-yellow-300 bg-yellow-900/40 text-[11px] px-2 py-1 rounded-full"
                          : "text-green-300 bg-green-900/40 text-[11px] px-2 py-1 rounded-full"
                      }
                    >
                      {row.priority ?? "Keine Prio"}
                    </span>

                    {/* Status */}
                    <span className="text-[11px] px-2 py-1 rounded-full bg-[#0d0d0d] text-gray-200">
                      {row.status ?? "offen"}
                    </span>
                  </div>
                </div>

                {/* Datum / Uhrzeit */}
                <div className="mb-2 flex flex-wrap gap-3 text-xs text-gray-400">
                  <span className="flex gap-2 items-center">
                    <CalendarClockIcon className="h-4 w-4" /> {row.date ?? "—"}
                  </span>
                  <span className="flex gap-2 items-center">
                    <Clock3Icon className="h-4 w-4" /> {row.time ?? "—"}
                  </span>
                </div>

                {/* Mangel / Beschreibung */}
                <p className="mb-3 line-clamp-3 text-sm text-gray-300">
                  {row.shortage ?? "Kein Mangeltext hinterlegt."}
                </p>

                {/* Ersteller / Zugewiesen */}
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">
                      Erstellt von
                    </span>
                    {row.created_by_profile ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image
                            src={
                              row.created_by_profile.avatar_url ??
                              "/avatar_placeholder.png"
                            }
                            alt="Ersteller"
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full border border-[#2a2a2a]"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {`${row.created_by_profile.first_name ?? ""} ${
                              row.created_by_profile.last_name ?? ""
                            }`.trim() || "Unbekannt"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-500">
                      Zugewiesen
                    </span>
                    {row.assigned_to_profile ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Image
                            src={
                              row.assigned_to_profile.avatar_url ??
                              "/avatar_placeholder.png"
                            }
                            alt="Zugewiesen an"
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full border border-[#2a2a2a]"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {`${row.assigned_to_profile.first_name ?? ""} ${
                              row.assigned_to_profile.last_name ?? ""
                            }`.trim() || "Unbekannt"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-blue-400"
                    onClick={() =>
                      (window.location.href = `/inspections/${row.id}`)
                    }
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-red-400"
                    onClick={() => handleDelete(row.id)}
                  >
                    Löschen
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </Card>
    </main>
  );
}

// Helper
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
