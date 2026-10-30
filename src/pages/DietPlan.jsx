import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function DietPlan() {
  const navigate = useNavigate();
  const { memberId, clientId } = useParams();

  const isOnlineClient = Boolean(clientId);
  const entityId = clientId || memberId;

  const backPath = isOnlineClient
  ? `/online-clients/${entityId}`
  : "/members";

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    goal: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    breakfast: "",
    mid_morning: "",
    lunch: "",
    evening_snack: "",
    dinner: "",
    water_target: "",
    coach_notes: "",
  });

  useEffect(() => {
    loadDietPlan();
  }, [memberId, clientId]);

  async function loadDietPlan() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Get member
      let clientData;
let clientError;

if (isOnlineClient) {
  const result = await supabase
    .from("online_clients")
    .select("*")
    .eq("id", entityId)
    .eq("owner_id", user.id)
    .maybeSingle();

  clientData = result.data;
  clientError = result.error;
} else {
  const result = await supabase
    .from("members")
    .select("*")
    .eq("id", entityId)
    .eq("owner_id", user.id)
    .maybeSingle();

  clientData = result.data;
  clientError = result.error;
}

if (clientError) throw clientError;

if (!clientData) {
  throw new Error(
    isOnlineClient
      ? "Online client not found."
      : "Member not found."
  );
}

