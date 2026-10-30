import { supabase } from "../lib/supabase";

const BUCKET = "profile-photos";

// Upload Member Profile Photo
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

export async function uploadAssessmentPhoto(
  memberId,
  assessmentId,
  file,
  photoType
) {
  const extension = file.name.split(".").pop().toLowerCase();

  const filePath =
    `${memberId}/${assessmentId}/${photoType}.${extension}`;

  console.log("📸 ASSESSMENT PHOTO");
  console.log("Bucket:", BUCKET);
  console.log("Member ID:", memberId);
  console.log("Assessment ID:", assessmentId);
  console.log("Photo Type:", photoType);
  console.log("File:", file.name);
  console.log("Path:", filePath);

  const { data: uploadData, error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type,
    });

  console.log("📤 UPLOAD RESULT:", uploadData);
  console.log("📤 UPLOAD ERROR:", error);

  if (error) {
    console.error("❌ ASSESSMENT PHOTO UPLOAD FAILED:", error);
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  console.log(
    "🌐 ASSESSMENT PHOTO URL:",
    publicData.publicUrl
  );

  return publicData.publicUrl;
}