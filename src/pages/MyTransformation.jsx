import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MyTransformation() {
  const [assessment, setAssessment] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, []);

  async function loadAssessment() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!member) return;

    const { data } = await supabase
      .from("body_assessments")
      .select("*")
      .eq("member_id", member.id)
      .order("assessment_date", { ascending: false })
      .limit(1)
      .single();

    setAssessment(data);
  }

  if (!assessment) {
    return (
      <div className="page">
        <h1>My Transformation</h1>
        <p>No assessment found.</p>
      </div>
    );
  }

  return (
    <div className="page">

      <h1>📈 My Transformation</h1>

      <div className="assessment-card">

        <h2>❤️ Basic Health</h2>

        <div className="assessment-grid">

          <div className="metric-card">
            <label>Height</label>
            <h3>{assessment.height} cm</h3>
          </div>

          <div className="metric-card">
            <label>Weight</label>
            <h3>{assessment.weight} kg</h3>
          </div>

          <div className="metric-card">
            <label>BMI</label>
            <h3>{assessment.bmi}</h3>
          </div>

          <div className="metric-card">
            <label>Body Fat</label>
            <h3>{assessment.body_fat}%</h3>
          </div>

        </div>

      </div>

      <div className="assessment-card">

        <h2>📏 Measurements</h2>

        <div className="assessment-grid">

          <div className="metric-card">
            <label>Shoulders</label>
            <h3>{assessment.shoulders} cm</h3>
          </div>

          <div className="metric-card">
            <label>Bust</label>
            <h3>{assessment.bust} cm</h3>
          </div>

          <div className="metric-card">
            <label>Under Bust</label>
            <h3>{assessment.under_bust} cm</h3>
          </div>

          <div className="metric-card">
            <label>Waist</label>
            <h3>{assessment.waist} cm</h3>
          </div>

          <div className="metric-card">
            <label>Upper Abdomen</label>
            <h3>{assessment.upper_abdomen} cm</h3>
          </div>

          <div className="metric-card">
            <label>Lower Abdomen</label>
            <h3>{assessment.lower_abdomen} cm</h3>
          </div>

          <div className="metric-card">
            <label>Hips</label>
            <h3>{assessment.hips} cm</h3>
          </div>

          <div className="metric-card">
            <label>Left Arm</label>
            <h3>{assessment.left_arm} cm</h3>
          </div>

          <div className="metric-card">
            <label>Right Arm</label>
            <h3>{assessment.right_arm} cm</h3>
          </div>

          <div className="metric-card">
            <label>Left Thigh</label>
            <h3>{assessment.left_thigh} cm</h3>
          </div>

          <div className="metric-card">
            <label>Right Thigh</label>
            <h3>{assessment.right_thigh} cm</h3>
          </div>

        </div>

      </div>

      <div className="assessment-card">

        <h2>🎯 Goal</h2>
        <p>{assessment.goal || "Not Added"}</p>

        <h2 style={{ marginTop: "25px" }}>📝 Coach Notes</h2>
        <p>{assessment.coach_notes || "No Notes"}</p>

      </div>

    </div>
  );
}