setMember(clientData);

      // Get existing diet plan
      let dietData;
      let dietError;

      if (isOnlineClient) {
        const result = await supabase
          .from("online_diet_plans")
          .select("*")
          .eq("online_client_id", entityId)
          .maybeSingle();

        dietData = result.data;
        dietError = result.error;
      } else {
        const result = await supabase
          .from("diet_plans")
          .select("*")
          .eq("member_id", entityId)
          .maybeSingle();

        dietData = result.data;
        dietError = result.error;
      }

      if (dietError) throw dietError;

      if (dietData) {
        setForm({
          goal: dietData.goal || "",
          calories: dietData.calories || "",
          protein: dietData.protein || "",
          carbs: dietData.carbs || "",
          fats: dietData.fats || "",
          breakfast: dietData.breakfast || "",
          mid_morning: dietData.mid_morning || "",
          lunch: dietData.lunch || "",
          evening_snack: dietData.evening_snack || "",
          dinner: dietData.dinner || "",
          water_target: dietData.water_target || "",
          coach_notes: dietData.coach_notes || "",
        });
      }
    } catch (err) {
      console.error("Diet plan loading error:", err);
      setError(err.message || "Unable to load diet plan.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function saveDietPlan(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const payload = isOnlineClient
      ? {
          online_client_id: entityId,
          goal: form.goal,
          calories: form.calories
            ? Number(form.calories)
            : null,
          protein: form.protein
            ? Number(form.protein)
            : null,
          carbs: form.carbs
            ? Number(form.carbs)
            : null,
          fats: form.fats
            ? Number(form.fats)
            : null,
          breakfast: form.breakfast,
          mid_morning: form.mid_morning,
          lunch: form.lunch,
          evening_snack: form.evening_snack,
          dinner: form.dinner,
          water_target: form.water_target,
          coach_notes: form.coach_notes,
          updated_at: new Date().toISOString(),
        }
      : {
          member_id: entityId,
          goal: form.goal,
          calories: form.calories
            ? Number(form.calories)
            : null,
          protein: form.protein
            ? Number(form.protein)
            : null,
          carbs: form.carbs
            ? Number(form.carbs)
            : null,
          fats: form.fats
            ? Number(form.fats)
            : null,
          breakfast: form.breakfast,
          mid_morning: form.mid_morning,
          lunch: form.lunch,
          evening_snack: form.evening_snack,
          dinner: form.dinner,
          water_target: form.water_target,
          coach_notes: form.coach_notes,
          updated_at: new Date().toISOString(),
        };

        const { error: saveError } = await supabase
        .from(isOnlineClient ? "online_diet_plans" : "diet_plans")
        .upsert(
          payload,
          {
            onConflict: isOnlineClient
              ? "online_client_id"
              : "member_id",
          }
        );

      if (saveError) throw saveError;

      setMessage("✅ Diet plan saved successfully.");

      setTimeout(() => {
        navigate(backPath);
      }, 1200);
    } catch (err) {
      console.error("Diet plan save error:", err);

      setError(
        err.message || "Unable to save diet plan."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page">

      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "30px 20px",
        }}
      >

        {/* Back */}

        <button
          type="button"
          onClick={() => navigate(backPath)}
          style={{
            background: "transparent",
            border: "none",
            color: "#aaa",
            fontSize: "15px",
            cursor: "pointer",
            marginBottom: "25px",
          }}
        >
          ← Back
        </button>

        {/* Header */}

        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              color: "#ff4438",
              fontWeight: "800",
              fontSize: "13px",
              letterSpacing: "1px",
            }}
          >
            BODY ENGINEERING
          </div>

          <h1
            style={{
              marginTop: "8px",
              marginBottom: "5px",
            }}
          >
            🥗 Diet Plan
          </h1>

          {member && (
            <p style={{ opacity: 0.7 }}>
              Creating nutrition plan for{" "}
              <strong>{member.full_name}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              padding: "14px 18px",
              marginBottom: "20px",
              borderRadius: "12px",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid #22c55e",
              color: "#22c55e",
              fontWeight: "700",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={saveDietPlan}>

          {/* Nutrition Summary */}

          <section style={sectionStyle}>

            <h2 style={sectionTitle}>
              🎯 Nutrition Summary
            </h2>

            <div style={gridStyle}>

              <Field
                label="Goal"
                name="goal"
                value={form.goal}
                onChange={handleChange}
                placeholder="e.g. Fat Loss"
              />

              <Field
                label="Calories (kcal)"
                name="calories"
                type="number"
                value={form.calories}
                onChange={handleChange}
                placeholder="e.g. 1800"
              />

              <Field
                label="Protein (g)"
                name="protein"
                type="number"
                value={form.protein}
                onChange={handleChange}
                placeholder="e.g. 120"
              />

              <Field
                label="Carbs (g)"
                name="carbs"
                type="number"
                value={form.carbs}
                onChange={handleChange}
                placeholder="e.g. 180"
              />

              <Field
                label="Fats (g)"
                name="fats"
                type="number"
                value={form.fats}
                onChange={handleChange}
                placeholder="e.g. 60"
              />

              <Field
                label="Water Target"
                name="water_target"
                value={form.water_target}
                onChange={handleChange}
                placeholder="e.g. 2.5–3 L / day"
              />

            </div>

          </section>

          {/* Meals */}

          <section style={sectionStyle}>

            <h2 style={sectionTitle}>
              🍽️ Daily Meals
            </h2>

            <MealField
              icon="🌅"
              title="Breakfast"
              name="breakfast"
              value={form.breakfast}
              onChange={handleChange}
              placeholder="Enter breakfast details..."
            />

            <MealField
              icon="🍎"
              title="Mid-Morning"
              name="mid_morning"
              value={form.mid_morning}
              onChange={handleChange}
              placeholder="Enter mid-morning meal..."
            />

            <MealField
              icon="🍱"
              title="Lunch"
              name="lunch"
              value={form.lunch}
              onChange={handleChange}
              placeholder="Enter lunch details..."
            />

            <MealField
              icon="☕"
              title="Evening Snack"
              name="evening_snack"
              value={form.evening_snack}
              onChange={handleChange}
              placeholder="Enter evening snack..."
            />

            <MealField
              icon="🌙"
              title="Dinner"
              name="dinner"
              value={form.dinner}
              onChange={handleChange}
              placeholder="Enter dinner details..."
            />

          </section>

          {/* Coach Notes */}

          <section style={sectionStyle}>

            <h2 style={sectionTitle}>
              📝 Coach Notes
            </h2>

            <textarea
              name="coach_notes"
              value={form.coach_notes}
              onChange={handleChange}
              placeholder="Add instructions, reminders or special coaching notes..."
              rows="5"
              style={textareaStyle}
            />

          </section>

          {/* Save */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              marginTop: "25px",
            }}
          >

            <button
              type="button"
              onClick={() => navigate(backPath)}
              style={secondaryButton}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={primaryButton}
            >
              {saving
                ? "Saving..."
                : "💾 Save Diet Plan"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


/* =========================
   SMALL COMPONENTS
========================= */

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}


function MealField({
  icon,
  title,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div style={{ marginBottom: "20px" }}>

      <label style={labelStyle}>
        {icon} {title}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows="4"
        style={textareaStyle}
      />

    </div>
  );
}


/* =========================
   STYLES
========================= */

const sectionStyle = {
  background: "#111",
  border: "1px solid #333",
  borderRadius: "18px",
  padding: "25px",
  marginBottom: "20px",
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: "22px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "18px",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "700",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "10px",
  border: "1px solid #444",
  background: "#1b1b1b",
  color: "#fff",
  fontSize: "15px",
  outline: "none",
};

const textareaStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #444",
  background: "#1b1b1b",
  color: "#fff",
  fontSize: "15px",
  resize: "vertical",
  outline: "none",
};

const primaryButton = {
  padding: "14px 22px",
  borderRadius: "10px",
  border: "none",
  background: "#ff4438",
  color: "#fff",
  fontWeight: "800",
  fontSize: "15px",
  cursor: "pointer",
};

const secondaryButton = {
  padding: "14px 22px",
  borderRadius: "10px",
  border: "1px solid #444",
  background: "#1b1b1b",
  color: "#fff",
  fontWeight: "700",
  fontSize: "15px",
  cursor: "pointer",
};