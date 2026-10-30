import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import Header from "../components/Header";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AddOnlineWorkout() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const {
    id: onlineClientId,
    workoutId,
  } = useParams();

  const isEditMode = Boolean(workoutId);

  const [client, setClient] = useState(null);

  const [planName, setPlanName] = useState("");
  const [goal, setGoal] = useState("");
  const [coachNotes, setCoachNotes] = useState("");

  const [exercises, setExercises] = useState([
    {
      day_name: "Day 1",
      exercise_name: "",
      sets: 3,
      reps: "",
      weight: "",
      rest: "",
      tempo: "",
      notes: "",
      exercise_order: 1,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadClient();

    if (workoutId) {
      loadWorkout();
    }
  }, [onlineClientId, workoutId]);

  async function loadClient() {
    try {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("online_clients")
        .select("*")
        .eq("id", onlineClientId)
        .single();

      if (error) throw error;

      setClient(data);

      // Pre-fill useful information
      setGoal(data.goal || "");
    } catch (err) {
      console.error("Load online client error:", err);
      setError(
        err.message || "Unable to load online client."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadWorkout() {
    if (!workoutId) return;

    try {
      setLoading(true);
      setError("");

      // Load workout plan
      const {
        data: workoutPlan,
        error: planError,
      } = await supabase
        .from("online_workout_plans")
        .select("*")
        .eq("id", workoutId)
        .eq("online_client_id", onlineClientId)
        .single();

      if (planError) throw planError;

      // Load exercises
      const {
        data: workoutExercises,
        error: exerciseError,
      } = await supabase
        .from("online_workout_exercises")
        .select("*")
        .eq("workout_plan_id", workoutPlan.id)
        .order("exercise_order", {
          ascending: true,
        });

      if (exerciseError) throw exerciseError;

      setPlanName(workoutPlan.plan_name || "");
      setGoal(workoutPlan.goal || "");
      setCoachNotes(workoutPlan.coach_notes || "");

      if (workoutExercises?.length > 0) {
        setExercises(
          workoutExercises.map((exercise, index) => ({
            id: exercise.id,

            day_name:
              exercise.day_name || "Day 1",

            exercise_name:
              exercise.exercise_name || "",

            sets:
              exercise.sets ?? 3,

            reps:
              exercise.reps || "",

            weight:
              exercise.weight || "",

            rest:
              exercise.rest || "",

            tempo:
              exercise.tempo || "",

            notes:
              exercise.notes || "",

            exercise_order:
              exercise.exercise_order ?? index + 1,
          }))
        );
      }
    } catch (err) {
      console.error(
        "Load workout error:",
        err
      );

      setError(
        err.message ||
          "Unable to load workout plan."
      );
    } finally {
      setLoading(false);
    }
  }

  function addExercise(dayName = null) {
    setExercises((prev) => {
      const targetDay =
        dayName ||
        (prev.length > 0
          ? prev[prev.length - 1].day_name
          : "Day 1");

      const dayExerciseCount = prev.filter(
        (exercise) =>
          exercise.day_name === targetDay
      ).length;

      return [
        ...prev,
        {
          day_name: targetDay,
          exercise_name: "",
          sets: 3,
          reps: "",
          weight: "",
          rest: "",
          tempo: "",
          notes: "",
          exercise_order:
            dayExerciseCount + 1,
        },
      ];
    });
  }

  function removeExercise(index) {
    if (exercises.length === 1) {
      return;
    }

    setExercises((prev) => {
      const filtered = prev.filter(
        (_, i) => i !== index
      );

      return normalizeExerciseOrder(filtered);
    });
  }

  function updateExercise(index, field, value) {
    setExercises((prev) =>
      prev.map((exercise, i) =>
        i === index
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      )
    );
  }

  function addDay() {
    const existingDayNumbers = exercises
      .map((item) => {
        const match =
          item.day_name?.match(
            /^Day\s+(\d+)$/i
          );

        return match
          ? Number(match[1])
          : 0;
      })
      .filter(Boolean);

    const nextDayNumber =
      existingDayNumbers.length > 0
        ? Math.max(
            ...existingDayNumbers
          ) + 1
        : 1;

    setExercises((prev) => [
      ...prev,
      {
        day_name: `Day ${nextDayNumber}`,
        exercise_name: "",
        sets: 3,
        reps: "",
        weight: "",
        rest: "",
        tempo: "",
        notes: "",
        exercise_order: 1,
      },
    ]);
  }

  function normalizeExerciseOrder(exerciseList) {
    const counters = {};

    return exerciseList.map((exercise) => {
      const dayName =
        exercise.day_name?.trim() || "Day 1";

      if (!counters[dayName]) {
        counters[dayName] = 0;
      }

      counters[dayName] += 1;

      return {
        ...exercise,
        day_name: dayName,
        exercise_order: counters[dayName],
      };
    });
  }

  async function handleSaveWorkout() {
    setError("");
    setMessage("");

    if (!onlineClientId) {
      setError("Online client ID is missing.");
      return;
    }

    if (!planName.trim()) {
      setError("Please enter a workout plan name.");
      return;
    }

    const validExercises = exercises.filter(
      (exercise) =>
        exercise.exercise_name &&
        exercise.exercise_name.trim()
    );

    if (validExercises.length === 0) {
      setError("Please add at least one exercise.");
      return;
    }

    try {
      setSaving(true);

      /*
       * =========================================
       * NORMALIZE EXERCISES
       * =========================================
       */

      const orderedExercises =
        normalizeExerciseOrder(validExercises);

      /*
       * =========================================
       * EDIT EXISTING WORKOUT
       * =========================================
       */

      if (isEditMode) {
        /*
         * 1. Update workout plan
         */

        const {
          error: planUpdateError,
        } = await supabase
          .from("online_workout_plans")
          .update({
            plan_name: planName.trim(),
            goal: goal.trim(),
            coach_notes: coachNotes.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", workoutId)
          .eq(
            "online_client_id",
            onlineClientId
          );

        if (planUpdateError) {
          throw planUpdateError;
        }

        /*
         * 2. Delete old exercises
         */

        const {
          error: deleteError,
        } = await supabase
          .from("online_workout_exercises")
          .delete()
          .eq(
            "workout_plan_id",
            workoutId
          );

        if (deleteError) {
          throw deleteError;
        }

        /*
         * 3. Insert the NEW exercises
         */

        const exerciseRows =
          orderedExercises.map(
            (exercise) => ({
              workout_plan_id: workoutId,

              day_name:
                exercise.day_name?.trim() ||
                "Day 1",

              exercise_name:
                exercise.exercise_name.trim(),

              sets:
                exercise.sets !== ""
                  ? Number(exercise.sets)
                  : null,

              reps:
                exercise.reps?.trim() || "",

              weight:
                exercise.weight?.trim() || "",

              rest:
                exercise.rest?.trim() || "",

              tempo:
                exercise.tempo?.trim() || "",

              notes:
                exercise.notes?.trim() || "",

              exercise_order:
                exercise.exercise_order,
            })
          );

        const {
          error: exerciseError,
        } = await supabase
          .from("online_workout_exercises")
          .insert(exerciseRows);

        if (exerciseError) {
          throw exerciseError;
        }

        setMessage(
          "Workout plan updated successfully! ✅"
        );

        setTimeout(() => {
          navigate(
            `/online-clients/${onlineClientId}`
          );
        }, 800);

        return;
      }

      /*
       * =========================================
       * CREATE NEW WORKOUT
       * =========================================
       */

      /*
       * 1. Deactivate previous active plans
       */

      const {
        error: deactivateError,
      } = await supabase
        .from("online_workout_plans")
        .update({
          is_active: false,
        })
        .eq(
          "online_client_id",
          onlineClientId
        );

      if (deactivateError) {
        throw deactivateError;
      }

      /*
       * 2. CREATE THE NEW WORKOUT PLAN
       */

      const {
        data: newWorkoutPlan,
        error: planError,
      } = await supabase
        .from("online_workout_plans")
        .insert({
          online_client_id:
            onlineClientId,

          plan_name:
            planName.trim(),

          goal:
            goal.trim(),

          coach_notes:
            coachNotes.trim(),

          is_active: true,
        })
        .select()
        .single();

      if (planError) {
        throw planError;
      }

      /*
       * IMPORTANT:
       * Use newWorkoutPlan.id
       * NOT workoutId
       */

      const exerciseRows =
        orderedExercises.map(
          (exercise) => ({
            workout_plan_id:
              newWorkoutPlan.id,

            day_name:
              exercise.day_name?.trim() ||
              "Day 1",

            exercise_name:
              exercise.exercise_name.trim(),

            sets:
              exercise.sets !== ""
                ? Number(exercise.sets)
                : null,

            reps:
              exercise.reps?.trim() || "",

            weight:
              exercise.weight?.trim() || "",

            rest:
              exercise.rest?.trim() || "",

            tempo:
              exercise.tempo?.trim() || "",

            notes:
              exercise.notes?.trim() || "",

            exercise_order:
              exercise.exercise_order,
          })
        );

      /*
       * 3. INSERT EXERCISES
       */

      const {
        error: exerciseError,
      } = await supabase
        .from("online_workout_exercises")
        .insert(exerciseRows);

      if (exerciseError) {

        /*
         * Roll back the newly created plan
         */

        await supabase
          .from("online_workout_plans")
          .delete()
          .eq(
            "id",
            newWorkoutPlan.id
          );

        throw exerciseError;
      }

      /*
       * SUCCESS
       */

      setMessage(
        "Workout plan created successfully! ✅"
      );

      setTimeout(() => {
        navigate(
          `/online-clients/${onlineClientId}`
        );
      }, 800);

    } catch (err) {

      console.error(
        "Save online workout error:",
        err
      );

      setError(
        err.message ||
          "Unable to save workout plan."
      );

    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page">
        <div className="alert alert-error">
          {error ||
            "Online client could not be found."}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
<Header
  title={
    isEditMode
      ? "Edit Online Workout"
      : "Create Online Workout"
  }
  subtitle={
    isEditMode
      ? `Update the workout plan for ${client.full_name}`
      : `Create a personalized workout plan for ${client.full_name}`
  }
  onMenuClick={openSidebar}
/>

      {/* BACK BUTTON */}

      <button
        className="btn"
        onClick={() =>
          navigate(
            `/online-clients/${onlineClientId}`
          )
        }
        style={{
          marginBottom: "20px",
        }}
      >
        ← Back to Client
      </button>

      {/* CLIENT HEADER */}

      <section className="assessment-card">

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >

          {client.profile_photo ? (
            <img
              src={client.profile_photo}
              alt={client.full_name}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                objectFit: "cover",
                border:
                  "3px solid #ff4d4d",
              }}
            />
          ) : (
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#ff4d4d,#ff8a00)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "30px",
                fontWeight: "700",
              }}
            >
              {client.full_name
                ?.split(" ")
                .map((name) => name[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </div>
          )}

          <div>
            <p
              style={{
                margin: 0,
                opacity: 0.6,
              }}
            >
              ONLINE CLIENT
            </p>

            <h1
              style={{
                margin:
                  "5px 0 5px",
              }}
            >
              {client.full_name}
            </h1>

            <p
              style={{
                margin: 0,
              }}
            >
              🎯 {client.goal || "Goal not specified"}
            </p>
          </div>

        </div>

      </section>

      {/* PLAN DETAILS */}

      <section
        className="assessment-card"
        style={{
          marginTop: "24px",
        }}
      >

        <h2>
          💪 Workout Plan Details
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Plan Name
            </label>

            <input
              type="text"
              value={planName}
              onChange={(e) =>
                setPlanName(e.target.value)
              }
              placeholder="Example: 12 Week Fat Loss Program"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border:
                  "1px solid #444",
                background:
                  "#1e1e1e",
                color: "#fff",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Goal
            </label>

            <input
              type="text"
              value={goal}
              onChange={(e) =>
                setGoal(e.target.value)
              }
              placeholder="Fat loss / Muscle gain / Strength"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border:
                  "1px solid #444",
                background:
                  "#1e1e1e",
                color: "#fff",
                boxSizing:
                  "border-box",
              }}
            />
          </div>

        </div>

        <div
          style={{
            marginTop: "20px",
          }}
        >

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
            }}
          >
            Coach Notes
          </label>

          <textarea
            value={coachNotes}
            onChange={(e) =>
              setCoachNotes(e.target.value)
            }
            placeholder="Add instructions, coaching notes or special considerations..."
            rows={4}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              border:
                "1px solid #444",
              background:
                "#1e1e1e",
              color: "#fff",
              resize: "vertical",
              boxSizing:
                "border-box",
            }}
          />

        </div>

      </section>

      {/* EXERCISES */}

      <section
        className="assessment-card"
        style={{
          marginTop: "24px",
        }}
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >

          <div>
            <h2
              style={{
                marginBottom: "5px",
              }}
            >
              🏋️ Exercises
            </h2>

            <p
              style={{
                margin: 0,
                opacity: 0.7,
              }}
            >
              Build the workout day by day.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

<button
  type="button"
  className="btn"
  onClick={() => {
    const lastExercise = exercises[exercises.length - 1]
    addExercise(lastExercise?.day_name || "Day 1")
  }}
  disabled={saving}
>
  ➕ Add Exercise
</button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={addDay}
              disabled={saving}
            >
              📅 Add Day
            </button>

          </div>

        </div>

        <div
          style={{
            marginTop: "25px",
          }}
        >

{Object.entries(
  exercises.reduce((days, exercise, index) => {
    const dayName =
      exercise.day_name?.trim() || "Day 1";

    if (!days[dayName]) {
      days[dayName] = [];
    }

    days[dayName].push({
      ...exercise,
      originalIndex: index,
    });

    return days;
  }, {})
).map(([dayName, dayExercises]) => (
  <div
    key={dayName}
    style={{
      marginBottom: "30px",
    }}
  >

    {/* DAY HEADER */}

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap",
        padding: "18px 20px",
        marginBottom: "15px",
        borderRadius: "14px",
        background:
          "rgba(255,68,56,0.10)",
        border:
          "1px solid rgba(255,68,56,0.25)",
      }}
    >

      <div>
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#ff4438",
          }}
        >
          TRAINING DAY
        </p>

        <h2
          style={{
            margin: "4px 0 0",
          }}
        >
          {dayName}
        </h2>
      </div>

      <button
        type="button"
        className="btn"
        onClick={() =>
          addExercise(dayName)
        }
        disabled={saving}
      >
        ➕ Add Exercise
      </button>

    </div>

    {/* DAY EXERCISES */}

    {dayExercises.map(
      (exercise, dayIndex) => {

        const index =
          exercise.originalIndex;

        return (
          <div
            key={index}
            style={{
              padding: "22px",
              marginBottom: "18px",
              borderRadius: "16px",
              background:
                "rgba(255,255,255,0.04)",
              border:
                "1px solid rgba(255,255,255,0.08)",
            }}
          >

            {/* EXERCISE HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >

              <h3
                style={{
                  margin: 0,
                }}
              >
                Exercise #{dayIndex + 1}
              </h3>

              {exercises.length > 1 && (
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    removeExercise(index)
                  }
                  disabled={saving}
                >
                  🗑 Remove
                </button>
              )}

            </div>

            {/* ROW 1 */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(200px,1fr))",
                gap: "16px",
              }}
            >

              <div>
                <label>
                  Day
                </label>

                <input
                  type="text"
                  value={
                    exercise.day_name
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "day_name",
                      e.target.value
                    )
                  }
                  placeholder="Day 1"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  Exercise Name
                </label>

                <input
                  type="text"
                  value={
                    exercise.exercise_name
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "exercise_name",
                      e.target.value
                    )
                  }
                  placeholder="Example: Barbell Squat"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  Sets
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    exercise.sets
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "sets",
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  Reps
                </label>

                <input
                  type="text"
                  value={
                    exercise.reps
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "reps",
                      e.target.value
                    )
                  }
                  placeholder="8-12"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

            </div>

            {/* ROW 2 */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: "16px",
                marginTop: "16px",
              }}
            >

              <div>
                <label>
                  Weight
                </label>

                <input
                  type="text"
                  value={
                    exercise.weight
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "weight",
                      e.target.value
                    )
                  }
                  placeholder="60 kg / Bodyweight"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  Rest
                </label>

                <input
                  type="text"
                  value={
                    exercise.rest
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "rest",
                      e.target.value
                    )
                  }
                  placeholder="60 sec"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

              <div>
                <label>
                  Tempo
                </label>

                <input
                  type="text"
                  value={
                    exercise.tempo
                  }
                  onChange={(e) =>
                    updateExercise(
                      index,
                      "tempo",
                      e.target.value
                    )
                  }
                  placeholder="3-1-1-0"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "6px",
                    borderRadius: "10px",
                    border:
                      "1px solid #444",
                    background:
                      "#1e1e1e",
                    color: "#fff",
                    boxSizing:
                      "border-box",
                  }}
                />
              </div>

            </div>

            {/* NOTES */}

            <div
              style={{
                marginTop: "16px",
              }}
            >

              <label>
                Exercise Notes
              </label>

              <textarea
                value={
                  exercise.notes
                }
                onChange={(e) =>
                  updateExercise(
                    index,
                    "notes",
                    e.target.value
                  )
                }
                placeholder="Technique cues, modifications, instructions..."
                rows={2}
                style={{
                  width: "100%",
                  padding: "12px",
                  marginTop: "6px",
                  borderRadius: "10px",
                  border:
                    "1px solid #444",
                  background:
                    "#1e1e1e",
                  color: "#fff",
                  resize:
                    "vertical",
                  boxSizing:
                    "border-box",
                }}
              />

            </div>

          </div>
        );
      }
    )}

  </div>
))}

        </div>

      </section>

      {/* ERROR */}

      {error && (
        <div
          className="alert alert-error"
          style={{
            marginTop: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* SUCCESS */}

      {message && (
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "12px",
            background:
              "rgba(50,215,75,0.12)",
            color: "#32d74b",
            fontWeight: "600",
          }}
        >
          {message}
        </div>
      )}

      {/* SAVE */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "flex-end",
          gap: "12px",
          marginTop: "25px",
          paddingBottom: "40px",
        }}
      >

        <button
          type="button"
          className="btn"
          onClick={() =>
            navigate(
              `/online-clients/${onlineClientId}`
            )
          }
          disabled={saving}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveWorkout}
          disabled={saving}
        >
          {saving
  ? "Saving Workout..."
  : isEditMode
    ? "💾 Update Workout Plan"
    : "💾 Save Workout Plan"}
        </button>

      </div>

    </div>
  );
}