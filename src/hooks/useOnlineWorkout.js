import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useOnlineWorkout(clientId) {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setWorkoutPlan(null);
      setExercises([]);
      setLoading(false);
      return;
    }

    loadWorkout();
  }, [clientId]);

  async function loadWorkout() {
    try {
      setLoading(true);

      // Get the latest active workout plan
      const {
        data: plans,
        error: planError,
      } = await supabase
        .from("online_workout_plans")
        .select("*")
        .eq("online_client_id", clientId)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (planError) throw planError;

      const plan = plans?.[0] || null;

      if (!plan) {
        setWorkoutPlan(null);
        setExercises([]);
        return;
      }

      // Get exercises belonging to this workout
      const {
        data: exerciseData,
        error: exerciseError,
      } = await supabase
        .from("online_workout_exercises")
        .select("*")
        .eq("workout_plan_id", plan.id)
        .order("exercise_order", {
          ascending: true,
        });

      if (exerciseError) throw exerciseError;

      setWorkoutPlan(plan);
      setExercises(exerciseData || []);
    } catch (error) {
      console.error(
        "Online workout loading error:",
        error
      );

      setWorkoutPlan(null);
      setExercises([]);
    } finally {
      setLoading(false);
    }
  }

  return {
    workoutPlan,
    exercises,
    loading,
    reloadWorkout: loadWorkout,
  };
}