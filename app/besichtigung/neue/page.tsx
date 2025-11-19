"use client";
import { v4 as uuidv4 } from "uuid";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

import { uploadPictures } from "@/lib/supabase/fileUpload";
import { supabase } from "@/lib/supabase/supabaseclient";
import { ImagePreviewGrid } from "@/components/imagePreviewGrid";
import dayjs from "dayjs";
import Link from "next/link";
import { localDB } from "@/lib/localdb";
import { Building2Icon } from "lucide-react";

import type { Tables, TablesInsert } from "@/types/supabase";
import type { User } from "@supabase/supabase-js";

type InspectionInsert = TablesInsert<"inspections">;
type ObjectRow = Tables<"objects">;
type ProfileRow = Tables<"profiles">;

// 👇 Formular-Daten: basiert auf DB-Insert + zusätzliche UI-Felder
type InspectionFormData = {
  address: {
    street: string;
    city: string;
    zip: string;
  };
  files: File[];
  // Roh-Input für datetime-local (wird beim Submit in ISO umgewandelt)
} & Pick<
  InspectionInsert,
  | "object_id"
  | "floor"
  | "entrance"
  | "responsibility"
  | "inspector"
  | "shortage"
  | "measures"
  | "priority"
  | "status"
  | "date"
  | "time"
  | "notes"
  | "assigned_to"
>;

