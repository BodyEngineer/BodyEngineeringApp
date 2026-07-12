import { supabase } from "../lib/supabase";

export async function getCurrentMember() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("Logged in user:", user);

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("auth_user_id", user.id);

  console.log("Members found:", data);
  console.log("Error:", error);

  if (error) throw error;

  return data[0];
}
export async function updateMember(memberId, values) {
  const { data, error } = await supabase
    .from("members")
    .update(values)
    .eq("id", memberId)
    .select();

  console.log("Updated rows:", data);

  if (error) throw error;

  return data;
}