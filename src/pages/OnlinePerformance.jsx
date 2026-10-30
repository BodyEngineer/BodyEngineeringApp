import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function OnlinePerformance() {
  const [exercises, setExercises] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPerformance();
  }, []);

  async function loadPerformance() {
    try {
      setLoading(true);
      setError("");

      // ---------------------------------------
      // 1. GET WORKOUT EXERCISES
      // ---------------------------------------
      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from("online_workout_exercises")
        .select(`
          id,
          workout_plan_id,
          day_name,
          exercise_name,
          sets,
          reps,
          weight,
          rest,
          tempo,
          notes,
          exercise_order
        `)
        .order("exercise_order", {
          ascending: true,
        });

      if (exerciseError) {
        throw exerciseError;
      }

      // ---------------------------------------
      // 2. GET COMPLETED TASKS
      // ---------------------------------------
      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from("online_task_completions")
        .select(`
          id,
          task_id,
          completed_at
        `)
        .order("completed_at", {
          ascending: false,
        });

      if (completionError) {
        throw completionError;
      }

      setExercises(exerciseData || []);
      setCompletions(completionData || []);
    } catch (err) {
      console.error("Online Performance Error:", err);

      setError(
        err?.message || "Unable to load performance."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------
  // CURRENT WEEK
  // Monday → Sunday
  // ---------------------------------------
  const weekStart = useMemo(() => {
    const today = new Date();
    const day = today.getDay();

    const difference =
      day === 0 ? -6 : 1 - day;

    const monday = new Date(today);

    monday.setDate(
      today.getDate() + difference
    );

    monday.setHours(0, 0, 0, 0);

    return monday;
  }, []);

  // ---------------------------------------
  // COMPLETED EXERCISES
  // ---------------------------------------
  const completedExerciseIds = useMemo(() => {
    const completedIds = new Set();

    completions.forEach((completion) => {
      if (!completion.completed_at) return;

      const completedDate =
        new Date(completion.completed_at);

      if (completedDate >= weekStart) {
        completedIds.add(completion.task_id);
      }
    });

    return completedIds;
  }, [completions, weekStart]);

  // ---------------------------------------
  // GROUP BY DAY
  // ---------------------------------------
  const days = useMemo(() => {
    const grouped = {};

    exercises.forEach((exercise) => {
      const dayName =
        exercise.day_name || "Other";

      if (!grouped[dayName]) {
        grouped[dayName] = [];
      }

      grouped[dayName].push(exercise);
    });

    return Object.entries(grouped)
      .sort(([dayA], [dayB]) => {
        const numberA =
          parseInt(
            dayA.replace(/\D/g, ""),
            10
          ) || 999;

        const numberB =
          parseInt(
            dayB.replace(/\D/g, ""),
            10
          ) || 999;

        return numberA - numberB;
      })
      .map(([dayName, dayExercises]) => ({
        dayName,
        exercises: dayExercises.sort(
          (a, b) =>
            (a.exercise_order || 0) -
            (b.exercise_order || 0)
        ),
      }));
  }, [exercises]);

  // ---------------------------------------
  // TOTAL STATS
  // ---------------------------------------
  const totalExercises = exercises.length;

  const totalCompleted = exercises.filter(
    (exercise) =>
      completedExerciseIds.has(exercise.id)
  ).length;

  const totalRemaining =
    Math.max(
      totalExercises - totalCompleted,
      0
    );

  const overallPercentage =
    totalExercises > 0
      ? Math.round(
          (totalCompleted /
            totalExercises) *
            100
        )
      : 0;

  // ---------------------------------------
  // PROGRESS CIRCLE
  // ---------------------------------------
  const circleRadius = 52;
  const circleCircumference =
    2 * Math.PI * circleRadius;

  const circleOffset =
    circleCircumference -
    (overallPercentage /
      100) *
      circleCircumference;

  // ---------------------------------------
  // LOADING
  // ---------------------------------------
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingCard}>
          <div style={styles.spinner}></div>

          <h2 style={styles.loadingTitle}>
            Loading Performance
          </h2>

          <p style={styles.loadingText}>
            Preparing your weekly workout report...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------
  // ERROR
  // ---------------------------------------
  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>
              !
            </div>

            <h2>
              Unable to load performance
            </h2>

            <p>{error}</p>

            <button
              onClick={loadPerformance}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------
  // PAGE
  // ---------------------------------------
  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* -------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------- */}

        <div style={styles.header}>

          <div>
            <div style={styles.eyebrow}>
              BODY ENGINEERING
            </div>

            <h1 style={styles.title}>
              Your Performance
            </h1>

            <p style={styles.subtitle}>
              Track your training consistency
              and weekly workout progress.
            </p>
          </div>

          <div style={styles.weekBadge}>
            <span style={styles.weekDot}></span>
            Current Week
          </div>

        </div>


        {/* -------------------------------- */}
        {/* HERO PERFORMANCE CARD */}
        {/* -------------------------------- */}

        <section style={styles.performanceHero}>

          <div style={styles.heroGlow}></div>

          <div style={styles.heroContent}>

            <div>
              <p style={styles.heroEyebrow}>
                WEEKLY PERFORMANCE
              </p>

              <h2 style={styles.heroTitle}>
                Keep pushing.
              </h2>

              <p style={styles.heroText}>
                Monday → Sunday
              </p>

              <div style={styles.heroStats}>

                <div style={styles.heroStat}>
                  <strong>
                    {totalCompleted}
                  </strong>

                  <span>
                    Completed
                  </span>
                </div>

                <div style={styles.statDivider}></div>

                <div style={styles.heroStat}>
                  <strong>
                    {totalRemaining}
                  </strong>

                  <span>
                    Remaining
                  </span>
                </div>

                <div style={styles.statDivider}></div>

                <div style={styles.heroStat}>
                  <strong>
                    {totalExercises}
                  </strong>

                  <span>
                    Total
                  </span>
                </div>

              </div>
            </div>


            {/* PROGRESS CIRCLE */}

            <div style={styles.progressCircleWrapper}>

              <svg
                width="150"
                height="150"
                viewBox="0 0 150 150"
              >

                <circle
                  cx="75"
                  cy="75"
                  r={circleRadius}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="11"
                />

                <circle
                  cx="75"
                  cy="75"
                  r={circleRadius}
                  fill="none"
                  stroke="#ff4438"
                  strokeWidth="11"
                  strokeLinecap="round"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={circleOffset}
                  transform="rotate(-90 75 75)"
                  style={{
                    transition:
                      "stroke-dashoffset 0.8s ease",
                  }}
                />

                <text
                  x="75"
                  y="72"
                  textAnchor="middle"
                  fill="white"
                  fontSize="26"
                  fontWeight="800"
                >
                  {overallPercentage}%
                </text>

                <text
                  x="75"
                  y="92"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.65)"
                  fontSize="10"
                >
                  COMPLETE
                </text>

              </svg>

            </div>

          </div>
        </section>


        {/* -------------------------------- */}
        {/* NO EXERCISES */}
        {/* -------------------------------- */}

        {days.length === 0 && (
          <div style={styles.emptyCard}>

            <div style={styles.emptyIcon}>
              🏋️
            </div>

            <h2>
              No workouts yet
            </h2>

            <p>
              Your coach hasn't assigned
              any exercises yet.
            </p>

          </div>
        )}


        {/* -------------------------------- */}
        {/* DAYS */}
        {/* -------------------------------- */}

        <div style={styles.daysContainer}>

          {days.map((day) => {

            const completedCount =
              day.exercises.filter(
                (exercise) =>
                  completedExerciseIds.has(
                    exercise.id
                  )
              ).length;

            const totalCount =
              day.exercises.length;

            const percentage =
              totalCount > 0
                ? Math.round(
                    (completedCount /
                      totalCount) *
                      100
                  )
                : 0;

            return (
              <section
                key={day.dayName}
                style={styles.dayCard}
              >

                {/* DAY HEADER */}

                <div style={styles.dayHeader}>

                  <div>

                    <div style={styles.dayLabel}>
                      TRAINING DAY
                    </div>

                    <h2 style={styles.dayTitle}>
                      {day.dayName}
                    </h2>

                  </div>


                  <div style={styles.dayProgress}>

                    <div style={styles.dayPercentage}>
                      {percentage}%
                    </div>

                    <div style={styles.dayCompleted}>
                      {completedCount} /{" "}
                      {totalCount}
                    </div>

                  </div>

                </div>


                {/* DAY PROGRESS BAR */}

                <div style={styles.progressBarBackground}>

                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${percentage}%`,
                    }}
                  />

                </div>


                {/* EXERCISES */}

                <div>

                  {day.exercises.map(
                    (exercise, index) => {

                      const completed =
                        completedExerciseIds.has(
                          exercise.id
                        );

                      return (
                        <div
                          key={exercise.id}
                          style={{
                            ...styles.exerciseRow,
                            borderBottom:
                              index ===
                              day.exercises.length - 1
                                ? "none"
                                : "1px solid #eeeeee",
                          }}
                        >

                          {/* STATUS */}

                          <div
                            style={{
                              ...styles.statusCircle,
                              ...(completed
                                ? styles.statusCompleted
                                : styles.statusPending),
                            }}
                          >
                            {completed
                              ? "✓"
                              : index + 1}
                          </div>


                          {/* EXERCISE INFO */}

                          <div style={styles.exerciseInfo}>

                            <div
                              style={{
                                ...styles.exerciseName,
                                ...(completed
                                  ? styles.exerciseCompleted
                                  : {}),
                              }}
                            >
                              {exercise.exercise_name}
                            </div>


                            <div style={styles.exerciseMeta}>

                              {exercise.sets && (
                                <span>
                                  {exercise.sets} sets
                                </span>
                              )}

                              {exercise.reps && (
                                <span>
                                  • {exercise.reps} reps
                                </span>
                              )}

                              {exercise.weight && (
                                <span>
                                  • {exercise.weight}
                                </span>
                              )}

                              {exercise.rest && (
                                <span>
                                  • Rest: {exercise.rest}
                                </span>
                              )}

                            </div>

                          </div>


                          {/* STATUS */}

                          <div
                            style={{
                              ...styles.statusBadge,
                              ...(completed
                                ? styles.completedBadge
                                : styles.pendingBadge),
                            }}
                          >
                            {completed
                              ? "Completed"
                              : "Pending"}
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </section>
            );
          })}

        </div>


        {/* -------------------------------- */}
        {/* MOTIVATION */}
        {/* -------------------------------- */}

        <div style={styles.motivationCard}>

          <div style={styles.motivationIcon}>
            🔥
          </div>

          <div>

            <h3 style={styles.motivationTitle}>
              Consistency creates results.
            </h3>

            <p style={styles.motivationText}>
              Complete your assigned workouts
              and keep building your momentum.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}


/* ================================================= */
/* INLINE STYLES — NO CSS FILE REQUIRED */
/* ================================================= */

const styles = {
    page: {
      minHeight: "100vh",
      background:
        "linear-gradient(180deg, #f7f7f8 0%, #eef0f3 45%, #f5f6f8 100%)",
      padding: "34px 20px 70px",
      fontFamily:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#111111",
    },

    container: {
      width: "100%",
      maxWidth: 1120,
      margin: "0 auto",
    },

    /* =========================
       HEADER
    ========================= */

    header: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      marginBottom: 30,
    },

    eyebrow: {
      fontSize: 11,
      fontWeight: 900,
      letterSpacing: "2.5px",
      color: "#ff4438",
      marginBottom: 10,
      textTransform: "uppercase",
    },

    title: {
      margin: 0,
      fontSize: "clamp(34px, 5vw, 52px)",
      fontWeight: 950,
      letterSpacing: "-2.5px",
      lineHeight: 1,
      color: "#101114",
    },

    subtitle: {
      margin: "12px 0 0",
      color: "#737780",
      fontSize: 15,
      lineHeight: 1.6,
      maxWidth: 520,
    },

    weekBadge: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      background: "rgba(255,255,255,0.92)",
      border: "1px solid rgba(0,0,0,0.07)",
      padding: "11px 16px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 800,
      color: "#33363b",
      boxShadow:
        "0 8px 25px rgba(0,0,0,0.06)",
      whiteSpace: "nowrap",
      backdropFilter: "blur(12px)",
    },

    weekDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#22c55e",
      boxShadow:
        "0 0 0 5px rgba(34,197,94,0.12), 0 0 12px rgba(34,197,94,0.35)",
    },

    /* =========================
       HERO
    ========================= */

    performanceHero: {
      position: "relative",
      overflow: "hidden",
      background:
        "linear-gradient(135deg, #0b0b0d 0%, #141416 48%, #211312 100%)",
      borderRadius: 30,
      padding: "38px 40px",
      color: "#ffffff",
      boxShadow:
        "0 24px 60px rgba(0,0,0,0.20)",
      marginBottom: 30,
      border:
        "1px solid rgba(255,255,255,0.07)",
    },

    heroGlow: {
      position: "absolute",
      width: 380,
      height: 380,
      right: -130,
      top: -180,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255,68,56,0.38) 0%, rgba(255,68,56,0.14) 32%, transparent 70%)",
      pointerEvents: "none",
      filter: "blur(2px)",
    },

    heroContent: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 40,
    },

    heroEyebrow: {
      margin: 0,
      color: "#ff6258",
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: "2.5px",
    },

    heroTitle: {
      margin: "9px 0 5px",
      fontSize: "clamp(30px, 5vw, 44px)",
      fontWeight: 950,
      letterSpacing: "-1.8px",
      lineHeight: 1.05,
    },

    heroText: {
      margin: 0,
      color: "rgba(255,255,255,0.55)",
      fontSize: 13,
    },

    heroStats: {
      display: "flex",
      alignItems: "center",
      gap: 26,
      marginTop: 30,
      flexWrap: "wrap",
    },

    heroStat: {
      display: "flex",
      flexDirection: "column",
      gap: 4,
      minWidth: 65,
    },

    heroStatStrong: {
        fontSize: 28,
        lineHeight: 1,
        fontWeight: 950,
        color: "#ffffff",
      },

      heroStatSpan: {
        color: "rgba(255,255,255,0.48)",
        fontSize: 10,
        fontWeight: 700,
      },

      statDivider: {
        width: 1,
        height: 38,
        background: "rgba(255,255,255,0.12)",
      },

    progressCircleWrapper: {
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 155,
      height: 155,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(255,68,56,0.08), transparent 68%)",
    },

    /* =========================
       DAYS
    ========================= */

    daysContainer: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },

    dayCard: {
      position: "relative",
      background:
        "rgba(255,255,255,0.96)",
      borderRadius: 25,
      overflow: "hidden",
      border:
        "1px solid rgba(17,24,39,0.07)",
      boxShadow:
        "0 12px 35px rgba(0,0,0,0.055)",
      transition:
        "transform 0.25s ease, box-shadow 0.25s ease",
    },

    dayHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      padding: "25px 27px 18px",
    },

    dayLabel: {
      fontSize: 9,
      fontWeight: 900,
      letterSpacing: "2px",
      color: "#ff4438",
      marginBottom: 6,
    },

    dayTitle: {
      margin: 0,
      fontSize: 23,
      fontWeight: 900,
      letterSpacing: "-0.5px",
      color: "#121316",
    },

    dayProgress: {
      textAlign: "right",
    },

    dayPercentage: {
      fontSize: 21,
      fontWeight: 950,
      letterSpacing: "-0.5px",
      color: "#111318",
    },

    dayCompleted: {
      marginTop: 3,
      fontSize: 10,
      fontWeight: 700,
      color: "#a0a3aa",
    },

    progressBarBackground: {
      height: 6,
      background:
        "linear-gradient(90deg, #f1f2f3, #e8e9eb)",
      margin: "0 27px 7px",
      borderRadius: 999,
      overflow: "hidden",
    },

    progressBar: {
      height: "100%",
      background:
        "linear-gradient(90deg, #ff4438 0%, #ff655c 55%, #ff8a82 100%)",
      borderRadius: 999,
      boxShadow:
        "0 0 12px rgba(255,68,56,0.30)",
      transition:
        "width 0.6s cubic-bezier(.4,0,.2,1)",
    },

    /* =========================
       EXERCISE ROW
    ========================= */

    exerciseRow: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "19px 27px",
      transition:
        "background 0.2s ease",
    },

    statusCircle: {
      width: 42,
      height: 42,
      minWidth: 42,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 900,
      border: "1px solid transparent",
    },

    statusCompleted: {
      background:
        "linear-gradient(135deg, #dcfce7, #bbf7d0)",
      color: "#15803d",
      borderColor: "#bbf7d0",
      boxShadow:
        "0 4px 12px rgba(34,197,94,0.12)",
    },

    statusPending: {
      background:
        "linear-gradient(135deg, #f7f7f8, #eceef1)",
      color: "#9ca0a8",
      borderColor: "#e5e7eb",
    },

    exerciseInfo: {
      flex: 1,
      minWidth: 0,
    },

    exerciseName: {
      fontSize: 15,
      fontWeight: 850,
      color: "#30343b",
      letterSpacing: "-0.2px",
      textTransform: "capitalize",
    },

    exerciseCompleted: {
      color: "#111318",
    },

    exerciseMeta: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
      fontSize: 11,
      fontWeight: 600,
      color: "#a1a5ad",
    },

    statusBadge: {
      padding: "7px 12px",
      borderRadius: 999,
      fontSize: 10,
      fontWeight: 900,
      letterSpacing: "0.2px",
      whiteSpace: "nowrap",
    },

    completedBadge: {
      background:
        "linear-gradient(135deg, #dcfce7, #d1fae5)",
      color: "#15803d",
      border:
        "1px solid #bbf7d0",
    },

    pendingBadge: {
      background:
        "linear-gradient(135deg, #f5f6f7, #eceef0)",
      color: "#737780",
      border:
        "1px solid #e5e7eb",
    },

    /* =========================
       MOTIVATION
    ========================= */

    motivationCard: {
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      gap: 17,
      marginTop: 24,
      padding: "21px 25px",
      borderRadius: 22,
      background:
        "linear-gradient(135deg, #fff8f7 0%, #ffffff 100%)",
      border:
        "1px solid rgba(255,68,56,0.14)",
      boxShadow:
        "0 10px 30px rgba(255,68,56,0.05)",
    },

    motivationIcon: {
      width: 48,
      height: 48,
      minWidth: 48,
      borderRadius: 15,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "linear-gradient(135deg, #fff0ee, #ffe4e1)",
      fontSize: 21,
      boxShadow:
        "0 6px 16px rgba(255,68,56,0.08)",
    },

    motivationTitle: {
      margin: 0,
      fontSize: 15,
      fontWeight: 900,
      letterSpacing: "-0.2px",
    },

    motivationText: {
      margin: "5px 0 0",
      color: "#777b83",
      fontSize: 12,
      lineHeight: 1.5,
    },

    /* =========================
       EMPTY
    ========================= */

    emptyCard: {
      background:
        "rgba(255,255,255,0.96)",
      borderRadius: 25,
      padding: 60,
      textAlign: "center",
      border:
        "1px solid rgba(17,24,39,0.07)",
      boxShadow:
        "0 12px 35px rgba(0,0,0,0.05)",
    },

    emptyIcon: {
      width: 70,
      height: 70,
      margin: "0 auto 18px",
      borderRadius: 22,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "linear-gradient(135deg, #fff0ee, #ffe4e1)",
      fontSize: 32,
    },

    /* =========================
       LOADING
    ========================= */

    loadingCard: {
      maxWidth: 450,
      margin: "15vh auto",
      textAlign: "center",
      padding: 45,
      background: "#ffffff",
      borderRadius: 25,
      boxShadow:
        "0 20px 50px rgba(0,0,0,0.08)",
    },

    spinner: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      border:
        "4px solid #eeeeef",
      borderTopColor: "#ff4438",
      margin: "0 auto 20px",
      animation:
        "spin 0.8s linear infinite",
    },

    loadingTitle: {
      margin: 0,
      fontSize: 22,
      fontWeight: 900,
    },

    loadingText: {
      color: "#777b83",
      marginTop: 8,
      fontSize: 14,
    },

    /* =========================
       ERROR
    ========================= */

    errorCard: {
      maxWidth: 600,
      margin: "10vh auto",
      background: "#ffffff",
      borderRadius: 25,
      padding: 40,
      textAlign: "center",
      boxShadow:
        "0 20px 50px rgba(0,0,0,0.08)",
      border:
        "1px solid rgba(17,24,39,0.07)",
    },

    errorIcon: {
      width: 54,
      height: 54,
      margin: "0 auto 16px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background:
        "linear-gradient(135deg, #fee2e2, #fecaca)",
      color: "#dc2626",
      fontWeight: 950,
      fontSize: 24,
    },

    retryButton: {
      marginTop: 16,
      padding: "12px 22px",
      border: "none",
      borderRadius: 12,
      background:
        "linear-gradient(135deg, #111111, #272727)",
      color: "#ffffff",
      fontWeight: 800,
      cursor: "pointer",
      boxShadow:
        "0 8px 20px rgba(0,0,0,0.15)",
    },
  };