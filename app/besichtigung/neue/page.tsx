"use client";

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

import { formdata } from "@/types/formdatatype";
import { uploadPictures } from "@/lib/supabase/fileUpload";
import { supabase } from "@/lib/supabase/supabaseclient";
import { ImagePreviewGrid } from "@/components/imagePreviewGrid";
import dayjs from "dayjs";
import Link from "next/link";

export default function NeueBesichtigungsForm() {
  const [notes, setNotes] = React.useState(false);
  const [objects, setObjects] = React.useState<any[]>([]);
  const [loadingObjects, setLoadingObjects] = React.useState(true);

  const [formData, setFormData] = React.useState<formdata>({
    object: "",
    floor: "",
    entrance: "",
    address: { street: "", city: "", zip: "" },
    inspector: "",
    responsibility: "",
    measures: "",
    shortage: "",
    priority: "mittel",
    status: "offen",
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    files: undefined,
  });

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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 💾 Submit
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { data: inspectionData, error: inspectionError } = await supabase
        .from("inspections")
        .insert([
          {
            object_id: formData.object,
            floor: formData.floor,
            entrance: formData.entrance,
            responsibility: formData.responsibility,
            inspector: formData.inspector,
            shortage: formData.shortage,
            measures: formData.measures,
            priority: formData.priority,
            date: formData.date,
            time: formData.time,
            notes: formData.notes || null,
            status: formData.status || "offen",
          },
        ])
        .select("id")
        .single();

      if (inspectionError) throw inspectionError;
      const inspectionId = inspectionData.id;

      if (formData.files?.length) {
        const urls = await uploadPictures(formData.files);
        const photoRecords = urls.map((url) => ({
          inspection_id: inspectionId,
          url,
        }));
        const { error: photoError } = await supabase
          .from("photos")
          .insert(photoRecords);
        if (photoError) throw photoError;
      }

      alert("✅ Besichtigung erfolgreich gespeichert!");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      alert("❌ Fehler beim Speichern der Besichtigung!");
    }
  }

  // 📦 Objekte laden
  React.useEffect(() => {
    async function loadObjects() {
      const { data, error } = await supabase
        .from("objects")
        .select("id, objektnr, strasse, ort, plz")
        .order("objektnr", { ascending: true });

      if (!error && data) setObjects(data);
      setLoadingObjects(false);
    }
    loadObjects();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 flex justify-center items-start p-6">
      <Card className="w-full max-w-3xl bg-[#111] border border-[#1f1f1f] text-gray-100 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-blue-400">
            🏢 Besichtigung erfassen
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
                      object: value,
                      address: {
                        street: selected.strasse,
                        city: selected.ort,
                        zip: selected.plz,
                      },
                    }));
                }}
              >
                <SelectTrigger className="w-full md:col-span-2 bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100">
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

                  <Label className="text-gray-300">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData((p) => ({
                        ...p,
                        status: v as "offen" | "in Bearbeitung" | "erledigt",
                      }))
                    }
                  >
                    <SelectTrigger className="bg-[#0d0d0d] border border-[#2a2a2a] text-gray-100">
                      <SelectValue placeholder="Bitte wählen …" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100">
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in Bearbeitung">
                        In Bearbeitung
                      </SelectItem>
                      <SelectItem value="erledigt">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                          ...(e.target.files ? Array.from(e.target.files) : []),
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
                className="border border-[#2a2a2a] text-gray-300 hover:bg-[#222]"
                onClick={() => setNotes(!notes)}
              >
                {notes ? "❌ Entfernen" : "📝 Hinzufügen"}
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
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
            💾 Absenden
          </Button>
        </CardFooter>
      </Card>
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
