"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/supabaseclient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import Image from "next/image";
import { uploadPictures } from "@/lib/supabase/fileUpload";
import { localDB } from "@/lib/localdb";

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
    id: string;
    objektnr: number;
    strasse: string;
    ort: string;
    plz?: string;
  } | null;
  photos: { id: string; url: string; description: string | null }[];
};

export default function InspectionDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = params?.id;

  const [inspection, setInspection] = React.useState<InspectionDetail | null>(
    null
  );
  const [objects, setObjects] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [newPhotos, setNewPhotos] = React.useState<File[]>([]);

  // 🟡 Daten laden (offline + online)
  React.useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      // 1️⃣ Versuch: aus lokalem Cache
      const localData = id ? await localDB.inspections.get(id) : null;
      if (localData?.data) setInspection(localData.data as InspectionDetail);

      // 2️⃣ Online-Aktualisierung
      if (navigator.onLine) {
        const [{ data: insp, error: inspErr }, { data: objs }] =
          await Promise.all([
            supabase
              .from("inspections")
              .select(
                `
              id, date, time, priority, status, shortage, measures,
              responsibility, inspector, notes, floor, entrance,
              object:objects!inspections_object_id_fkey (id, objektnr, strasse, ort, plz),
              photos:photos (id, url, description)
            `
              )
              .eq("id", id)
              .single(),
            supabase.from("objects").select("id, objektnr, strasse, ort, plz"),
          ]);

        if (inspErr) console.error(inspErr);
        if (insp) {
          const normalized: InspectionDetail = {
            ...insp,
            object: Array.isArray(insp.object) ? insp.object[0] : insp.object,
            photos: Array.isArray(insp.photos) ? insp.photos : [],
          };
          setInspection(normalized);

          await localDB.inspections.put({
            id: id!, // <-- Non-null Assertion (wir wissen, dass id existiert)
            data: normalized,
            status: "synced",
            updatedAt: new Date().toISOString(),
          });
        }

        if (objs) setObjects(objs);
      }

      setLoading(false);
    }

    load();
  }, [id]);

  // 🟢 Speichern mit Offline-Fallback
  async function handleSave() {
    if (!inspection) return;
    setSaving(true);

    const updateFields = {
      shortage: inspection.shortage,
      measures: inspection.measures,
      notes: inspection.notes,
      priority: inspection.priority,
      status: inspection.status,
      responsibility: inspection.responsibility,
      inspector: inspection.inspector,
      floor: inspection.floor,
      entrance: inspection.entrance,
      object_id: inspection.object?.id ?? null, // ✅ richtige Spalte
      updatedat: new Date().toISOString(), // ✅ passt zu deiner Supabase-Spalte
    };

    try {
      // 📴 Offline speichern
      if (!navigator.onLine) {
        await localDB.inspections.put({
          id: inspection.id,
          data: { ...inspection, ...updateFields },
          photosToAdd: newPhotos ?? [],
          status: "pending",
          updatedAt: updateFields.updatedat,
        });
        alert("📶 Kein Internet – Änderungen lokal gespeichert!");
        setEditMode(false);
        setSaving(false);
        return;
      }

      // 🌐 Online: Supabase-Update
      const { error: inspErr } = await supabase
        .from("inspections")
        .update(updateFields)
        .eq("id", inspection.id);
      if (inspErr) throw inspErr;

      // 📸 Fotos anhängen
      // 📸 Fotos anhängen
      if (newPhotos.length) {
        const urls = await uploadPictures(newPhotos);
        const photoRecords = urls.map((url) => ({
          id: crypto.randomUUID(), // lokale ID für Konsistenz
          url,
          description: null,
        }));

        const { error: photoErr } = await supabase.from("photos").insert(
          photoRecords.map((p) => ({
            inspection_id: inspection.id,
            url: p.url,
          }))
        );

        if (photoErr) throw photoErr;

        // UI aktualisieren
        setInspection((prev) =>
          prev
            ? { ...prev, photos: [...(prev.photos ?? []), ...photoRecords] }
            : prev
        );
      }

      // Lokalen Cache aktualisieren
      await localDB.inspections.put({
        id: inspection.id,
        data: { ...inspection, ...updateFields },
        status: "synced",
        updatedAt: updateFields.updatedat,
      });

      alert("✅ Änderungen gespeichert!");
      setEditMode(false);
      setNewPhotos([]);
    } catch (err) {
      console.error("❌ Fehler beim Speichern:", err);
      alert("❌ Fehler beim Speichern!");
    } finally {
      setSaving(false);
    }
  }

  // 🗑 Foto löschen
  async function handleDeletePhoto(photoId: string) {
    if (!navigator.onLine) {
      alert("⚠️ Offline – Löschen erst wieder online möglich.");
      return;
    }
    const { error } = await supabase.from("photos").delete().eq("id", photoId);
    if (!error) {
      setInspection((prev) =>
        prev
          ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) }
          : prev
      );
    }
  }

  const handleChange = (field: keyof InspectionDetail, value: string | null) =>
    setInspection((prev) => (prev ? { ...prev, [field]: value ?? "" } : prev));

  if (loading || !inspection)
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center">
        <div>Lade Details …</div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card className="bg-[#111] border border-[#1f1f1f] p-4">
          <div className="flex justify-between items-start">
            <h1 className="text-xl font-semibold text-blue-400">
              Objekt {inspection.object?.objektnr ?? "—"}
            </h1>

            <div className="flex gap-2">
              {!editMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  ✏️ Bearbeiten
                </Button>
              ) : (
                <>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    💾 Speichern
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(false)}
                    disabled={saving}
                  >
                    Abbrechen
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-gray-300">
            {editMode ? (
              <Select
                value={inspection.object?.id ?? ""}
                onValueChange={(value) => {
                  const obj = objects.find((o) => o.id === value);
                  if (obj)
                    setInspection((prev) =>
                      prev ? { ...prev, object: obj } : prev
                    );
                }}
              >
                <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a]">
                  <SelectValue placeholder="Objekt auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {objects.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.objektnr} – {o.strasse}, {o.ort}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                {inspection.object?.strasse ?? "—"},{" "}
                {inspection.object?.plz ?? ""} {inspection.object?.ort ?? "—"}
              </>
            )}
          </div>

          <div className="flex gap-4 mt-2 text-sm text-gray-400">
            {editMode ? (
              <>
                <Input
                  placeholder="Etage"
                  value={inspection.floor ?? ""}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-gray-100"
                />
                <Input
                  placeholder="Eingang"
                  value={inspection.entrance ?? ""}
                  onChange={(e) => handleChange("entrance", e.target.value)}
                  className="bg-[#0d0d0d] border-[#2a2a2a] text-gray-100"
                />
              </>
            ) : (
              <>
                <div>Etage: {inspection.floor ?? "—"}</div>
                <div>Eingang: {inspection.entrance ?? "—"}</div>
              </>
            )}
          </div>

          <Separator className="bg-[#222] my-3" />

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              ⬅ Zurück
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
              onClick={() => window.open(`/api/${inspection.id}/pdf`, "_blank")}
            >
              📄 Export / Bericht
            </Button>
          </div>
        </Card>

        {/* Mangel & Notizen */}
        <Card className="bg-[#111] border border-[#1f1f1f] p-4 space-y-4">
          <EditableField
            label="Mangelbeschreibung"
            value={inspection.shortage ?? ""}
            editable={editMode}
            onChange={(v) => handleChange("shortage", v)}
          />
          <EditableField
            label="Maßnahmen"
            value={inspection.measures ?? ""}
            editable={editMode}
            onChange={(v) => handleChange("measures", v)}
          />
          <EditableField
            label="Notizen"
            value={inspection.notes ?? ""}
            editable={editMode}
            onChange={(v) => handleChange("notes", v)}
          />
        </Card>

        {/* 📷 Fotos */}
        <Card className="bg-[#111] border border-[#1f1f1f] p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-200">
            📷 Fotos ({inspection.photos?.length ?? 0})
          </h2>

          {editMode && (
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setNewPhotos(e.target.files ? Array.from(e.target.files) : [])
              }
              className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100"
            />
          )}

          {inspection.photos?.length > 0 ? (
            <PhotoGrid
              photos={inspection.photos}
              editable={editMode}
              onDelete={handleDeletePhoto}
            />
          ) : (
            <div className="text-sm text-gray-500">Keine Fotos vorhanden.</div>
          )}
        </Card>
      </div>
    </main>
  );
}

// ✏️ Textfeld
function EditableField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] uppercase text-gray-500">{label}</Label>
      {editable ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 text-sm"
        />
      ) : (
        <div className="text-sm text-gray-300">{value || "—"}</div>
      )}
    </div>
  );
}

// 🖼 Foto Grid mit Delete-Option
function PhotoGrid({
  photos,
  editable,
  onDelete,
}: {
  photos: { id: string; url: string; description: string | null }[];
  editable?: boolean;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square border border-[#2a2a2a] rounded-lg overflow-hidden group"
        >
          <Image
            src={photo.url}
            alt={photo.description ?? "Foto"}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {editable && onDelete && (
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
