import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function BodyAssessment() {
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState("");

  const [form, setForm] = useState({
    height: "",
    weight: "",
    bmi: "",
    body_fat: "",
  
    neck: "",
    shoulders: "",
  
    bust: "",
    under_bust: "",
  
    waist: "",
    upper_abdomen: "",
    lower_abdomen: "",
    hips: "",
  
    left_arm: "",
    right_arm: "",
  
    left_thigh: "",
    right_thigh: "",
  
    left_calf: "",
    right_calf: "",
  
    goal: "",
    coach_notes: "",
  });

  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const bmi = (Number(form.weight) / (h * h)).toFixed(1);
  
      setForm((prev) => ({
        ...prev,
        bmi,
      }));
    }
  }, [form.height, form.weight]);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("owner_id", user.id)
      .order("full_name");

    setMembers(data || []);
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };
  const handleSave = async () => {
    if (!memberId) {
      alert("Please select a member.");
      return;
    }
  
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    console.log("Current User:", user);
console.log("User ID:", user?.id);
console.log("Selected Member:", memberId);
    // Check whether assessment already exists

const { data: existingAssessment } = await supabase
.from("body_assessments")
.select("id")
.eq("member_id", memberId)
.maybeSingle();

const assessmentData = {
owner_id: user.id,
member_id: memberId,

height: form.height || null,
weight: form.weight || null,
bmi: form.bmi || null,
body_fat: form.body_fat || null,

neck: form.neck || null,
shoulders: form.shoulders || null,

bust: form.bust || null,
under_bust: form.under_bust || null,

waist: form.waist || null,
upper_abdomen: form.upper_abdomen || null,
lower_abdomen: form.lower_abdomen || null,
hips: form.hips || null,

left_arm: form.left_arm || null,
right_arm: form.right_arm || null,

left_thigh: form.left_thigh || null,
right_thigh: form.right_thigh || null,

left_calf: form.left_calf || null,
right_calf: form.right_calf || null,

goal: form.goal,
coach_notes: form.coach_notes,

assessment_date: new Date().toISOString().split("T")[0],
};

let error;

if (existingAssessment) {
({ error } = await supabase
  .from("body_assessments")
  .update(assessmentData)
  .eq("id", existingAssessment.id));
} else {
({ error } = await supabase
  .from("body_assessments")
  .insert(assessmentData));
}

if (error) {
console.error(error);
alert(error.message);
} else {
alert("✅ Assessment Saved Successfully!");
}
  };

  return (
    <div className="page">

      <h1>Monthly Body Assessment</h1>

      <div className="form-card">

        <label>Select Member</label>

        <select
          className="form-select"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        >

          <option value="">Choose Member</option>

          {members.map((member) => (
            <option
              key={member.id}
              value={member.id}
            >
              {member.full_name}
            </option>
          ))}

        </select>

      </div><div className="assessment-card">

<h2 className="assessment-title">
  ❤️ Basic Health
</h2>

<div className="assessment-grid">

  <div className="metric-card">
    <label>Height (cm)</label>

    <input
      name="height"
      value={form.height}
      onChange={handleChange}
      placeholder="165"
    />
  </div>

  <div className="metric-card">
    <label>Weight (kg)</label>

    <input
      name="weight"
      value={form.weight}
      onChange={handleChange}
      placeholder="68"
    />
  </div>

  <div className="metric-card">

    <label>BMI</label>

    <input
      name="bmi"
      value={form.bmi}
      readOnly
    />

  </div>

  <div className="metric-card">

    <label>Body Fat %</label>

    <input
      name="body_fat"
      value={form.body_fat}
      onChange={handleChange}
      placeholder="25"
    />

  </div>

</div>

</div>

<div className="assessment-card">

<h2 className="assessment-title">
💪 Upper Body
</h2>

<div className="assessment-grid">

<div className="metric-card">
<label>Shoulders (cm)</label>
<input
name="shoulders"
value={form.shoulders}
onChange={handleChange}
/>
</div>

<div className="metric-card">
<label>Bust (cm)</label>
<input
name="bust"
value={form.bust}
onChange={handleChange}
/>
</div>

<div className="metric-card">
<label>Under Bust (cm)</label>
<input
name="under_bust"
value={form.under_bust}
onChange={handleChange}
/>
</div>

<div className="metric-card">
<label>Left Arm (cm)</label>
<input
name="left_arm"
value={form.left_arm}
onChange={handleChange}
/>
</div>

<div className="metric-card">
<label>Right Arm (cm)</label>
<input
name="right_arm"
value={form.right_arm}
onChange={handleChange}
/>
</div>

</div>

</div>

<div className="assessment-card">

<h2 className="assessment-title">
🔥 Core Measurements
</h2>

<div className="assessment-grid">

<div className="metric-card">
<label>Upper Abdomen</label>

<input
name="upper_abdomen"
value={form.upper_abdomen}
onChange={handleChange}
/>

</div>

<div className="metric-card">

<label>Waist</label>

<input
name="waist"
value={form.waist}
onChange={handleChange}
/>

</div>

<div className="metric-card">

<label>Lower Abdomen</label>

<input
name="lower_abdomen"
value={form.lower_abdomen}
onChange={handleChange}
/>

</div>

<div className="metric-card">

<label>Hips</label>

<input
name="hips"
value={form.hips}
onChange={handleChange}
/>

</div>

</div>

</div>

<div className="assessment-card">

<h2 className="assessment-title">
🦵 Lower Body
</h2>

<div className="assessment-grid">

<div className="metric-card">

<label>Left Thigh</label>

<input
name="left_thigh"
value={form.left_thigh}
onChange={handleChange}
/>

</div>

<div className="metric-card">

<label>Right Thigh</label>

<input
name="right_thigh"
value={form.right_thigh}
onChange={handleChange}
/>

</div>

</div>

</div>
<div className="assessment-card">

  <h2 className="assessment-title">
    🎯 Goal & Coach Notes
  </h2>

  <div className="assessment-grid">

    <div className="metric-card">
      <label>Goal</label>

      <select
        name="goal"
        value={form.goal}
        onChange={handleChange}
      >
        <option value="">Select Goal</option>
        <option>Weight Loss</option>
        <option>Fat Loss</option>
        <option>Muscle Gain</option>
        <option>Body Recomposition</option>
        <option>Competition Prep</option>
        <option>Maintenance</option>
      </select>

    </div>

  </div>

  <div style={{marginTop:"25px"}}>

    <label>Coach Notes</label>

    <textarea
      name="coach_notes"
      value={form.coach_notes}
      onChange={handleChange}
      rows="5"
      placeholder="Write monthly assessment notes..."
    />

  </div>

</div>

<div style={{ 
    marginTop: "35px" ,
    display: "flex" ,
    judtifyContent: "flex-end" ,
    }}>
<button className="save-btn" onClick={handleSave}>
  Save Assessment
</button>
</div>
    </div>
    

  );
}


