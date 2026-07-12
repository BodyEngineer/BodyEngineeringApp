import { supabase } from "../lib/supabase";

const BUCKET = "profile-photos";

export async function uploadProfilePhoto(memberId, file) {
  const extension = file.name.split(".").pop();
  const filePath = `${memberId}/profile.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}