import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function WorkoutPlan() {
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMember();
  }, []);

  async function loadMember() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/member-login");
        return;
      }

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        navigate("/member-login");
        return;
      }

      setMember(data);
    } catch (error) {
      console.error("Workout plan error:", error);
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

  if (!member) {
    return null;
  }

  const workoutPlan = [
    {
      day: "Monday",
      focus: "Lower Body + Core",
      exercises: [
        ["Squats", "3 × 12"],
        ["Walking Lunges", "3 × 10 each leg"],
        ["Leg Press", "3 × 12"],
        ["Leg Curl", "3 × 12"],
        ["Glute Bridge", "3 × 15"],
        ["Plank", "3 × 30 sec"],
      ],
    },

    {
      day: "Tuesday",
      focus: "Upper Body",
      exercises: [
        ["Lat Pulldown", "3 × 12"],
        ["Seated Row", "3 × 12"],
        ["Chest Press", "3 × 12"],
        ["Shoulder Press", "3 × 10"],
        ["Biceps Curl", "3 × 12"],
        ["Triceps Pushdown", "3 × 12"],
      ],
    },

    {
      day: "Wednesday",
      focus: "Cardio + Core",
      exercises: [
        ["Treadmill / Brisk Walk", "20 min"],
        ["Cycling", "10 min"],
        ["Crunches", "3 × 15"],
        ["Leg Raises", "3 × 12"],
        ["Russian Twist", "3 × 15"],
        ["Plank", "3 × 30 sec"],
      ],
    },

    {
      day: "Thursday",
      focus: "Lower Body",
      exercises: [
        ["Goblet Squat", "3 × 12"],
        ["Romanian Deadlift", "3 × 10"],
        ["Step Ups", "3 × 10 each leg"],
        ["Leg Extension", "3 × 12"],
        ["Glute Kickback", "3 × 15"],
        ["Calf Raises", "3 × 15"],
      ],
    },

    {
      day: "Friday",
      focus: "Upper Body + Core",
      exercises: [
        ["Lat Pulldown", "3 × 12"],
        ["Chest Press", "3 × 12"],
        ["Dumbbell Row", "3 × 10"],
        ["Lateral Raises", "3 × 15"],
        ["Triceps Pushdown", "3 × 12"],
        ["Plank", "3 × 30 sec"],
      ],
    },

    {
      day: "Saturday",
      focus: "Full Body Conditioning",
      exercises: [
        ["Bodyweight Squats", "3 × 15"],
        ["Push Ups", "3 × 10"],
        ["Dumbbell Row", "3 × 12"],
        ["Lunges", "3 × 10 each leg"],
        ["Mountain Climbers", "3 × 20"],
        ["Plank", "3 × 30 sec"],
      ],
    },

    {
      day: "Sunday",
      focus: "Rest & Recovery",
      exercises: [
        ["Light Walking", "15–20 min"],
        ["Stretching", "10–15 min"],
        ["Mobility Work", "10 min"],
      ],
    },
  ];

  return (
    <div className="page">

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              color: "#ff4438",
              fontWeight: "700",
              letterSpacing: "1px",
            }}
          >
            BODY ENGINEERING
          </p>

          <h1 style={{ margin: "5px 0" }}>
            🏋️ Workout Plan
          </h1>

          <p style={{ opacity: 0.7 }}>
            Welcome, {member.full_name}
          </p>
        </div>

        <button
          onClick={() => navigate("/member-dashboard")}
          style={{
            padding: "11px 18px",
            borderRadius: "10px",
            border: "1px solid #444",
            background: "#1b1b1b",
            color: "#fff",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Dashboard
        </button>
      </div>

      {/* MEMBER INFO */}

      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: "18px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "15px",
          }}
        >
          <div>
            <small style={{ opacity: 0.6 }}>
              MEMBER
            </small>
            <strong style={{ display: "block", marginTop: "5px" }}>
              {member.full_name}
            </strong>
          </div>

          <div>
            <small style={{ opacity: 0.6 }}>
              MEMBERSHIP
            </small>
            <strong style={{ display: "block", marginTop: "5px" }}>
              {member.membership_type || "Fitness"}
            </strong>
          </div>

          <div>
            <small style={{ opacity: 0.6 }}>
              GOAL
            </small>
            <strong style={{ display: "block", marginTop: "5px" }}>
              Fitness & Strength
            </strong>
          </div>
        </div>
      </div>

      {/* WORKOUT DAYS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {workoutPlan.map((workout) => (
          <div
            key={workout.day}
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "18px",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {workout.day}
              </h2>

              <span
                style={{
                  fontSize: "12px",
                  padding: "6px 9px",
                  borderRadius: "8px",
                  background: "#ff4438",
                  fontWeight: "700",
                }}
              >
                WORKOUT
              </span>
            </div>

            <p
              style={{
                marginTop: "5px",
                marginBottom: "18px",
                color: "#ff8a80",
                fontWeight: "600",
              }}
            >
              {workout.focus}
            </p>

            {workout.exercises.map(
              ([exercise, reps], index) => (
                <div
                  key={exercise}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    padding: "12px 0",
                    borderBottom:
                      index !==
                      workout.exercises.length - 1
                        ? "1px solid #292929"
                        : "none",
                  }}
                >
                  <span>
                    {index + 1}. {exercise}
                  </span>

                  <strong
                    style={{
                      whiteSpace: "nowrap",
                      color: "#ddd",
                    }}
                  >
                    {reps}
                  </strong>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      {/* COACH NOTE */}

      <div
        style={{
          marginTop: "25px",
          padding: "22px",
          borderRadius: "18px",
          background: "#111",
          border: "1px solid #333",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          💡 Coach's Note
        </h3>

        <p style={{ marginBottom: 0, opacity: 0.8 }}>
          Consistency beats intensity. Focus on proper
          form, controlled movement and gradual
          progression. Rest and recovery are part of
          your training too.
        </p>
      </div>

    </div>
  );
}