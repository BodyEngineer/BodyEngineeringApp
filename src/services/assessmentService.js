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
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateAssessment(id, values) {
  const { data, error } = await supabase
    .from("online_member_assessments")
    .update(values)
    .eq("id", id)
    .select()
    .single();

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