import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function OnlineDietPlan() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDietPlan();
  }, []);

  async function loadDietPlan() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/member-login");
        return;
      }

      // Get online coaching client
      const { data: clientData, error: clientError } =
        await supabase
          .from("online_clients")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (clientError) throw clientError;

      if (!clientData) {
        setError("Your online coaching account could not be found.");
        return;
      }

      setClient(clientData);

      // Get diet plan
      const { data: dietData, error: dietError } =
      await supabase
        .from("online_diet_plans")
        .select("*")
        .eq("online_client_id", clientData.id);

    console.log("ONLINE CLIENT ID:", clientData.id);
    console.log("DIET DATA:", dietData);
    console.log("DIET ERROR:", dietError);

    if (dietError) throw dietError;

    setDietPlan(dietData?.[0] || null);
    } catch (err) {
      console.error("Online diet plan error:", err);

      setError(
        err.message || "Unable to load your diet plan."
      );
    } finally {
      setLoading(false);
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
          padding: "30px 20px 60px",
        }}
      >
        {/* Back Button */}

        <button
          type="button"
          onClick={() => navigate("/online-dashboard")}
          style={{
            background: "transparent",
            border: "none",
            color: "#aaa",
            fontSize: "15px",
            cursor: "pointer",
            marginBottom: "25px",
          }}
        >
          ← Back to Dashboard
        </button>

        {/* Header */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >
          <div
            style={{
              fontSize: "52px",
              marginBottom: "10px",
            }}
          >
            🥗
          </div>

          <p
            style={{
              margin: 0,
              color: "#ff4438",
              fontWeight: 700,
              letterSpacing: "1.5px",
              fontSize: "13px",
            }}
          >
            BODY ENGINEERING
          </p>

          <h1
            style={{
              margin: "8px 0",
              fontSize: "36px",
            }}
          >
            My Diet Plan
          </h1>

          {client && (
            <p
              style={{
                opacity: 0.7,
                margin: 0,
              }}
            >
              Personalized nutrition plan for{" "}
              <strong>{client.full_name}</strong>
            </p>
          )}
        </div>

        {/* Error */}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* No Diet Plan */}

        {!error && !dietPlan && (
          <div
            className="assessment-card"
            style={{
              textAlign: "center",
              padding: "60px 25px",
            }}
          >
            <div
              style={{
                fontSize: "50px",
                marginBottom: "15px",
              }}
            >
              🥗
            </div>

            <h2>Diet Plan Coming Soon</h2>

            <p style={{ opacity: 0.7 }}>
              Your personalized nutrition plan will be
              added by your coach.
            </p>
          </div>
        )}

        {/* Diet Plan */}

        {dietPlan && (
          <>
            {/* Nutrition Summary */}

            <section className="assessment-card">
              <h2>📊 Nutrition Targets</h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                <div className="diet-stat-card">
                  <span>🎯 Goal</span>
                  <strong>
                    {dietPlan.goal || "—"}
                  </strong>
                </div>

                <div className="diet-stat-card">
                  <span>🔥 Calories</span>
                  <strong>
                    {dietPlan.calories
                      ? `${dietPlan.calories} kcal`
                      : "—"}
                  </strong>
                </div>

                <div className="diet-stat-card">
                  <span>🥩 Protein</span>
                  <strong>
                    {dietPlan.protein
                      ? `${dietPlan.protein} g`
                      : "—"}
                  </strong>
                </div>

                <div className="diet-stat-card">
                  <span>🍚 Carbs</span>
                  <strong>
                    {dietPlan.carbs
                      ? `${dietPlan.carbs} g`
                      : "—"}
                  </strong>
                </div>

                <div className="diet-stat-card">
                  <span>🥑 Fats</span>
                  <strong>
                    {dietPlan.fats
                      ? `${dietPlan.fats} g`
                      : "—"}
                  </strong>
                </div>
              </div>
            </section>

            {/* Daily Meals */}

            <section
              className="assessment-card"
              style={{ marginTop: 24 }}
            >
              <h2>🍽️ Daily Meal Plan</h2>

              <div
                style={{
                  display: "grid",
                  gap: "15px",
                  marginTop: "20px",
                }}
              >
                {[
                  [
                    "🌅",
                    "Breakfast",
                    dietPlan.breakfast,
                  ],
                  [
                    "🍎",
                    "Mid-Morning",
                    dietPlan.mid_morning,
                  ],
                  [
                    "🍱",
                    "Lunch",
                    dietPlan.lunch,
                  ],
                  [
                    "☕",
                    "Evening Snack",
                    dietPlan.evening_snack,
                  ],
                  [
                    "🌙",
                    "Dinner",
                    dietPlan.dinner,
                  ],
                ].map(([icon, title, meal]) => (
                  <div
                    key={title}
                    className="diet-meal-card"
                  >
                    <h3>
                      {icon} {title}
                    </h3>

                    <p>
                      {meal || "Not specified"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Water */}

            <section
              className="assessment-card"
              style={{ marginTop: 24 }}
            >
              <h2>💧 Hydration</h2>

              <p
                style={{
                  marginTop: 12,
                  fontSize: "17px",
                }}
              >
                {dietPlan.water_target ||
                  "Not specified"}
              </p>
            </section>

            {/* Coach Notes */}

            <section
              className="assessment-card"
              style={{ marginTop: 24 }}
            >
              <h2>📝 Coach Notes</h2>

              <p
                style={{
                  marginTop: 12,
                  lineHeight: 1.7,
                  opacity: 0.85,
                }}
              >
                {dietPlan.coach_notes ||
                  "No additional notes from your coach."}
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
}