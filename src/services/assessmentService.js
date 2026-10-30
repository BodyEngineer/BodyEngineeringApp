import { supabase } from "../lib/supabase";

export async function getAssessments(onlineMemberId) {
  const { data, error } = await supabase
    .from("online_member_assessments")
    .select("*")
    .eq("online_member_id", onlineMemberId)
    .order("assessment_date", { ascending: false });

  if (error) throw error;

  return data;
}

export async function addAssessment(values) {
  const { data, error } = await supabase
    .from("online_member_assessments")
    .insert(values)
    .select("*")
    .single();

  console.log("ADD ASSESSMENT RAW DATA:", data);
  console.log("ADD ASSESSMENT RAW ERROR:", error);

  if (error) throw error;

  return data;
}

export async function updateAssessment(id, values) {
  console.log("UPDATE ASSESSMENT ID:", id);
  console.log("UPDATE VALUES:", values);

  const { data, error } = await supabase
    .from("online_member_assessments")
    .update(values)
    .eq("id", id)
    .select("*");

  console.log("UPDATE RAW DATA:", data);
  console.log("UPDATE RAW ERROR:", error);

  if (error) throw error;

  return data;
}

export async function deleteAssessment(id) {
  const { error } = await supabase
    .from("online_member_assessments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}