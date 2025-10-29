"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseclient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";

type InspectionDetail = {
  id: string;
  date: string | null;
  time: string | null;
  priority: string | null;
  status: string | null;
  shortage: string | null;
  measures: string | null;
  responsibility: string | null;
  inspector: string | null;
  notes: string | null;
  floor: string | null;
  entrance: string | null;
  object: {
    objektnr: number;
    strasse: string;
    ort: string;
    plz?: string;
  } | null;
  photos: {
    id: string;
    url: string;
    description: string | null;
  }[];
};

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [inspection, setInspection] = React.useState<InspectionDetail | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [savingStatus, setSavingStatus] = React.useState(false);

  // Daten laden
  React.useEffect(() => {
    async function load() {
      setLoading(true);

      // 1. Inspection + verbundenes Objekt laden
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
          measures,
          responsibility,
          inspector,
          notes,
          floor,
          entrance,
          object:objects!inspections_object_id_fkey (
            objektnr,
            strasse,
            ort,
            plz
          ),
          photos:photos (
            id,
            url,
            description
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Fehler beim Laden der Besichtigung:", error);
      } else {
        if (data) {
          // Falls Supabase ein Array für die Relation liefert:
          const normalized = {
            ...data,
            object: Array.isArray(data.object) ? data.object[0] : data.object,
          };

          setInspection(normalized as InspectionDetail);
        }
      }

      setLoading(false);
    }

    load();
  }, [id]);

  // Status ändern
  async function handleStatusChange(newStatus: string) {
    if (!inspection) return;
    setSavingStatus(true);

    const { error } = await supabase
      .from("inspections")
      .update({ status: newStatus })
      .eq("id", inspection.id);

    if (error) {
      console.error("Fehler beim Update Status:", error);
    } else {
      setInspection((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }

    setSavingStatus(false);
  }

  if (loading || !inspection) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Lade Details…</div>
      </main>
    );
  }

  const addrLine1 = inspection.object?.strasse ?? "—";
  const addrLine2 = inspection.object
    ? [inspection.object.plz, inspection.object.ort].filter(Boolean).join(" ")
    : "—";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Card */}
        <Card className="bg-[#111] border border-[#1f1f1f] shadow-xl p-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
                Objekt {inspection.object?.objektnr ?? "—"}
              </h1>
              <div className="text-sm text-gray-300 leading-tight">
                <div>{addrLine1}</div>
                <div className="text-gray-500">{addrLine2}</div>
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {inspection.floor && <div>Etage: {inspection.floor}</div>}
                {inspection.entrance && (
                  <div>Eingang: {inspection.entrance}</div>
                )}
                {inspection.responsibility && (
                  <div>Zuständig: {inspection.responsibility}</div>
                )}
                {inspection.inspector && (
                  <div>Bearbeiter: {inspection.inspector}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 text-sm">
              <div className="flex gap-4 text-gray-300">
                <div>
                  <div className="text-xs text-gray-500">Datum</div>
                  <div>{inspection.date ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Uhrzeit</div>
                  <div>{inspection.time ?? "—"}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left md:text-right">
                <div>
                  <div className="text-xs text-gray-500">Dringlichkeit</div>
                  <PriorityBadge priority={inspection.priority} />
                </div>

                <div className="w-40">
                  <Label className="text-[10px] uppercase text-gray-500">
                    Status
                  </Label>
                  <Select
                    value={inspection.status ?? "offen"}
                    onValueChange={handleStatusChange}
                    disabled={savingStatus}
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
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#222]" />

          <div className="flex gap-2 flex-wrap">
            <Button
              className="bg-[#222] border border-[#333] hover:bg-[#2a2a2a] text-gray-200 text-xs px-3 py-1 h-auto"
              onClick={() => router.back()}
            >
              ⬅ Zurück
            </Button>

            {/* Platzhalter für später */}
            <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1 h-auto">
              📄 Export / Bericht
            </Button>
          </div>
        </Card>

        {/* Mangel / Maßnahmen / Notizen */}
        <Card className="bg-[#111] border border-[#1f1f1f] shadow-xl p-4 space-y-6">
          <SectionBlock title="Mangel" body={inspection.shortage || "—"} />
          <Separator className="bg-[#222]" />
          <SectionBlock title="Maßnahmen" body={inspection.measures || "—"} />
          <Separator className="bg-[#222]" />
          <SectionBlock title="Interne Notiz" body={inspection.notes || "—"} />
        </Card>

        {/* Fotos */}
        <Card className="bg-[#111] border border-[#1f1f1f] shadow-xl p-4">
          <h2 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
            📷 Fotos
            <span className="text-[10px] text-gray-500 font-normal">
              ({inspection.photos.length})
            </span>
          </h2>

          {inspection.photos.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              Keine Fotos hochgeladen.
            </div>
          ) : (
            <PhotoGrid photos={inspection.photos} />
          )}
        </Card>
      </div>
    </main>
  );
}

// kleine Unterkomponenten für sauberes JSX

function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) {
    return (
      <span className="text-gray-400 bg-gray-800/50 text-xs px-2 py-1 rounded">
        —
      </span>
    );
  }

  if (priority === "hoch") {
    return (
      <span className="text-red-400 bg-red-900/30 text-xs px-2 py-1 rounded">
        hoch
      </span>
    );
  }
  if (priority === "mittel") {
    return (
      <span className="text-yellow-300 bg-yellow-900/30 text-xs px-2 py-1 rounded">
        mittel
      </span>
    );
  }
  return (
    <span className="text-green-300 bg-green-900/30 text-xs px-2 py-1 rounded">
      niedrig
    </span>
  );
}

function SectionBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </div>
      <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
        {body}
      </div>
    </div>
  );
}

function PhotoGrid({
  photos,
}: {
  photos: { id: string; url: string; description: string | null }[];
}) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <button
            key={photo.id}
            className="relative group border border-[#2a2a2a] rounded-lg overflow-hidden bg-black/40 aspect-square"
            onClick={() => setPreviewUrl(photo.url)}
          >
            <Image
              src={photo.url}
              alt={photo.description ?? "Foto"}
              fill
              className="object-cover group-hover:opacity-80 transition"
            />
            {photo.description && (
              <div className="absolute bottom-0 left-0 right-0 text-[10px] text-gray-200 bg-black/60 px-2 py-1 line-clamp-2">
                {photo.description}
              </div>
            )}
          </button>
        ))}
      </div>

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-3xl w-full max-h-[90vh] border border-[#333] bg-[#0a0a0a] rounded-lg overflow-hidden shadow-2xl">
            <div className="absolute top-2 right-2 text-gray-400 text-xs bg-black/60 rounded px-2 py-1">
              Tippen zum Schließen ✕
            </div>
            <div className="relative w-full h-[70vh]">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
