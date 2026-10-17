import { supabase } from "../lib/supabase";

export async function addOnlineClient(values) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase.functions.invoke(
    "create-member",
    {
      body: {
        type: "online",
        owner_id: user.id,
        ...values,
      },
    }
  );

  if (error) throw error;

  return data;
}

export async function getOnlineClients() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("online_clients")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const todayString =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // Calculate client status from expiry date
  return (data || []).map((client) => ({
    ...client,
    status:
      client.expiry_date && client.expiry_date >= todayString
        ? "active"
        : "inactive",
  }));
}

export async function createOnlineClientPayment({
  onlineClientId,
  amount,
  renewalPeriod,
  paymentMethod,
  paymentDate,
  screenshotUrl,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      online_client_id: onlineClientId,
      amount,
      renewal_period: renewalPeriod,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      screenshot_url: screenshotUrl || null,
      status: paymentMethod === "cash" ? "approved" : "pending",
      approved_by: paymentMethod === "cash" ? user.id : null,
      approved_at: paymentMethod === "cash" ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}