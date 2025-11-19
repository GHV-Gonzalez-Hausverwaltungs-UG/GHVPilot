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
import {
  ArrowLeftSquareIcon,
  Edit3Icon,
  FileUpIcon,
  SaveIcon,
  X,
} from "lucide-react";

type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

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
  created_by: string | null;
  assigned_to: string | null;
  created_by_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  assigned_to_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
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
  const [profiles, setProfiles] = React.useState<ProfileLite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editMode, setEditMode] = React.useState(false);
  const [newPhotos, setNewPhotos] = React.useState<File[]>([]);
  const [loadingProfiles, setLoadingProfiles] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);

      // 1️⃣ Lokaler Cache
      const localData = id ? await localDB.inspections.get(id) : null;
      if (localData?.data) {
        setInspection(localData.data as InspectionDetail);
      }

      // 2️⃣ Online aktualisieren
      if (!navigator.onLine) {
        setLoading(false);
        setLoadingProfiles(false);
        return;
      }

      const [{ data: insp, error: inspErr }, { data: objs }, { data: profs }] =
        await Promise.all([
          supabase
            .from("inspections")
            .select(
              `
              id, date, time, priority, status, shortage, measures,
              responsibility, inspector, notes, floor, entrance,
              created_by, assigned_to,
              object:objects!inspections_object_id_fkey (id, objektnr, strasse, ort, plz),
              photos:photos (id, url, description),
              created_by_profile:profiles!inspections_created_by_fkey (
                first_name, last_name, avatar_url
              ),
              assigned_to_profile:profiles!inspections_assigned_to_fkey (
                first_name, last_name, avatar_url
              )
            `
            )
            .eq("id", id)
            .single(),
          supabase.from("objects").select("id, objektnr, strasse, ort, plz"),
          supabase
            .from("profiles")
            .select("id, first_name, last_name, avatar_url"),
        ]);

      if (inspErr) console.error(inspErr);

      if (insp) {
        const raw = insp as any;

        const normalized: InspectionDetail = {
          ...raw,
          object: Array.isArray(raw.object) ? raw.object[0] : raw.object,
          photos: Array.isArray(raw.photos) ? raw.photos : [],
          created_by_profile: Array.isArray(raw.created_by_profile)
            ? raw.created_by_profile[0] ?? null
            : raw.created_by_profile ?? null,
          assigned_to_profile: Array.isArray(raw.assigned_to_profile)
            ? raw.assigned_to_profile[0] ?? null
            : raw.assigned_to_profile ?? null,
        };

        setInspection(normalized);

        await localDB.inspections.put({
          id: id!,
          data: normalized,
          status: "synced",
          updatedAt: new Date().toISOString(),
        });
      }

      if (objs) setObjects(objs);
      if (profs) setProfiles(profs as ProfileLite[]);
      setLoading(false);
      setLoadingProfiles(false);
    }

    load();
  }, [id]);

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
      object_id: inspection.object?.id ?? null,
      assigned_to: inspection.assigned_to,
      updatedat: new Date().toISOString(),
    };

    try {
      // 📴 Offline
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

      // 🌐 Online
      const { error: inspErr } = await supabase
        .from("inspections")
        .update(updateFields)
        .eq("id", inspection.id);
      if (inspErr) throw inspErr;

      // 📸 Fotos anhängen
      if (newPhotos.length) {
        const urls = await uploadPictures(newPhotos);
        const photoRecords = urls.map((url) => ({
          id: crypto.randomUUID(),
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

        setInspection((prev) =>
          prev
            ? { ...prev, photos: [...(prev.photos ?? []), ...photoRecords] }
            : prev
        );
      }

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
    setInspection((prev) => (prev ? { ...prev, [field]: value } : prev));

  if (loading || !inspection)
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-gray-100 flex items-center justify-center">
        <div>Lade Details …</div>
      </main>
    );

  const createdByLabel =
    inspection.created_by_profile &&
    `${inspection.created_by_profile.first_name ?? ""} ${
      inspection.created_by_profile.last_name ?? ""
    }`.trim();

  const assignedToLabel =
    inspection.assigned_to_profile &&
    `${inspection.assigned_to_profile.first_name ?? ""} ${
      inspection.assigned_to_profile.last_name ?? ""
    }`.trim();

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 px-4 py-6 md:px-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}

        {!editMode && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => router.back()}
              className="w-full sm:w-auto text-green-400 border border-green-400"
            >
              <ArrowLeftSquareIcon /> Zurück
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs w-full sm:w-auto"
              onClick={() => window.open(`/api/${inspection.id}/pdf`, "_blank")}
            >
              <FileUpIcon /> Export / Bericht
            </Button>
          </div>
        )}
        <div className="flex gap-2 flex-col md:items-end">
          {!editMode ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(true)}
              className="w-full md:w-auto bg-black"
            >
              <Edit3Icon /> Bearbeiten
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="w-full md:w-auto"
              >
                <SaveIcon /> Speichern
              </Button>
              <Button
                size="sm"
                onClick={() => setEditMode(false)}
                disabled={saving}
                className="w-full md:w-auto bg-black text-red-500 border border-red-500 hover:bg-red-500/10"
              >
                <X /> Abbrechen
              </Button>
            </>
          )}
        </div>
        <Card className="bg-[#111] border border-[#1f1f1f] p-4 space-y-4">
          {/* 🔹 Jetzt responsive: auf Mobile untereinander, ab md nebeneinander */}
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
            {/* Linke Seite: Objekt + Meta */}
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-blue-400 break-words">
                Objekt {inspection.object?.objektnr ?? "—"}
              </h1>

              <div className="text-sm text-gray-300">
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
                    <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] w-full max-w-md">
                      <SelectValue placeholder="Objekt auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                      {objects.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.objektnr} – {o.strasse}, {o.ort}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="break-words">
                    {inspection.object?.strasse ?? "—"},{" "}
                    {inspection.object?.plz ?? ""}{" "}
                    {inspection.object?.ort ?? "—"}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                {editMode ? (
                  <>
                    <Input
                      placeholder="Etage"
                      value={inspection.floor ?? ""}
                      onChange={(e) => handleChange("floor", e.target.value)}
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-gray-100 w-[120px]"
                    />
                    <Input
                      placeholder="Eingang"
                      value={inspection.entrance ?? ""}
                      onChange={(e) => handleChange("entrance", e.target.value)}
                      className="bg-[#0d0d0d] border-[#2a2a2a] text-gray-100 w-[120px]"
                    />
                  </>
                ) : (
                  <>
                    <div>Etage: {inspection.floor ?? "—"}</div>
                    <div>Eingang: {inspection.entrance ?? "—"}</div>
                  </>
                )}
              </div>
            </div>

            {/* Rechte Seite: Buttons – auf Mobile unten, aber in diesem Flexblock rechts */}
          </div>

          {/* 🔹 Meta: erstellt / zugewiesen */}
          <Separator className="bg-[#222] my-3" />
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            {/* Erstellt von */}
            <div className="flex items-center gap-3">
              <div className="text-xs uppercase text-gray-500 whitespace-nowrap">
                Erstellt von
              </div>
              {inspection.created_by_profile ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src={
                      inspection.created_by_profile.avatar_url ??
                      "/avatar_placeholder.png"
                    }
                    alt="Ersteller"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-[#2a2a2a] flex-shrink-0"
                  />
                  <span className="text-gray-200 text-sm truncate">
                    {createdByLabel || inspection.created_by || "Unbekannt"}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">
                  {inspection.created_by || "—"}
                </span>
              )}
            </div>

            {/* Zugewiesen an */}
            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase text-gray-500">
                Zugewiesen an
              </div>
              {editMode ? (
                <Select
                  value={inspection.assigned_to ?? "__none"}
                  onValueChange={(v) =>
                    setInspection((prev) =>
                      prev
                        ? {
                            ...prev,
                            assigned_to: v === "__none" ? null : v,
                          }
                        : prev
                    )
                  }
                  disabled={loadingProfiles}
                >
                  <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 w-full max-w-md">
                    <SelectValue
                      placeholder={
                        loadingProfiles
                          ? "Lade Nutzer..."
                          : "Mitarbeiter auswählen"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                    <SelectItem value="__none">Kein(e)</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
                          p.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : inspection.assigned_to_profile ? (
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src={
                      inspection.assigned_to_profile.avatar_url ??
                      "/avatar_placeholder.png"
                    }
                    alt="Zugewiesen an"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border border-[#2a2a2a] flex-shrink-0"
                  />
                  <span className="text-gray-200 text-sm truncate">
                    {assignedToLabel || inspection.assigned_to || "Unbekannt"}
                  </span>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">
                  {inspection.assigned_to || "—"}
                </span>
              )}
            </div>
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
        <div className="text-sm text-gray-300 whitespace-pre-line break-words">
          {value || "—"}
        </div>
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
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