export default function NeueBesichtigungsForm() {
  const [notes, setNotes] = React.useState(false);
  const [objects, setObjects] = React.useState<ObjectRow[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileRow[]>([]); // 👈 neu
  const [loadingObjects, setLoadingObjects] = React.useState(true);
  const [loadingProfiles, setLoadingProfiles] = React.useState(true); // 👈 neu
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [currentUser, setCurrentUser] = React.useState<User | null>(null); // 👈 neu

  const [formData, setFormData] = React.useState<InspectionFormData>({
    object_id: null,
    floor: "",
    entrance: "",
    responsibility: "",
    inspector: "",
    shortage: "",
    measures: "",
    priority: "mittel",
    status: "offen",
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    notes: null,
    assigned_to: null,
    address: { street: "", city: "", zip: "" },
    files: [],
  });

  // 👤 aktuellen User holen
  React.useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!error) setCurrentUser(data.user ?? null);
      })
      .catch((err) => console.error("Auth getUser error:", err));
  }, []);

  // 👥 mögliche Nutzer für "assigned_to" laden (z.B. alle Profile)
  React.useEffect(() => {
    async function loadProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true });

      if (!error && data) setProfiles(data as ProfileRow[]);
      setLoadingProfiles(false);
    }
    loadProfiles();
  }, []);

  // 🔄 Formular-Handler
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name in formData.address) {
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [name]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // 💾 Submit mit Loader & Blockierung
  // Ausschnitt für den relevanten Teil
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!currentUser) {
      alert("Kein eingeloggter Benutzer gefunden. Bitte erneut anmelden.");
      setIsSubmitting(false);
      return;
    }

    // 🔐 typed nach Supabase-Types
    const newInspection: InspectionInsert = {
      object_id: formData.object_id,
      floor: formData.floor || null,
      entrance: formData.entrance || null,
      responsibility: formData.responsibility || null,
      inspector: formData.inspector || null,
      shortage: formData.shortage || null,
      measures: formData.measures || null,
      priority: formData.priority || "mittel",
      status: formData.status || "offen",
      date: formData.date,
      time: formData.time,
      notes: formData.notes || null,
      // 🆕 wichtiger Teil:
      created_by: currentUser.id, // aktuell eingeloggter User
      assigned_to: formData.assigned_to || null,
      // falls es bei dir "updated_at" oder ähnliches heißt, bitte anpassen:
      updatedat: new Date().toISOString() as any,
    };

    try {
      // 📴 Offline → Lokal speichern
      if (!navigator.onLine) {
        const tempId = uuidv4();

        await localDB.inspections.put({
          id: tempId,
          data: newInspection,
          photosToAdd: formData.files ?? [],
          status: "pending",
          updatedAt: newInspection.updatedat ?? undefined,
        });

        alert("📶 Kein Internet – Besichtigung wurde lokal gespeichert!");
        setIsSubmitting(false);
        window.location.href = "/";
        return;
      }

      // 🌐 Online speichern
      const { data: insp, error } = await supabase
        .from("inspections")
        .insert([newInspection])
        .select("id")
        .single();

      if (error) throw error;
      const inspectionId = insp.id;

      // 📸 Bilder hochladen
      if (formData.files?.length) {
        const urls = await uploadPictures(formData.files);
        const photoRecords = urls.map((url) => ({
          inspection_id: inspectionId,
          url,
        }));
        await supabase.from("photos").insert(photoRecords);
      }

      // 🗄️ In lokale DB legen (Cache)
      await localDB.inspections.put({
        id: inspectionId,
        data: newInspection,
        status: "synced",
        updatedAt: new Date().toISOString(),
      });

      alert("✅ Besichtigung erfolgreich gespeichert!");
      window.location.href = "/inspections";
    } catch (err) {
      console.error("❌ Fehler beim Speichern:", err);
      alert("❌ Fehler beim Speichern!");
    } finally {
      setIsSubmitting(false);
    }
  }
  // 📦 Objekte laden
  React.useEffect(() => {
    async function loadObjects() {
      const { data, error } = await supabase
        .from("objects")
        .select("id, objektnr, strasse, ort, plz")
        .order("objektnr", { ascending: true });

      if (!error && data) setObjects(data as ObjectRow[]);
      setLoadingObjects(false);
    }
    loadObjects();
  }, []);

  return (
    <main className="relative min-h-screen bg-[#0a0a0a] text-gray-100 flex justify-center items-start p-6 overflow-hidden">
      {/* 🌀 Vollbild-Loader bei Submit */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            key="loader"
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <p className="text-gray-300 text-sm">Upload läuft … bitte warten</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className={isSubmitting ? "pointer-events-none" : ""}
      >
        <Card className="w-full max-w-3xl bg-[#111] border border-[#1f1f1f] text-gray-100 shadow-xl">
          <CardHeader>
            <CardTitle className="flex flex-row  gap-2 items-center text-2xl font-semibold text-blue-400">
              <Building2Icon /> Besichtigung erfassen
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* 🏠 Objektdaten */}
            <section>
              <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                Objektdaten
              </h2>
              <div className="grid md:grid-cols-2 gap-4 bg-[#1a1a1a] p-4 rounded-lg">
                <Select
                  disabled={loadingObjects}
                  onValueChange={(value) => {
                    const selected = objects.find((obj) => obj.id === value);
                    if (selected)
                      setFormData((prev) => ({
                        ...prev,
                        object_id: value,
                        address: {
                          street: selected.strasse ?? "",
                          city: selected.ort ?? "",
                          zip: selected.plz ?? "",
                        },
                      }));
                  }}
                >
                  <SelectTrigger className="w-full md:col-span-2 bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 truncate">
                    <SelectValue
                      placeholder={
                        loadingObjects ? "Lade Objekte..." : "Objekt auswählen"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] text-gray-100 border border-[#2a2a2a]">
                    <SelectGroup>
                      <SelectLabel>Objekte</SelectLabel>
                      {objects.map((obj) => (
                        <SelectItem key={obj.id} value={obj.id}>
                          {obj.objektnr} – {obj.strasse}, {obj.ort}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Field
                  label="Straße"
                  name="street"
                  value={formData.address.street}
                  onChange={handleFormChange}
                />
                <Field
                  label="Ort"
                  name="city"
                  value={formData.address.city}
                  onChange={handleFormChange}
                />
                <Field
                  label="Etage"
                  name="floor"
                  placeholder="3. OG"
                  value={formData.floor}
                  onChange={handleFormChange}
                />
                <Field
                  label="Hauseingang"
                  name="entrance"
                  placeholder="A"
                  value={formData.entrance}
                  onChange={handleFormChange}
                />
                <Field
                  label="Zuständigkeit"
                  name="responsibility"
                  placeholder="Hausmeister, Firma XY"
                  value={formData.responsibility}
                  onChange={handleFormChange}
                />
              </div>
            </section>

            <Separator className="bg-[#222]" />

            {/* ⚙️ Mangelbeschreibung */}
            <section>
              <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                Mangelaufnahme
              </h2>
              <div className="space-y-4 bg-[#1a1a1a] p-4 rounded-lg">
                <FieldArea
                  label="Mangel"
                  name="mangel"
                  placeholder="z. B. Lampe im Treppenhaus defekt"
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((p) => ({ ...p, shortage: e.target.value }))
                  }
                />
                <FieldArea
                  label="Maßnahmen"
                  name="massnahmen"
                  placeholder="Reparatur beauftragen, Leuchtmittel tauschen …"
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((p) => ({ ...p, measures: e.target.value }))
                  }
                />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                  <div className="flex flex-col w-full space-y-2">
                    <Label className="text-gray-300">Dringlichkeit</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          priority: v as "hoch" | "mittel" | "niedrig",
                        }))
                      }
                    >
                      <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100">
                        <SelectValue placeholder="Bitte wählen …" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                        <SelectItem value="hoch">Hoch</SelectItem>
                        <SelectItem value="mittel">Mittel</SelectItem>
                        <SelectItem value="niedrig">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label className="mt-4 text-gray-300">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          status: v as "offen" | "in_bearbeitung" | "erledigt", // an dein Enum anpassen!
                        }))
                      }
                    >
                      <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100">
                        <SelectValue placeholder="Bitte wählen …" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                        <SelectItem value="offen">Offen</SelectItem>
                        <SelectItem value="in_bearbeitung">
                          In Bearbeitung
                        </SelectItem>
                        <SelectItem value="erledigt">Erledigt</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* 👇 NEU: Zugewiesen an */}
                    <Label className="mt-4 text-gray-300">Zugewiesen an</Label>
                    <Select
                      value={formData.assigned_to ?? undefined}
                      onValueChange={(v) =>
                        setFormData((p) => ({
                          ...p,
                          assigned_to: v === "__none" ? null : v, // 👈 "__none" -> null
                        }))
                      }
                      disabled={loadingProfiles}
                    >
                      <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100">
                        <SelectValue
                          placeholder={
                            loadingProfiles
                              ? "Lade Nutzer..."
                              : "Mitarbeiter auswählen"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                        <SelectGroup>
                          <SelectLabel>Mitarbeiter</SelectLabel>

                          {/* 👇 statt value="" */}
                          <SelectItem value="__none">Kein(e)</SelectItem>

                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {`${p.first_name ?? ""} ${
                                p.last_name ?? ""
                              }`.trim() || p.id}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* rechts: Fotos-Upload wie bisher */}
                  <div className="space-y-2">
                    <Label className="text-gray-300">Fotos hinzufügen</Label>
                    <Input
                      id="photo"
                      name="photo"
                      type="file"
                      accept="image/*"
                      multiple
                      className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 file:text-gray-400"
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          files: [
                            ...(p.files || []),
                            ...(e.target.files
                              ? Array.from(e.target.files)
                              : []),
                          ],
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <Separator className="bg-[#222]" />

            {/* 🖼 Bilder-Vorschau */}
            {formData.files?.length ? (
              <section>
                <h2 className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                  Bildvorschau
                </h2>
                <ImagePreviewGrid
                  files={formData.files}
                  setFormData={setFormData}
                />
              </section>
            ) : null}

            <Separator className="bg-[#222]" />

            {/* 🗒 Notizen */}
            <section>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-sm uppercase tracking-wide text-gray-400">
                  Zusätzliche Notiz
                </h2>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border border-[#2a2a2a] text-gray-300 bg-[#111] hover:bg-[#222]"
                  onClick={() => setNotes(!notes)}
                >
                  {notes ? "Entfernen" : "Hinzufügen"}
                </Button>
              </div>
              <AnimatePresence>
                {notes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Textarea
                      placeholder="z. B. Bewohner informiert, Rückruf geplant …"
                      className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100"
                      value={formData.notes ?? ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, notes: e.target.value }))
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 mt-4 border-t border-[#1f1f1f] pt-4">
            <Link
              href="/inspections"
              className="text-gray-400 hover:text-gray-200 text-sm"
            >
              Abbrechen
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Wird gespeichert..." : "Absenden"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </main>
  );
}

// 🔹 Eingabefeld (Text)
function Field({ label, name, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{label}</Label>
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 placeholder:text-gray-500"
      />
    </div>
  );
}

// 🔹 Textarea
function FieldArea({ label, placeholder, onChange }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{label}</Label>
      <Textarea
        placeholder={placeholder}
        onChange={onChange}
        className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100 placeholder:text-gray-500"
      />
    </div>
  );
}
