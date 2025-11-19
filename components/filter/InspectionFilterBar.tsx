"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FilterIcon } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "offen", label: "Offen" },
  { value: "in_bearbeitung", label: "In Bearbeitung" },
  { value: "erledigt", label: "Erledigt" },
];

const PRIORITY_OPTIONS = [
  { value: "hoch", label: "Hoch" },
  { value: "mittel", label: "Mittel" },
  { value: "niedrig", label: "Niedrig" },
];

type PersonOption = {
  id: string;
  label: string;
};

export type InspectionFilterState = {
  search: string;
  statuses: string[];
  priorities: string[];
  dateFrom: string | null;
  dateTo: string | null;
  creatorId: string | null;
  assigneeId: string | null;
};

type Props = {
  value: InspectionFilterState;
  onChange: (next: InspectionFilterState) => void;
  creatorOptions: PersonOption[];
  assigneeOptions: PersonOption[];
};

export function InspectionFilterBar({
  value,
  onChange,
  creatorOptions,
  assigneeOptions,
}: Props) {
  const [open, setOpen] = React.useState(false);

  function toggleArrayField(field: "statuses" | "priorities", v: string) {
    onChange({
      ...value,
      [field]: value[field].includes(v)
        ? value[field].filter((x) => x !== v)
        : [...value[field], v],
    });
  }

  function resetFilters() {
    onChange({
      search: "",
      statuses: [],
      priorities: [],
      dateFrom: null,
      dateTo: null,
      creatorId: null,
      assigneeId: null,
    });
  }

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Obere Leiste: Suche + Filter-Button */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={value.search}
          onChange={(e) =>
            onChange({
              ...value,
              search: e.target.value,
            })
          }
          placeholder="Suche nach Objekt, Adresse oder Mangel…"
          className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-9 px-3 py-1 text-sm rounded-md min-w-[220px] flex-1"
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#111] text-white border-[#2a2a2a] text-xs cursor-pointer">
              <FilterIcon /> Filtern
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-[#151515] border border-[#2a2a2a] text-gray-100 max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Filter für Besichtigungen
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Status */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Status</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs px-2 ${
                      value.statuses.length === 0
                        ? "bg-blue-600/20 text-blue-300"
                        : "text-gray-300"
                    }`}
                    onClick={() =>
                      onChange({
                        ...value,
                        statuses: [],
                      })
                    }
                  >
                    Alle
                  </Button>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleArrayField("statuses", s.value)}
                      className={`text-xs px-2 py-1 rounded border border-transparent hover:border-[#333] ${
                        value.statuses.includes(s.value)
                          ? "bg-blue-600/20 text-blue-200"
                          : "text-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priorität */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Priorität
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs px-2 ${
                      value.priorities.length === 0
                        ? "bg-emerald-600/20 text-emerald-300"
                        : "text-gray-300"
                    }`}
                    onClick={() =>
                      onChange({
                        ...value,
                        priorities: [],
                      })
                    }
                  >
                    Alle
                  </Button>
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => toggleArrayField("priorities", p.value)}
                      className={`text-xs px-2 py-1 rounded border border-transparent hover:border-[#333] ${
                        value.priorities.includes(p.value)
                          ? "bg-emerald-600/20 text-emerald-200"
                          : "text-gray-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zeitraum */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Zeitraum
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500">Von</span>
                    <input
                      type="date"
                      value={value.dateFrom ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          dateFrom: e.target.value || null,
                        })
                      }
                      className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs rounded-md"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-500">Bis</span>
                    <input
                      type="date"
                      value={value.dateTo ?? ""}
                      onChange={(e) =>
                        onChange({
                          ...value,
                          dateTo: e.target.value || null,
                        })
                      }
                      className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Ersteller */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Ersteller
                </p>
                <Select
                  value={value.creatorId ?? "all"}
                  onValueChange={(val) =>
                    onChange({
                      ...value,
                      creatorId: val === "all" ? null : val,
                    })
                  }
                >
                  <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs w-[220px]">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100 text-xs">
                    <SelectItem value="all">Alle</SelectItem>
                    {creatorOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Zugewiesen */}
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">
                  Zugewiesen an
                </p>
                <Select
                  value={value.assigneeId ?? "all"}
                  onValueChange={(val) =>
                    onChange({
                      ...value,
                      assigneeId: val === "all" ? null : val,
                    })
                  }
                >
                  <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 h-8 px-2 py-1 text-xs w-[220px]">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100 text-xs">
                    <SelectItem value="all">Alle</SelectItem>
                    {assigneeOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-4 flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400"
                onClick={resetFilters}
              >
                Filter zurücksetzen
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 text-xs"
                onClick={() => setOpen(false)}
              >
                Anwenden
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
