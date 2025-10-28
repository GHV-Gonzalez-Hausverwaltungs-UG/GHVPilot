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
  const [formData, setFormData] = React.useState<formdata>({
    object: "",
    floor: "",
    entrance: "",
    address: {
      street: "",
      city: "",
      zip: "",
    },
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
  const [objects, setObjects] = React.useState<any[]>([]);
  const [loadingObjects, setLoadingObjects] = React.useState(true);
  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (name in formData.address) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
        date: formData.date || dayjs().format("YYYY-MM-DD"),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      // 1️⃣ Neue Inspection speichern
      const { data: inspectionData, error: inspectionError } = await supabase
        .from("inspections")
        .insert([
          {
            object_id: formData.object, // das ist die UUID aus "objects"
            floor: formData.floor,
            entrance: formData.entrance,
            responsibility: formData.responsibility,
            inspector: formData.inspector,
            shortage: formData.shortage,
            measures: formData.measures,
            priority: formData.priority,
            date: dayjs(formData.date, "DD.MM.YYYY").format("YYYY-MM-DD"),
            time: formData.time,
            notes: formData.notes || null,
            status: formData.status || "offen",
          },
        ])
        .select("id")
        .single();

      if (inspectionError) throw inspectionError;

      const inspectionId = inspectionData.id;
      console.log("Inspection created:", inspectionId);

      // 2️⃣ Bilder hochladen (falls vorhanden)
      if (formData.files && formData.files.length > 0) {
        const urls = await uploadPictures(formData.files);

        // 3️⃣ Bilder in photos-Tabelle speichern
        const photoRecords = urls.map((url) => ({
          inspection_id: inspectionId,
          url,
          description: null,
        }));

        const { error: photoError } = await supabase
          .from("photos")
          .insert(photoRecords);

        if (photoError) throw photoError;
      }

      alert("Besichtigung erfolgreich gespeichert!");
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      alert("Fehler beim Speichern der Besichtigung!");
    }
  }

  React.useEffect(() => {
    async function loadObjects() {
      const { data, error } = await supabase
        .from("objects")
        .select("id, objektnr, strasse, ort, plz")
        .order("objektnr", { ascending: true });

      if (error) {
        console.error("Fehler beim Laden der Objekte:", error);
      } else {
        setObjects(data || []);
      }
      setLoadingObjects(false);
    }

    loadObjects();
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex justify-center items-start p-6 bg-background text-foreground min-h-screen"
    >
      <Card className="w-full max-w-3xl border border-border bg-card shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-primary flex items-center gap-2">
            Besichtigung erfassen
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Abschnitt: Objektdaten */}
          <section>
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
              Objektdaten
            </h2>
            <div className="grid md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
              <Select
                disabled={loadingObjects}
                onValueChange={(value) => {
                  const selected = objects.find((obj) => obj.id === value);

                  if (selected) {
                    setFormData((prev) => ({
                      ...prev,
                      object: value, // UUID des Objekts
                      address: {
                        street: selected.strasse,
                        city: selected.ort,
                        zip: selected.plz,
                      },
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full md:col-span-2 truncate">
                  <SelectValue
                    placeholder={
                      loadingObjects ? "Lade Objekte..." : "Objekt auswählen"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
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
                placeholder="Musterstraße 10"
                value={formData.address.street ?? ""}
                onChange={handleFormChange}
              />

              <Field
                label="Ort"
                name="city"
                placeholder="München"
                value={formData.address.city ?? ""}
                onChange={handleFormChange}
              />

              <Field
                label="Etage"
                name="floor"
                placeholder="3. OG"
                value={formData.floor ?? ""}
                onChange={handleFormChange}
              />
              <Field
                label="Hauseingang"
                name="entrance"
                placeholder="A"
                value={formData.entrance ?? ""}
                onChange={handleFormChange}
              />

              <Field
                label="Zuständigkeit"
                name="responsibility"
                placeholder="Hausmeister, Firma XY …"
                value={formData.responsibility ?? ""}
                onChange={handleFormChange}
              />
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* Abschnitt: Mangelbeschreibung */}
          <section>
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
              Mangelaufnahme
            </h2>
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="mangel">Mangel</Label>
                <Textarea
                  id="mangel"
                  placeholder="z. B. Lampe im Treppenhaus defekt"
                  className="bg-background/60 border-border text-foreground"
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      shortage: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="massnahmen">Maßnahmen</Label>
                <Textarea
                  id="massnahmen"
                  placeholder="Reparatur beauftragen, Leuchtmittel tauschen …"
                  className="bg-background/60 border-border text-foreground"
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      measures: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
                <div className="flex flex-col w-full space-y-2">
                  <Label htmlFor="dringlichkeit">Dringlichkeit</Label>
                  <Select
                    name="dringlichkeit"
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: value as "hoch" | "mittel" | "niedrig",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-background/60 border-border">
                      <SelectValue placeholder="Bitte wählen …" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoch">Hoch</SelectItem>
                      <SelectItem value="mittel">Mittel</SelectItem>
                      <SelectItem value="niedrig">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    name="status"
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as
                          | "offen"
                          | "in Bearbeitung"
                          | "erledigt",
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-background/60 border-border">
                      <SelectValue placeholder="Bitte wählen …" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="in Bearbeitung">
                        in Bearbeitung
                      </SelectItem>
                      <SelectItem value="erledigt">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Fotos hinzufügen</Label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        files: [
                          ...(prev.files || []),
                          ...(e.target.files ? Array.from(e.target.files) : []),
                        ],
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-border/50" />

          {/* Abschnitt Bilder Vorschau */}
          {formData.files && formData.files.length > 0 && (
            <section>
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
                Bildvorschau
              </h2>
              <ImagePreviewGrid
                files={formData.files ?? []}
                setFormData={setFormData}
              />
            </section>
          )}

          <Separator className="bg-border/50" />

          {/* Abschnitt: Notiz */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground">
                Zusätzliche Notiz
              </h2>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setNotes(!notes)}
                className="border-border/70"
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
                    id="notiz"
                    placeholder="z. B. Bewohner informiert, Rückruf geplant …"
                    className="bg-background/60 border-border text-foreground"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 mt-4">
          <Link href="/" className="hover:bg-muted/50">
            Abbrechen
          </Link>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            💾 Absenden
          </Button>
        </CardFooter>
      </Card>
      {/* <pre className="whitespace-pre-wrap bg-muted/10 p-2 rounded border border-border text-sm">
        {JSON.stringify(formData, null, 2)}
      </pre> */}
    </form>
  );
}

/* Hilfs-Komponente */
type FieldProps = {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

function Field({ label, name, placeholder, value, onChange }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="bg-background/60 border-border text-foreground"
      />
    </div>
  );
}
