import { supabase } from "@/lib/supabase/supabaseclient";

export async function uploadPictures(files: File[]) {
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}_${file.name}`;
    console.log("🔹 Uploading:", fileName);

    const { data, error } = await supabase.storage
      .from("pictures")
      .upload(fileName, file);

    if (error) {
      console.error("❌ Upload error:", error);
      continue;
    }

    console.log("✅ Uploaded:", data);

    const { data: urlData } = supabase.storage
      .from("pictures")
      .getPublicUrl(data.path);

    uploadedUrls.push(urlData.publicUrl);
  }

  console.log("✅ Final uploaded URLs:", uploadedUrls);
  return uploadedUrls;
}
