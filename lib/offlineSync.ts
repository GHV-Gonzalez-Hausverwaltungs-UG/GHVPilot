import { localDB } from "@/lib/localdb";
import { uploadPictures } from "@/lib/supabase/fileUpload";
import { supabase } from "@/lib/supabase/supabaseclient";

export async function syncOfflineData() {
  const pending = await localDB.inspections
    .where("status")
    .equals("pending")
    .toArray();

  for (const item of pending) {
    try {
      const payload = { ...item.data } as Record<string, any>;

      // 🧹 Cleanup: entferne Felder, die es in Supabase nicht gibt
      if ("object" in payload) {
        payload.object_id = payload.object?.id ?? payload.object_id ?? null;
        delete payload.object;
      }

      if ("photos" in payload) {
        delete payload.photos; // ⚡️ ganz wichtig
      }

      if ("updatedAt" in payload) {
        payload.updatedat = payload.updatedAt;
        delete payload.updatedAt;
      }

      // 🛰️ Sync zu Supabase
      const { error } = await supabase
        .from("inspections")
        .update(payload)
        .eq("id", item.id);

      if (error) throw error;

      // 📸 Falls offline Fotos existieren
      if (item.photosToAdd?.length) {
        const urls = await uploadPictures(item.photosToAdd);
        await supabase
          .from("photos")
          .insert(urls.map((url) => ({ inspection_id: item.id, url })));
      }

      // ✅ Markiere als synced
      await localDB.inspections.update(item.id, { status: "synced" });
    } catch (err) {
      console.error("Sync-Fehler (Inspection):", err);
    }
  }
}
