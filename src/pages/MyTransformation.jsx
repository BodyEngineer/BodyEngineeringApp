import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
  } from "recharts";

export default function MyTransformation() {
  const [assessment, setAssessment] = useState(null);
  const [history, setHistory] = useState([]);

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
  
    const { data, error } = await supabase
      .from("body_assessments")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1);
  
    if (error) {
      console.log(error);
      return;
    }
  
    setAssessment(data[0]);
    console.log("Assessment Loaded:", data[0]);

    const { data: historyData } = await supabase
  .from("body_assessments")
  .select("assessment_date, weight, bmi, body_fat")
  .eq("member_id", member.id)
  .order("assessment_date", { ascending: true });

setHistory(historyData || []);
  
  }

 if (!assessment) {
  return (
    <div className="page">
      <h1>📈 My Transformation</h1>
      <p>Loading Assessment...</p>
    </div>
  );
}

return (
<div className="page">

<h1 className="page-title">
📈 My Transformation
</h1>

<div className="quick-grid">

  <div className="quick-card">
    <div className="quick-icon">⚖️</div>
    <h3>Weight</h3>
    <h1>{assessment.weight ?? "-"} kg</h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">📊</div>
    <h3>BMI</h3>
    <h1>{assessment.bmi ?? "-"}</h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">💧</div>
    <h3>Body Fat</h3>
    <h1>{assessment.body_fat ?? "-"}%</h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">🎯</div>
    <h3>Goal</h3>
    <h1>{assessment.goal || "-"}</h1>
  </div>
  </div>
  
      {/* BASIC HEALTH */}

      <div className="assessment-card">

<h2>
❤️ Basic Health
</h2>

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

      {/* BODY MEASUREMENTS */}

      <div className="assessment-card">

<h2>📏 Body Measurements</h2>

<div className="assessment-grid">

  <div className="metric-card">
    <label>Shoulders</label>
    <h3>{assessment.shoulders ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Bust</label>
    <h3>{assessment.bust ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Under Bust</label>
    <h3>{assessment.under_bust ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Waist</label>
    <h3>{assessment.waist ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Upper Abdomen</label>
    <h3>{assessment.upper_abdomen ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Lower Abdomen</label>
    <h3>{assessment.lower_abdomen ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Hips</label>
    <h3>{assessment.hips ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Left Arm</label>
    <h3>{assessment.left_arm ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Right Arm</label>
    <h3>{assessment.right_arm ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Left Thigh</label>
    <h3>{assessment.left_thigh ?? "-"} cm</h3>
  </div>

  <div className="metric-card">
    <label>Right Thigh</label>
    <h3>{assessment.right_thigh ?? "-"} cm</h3>
  </div>
</div>
</div>

      {/* COACH NOTES */}

      <div className="assessment-card">

  <h2>🎯 Goal</h2>

  <p>{assessment.goal || "Not Added"}</p>

  <h2 style={{ marginTop: "30px" }}>📝 Coach Notes</h2>

  <p>{assessment.coach_notes || "No Notes Available"}</p>

</div>

<div className="quick-grid">

  <div className="quick-card">
    <div className="quick-icon">🏆</div>
    <h3>Weight Lost</h3>

    <h1>
      {history.length > 1
        ? (history[0].weight - history[history.length - 1].weight).toFixed(1)
        : 0} kg
    </h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">💧</div>
    <h3>Body Fat</h3>

    <h1>
      {history.length > 1
        ? (history[0].body_fat - history[history.length - 1].body_fat).toFixed(1)
        : 0}%
    </h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">📊</div>
    <h3>BMI Change</h3>

    <h1>
      {history.length > 1
        ? (history[0].bmi - history[history.length - 1].bmi).toFixed(1)
        : 0}
    </h1>
  </div>

  <div className="quick-card">
    <div className="quick-icon">📅</div>
    <h3>Assessments</h3>

    <h1>{history.length}</h1>
  </div>

</div>

<div className="assessment-card">

  <h2>📈 Weight Progress</h2>

  <div style={{ width: "100%", height: 380 }}>

    <ResponsiveContainer>

      <LineChart data={history}>

      <CartesianGrid
  stroke="#2d3d5a"
  vertical={false}
/>

        <XAxis
  dataKey="assessment_date"
  tickFormatter={(date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    })
  }
/>

        <YAxis />

        <Tooltip
  contentStyle={{
    background: "#0f172a",
    border: "1px solid #ff4d4f",
    borderRadius: "12px",
    color: "#fff",
  }}
/>

        <Line
          type="monotone"
          dataKey="weight"
          stroke="#ff4d4f"
          strokeWidth={3}
        />

      </LineChart>

    </ResponsiveContainer>

    </div>
    </div>
    <div className="assessment-card">

<h2>📷 Transformation Photos</h2>

<div className="photo-grid">

  <div>
    <h3>Front Before</h3>
    {assessment.front_before ? (
     <img
     src={assessment.front_before}
     alt="Front Before"
     style={{
       width: "250px",
       height: "320px",
       objectFit: "cover",
       borderRadius: "12px"
     }}
   />
    ) : (
      <p>No Photo</p>
    )}
  </div>

  <div>
    <h3>Side Before</h3>
    {assessment.side_before ? (
      <img
        src={assessment.side_before}
        alt="Side Before"
        className="progress-photo"
      />
    ) : (
      <p>No Photo</p>
    )}
  </div>

  <div>
    <h3>Back Before</h3>
    {assessment.back_before ? (
      <img
        src={assessment.back_before}
        alt="Back Before"
        className="progress-photo"
      />
    ) : (
      <p>No Photo</p>
    )}
  </div>

</div>

<br />

<div className="photo-grid">

  <div>
    <h3>Front After</h3>
    {assessment.front_after ? (
      <img
        src={assessment.front_after}
        alt="Front After"
        className="progress-photo"
      />
    ) : (
      <p>No Photo</p>
    )}
  </div>

  <div>
    <h3>Side After</h3>
    {assessment.side_after ? (
      <img
        src={assessment.side_after}
        alt="Side After"
        className="progress-photo"
      />
    ) : (
      <p>No Photo</p>
    )}
  </div>

  <div>
    <h3>Back After</h3>
    {assessment.back_after ? (
      <img
        src={assessment.back_after}
        alt="Back After"
        className="progress-photo"
      />
    ) : (
      <p>No Photo</p>
    )}
  </div>

</div>

</div>

</div>

  );
}