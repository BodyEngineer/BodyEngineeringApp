import { supabase } from "../lib/supabase";

export async function addOnlineClient(values) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("online_clients")
    .insert([
      {
        owner_id: user.id,
        ...values,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getOnlineClients() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("online_clients")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}