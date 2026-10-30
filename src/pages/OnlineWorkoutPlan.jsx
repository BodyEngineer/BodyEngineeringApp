import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function OnlineWorkoutPlan() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [completions, setCompletions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingExercise, setCompletingExercise] =
    useState(null);

  // =========================================================
  // INDIA DATE
  // =========================================================

  function getIndiaDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

  // =========================================================
  // LOAD WORKOUT PLAN
  // =========================================================

  useEffect(() => {
    loadWorkoutPlan();
  }, []);

  async function loadWorkoutPlan() {
    try {
      setLoading(true);
      setError("");

      // =======================================================
      // 1. GET LOGGED-IN USER
      // =======================================================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/member-login");
        return;
      }

      // =======================================================
      // 2. FIND ONLINE CLIENT
      // =======================================================

      const {
        data: clientData,
        error: clientError,
      } = await supabase
        .from("online_clients")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (clientError) {
        throw clientError;
      }

      setClient(clientData);

      // =======================================================
      // 3. GET ACTIVE WORKOUT PLAN
      // =======================================================

      const {
        data: planData,
        error: planError,
      } = await supabase
        .from("online_workout_plans")
        .select("*")
        .eq("online_client_id", clientData.id)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (planError) {
        throw planError;
      }

      setWorkoutPlan(planData);

      // =======================================================
      // NO ACTIVE PLAN
      // =======================================================

      if (!planData) {
        setExercises([]);
        setCompletions([]);
        return;
      }

      // =======================================================
      // 4. LOAD ALL EXERCISES
      // =======================================================

      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from("online_workout_exercises")
        .select("*")
        .eq("workout_plan_id", planData.id)
        .order("exercise_order", {
          ascending: true,
        });

      if (exerciseError) {
        throw exerciseError;
      }

      const loadedExercises =
        exerciseData || [];

      setExercises(loadedExercises);

      // =======================================================
      // 5. LOAD COMPLETE HISTORY
      //
      // VERY IMPORTANT:
      // We DO NOT load only today's completions.
      //
      // We load the complete history so:
      //
      // Day 1 completion remains saved
      // Day 2 completion remains saved
      // Day 3 completion remains saved
      //
      // Nothing from a previous day is replaced.
      // =======================================================

      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from("online_task_completions")
        .select("*")
        .eq(
          "online_client_id",
          clientData.id
        )
        .order("completed_date", {
          ascending: false,
        })
        .order("completed_at", {
          ascending: false,
        });

      if (completionError) {
        throw completionError;
      }

      setCompletions(
        completionData || []
      );
    } catch (err) {
      console.error(
        "Online workout loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load your workout plan."
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // EXERCISE ID
  // =========================================================

  function getExerciseId(exercise) {
    if (!exercise) {
      return null;
    }

    if (
      exercise.id !== null &&
      exercise.id !== undefined &&
      exercise.id !== ""
    ) {
      return String(exercise.id);
    }

    return null;
  }

  // =========================================================
  // COMPLETION KEY
  //
  // Exercise + Date
  //
  // Example:
  //
  // exercise 123 + 2026-10-25
  //
  // becomes:
  //
  // 123__2026-10-25
  //
  // This prevents a completion from one day
  // being confused with another day.
  // =========================================================

  function getCompletionKey(
    exerciseId,
    date
  ) {
    if (!exerciseId || !date) {
      return null;
    }

    return `${String(
      exerciseId
    )}__${String(date).slice(0, 10)}`;
  }

  // =========================================================
  // COMPLETION KEY FROM DATABASE RECORD
  // =========================================================

  function getStoredCompletionKey(
    completion
  ) {
    if (!completion) {
      return null;
    }

    if (
      completion.task_id === null ||
      completion.task_id === undefined ||
      completion.task_id === ""
    ) {
      return null;
    }

    if (!completion.completed_date) {
      return null;
    }

    return getCompletionKey(
      completion.task_id,
      completion.completed_date
    );
  }

  // =========================================================
  // COMPLETION MAP
  // =========================================================

  const completionMap = useMemo(() => {
    const map = new Set();

    (completions || []).forEach(
      (completion) => {
        const key =
          getStoredCompletionKey(
            completion
          );

        if (key) {
          map.add(key);
        }
      }
    );

    return map;
  }, [completions]);

  // =========================================================
  // GET EXERCISE DATE
  //
  // We first look for a date directly on the exercise.
  // If the exercise doesn't have one, we look at the plan.
  // =========================================================

  function getExerciseDate(
    exercise
  ) {
    if (!exercise) {
      return null;
    }

    const exerciseDateFields = [
      "scheduled_date",
      "assigned_date",
      "workout_date",
      "exercise_date",
      "training_date",
      "date",
    ];

    for (
      const field of exerciseDateFields
    ) {
      if (exercise[field]) {
        return String(
          exercise[field]
        ).slice(0, 10);
      }
    }

    if (
      workoutPlan
    ) {
      const planDateFields = [
        "scheduled_date",
        "assigned_date",
        "workout_date",
        "training_date",
        "date",
      ];

      for (
        const field of planDateFields
      ) {
        if (workoutPlan[field]) {
          return String(
            workoutPlan[field]
          ).slice(0, 10);
        }
      }
    }

    return null;
  }

  // =========================================================
  // GET EXERCISE DAY
  // =========================================================

  function getExerciseDay(
    exercise
  ) {
    if (!exercise) {
      return 1;
    }

    const possibleDayValues = [
      exercise.day_number,
      exercise.day,
      exercise.workout_day,
      exercise.training_day,
    ];

    for (
      const value of possibleDayValues
    ) {
      if (
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const parsed =
          Number(value);

        if (
          Number.isFinite(parsed) &&
          parsed > 0
        ) {
          return parsed;
        }
      }
    }

    return 1;
  }

  // =========================================================
  // GET DAY NAME
  // =========================================================

  function getDayName(
    exercise
  ) {
    if (!exercise) {
      return "Workout";
    }

    return (
      exercise.day_name ||
      exercise.day ||
      `Day ${getExerciseDay(
        exercise
      )}`
    );
  }

  // =========================================================
  // IS EXERCISE COMPLETED FOR ITS ASSIGNED DATE?
  //
  // IMPORTANT:
  // This is NOT simply:
  //
  // completedExercises.has(exercise.id)
  //
  // because completion depends on DATE too.
  // =========================================================

  function isExerciseCompleted(
    exercise
  ) {
    const exerciseId =
      getExerciseId(exercise);

    if (!exerciseId) {
      return false;
    }

    // -------------------------------------------------------
    // If exercise has a scheduled date,
    // use that date.
    // -------------------------------------------------------

    const exerciseDate =
      getExerciseDate(exercise);

    if (exerciseDate) {
      const key =
        getCompletionKey(
          exerciseId,
          exerciseDate
        );

      return completionMap.has(key);
    }

    // -------------------------------------------------------
    // If no exercise date exists,
    // check whether this exercise has
    // ANY completion record.
    //
    // This supports programs where day_number
    // is used instead of calendar dates.
    // -------------------------------------------------------

    return (
      completions || []
    ).some((completion) => {
      return (
        String(
          completion.task_id
        ) === exerciseId
      );
    });
  }

  // =========================================================
  // TODAY'S COMPLETION
  // =========================================================

  function isExerciseCompletedToday(
    exercise
  ) {
    const exerciseId =
      getExerciseId(exercise);

    if (!exerciseId) {
      return false;
    }

    const today =
      getIndiaDate();

    const key =
      getCompletionKey(
        exerciseId,
        today
      );

    return completionMap.has(key);
  }

  // =========================================================
  // COMPLETE EXERCISE
  // =========================================================

  async function handleCompleteExercise(
    exercise
  ) {
    if (
      !client?.id ||
      !exercise?.id
    ) {
      return;
    }

    const exerciseId =
      String(exercise.id);

    const today =
      getIndiaDate();

    // =======================================================
    // CHECK WHETHER THIS EXERCISE IS ALREADY COMPLETED TODAY
    // =======================================================

    const todayKey =
      getCompletionKey(
        exerciseId,
        today
      );

    if (
      completionMap.has(
        todayKey
      )
    ) {
      return;
    }

    try {
      setCompletingExercise(
        exerciseId
      );

      setError("");

      console.log(
        "Completing exercise:",
        {
          exerciseId,
          exerciseName:
            exercise.exercise_name,
          clientId:
            client.id,
          date: today,
        }
      );

      // =====================================================
      // CHECK EXISTING RECORD FOR:
      //
      // SAME CLIENT
      // SAME EXERCISE
      // SAME DATE
      //
      // This prevents duplicates without touching
      // previous dates.
      // =====================================================

      const {
        data: existingCompletion,
        error: existingError,
      } = await supabase
        .from(
          "online_task_completions"
        )
        .select(
          "id, task_id, online_client_id, completed_date"
        )
        .eq(
          "task_id",
          exerciseId
        )
        .eq(
          "online_client_id",
          client.id
        )
        .eq(
          "completed_date",
          today
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      // =====================================================
      // ALREADY COMPLETED TODAY
      // =====================================================

      if (
        existingCompletion
      ) {
        setCompletions(
          (previous) => {
            const exists =
              previous.some(
                (item) =>
                  String(
                    item.id
                  ) ===
                  String(
                    existingCompletion.id
                  )
              );

            if (exists) {
              return previous;
            }

            return [
              existingCompletion,
              ...previous,
            ];
          }
        );

        return;
      }

      // =====================================================
      // INSERT NEW COMPLETION
      //
      // IMPORTANT:
      //
      // INSERT ONLY.
      //
      // We are NOT updating or deleting any previous
      // completion record.
      // =====================================================

      const {
        data:
          completionData,
        error:
          completionError,
      } = await supabase
        .from(
          "online_task_completions"
        )
        .insert({
          task_id:
            exerciseId,

          online_client_id:
            client.id,

          completed_date:
            today,

          completed_at:
            new Date().toISOString(),
        })
        .select("*")
        .single();

      if (completionError) {
        console.error(
          "Supabase completion error:",
          completionError
        );

        throw completionError;
      }

      console.log(
        "Exercise completion saved:",
        completionData
      );

      // =====================================================
      // UPDATE LOCAL HISTORY
      //
      // DO NOT REPLACE THE PREVIOUS ARRAY.
      // ADD THE NEW RECORD TO IT.
      // =====================================================

      setCompletions(
        (previous) => [
          completionData,
          ...previous,
        ]
      );
    } catch (err) {
      console.error(
        "Exercise completion error:",
        err
      );

      setError(
        err?.message ||
          "Unable to mark exercise as completed."
      );
    } finally {
      setCompletingExercise(
        null
      );
    }
  }

  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    await supabase.auth.signOut();

    navigate(
      "/member-login"
    );
  }

  // =========================================================
  // WORKOUT DAYS
  // =========================================================

  const workoutDays =
    useMemo(() => {
      const grouped = {};

      (exercises || []).forEach(
        (exercise) => {
          const dayName =
            getDayName(
              exercise
            );

          if (
            !grouped[dayName]
          ) {
            grouped[dayName] =
              [];
          }

          grouped[
            dayName
          ].push(exercise);
        }
      );

      return grouped;
    }, [exercises]);

  // =========================================================
  // SORT WORKOUT DAYS
  //
  // This prevents Day 3 appearing before Day 1.
  // =========================================================

  const sortedWorkoutDays =
    useMemo(() => {
      return Object.entries(
        workoutDays
      ).sort(
        (
          [, exercisesA],
          [, exercisesB]
        ) => {
          const dayA =
            getExerciseDay(
              exercisesA[0]
            );

          const dayB =
            getExerciseDay(
              exercisesB[0]
            );

          return (
            dayA - dayB
          );
        }
      );
    }, [workoutDays]);

  // =========================================================
  // CURRENT PROGRAM DAY
  //
  // This determines the first program day that still
  // contains an incomplete exercise.
  //
  // IMPORTANT:
  // This is based on the exercise's completion history,
  // NOT today's temporary state.
  // =========================================================

  const currentProgramDay =
    useMemo(() => {
      const days =
        Object.values(
          workoutDays
        )
          .map(
            (dayExercises) =>
              getExerciseDay(
                dayExercises[0]
              )
          )
          .filter(
            (day) =>
              Number.isFinite(
                day
              )
          )
          .sort(
            (a, b) =>
              a - b
          );

      if (
        days.length === 0
      ) {
        return 1;
      }

      const uniqueDays =
        [
          ...new Set(days),
        ];

      for (
        const day of uniqueDays
      ) {
        const dayExercises =
          (
            exercises || []
          ).filter(
            (exercise) =>
              getExerciseDay(
                exercise
              ) === day
          );

        if (
          dayExercises.length ===
          0
        ) {
          continue;
        }

        const completed =
          dayExercises.filter(
            isExerciseCompleted
          ).length;

        if (
          completed <
          dayExercises.length
        ) {
          return day;
        }
      }

      return (
        uniqueDays[
          uniqueDays.length -
            1
        ] + 1
      );
    }, [
      exercises,
      workoutDays,
      completionMap,
      completions,
    ]);

  // =========================================================
  // CURRENT PROGRAM DAY EXERCISES
  // =========================================================

  const currentDayExercises =
    useMemo(() => {
      return (
        exercises || []
      ).filter(
        (exercise) =>
          getExerciseDay(
            exercise
          ) ===
          currentProgramDay
      );
    }, [
      exercises,
      currentProgramDay,
    ]);

  // =========================================================
  // CURRENT PROGRAM DAY COMPLETED
  // =========================================================

  const currentDayCompletedCount =
    useMemo(() => {
      return currentDayExercises.filter(
        isExerciseCompleted
      ).length;
    }, [
      currentDayExercises,
      completionMap,
      completions,
    ]);

  // =========================================================
  // CURRENT PROGRAM DAY TOTAL
  // =========================================================

  const currentDayTotal =
    currentDayExercises.length;

  // =========================================================
  // CURRENT PROGRAM DAY REMAINING
  // =========================================================

  const currentDayRemaining =
    Math.max(
      0,
      currentDayTotal -
        currentDayCompletedCount
    );

  // =========================================================
  // CURRENT PROGRAM DAY PERCENTAGE
  // =========================================================

  const currentDayPercentage =
    currentDayTotal > 0
      ? Math.min(
          100,
          Math.round(
            (currentDayCompletedCount /
              currentDayTotal) *
              100
          )
        )
      : 0;

  // =========================================================
  // TOTAL COMPLETIONS
  //
  // Every historical completion is counted.
  // =========================================================

  const totalCompleted =
    completions.length;

  // =========================================================
  // ACTIVE DAYS
  //
  // Unique calendar dates.
  // =========================================================

  const activeDays =
    useMemo(() => {
      return new Set(
        (completions || [])
          .map(
            (item) =>
              item.completed_date
          )
          .filter(Boolean)
          .map((date) =>
            String(
              date
            ).slice(0, 10)
          )
      ).size;
    }, [completions]);

  // =========================================================
  // THIS WEEK
  // =========================================================

  const startOfWeek =
    useMemo(() => {
      const today =
        new Date();

      const day =
        today.getDay();

      const difference =
        day === 0
          ? 6
          : day - 1;

      const monday =
        new Date(today);

      monday.setDate(
        today.getDate() -
          difference
      );

      return getIndiaDate(
        monday
      );
    }, []);

  const thisWeekCompleted =
    useMemo(() => {
      return (
        completions || []
      ).filter(
        (completion) => {
          if (
            !completion.completed_date
          ) {
            return false;
          }

          const date =
            String(
              completion.completed_date
            ).slice(0, 10);

          return (
            date >=
            startOfWeek
          );
        }
      ).length;
    }, [
      completions,
      startOfWeek,
    ]);

  // =========================================================
  // TODAY'S COMPLETIONS
  // =========================================================

  const today =
    getIndiaDate();

  const todayCompletedCount =
    useMemo(() => {
      return (
        completions || []
      ).filter(
        (completion) =>
          String(
            completion.completed_date ||
              ""
          ).slice(
            0,
            10
          ) === today
      ).length;
    }, [
      completions,
      today,
    ]);

  // =========================================================
  // CURRENT STREAK
  // =========================================================

  const currentStreak =
    useMemo(() => {
      const dates =
        [
          ...new Set(
            (
              completions ||
              []
            )
              .map(
                (item) =>
                  item.completed_date
              )
              .filter(Boolean)
              .map(
                (date) =>
                  String(
                    date
                  ).slice(
                    0,
                    10
                  )
              )
          ),
        ].sort(
          (a, b) =>
            b.localeCompare(a)
        );

      if (
        dates.length ===
        0
      ) {
        return 0;
      }

      const completedSet =
        new Set(dates);

      let currentDate =
        new Date();

      let streak = 0;

      const todayString =
        getIndiaDate(
          currentDate
        );

      // If no completion today,
      // start checking from yesterday.
      if (
        !completedSet.has(
          todayString
        )
      ) {
        currentDate.setDate(
          currentDate.getDate() -
            1
        );
      }

      while (true) {
        const dateString =
          getIndiaDate(
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
          currentDate.getDate() -
            1
        );
      }

      return streak;
    }, [completions]);

  // =========================================================
  // LAST 7 DAYS
  // =========================================================

  const lastSevenDays =
    useMemo(() => {
      const result =
        [];

      const currentDate =
        new Date();

      for (
        let i = 6;
        i >= 0;
        i--
      ) {
        const date =
          new Date(
            currentDate
          );

        date.setDate(
          currentDate.getDate() -
            i
        );

        const dateString =
          getIndiaDate(
            date
          );

        const count =
          (
            completions ||
            []
          ).filter(
            (item) =>
              String(
                item.completed_date ||
                  ""
              ).slice(
                0,
                10
              ) ===
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

  // =========================================================
  // RECENT ACTIVITY
  // =========================================================

  const recentCompletions =
    useMemo(() => {
      return [
        ...(completions ||
          []),
      ].slice(0, 10);
    }, [completions]);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(
    dateValue
  ) {
    if (!dateValue) {
      return "—";
    }

    const parts =
      String(
        dateValue
      )
        .slice(
          0,
          10
        )
        .split("-")
        .map(Number);

    if (
      parts.length !==
      3
    ) {
      return "—";
    }

    const date =
      new Date(
        parts[0],
        parts[1] - 1,
        parts[2]
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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

  // =========================================================
  // FIND EXERCISE FOR COMPLETION
  // =========================================================

  function findExerciseForCompletion(
    completion
  ) {
    if (
      !completion?.task_id
    ) {
      return null;
    }

    return (
      exercises.find(
        (exercise) =>
          String(
            exercise.id
          ) ===
          String(
            completion.task_id
          )
      ) || null
    );
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

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
            navigate(
              "/online-dashboard"
            )
          }
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <div className="premium-hero">

        <div className="hero-left">

          <div className="avatar-ring">

            <img
              src={
                client?.profile_photo ||
                "https://i.pravatar.cc/200"
              }
              className="member-avatar"
              alt="Profile"
            />

          </div>

          <div>

            <p className="hero-brand">
              BODY ENGINEERING
            </p>

            <h1>
              My Workout Plan
            </h1>

            <p className="hero-message">
              💪 Train smart. Stay consistent.
            </p>

          </div>

        </div>

        <div className="hero-right">

          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >
            Sign Out
          </button>

        </div>

      </div>

      {/* =====================================================
          BACK
      ===================================================== */}

      <button
        className="view-btn"
        onClick={() =>
          navigate(
            "/online-dashboard"
          )
        }
        style={{
          marginTop:
            "20px",
        }}
      >
        ← Back to Dashboard
      </button>

      {/* =====================================================
          WORKOUT PROGRESS
      ===================================================== */}

      <section
        className="assessment-card"
        style={{
          marginTop:
            "24px",
        }}
      >

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              "15px",
            flexWrap:
              "wrap",
          }}
        >

          <div>

            <p
              style={{
                margin: 0,
                fontSize:
                  "12px",
                fontWeight:
                  "700",
                letterSpacing:
                  "1.5px",
                color:
                  "#ff4438",
              }}
            >
              CURRENT PROGRAM DAY
            </p>

            <h2
              style={{
                margin:
                  "6px 0 4px",
              }}
            >
              💪 Day{" "}
              {
                currentProgramDay
              }{" "}
              Exercise Completion
            </h2>

            <p
              style={{
                margin: 0,
                opacity:
                  0.7,
              }}
            >
              {
                currentDayCompletedCount
              }{" "}
              of{" "}
              {
                currentDayTotal
              }{" "}
              exercises completed
            </p>

          </div>

          <div
            style={{
              minWidth:
                "80px",
              textAlign:
                "center",
            }}
          >

            <strong
              style={{
                fontSize:
                  "30px",
              }}
            >
              {
                currentDayPercentage
              }%
            </strong>

          </div>

        </div>

        {/* PROGRESS BAR */}

        <div
          style={{
            marginTop:
              "20px",
            height:
              "12px",
            borderRadius:
              "20px",
            background:
              "rgba(255,255,255,.08)",
            overflow:
              "hidden",
          }}
        >

          <div
            style={{
              width:
                `${currentDayPercentage}%`,
              height:
                "100%",
              borderRadius:
                "20px",
              background:
                "linear-gradient(90deg,#ff4438,#32d74b)",
              transition:
                "width .3s ease",
            }}
          />

        </div>

        {/* STATS */}

        <div
          style={{
            display:
              "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(130px,1fr))",
            gap:
              "12px",
            marginTop:
              "18px",
          }}
        >

          <div
            style={{
              padding:
                "15px",
              borderRadius:
                "12px",
              background:
                "rgba(50,215,75,.08)",
            }}
          >

            <small>
              COMPLETED
            </small>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "5px",
                fontSize:
                  "22px",
                color:
                  "#32d74b",
              }}
            >
              {
                currentDayCompletedCount
              }
            </strong>

          </div>

          <div
            style={{
              padding:
                "15px",
              borderRadius:
                "12px",
              background:
                "rgba(255,255,255,.04)",
            }}
          >

            <small>
              REMAINING
            </small>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "5px",
                fontSize:
                  "22px",
              }}
            >
              {
                currentDayRemaining
              }
            </strong>

          </div>

          <div
            style={{
              padding:
                "15px",
              borderRadius:
                "12px",
              background:
                "rgba(255,68,56,.08)",
            }}
          >

            <small>
              ASSIGNED
            </small>

            <strong
              style={{
                display:
                  "block",
                marginTop:
                  "5px",
                fontSize:
                  "22px",
              }}
            >
              {
                currentDayTotal
              }
            </strong>

          </div>

        </div>

        {currentDayTotal ===
          0 && (
          <div
            style={{
              marginTop:
                "18px",
              padding:
                "14px",
              borderRadius:
                "12px",
              background:
                "rgba(255,255,255,.04)",
              textAlign:
                "center",
              opacity:
                0.7,
            }}
          >
            📋 No exercises are
            assigned to Day{" "}
            {
              currentProgramDay
            }.
          </div>
        )}

        {currentDayTotal >
          0 &&
          currentDayCompletedCount ===
            currentDayTotal && (
            <div
              style={{
                marginTop:
                  "18px",
                padding:
                  "14px 16px",
                borderRadius:
                  "12px",
                background:
                  "rgba(50,215,75,.12)",
                color:
                  "#32d74b",
                fontWeight:
                  "700",
                textAlign:
                  "center",
              }}
            >
              🎉 Day{" "}
              {
                currentProgramDay
              }{" "}
              completed! Great job!
            </div>
          )}

      </section>

      {/* =====================================================
          NO ACTIVE PLAN
      ===================================================== */}

      {!workoutPlan ? (
        <section
          className="assessment-card"
          style={{
            marginTop:
              "24px",
            textAlign:
              "center",
            padding:
              "50px 25px",
          }}
        >

          <div
            style={{
              fontSize:
                "55px",
              marginBottom:
                "15px",
            }}
          >
            🏋️
          </div>

          <h2>
            Your Workout Plan Is
            Coming Soon
          </h2>

          <p
            style={{
              opacity:
                0.7,
              maxWidth:
                "550px",
              margin:
                "10px auto 0",
            }}
          >
            Your coach hasn't assigned
            an active workout plan yet.
            Once your personalized
            programme is ready, it will
            appear here.
          </p>

        </section>
      ) : (
        <>

          {/* =================================================
              PLAN HEADER
          ================================================= */}

          <section
            className="assessment-card"
            style={{
              marginTop:
                "24px",
            }}
          >

            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "flex-start",
                gap:
                  "20px",
                flexWrap:
                  "wrap",
              }}
            >

              <div>

                <p
                  style={{
                    margin: 0,
                    fontSize:
                      "13px",
                    fontWeight:
                      "700",
                    letterSpacing:
                      "1.5px",
                    color:
                      "#ff4438",
                  }}
                >
                  PERSONALIZED TRAINING
                </p>

                <h2
                  style={{
                    marginTop:
                      "8px",
                    marginBottom:
                      "8px",
                  }}
                >
                  {
                    workoutPlan.plan_name
                  }
                </h2>

                {workoutPlan.goal && (
                  <p>
                    🎯{" "}
                    <strong>
                      Goal:
                    </strong>{" "}
                    {
                      workoutPlan.goal
                    }
                  </p>
                )}

              </div>

              <div
                style={{
                  padding:
                    "8px 15px",
                  borderRadius:
                    "30px",
                  background:
                    "rgba(50,215,75,.12)",
                  color:
                    "#32d74b",
                  fontWeight:
                    "700",
                }}
              >
                🟢 ACTIVE PLAN
              </div>

            </div>

            {workoutPlan.coach_notes && (
              <div
                style={{
                  marginTop:
                    "22px",
                  padding:
                    "18px",
                  borderRadius:
                    "14px",
                  background:
                    "rgba(255,255,255,.04)",
                  border:
                    "1px solid rgba(255,255,255,.08)",
                }}
              >

                <strong>
                  📝 Coach's Notes
                </strong>

                <p
                  style={{
                    marginBottom:
                      0,
                    marginTop:
                      8,
                    lineHeight:
                      1.6,
                  }}
                >
                  {
                    workoutPlan.coach_notes
                  }
                </p>

              </div>
            )}

          </section>

          {/* =================================================
              WORKOUT DAYS
          ================================================= */}

          {sortedWorkoutDays.map(
            (
              [
                dayName,
                dayExercises,
              ]
            ) => {

              const dayNumber =
                getExerciseDay(
                  dayExercises[0]
                );

              const dayCompleted =
                dayExercises.filter(
                  isExerciseCompleted
                ).length;

              const dayTotal =
                dayExercises.length;

              const dayPercentage =
                dayTotal > 0
                  ? Math.round(
                      (dayCompleted /
                        dayTotal) *
                        100
                    )
                  : 0;

              return (
                <section
                  className="assessment-card"
                  key={`${dayName}-${dayNumber}`}
                  style={{
                    marginTop:
                      "24px",
                  }}
                >

                  {/* DAY HEADER */}

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      gap:
                        "15px",
                      flexWrap:
                        "wrap",
                      marginBottom:
                        "20px",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap:
                          "12px",
                      }}
                    >

                      <div
                        style={{
                          width:
                            "46px",
                          height:
                            "46px",
                          borderRadius:
                            "14px",
                          background:
                            "rgba(255,68,56,.12)",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize:
                            "23px",
                        }}
                      >
                        💪
                      </div>

                      <div>

                        <p
                          style={{
                            margin: 0,
                            fontSize:
                              "12px",
                            color:
                              "#ff4438",
                            fontWeight:
                              "700",
                            letterSpacing:
                              "1px",
                          }}
                        >
                          TRAINING DAY
                        </p>

                        <h2
                          style={{
                            margin:
                              "3px 0 0",
                          }}
                        >
                          {dayName}
                        </h2>

                      </div>

                    </div>

                    <div
                      style={{
                        textAlign:
                          "right",
                      }}
                    >

                      <strong
                        style={{
                          fontSize:
                            "20px",
                        }}
                      >
                        {
                          dayPercentage
                        }%
                      </strong>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          opacity:
                            0.6,
                          marginTop:
                            "3px",
                        }}
                      >
                        {
                          dayCompleted
                        }{" "}
                        /{" "}
                        {
                          dayTotal
                        }
                      </div>

                    </div>

                  </div>

                  {/* DAY PROGRESS */}

                  <div
                    style={{
                      height:
                        "7px",
                      width:
                        "100%",
                      background:
                        "rgba(255,255,255,.07)",
                      borderRadius:
                        "999px",
                      overflow:
                        "hidden",
                      marginBottom:
                        "20px",
                    }}
                  >

                    <div
                      style={{
                        width:
                          `${dayPercentage}%`,
                        height:
                          "100%",
                        background:
                          "linear-gradient(90deg,#ff4438,#32d74b)",
                        borderRadius:
                          "999px",
                        transition:
                          "width .3s ease",
                      }}
                    />

                  </div>

                  {/* EXERCISES */}

                  <div
                    style={{
                      display:
                        "flex",
                      flexDirection:
                        "column",
                      gap:
                        "12px",
                    }}
                  >

                    {dayExercises.map(
                      (
                        exercise,
                        index
                      ) => {

                        const completed =
                          isExerciseCompleted(
                            exercise
                          );

                        const completedToday =
                          isExerciseCompletedToday(
                            exercise
                          );

                        const isSaving =
                          completingExercise ===
                          String(
                            exercise.id
                          );

                        return (
                          <div
                            key={
                              exercise.id ||
                              `${dayName}-${index}`
                            }
                            style={{
                              padding:
                                "16px",
                              borderRadius:
                                "14px",
                              background:
                                completed
                                  ? "rgba(50,215,75,.08)"
                                  : "rgba(255,255,255,.035)",
                              border:
                                completed
                                  ? "1px solid rgba(50,215,75,.25)"
                                  : "1px solid rgba(255,255,255,.08)",
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap:
                                  "15px",
                                flexWrap:
                                  "wrap",
                              }}
                            >

                              <div>

                                <h3
                                  style={{
                                    margin:
                                      "0 0 5px",
                                  }}
                                >
                                  {index +
                                    1}
                                  .{" "}
                                  {
                                    exercise.exercise_name ||
                                    exercise.exercise ||
                                    exercise.name ||
                                    "Exercise"
                                  }
                                </h3>

                                {exercise.reps && (
                                  <p
                                    style={{
                                      margin:
                                        0,
                                      fontSize:
                                        "13px",
                                      opacity:
                                        0.65,
                                    }}
                                  >
                                    Reps:{" "}
                                    {
                                      exercise.reps
                                    }
                                  </p>
                                )}

                                {exercise.sets && (
                                  <p
                                    style={{
                                      margin:
                                        "3px 0 0",
                                      fontSize:
                                        "13px",
                                      opacity:
                                        0.65,
                                    }}
                                  >
                                    Sets:{" "}
                                    {
                                      exercise.sets
                                    }
                                  </p>
                                )}

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleCompleteExercise(
                                    exercise
                                  )
                                }
                                disabled={
                                  completedToday ||
                                  isSaving
                                }
                                style={{
                                  border:
                                    "none",
                                  borderRadius:
                                    "10px",
                                  padding:
                                    "10px 16px",
                                  fontWeight:
                                    "700",
                                  cursor:
                                    completedToday
                                      ? "default"
                                      : "pointer",
                                  background:
                                    completedToday
                                      ? "rgba(50,215,75,.15)"
                                      : "#ff4438",
                                  color:
                                    completedToday
                                      ? "#32d74b"
                                      : "#fff",
                                  opacity:
                                    isSaving
                                      ? 0.7
                                      : 1,
                                  minWidth:
                                    "145px",
                                }}
                              >
                                {isSaving
                                  ? "Saving..."
                                  : completedToday
                                  ? "✓ Completed Today"
                                  : completed
                                  ? "✓ Completed"
                                  : "✓ Mark Complete"}
                              </button>

                            </div>

                            {completed &&
                              !completedToday && (
                                <div
                                  style={{
                                    marginTop:
                                      "10px",
                                    fontSize:
                                      "12px",
                                    color:
                                      "#32d74b",
                                    opacity:
                                      0.75,
                                  }}
                                >
                                  ✓ Previously
                                  completed
                                </div>
                              )}

                          </div>
                        );
                      }
                    )}

                  </div>

                </section>
              );
            }
          )}

        </>
      )}

      {/* =====================================================
          TRAINING HISTORY
      ===================================================== */}

      {completions.length >
        0 && (
        <section
          className="assessment-card"
          style={{
            marginTop:
              "24px",
            marginBottom:
              "40px",
          }}
        >

          <h2>
            📈 Training History
          </h2>

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(130px,1fr))",
              gap:
                "12px",
              marginTop:
                "18px",
            }}
          >

            <div
              style={{
                padding:
                  "15px",
                borderRadius:
                  "12px",
                background:
                  "rgba(50,215,75,.08)",
              }}
            >

              <small>
                TOTAL COMPLETED
              </small>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  fontSize:
                    "22px",
                  color:
                    "#32d74b",
                }}
              >
                {
                  totalCompleted
                }
              </strong>

            </div>

            <div
              style={{
                padding:
                  "15px",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,255,255,.04)",
              }}
            >

              <small>
                ACTIVE DAYS
              </small>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  fontSize:
                    "22px",
                }}
              >
                {
                  activeDays
                }
              </strong>

            </div>

            <div
              style={{
                padding:
                  "15px",
                borderRadius:
                  "12px",
                background:
                  "rgba(255,68,56,.08)",
              }}
            >

              <small>
                THIS WEEK
              </small>

              <strong
                style={{
                  display:
                    "block",
                  marginTop:
                    "5px",
                  fontSize:
                    "22px",
                }}
              >
                {
                  thisWeekCompleted
                }
              </strong>

            </div>

          </div>

          <div
            style={{
              marginTop:
                "20px",
            }}
          >

            {recentCompletions.map(
              (
                completion
              ) => {

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
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap:
                        "15px",
                      padding:
                        "14px 0",
                      borderBottom:
                        "1px solid rgba(255,255,255,.07)",
                    }}
                  >

                    <div>

                      <strong>
                        {
                          exercise?.exercise_name ||
                          exercise?.exercise ||
                          exercise?.name ||
                          "Exercise"
                        }
                      </strong>

                      <div
                        style={{
                          fontSize:
                            "12px",
                          opacity:
                            0.6,
                          marginTop:
                            "4px",
                        }}
                      >
                        {
                          formatDate(
                            completion.completed_date
                          )
                        }
                      </div>

                    </div>

                    <div
                      style={{
                        fontSize:
                          "22px",
                      }}
                    >
                      ✅
                    </div>

                  </div>
                );
              }
            )}

          </div>

        </section>
      )}

    </div>
  );
}