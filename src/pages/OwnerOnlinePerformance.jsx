import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function OwnerOnlinePerformance() {
  const navigate = useNavigate();
  const { clientId } = useParams();

  const [client, setClient] = useState(null);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [completions, setCompletions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // LOAD PERFORMANCE
  // ============================================================

  useEffect(() => {
    if (clientId) {
      loadPerformance();
    }
  }, [clientId]);

  async function loadPerformance() {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------------
      // 1. CLIENT
      // --------------------------------------------------------

      const {
        data: clientData,
        error: clientError,
      } = await supabase
        .from("online_clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (clientError) {
        throw clientError;
      }

      if (!clientData) {
        throw new Error("Online client profile was not found.");
      }

      setClient(clientData);

      // --------------------------------------------------------
      // 2. WORKOUT PLANS
      // --------------------------------------------------------

      const {
        data: planData,
        error: planError,
      } = await supabase
        .from("online_workout_plans")
        .select("*")
        .eq("online_client_id", clientData.id)
        .order("created_at", {
          ascending: false,
        });

      if (planError) {
        throw planError;
      }

      const plans = planData || [];

      setWorkoutPlans(plans);

      // --------------------------------------------------------
      // 3. WORKOUT EXERCISES
      // --------------------------------------------------------

      let exercises = [];

      if (plans.length > 0) {
        const planIds = plans.map((plan) => plan.id);

        const {
          data: exerciseData,
          error: exerciseError,
        } = await supabase
          .from("online_workout_exercises")
          .select("*")
          .in("workout_plan_id", planIds);

        if (exerciseError) {
          throw exerciseError;
        }

        exercises = exerciseData || [];
      }

      setWorkoutExercises(exercises);

      // --------------------------------------------------------
      // 4. COMPLETION HISTORY
      // --------------------------------------------------------

      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from("online_task_completions")
        .select("*")
        .eq("online_client_id", clientData.id)
        .order("completed_date", {
          ascending: false,
        })
        .order("completed_at", {
          ascending: false,
        });

      if (completionError) {
        throw completionError;
      }

      setCompletions(completionData || []);
    } catch (err) {
      console.error(
        "Owner online performance error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load client performance."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // DATE HELPERS
  // ============================================================

  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function dateFromString(dateValue) {
    if (!dateValue) {
      return null;
    }

    const parts = String(dateValue)
      .slice(0, 10)
      .split("-")
      .map(Number);

    if (parts.length !== 3) {
      return null;
    }

    const date = new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function formatDate(dateValue) {
    const date = dateFromString(dateValue);

    if (!date) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  // ============================================================
  // EXERCISE NAME
  // ============================================================

  function getExerciseName(exercise, completion) {
    if (exercise) {
      return (
        exercise.exercise_name ||
        exercise.exercise ||
        exercise.name ||
        exercise.title ||
        exercise.task_name ||
        exercise.task ||
        "Exercise"
      );
    }

    return (
      completion?.exercise_name ||
      completion?.exercise ||
      completion?.task_name ||
      completion?.title ||
      completion?.name ||
      completion?.task ||
      "Exercise"
    );
  }

  // ============================================================
  // EXERCISE MATCH
  // ============================================================

  function findExerciseForCompletion(completion) {
    if (!completion?.task_id) {
      return null;
    }

    return (
      workoutExercises.find(
        (exercise) =>
          String(exercise.id) ===
          String(completion.task_id)
      ) || null
    );
  }

  // ============================================================
  // TODAY
  // ============================================================

  const todayDate = getLocalDateString();

  // ============================================================
  // SORT EXERCISES
  // ============================================================

  const sortedExercises = useMemo(() => {
    return [...workoutExercises].sort(
      (a, b) => {
        const orderA =
          Number(
            a.exercise_order ??
              a.order ??
              a.position ??
              999
          );

        const orderB =
          Number(
            b.exercise_order ??
              b.order ??
              b.position ??
              999
          );

        return orderA - orderB;
      }
    );
  }, [workoutExercises]);

  // ============================================================
  // COMPLETED IDS
  // ============================================================

  const completedTaskIds = useMemo(() => {
    return new Set(
      completions
        .map((item) => item.task_id)
        .filter(Boolean)
        .map((id) => String(id))
    );
  }, [completions]);

  // ============================================================
  // CURRENT WEEK
  // ============================================================

  const startOfWeek = useMemo(() => {
    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const day = today.getDay();

    const difference =
      day === 0
        ? 6
        : day - 1;

    const monday = new Date(today);

    monday.setDate(
      today.getDate() - difference
    );

    return monday;
  }, []);

  const startOfWeekString =
    getLocalDateString(startOfWeek);

  const endOfWeek = useMemo(() => {
    const sunday = new Date(
      startOfWeek
    );

    sunday.setDate(
      sunday.getDate() + 6
    );

    return sunday;
  }, [startOfWeek]);

  const endOfWeekString =
    getLocalDateString(endOfWeek);

  // ============================================================
  // WEEKLY COMPLETIONS
  // ============================================================

  const weeklyCompletions = useMemo(() => {
    return completions.filter((item) => {
      const date = item.completed_date;

      return (
        date &&
        date >= startOfWeekString &&
        date <= endOfWeekString
      );
    });
  }, [
    completions,
    startOfWeekString,
    endOfWeekString,
  ]);

  // ============================================================
  // WEEKLY ASSIGNED EXERCISES
  // ============================================================

  const weeklyAssignedExercises = useMemo(() => {
    return sortedExercises.filter((exercise) => {
      const fields = [
        "scheduled_date",
        "assigned_date",
        "workout_date",
        "exercise_date",
        "date",
        "training_date",
      ];

      const exerciseDateField =
        fields.find(
          (field) => exercise[field]
        );

      if (exerciseDateField) {
        const date = String(
          exercise[exerciseDateField]
        ).slice(0, 10);

        return (
          date >= startOfWeekString &&
          date <= endOfWeekString
        );
      }

      const plan =
        workoutPlans.find(
          (item) =>
            String(item.id) ===
            String(exercise.workout_plan_id)
        );

      if (!plan) {
        return false;
      }

      const planDateField =
        [
          "scheduled_date",
          "assigned_date",
          "workout_date",
          "date",
          "training_date",
        ].find(
          (field) => plan[field]
        );

      if (planDateField) {
        const date = String(
          plan[planDateField]
        ).slice(0, 10);

        return (
          date >= startOfWeekString &&
          date <= endOfWeekString
        );
      }

      // Existing workout architecture:
      // active exercises belong to current plan.
      return true;
    });
  }, [
    sortedExercises,
    workoutPlans,
    startOfWeekString,
    endOfWeekString,
  ]);

  // ============================================================
  // WEEKLY UNIQUE COMPLETED ASSIGNED TASKS
  // ============================================================

  const weeklyCompletedTaskIds =
    useMemo(() => {
      const assignedIds =
        new Set(
          weeklyAssignedExercises.map(
            (exercise) =>
              String(exercise.id)
          )
        );

      const completedIds =
        new Set();

      weeklyCompletions.forEach(
        (completion) => {
          if (!completion.task_id) {
            return;
          }

          const id = String(
            completion.task_id
          );

          if (assignedIds.has(id)) {
            completedIds.add(id);
          }
        }
      );

      return completedIds;
    }, [
      weeklyAssignedExercises,
      weeklyCompletions,
    ]);

  const weeklyAssignedCount =
    weeklyAssignedExercises.length;

  const weeklyCompletedCount =
    weeklyCompletedTaskIds.size;

  const weeklyRemainingCount =
    Math.max(
      0,
      weeklyAssignedCount -
        weeklyCompletedCount
    );

  const weeklyCompletionRate =
    weeklyAssignedCount === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (weeklyCompletedCount /
              weeklyAssignedCount) *
              100
          )
        );

  // ============================================================
  // TODAY'S ASSIGNED EXERCISES
  // ============================================================

  const assignedTodayExercises =
    useMemo(() => {
      return sortedExercises.filter(
        (exercise) => {
          const exerciseDateFields = [
            "scheduled_date",
            "assigned_date",
            "workout_date",
            "exercise_date",
            "date",
            "training_date",
          ];

          for (
            const field of exerciseDateFields
          ) {
            if (exercise[field]) {
              return (
                String(
                  exercise[field]
                ).slice(0, 10) ===
                todayDate
              );
            }
          }

          const plan =
            workoutPlans.find(
              (item) =>
                String(item.id) ===
                String(
                  exercise.workout_plan_id
                )
            );

          if (!plan) {
            return false;
          }

          const planDateFields = [
            "scheduled_date",
            "assigned_date",
            "workout_date",
            "date",
            "training_date",
          ];

          for (
            const field of planDateFields
          ) {
            if (plan[field]) {
              return (
                String(
                  plan[field]
                ).slice(0, 10) ===
                todayDate
              );
            }
          }

          // Current active plan = today's
          // assignment when no date system exists.
          return true;
        }
      );
    }, [
      sortedExercises,
      workoutPlans,
      todayDate,
    ]);

  // ============================================================
  // TODAY COMPLETED IDS
  // ============================================================

  const todayCompletedIds =
    useMemo(() => {
      return new Set(
        completions
          .filter(
            (completion) =>
              completion.completed_date ===
              todayDate
          )
          .map(
            (completion) =>
              completion.task_id
          )
          .filter(Boolean)
          .map((id) => String(id))
      );
    }, [
      completions,
      todayDate,
    ]);

  // ============================================================
  // TODAY COUNTS
  // ============================================================

  const assignedTodayCount =
    assignedTodayExercises.length;

  const todayCompletedCount =
    assignedTodayExercises.filter(
      (exercise) =>
        todayCompletedIds.has(
          String(exercise.id)
        )
    ).length;

  const remainingToday =
    Math.max(
      0,
      assignedTodayCount -
        todayCompletedCount
    );

  const completionRate =
    assignedTodayCount === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (todayCompletedCount /
              assignedTodayCount) *
              100
          )
        );

  // ============================================================
  // GROUP EXERCISES BY DAY
  // ============================================================

  const workoutDays = useMemo(() => {
    const groups = {};

    sortedExercises.forEach(
      (exercise) => {
        const dayName =
          exercise.day_name ||
          exercise.day ||
          exercise.training_day ||
          "Workout";

        if (!groups[dayName]) {
          groups[dayName] = [];
        }

        groups[dayName].push(exercise);
      }
    );

    return Object.entries(groups);
  }, [sortedExercises]);

  // ============================================================
  // DAY ORDER
  // ============================================================

  function getDayNumber(dayName) {
    const match = String(
      dayName
    ).match(/\d+/);

    return match
      ? Number(match[0])
      : 999;
  }

  const sortedWorkoutDays =
    useMemo(() => {
      return [...workoutDays].sort(
        ([a], [b]) =>
          getDayNumber(a) -
          getDayNumber(b)
      );
    }, [workoutDays]);

  // ============================================================
  // DAY COMPLETION
  // ============================================================

  function getDayStats(exercises) {
    const total =
      exercises.length;

    const completed =
      exercises.filter(
        (exercise) =>
          completedTaskIds.has(
            String(exercise.id)
          )
      ).length;

    const percentage =
      total === 0
        ? 0
        : Math.round(
            (completed / total) *
              100
          );

    return {
      total,
      completed,
      remaining:
        Math.max(
          0,
          total - completed
        ),
      percentage,
    };
  }

  // ============================================================
  // ACTIVE DAYS
  // ============================================================

  const uniqueCompletedDates =
    useMemo(() => {
      return [
        ...new Set(
          completions
            .map(
              (item) =>
                item.completed_date
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [completions]);

  const activeDays =
    uniqueCompletedDates.length;

  // ============================================================
  // CURRENT STREAK
  // ============================================================

  const currentStreak =
    useMemo(() => {
      if (
        uniqueCompletedDates.length ===
        0
      ) {
        return 0;
      }

      const completedSet =
        new Set(
          uniqueCompletedDates
        );

      let streak = 0;

      const currentDate =
        new Date();

      currentDate.setHours(
        0,
        0,
        0,
        0
      );

      let dateString =
        getLocalDateString(
          currentDate
        );

      if (
        !completedSet.has(
          dateString
        )
      ) {
        currentDate.setDate(
          currentDate.getDate() - 1
        );
      }

      while (true) {
        dateString =
          getLocalDateString(
            currentDate
          );

        if (
          !completedSet.has(
            dateString
          )
        ) {
          break;
        }

        streak++;

        currentDate.setDate(
          currentDate.getDate() - 1
        );
      }

      return streak;
    }, [
      uniqueCompletedDates,
    ]);

  // ============================================================
  // LAST 7 DAYS
  // ============================================================

  const lastSevenDays =
    useMemo(() => {
      const result = [];

      for (
        let i = 6;
        i >= 0;
        i--
      ) {
        const date =
          new Date();

        date.setHours(
          0,
          0,
          0,
          0
        );

        date.setDate(
          date.getDate() - i
        );

        const dateString =
          getLocalDateString(
            date
          );

        const count =
          completions.filter(
            (item) =>
              item.completed_date ===
              dateString
          ).length;

        result.push({
          date,
          dateString,
          count,
        });
      }

      return result;
    }, [completions]);

  // ============================================================
  // RECENT ACTIVITY
  // ============================================================

  const recentCompletions =
    completions.slice(0, 10);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // ============================================================
  // ERROR
  // ============================================================

  if (error) {
    return (
      <div className="page">

        <div className="alert alert-error">
          {error}
        </div>

        <button
          type="button"
          className="view-btn"
          onClick={() =>
            navigate("/online-clients")
          }
        >
          ← Back to Online Clients
        </button>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >

        <div>

          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "2px",
              opacity: 0.55,
            }}
          >
            COACH PORTAL
          </p>

          <h1
            style={{
              margin: "6px 0",
            }}
          >
            Client Performance
          </h1>

          <p
            style={{
              margin: 0,
              opacity: 0.7,
            }}
          >
            Monitor training consistency
            and workout completion.
          </p>

        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            navigate(
              `/online-clients/${clientId}`
            )
          }
        >
          ← Client Profile
        </button>

      </div>

      {/* ======================================================
          CLIENT
      ====================================================== */}

      {client && (
        <section
          className="assessment-card"
          style={{
            marginBottom: "24px",
          }}
        >

          <p
            style={{
              margin: 0,
              fontSize: "12px",
              fontWeight: "800",
              letterSpacing: "1.5px",
              opacity: 0.55,
            }}
          >
            ATHLETE
          </p>

          <h2
            style={{
              margin: "6px 0 4px",
            }}
          >
            {client.full_name}
          </h2>

          {client.email && (
            <p
              style={{
                margin: 0,
                opacity: 0.65,
              }}
            >
              {client.email}
            </p>
          )}

        </section>
      )}

      {/* ======================================================
          WEEKLY PERFORMANCE HERO
      ====================================================== */}

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "22px",
          padding: "28px",
          marginBottom: "24px",
          background:
            "linear-gradient(135deg, #17191f 0%, #20242d 55%, #46191c 100%)",
          boxShadow:
            "0 18px 45px rgba(0,0,0,0.18)",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "25px",
            flexWrap: "wrap",
          }}
        >

          <div>

            <p
              style={{
                margin: 0,
                color: "#ff453a",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "2px",
              }}
            >
              WEEKLY PERFORMANCE
            </p>

            <h2
              style={{
                margin: "7px 0 4px",
                color: "#ffffff",
                fontSize: "30px",
                fontWeight: "900",
              }}
            >
              {weeklyCompletionRate >= 80
                ? "Excellent work."
                : weeklyCompletionRate >= 50
                ? "Keep pushing."
                : "Let's build consistency."}
            </h2>

            <p
              style={{
                margin: 0,
                color:
                  "rgba(255,255,255,0.65)",
                fontSize: "13px",
              }}
            >
              Monday → Sunday
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                marginTop: "25px",
              }}
            >

              <div>
                <strong
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "18px",
                  }}
                >
                  {weeklyCompletedCount}
                </strong>

                <span
                  style={{
                    color:
                      "rgba(255,255,255,0.55)",
                    fontSize: "11px",
                  }}
                >
                  Completed
                </span>
              </div>

              <div
                style={{
                  width: "1px",
                  height: "38px",
                  background:
                    "rgba(255,255,255,0.12)",
                }}
              />

              <div>
                <strong
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "18px",
                  }}
                >
                  {weeklyRemainingCount}
                </strong>

                <span
                  style={{
                    color:
                      "rgba(255,255,255,0.55)",
                    fontSize: "11px",
                  }}
                >
                  Remaining
                </span>
              </div>

              <div
                style={{
                  width: "1px",
                  height: "38px",
                  background:
                    "rgba(255,255,255,0.12)",
                }}
              />

              <div>
                <strong
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "18px",
                  }}
                >
                  {weeklyAssignedCount}
                </strong>

                <span
                  style={{
                    color:
                      "rgba(255,255,255,0.55)",
                    fontSize: "11px",
                  }}
                >
                  Total
                </span>
              </div>

            </div>

          </div>

          {/* CIRCULAR SCORE */}

          <div
            style={{
              width: "118px",
              height: "118px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              background: `conic-gradient(
                #ff453a ${weeklyCompletionRate}%,
                rgba(255,255,255,0.12) ${weeklyCompletionRate}% 100%
              )`,
              position: "relative",
            }}
          >

            <div
              style={{
                position: "absolute",
                inset: "9px",
                borderRadius: "50%",
                background: "#20232a",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >

              <strong
                style={{
                  color: "#ffffff",
                  fontSize: "27px",
                  lineHeight: 1,
                }}
              >
                {weeklyCompletionRate}%
              </strong>

              <span
                style={{
                  marginTop: "5px",
                  color:
                    "rgba(255,255,255,0.55)",
                  fontSize: "9px",
                  fontWeight: "800",
                  letterSpacing: "1px",
                }}
              >
                COMPLETE
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          QUICK OVERVIEW
      ====================================================== */}

      <section
        className="assessment-card"
        style={{
          marginBottom: "24px",
        }}
      >

        <h2>
          Performance Overview
        </h2>

        <div
          className="quick-grid"
          style={{
            marginTop: "20px",
          }}
        >

          <div className="quick-card">

            <h3>
              🔥 Current Streak
            </h3>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                margin: "8px 0 0",
              }}
            >
              {currentStreak}
            </p>

            <small>
              consecutive days
            </small>

          </div>

          <div className="quick-card">

            <h3>
              📅 Active Days
            </h3>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                margin: "8px 0 0",
              }}
            >
              {activeDays}
            </p>

            <small>
              exercise activity days
            </small>

          </div>

          <div className="quick-card">

            <h3>
              ✅ Completed
            </h3>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                margin: "8px 0 0",
              }}
            >
              {completions.length}
            </p>

            <small>
              total exercises
            </small>

          </div>

          <div className="quick-card">

            <h3>
              🎯 This Week
            </h3>

            <p
              style={{
                fontSize: "28px",
                fontWeight: "800",
                margin: "8px 0 0",
              }}
            >
              {weeklyCompletedCount}
            </p>

            <small>
              exercises completed
            </small>

          </div>

        </div>

      </section>

      {/* ======================================================
          TODAY'S PERFORMANCE
      ====================================================== */}

      <section
        className="assessment-card"
        style={{
          marginBottom: "24px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >

          <div>

            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "1.5px",
                color: "#ff453a",
              }}
            >
              TODAY'S PERFORMANCE
            </p>

            <h2
              style={{
                margin: "5px 0 0",
              }}
            >
              💪 Exercise Completion
            </h2>

          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: "900",
            }}
          >
            {completionRate}%
          </div>

        </div>

        {/* PROGRESS */}

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <div
            style={{
              height: "10px",
              width: "100%",
              borderRadius: "999px",
              background:
                "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >

            <div
              style={{
                height: "100%",
                width: `${completionRate}%`,
                borderRadius: "999px",
                background:
                  "linear-gradient(90deg, #ff453a, #32d74b)",
                transition:
                  "width 0.5s ease",
              }}
            />

          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "10px",
              fontSize: "13px",
              opacity: 0.65,
            }}
          >

            <span>
              {todayCompletedCount} completed
            </span>

            <span>
              {remainingToday} remaining
            </span>

          </div>

        </div>

        {/* THREE SMALL CARDS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "18px",
          }}
        >

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background:
                "rgba(50,215,75,0.12)",
            }}
          >

            <div
              style={{
                fontSize: "10px",
                fontWeight: "900",
                opacity: 0.7,
              }}
            >
              COMPLETED
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "24px",
                fontWeight: "900",
                color: "#32d74b",
              }}
            >
              {todayCompletedCount}
            </div>

          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background:
                "rgba(100,150,255,0.12)",
            }}
          >

            <div
              style={{
                fontSize: "10px",
                fontWeight: "900",
                opacity: 0.7,
              }}
            >
              REMAINING
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "24px",
                fontWeight: "900",
              }}
            >
              {remainingToday}
            </div>

          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background:
                "rgba(255,69,58,0.15)",
            }}
          >

            <div
              style={{
                fontSize: "10px",
                fontWeight: "900",
                opacity: 0.7,
              }}
            >
              ASSIGNED
            </div>

            <div
              style={{
                marginTop: "6px",
                fontSize: "24px",
                fontWeight: "900",
              }}
            >
              {assignedTodayCount}
            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          TRAINING DAYS
      ====================================================== */}

      {sortedWorkoutDays.length > 0 && (
        <section
          style={{
            marginBottom: "24px",
          }}
        >

          {sortedWorkoutDays.map(
            ([dayName, exercises]) => {

              const stats =
                getDayStats(exercises);

              return (
                <div
                  key={dayName}
                  className="assessment-card"
                  style={{
                    marginBottom: "18px",
                    overflow: "hidden",
                  }}
                >

                  {/* DAY HEADER */}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >

                    <div>

                      <p
                        style={{
                          margin: 0,
                          color: "#ff453a",
                          fontSize: "10px",
                          fontWeight: "900",
                          letterSpacing: "1.8px",
                        }}
                      >
                        TRAINING DAY
                      </p>

                      <h2
                        style={{
                          margin:
                            "6px 0 0",
                        }}
                      >
                        {dayName}
                      </h2>

                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >

                      <div
                        style={{
                          fontSize: "22px",
                          fontWeight: "900",
                        }}
                      >
                        {stats.percentage}%
                      </div>

                      <div
                        style={{
                          fontSize: "11px",
                          opacity: 0.55,
                        }}
                      >
                        {stats.completed} /{" "}
                        {stats.total}
                      </div>

                    </div>

                  </div>

                  {/* DAY PROGRESS */}

                  <div
                    style={{
                      marginTop: "15px",
                      height: "6px",
                      borderRadius: "999px",
                      background:
                        "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >

                    <div
                      style={{
                        width: `${stats.percentage}%`,
                        height: "100%",
                        borderRadius: "999px",
                        background:
                          stats.percentage ===
                          100
                            ? "#32d74b"
                            : "#ff453a",
                        transition:
                          "width 0.4s ease",
                      }}
                    />

                  </div>

                  {/* EXERCISES */}

                  <div
                    style={{
                      marginTop: "14px",
                    }}
                  >

                    {exercises.map(
                      (exercise, index) => {

                        const completed =
                          completedTaskIds.has(
                            String(
                              exercise.id
                            )
                          );

                        const exerciseName =
                          getExerciseName(
                            exercise,
                            null
                          );

                        return (
                          <div
                            key={
                              exercise.id
                            }
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "space-between",
                              gap: "15px",
                              padding:
                                "16px 0",
                              borderBottom:
                                index <
                                exercises.length -
                                  1
                                  ? "1px solid rgba(255,255,255,0.07)"
                                  : "none",
                            }}
                          >

                            {/* LEFT */}

                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "14px",
                                minWidth: 0,
                              }}
                            >

                              <div
                                style={{
                                  width:
                                    "34px",
                                  height:
                                    "34px",
                                  borderRadius:
                                    "50%",
                                  flexShrink: 0,
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  background:
                                    completed
                                      ? "rgba(50,215,75,0.18)"
                                      : "rgba(255,255,255,0.04)",
                                  color:
                                    completed
                                      ? "#32d74b"
                                      : "inherit",
                                  border:
                                    completed
                                      ? "1px solid rgba(50,215,75,0.35)"
                                      : "1px solid rgba(255,255,255,0.08)",
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "800",
                                }}
                              >
                                {completed
                                  ? "✓"
                                  : index + 1}
                              </div>

                              <div
                                style={{
                                  minWidth:
                                    0,
                                }}
                              >

                                <h3
                                  style={{
                                    margin:
                                      "0 0 5px",
                                    fontSize:
                                      "15px",
                                  }}
                                >
                                  {
                                    exerciseName
                                  }
                                </h3>

                                <p
                                  style={{
                                    margin: 0,
                                    fontSize:
                                      "11px",
                                    opacity:
                                      0.55,
                                  }}
                                >
                                  {exercise.sets
                                    ? `${exercise.sets} sets`
                                    : "—"}

                                  {" • "}

                                  {exercise.reps
                                    ? `${exercise.reps} reps`
                                    : "—"}

                                  {exercise.weight
                                    ? ` • ${exercise.weight}`
                                    : ""}

                                  {exercise.rest
                                    ? ` • Rest: ${exercise.rest}`
                                    : ""}
                                </p>

                              </div>

                            </div>

                            {/* STATUS */}

                            <div
                              style={{
                                flexShrink:
                                  0,
                                padding:
                                  "6px 11px",
                                borderRadius:
                                  "999px",
                                fontSize:
                                  "10px",
                                fontWeight:
                                  "800",
                                background:
                                  completed
                                    ? "rgba(50,215,75,0.14)"
                                    : "rgba(255,255,255,0.05)",
                                color:
                                  completed
                                    ? "#32d74b"
                                    : "inherit",
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

                </div>
              );
            }
          )}

        </section>
      )}

      {/* ======================================================
          LAST 7 DAYS
      ====================================================== */}

      <section
        className="assessment-card"
        style={{
          marginBottom: "24px",
        }}
      >

        <h2>
          📅 Last 7 Days
        </h2>

        <p
          style={{
            margin: "5px 0 0",
            opacity: 0.65,
            fontSize: "14px",
          }}
        >
          Completed exercises for each day.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(7, minmax(0, 1fr))",
            gap: "10px",
            marginTop: "22px",
          }}
        >

          {lastSevenDays.map(
            (day) => {

              const dayLabel =
                day.date.toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "short",
                  }
                );

              const dateLabel =
                day.date.getDate();

              const isCurrentDay =
                day.dateString ===
                todayDate;

              return (
                <div
                  key={
                    day.dateString
                  }
                  style={{
                    textAlign: "center",
                    padding:
                      "14px 6px",
                    borderRadius: "12px",
                    background:
                      day.count > 0
                        ? "rgba(50,215,75,0.12)"
                        : "rgba(255,255,255,0.04)",
                    border:
                      isCurrentDay
                        ? "2px solid rgba(50,215,75,0.65)"
                        : "1px solid rgba(255,255,255,0.08)",
                    minWidth: 0,
                  }}
                >

                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.6,
                    }}
                  >
                    {dayLabel}
                  </div>

                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "800",
                      margin: "5px 0",
                    }}
                  >
                    {dateLabel}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight:
                        day.count > 0
                          ? "700"
                          : "400",
                    }}
                  >
                    {day.count > 0
                      ? `✓ ${day.count}`
                      : "—"}
                  </div>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* ======================================================
          RECENT ACTIVITY
      ====================================================== */}

      <section
        className="assessment-card"
        style={{
          marginBottom: "24px",
        }}
      >

        <h2>
          📝 Recent Exercise Activity
        </h2>

        {recentCompletions.length ===
        0 ? (
          <div
            style={{
              marginTop: "20px",
              padding: "24px",
              textAlign: "center",
              opacity: 0.65,
            }}
          >

            <div
              style={{
                fontSize: "38px",
                marginBottom: "10px",
              }}
            >
              🏋️
            </div>

            <p>
              No exercise activity recorded yet.
            </p>

          </div>
        ) : (
          <div
            style={{
              marginTop: "18px",
            }}
          >

            {recentCompletions.map(
              (completion) => {

                const exercise =
                  findExerciseForCompletion(
                    completion
                  );

                return (
                  <div
                    key={
                      completion.id
                    }
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "15px",
                      padding:
                        "16px 0",
                      borderBottom:
                        "1px solid rgba(255,255,255,0.08)",
                    }}
                  >

                    <div>

                      <h3
                        style={{
                          margin:
                            "0 0 5px",
                          fontSize: "15px",
                        }}
                      >
                        {getExerciseName(
                          exercise,
                          completion
                        )}
                      </h3>

                      <p
                        style={{
                          margin: 0,
                          opacity: 0.6,
                          fontSize: "13px",
                        }}
                      >
                        {formatDate(
                          completion.completed_date
                        )}
                      </p>

                    </div>

                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius:
                          "50%",
                        display:
                          "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        background:
                          "rgba(50,215,75,0.12)",
                        color:
                          "#32d74b",
                      }}
                    >
                      ✓
                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </section>

      {/* ======================================================
          SIMPLE COACHING SUMMARY
      ====================================================== */}

      <section
        className="assessment-card"
        style={{
          marginBottom: "40px",
          textAlign: "center",
        }}
      >

        <div
          style={{
            fontSize: "40px",
            marginBottom: "8px",
          }}
        >
          🏆
        </div>

        <h2>
          Coaching Performance Summary
        </h2>

        <p
          style={{
            maxWidth: "700px",
            margin: "10px auto 0",
            opacity: 0.7,
            lineHeight: 1.6,
          }}
        >
          {weeklyCompletionRate >= 80
            ? "Excellent consistency this week. Keep the momentum going."
            : weeklyCompletionRate >= 50
            ? "Good progress. Focus on completing the remaining assigned workouts."
            : "Consistency needs attention. Review missed workouts and keep the client accountable."}
        </p>

      </section>

    </div>
  );
}