import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function MemberDietPlan() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
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

      // Get member
      const { data: memberData, error: memberError } =
        await supabase
          .from("members")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (memberError) throw memberError;

      if (!memberData) {
        setError("Your member account could not be found.");
        return;
      }

      setMember(memberData);

      // Get diet plan
      const { data: dietData, error: dietError } =
        await supabase
          .from("diet_plans")
          .select("*")
          .eq("member_id", memberData.id)
          .maybeSingle();

      if (dietError) throw dietError;

      setDietPlan(dietData);
    } catch (err) {
      console.error("Diet plan error:", err);

      setError(
        err.message ||
          "Unable to load your diet plan."
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
          maxWidth: "900px",
          margin: "0 auto",
          padding: "30px 20px",
        }}
      >

        <button
          type="button"
          onClick={() => navigate("/member-dashboard")}
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

        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: "20px",
            padding: "30px",
          }}
        >

          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: "10px",
              }}
            >
              🥗
            </div>

            <h1>My Diet Plan</h1>

            {member && (
              <p style={{ opacity: 0.7 }}>
                Personalized nutrition plan for{" "}
                <strong>{member.full_name}</strong>
              </p>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {!error && !dietPlan && (
            <div
              style={{
                textAlign: "center",
                padding: "50px 20px",
                background: "#1b1b1b",
                borderRadius: "16px",
              }}
            >
              <div style={{ fontSize: "40px" }}>
                🥗
              </div>

              <h2>
                Diet Plan Coming Soon
              </h2>

              <p style={{ opacity: 0.7 }}>
                Your personalized diet plan
                will be added by your coach.
              </p>
            </div>
          )}

          {dietPlan && (
            <>
              {/* Nutrition Summary */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                  marginBottom: "30px",
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

              {/* Meals */}

              <div className="diet-meals">

                {[
                  ["🌅", "Breakfast", dietPlan.breakfast],
                  ["🍎", "Mid-Morning", dietPlan.mid_morning],
                  ["🍱", "Lunch", dietPlan.lunch],
                  ["☕", "Evening Snack", dietPlan.evening_snack],
                  ["🌙", "Dinner", dietPlan.dinner],
                ].map(
                  ([icon, title, meal]) => (
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
                  )
                )}

              </div>

              {/* Water */}

              <div className="diet-info-card">
                <h3>💧 Water Target</h3>

                <p>
                  {dietPlan.water_target ||
                    "Not specified"}
                </p>
              </div>

              {/* Coach Notes */}

              <div className="diet-info-card">
                <h3>📝 Coach Notes</h3>

                <p>
                  {dietPlan.coach_notes ||
                    "No additional notes."}
                </p>
              </div>

            </>
          )}

        </div>
      </div>
    </div>
  );
}