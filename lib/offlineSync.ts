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
      const payload = { ...item.data } as any; // ✅ wichtig!

      if (payload.object && !payload.object_id) {
        payload.object_id = payload.object.id ?? null;
        delete payload.object;
      }

      if (payload.updatedAt && !payload.updatedat) {
        payload.updatedat = payload.updatedAt;
        delete payload.updatedAt;
      }

      const { error } = await supabase
        .from("inspections")
        .update(payload)
        .eq("id", item.id);
      if (error) throw error;

      if (item.photosToAdd?.length) {
        const urls = await uploadPictures(item.photosToAdd);
        await supabase
          .from("photos")
          .insert(urls.map((url) => ({ inspection_id: item.id, url })));
      }

      await localDB.inspections.update(item.id, { status: "synced" });
    } catch (err) {
      console.error("Sync-Fehler (Inspection):", err);
    }
  }
}
