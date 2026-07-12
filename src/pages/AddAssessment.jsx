import Header from "../components/Header";
import { useOutletContext, useParams } from "react-router-dom";
import { useState } from "react";

export default function AddAssessment() {
  const { openSidebar } = useOutletContext();
  const { id } = useParams();

  const [form, setForm] = useState({
    assessment_date: new Date().toISOString().split("T")[0],

    weight: "",
    body_fat: "",

    chest: "",
    waist: "",
    hips: "",

    left_arm: "",
    right_arm: "",

    left_forearm: "",
    right_forearm: "",

    left_thigh: "",
    right_thigh: "",

    left_calf: "",
    right_calf: "",

    neck: "",

    member_notes: "",
  });

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="page">

      <Header
        title="Monthly Assessment"
        subtitle="Track client progress"
        onMenuClick={openSidebar}
      />

      <div className="assessment-card">

        <h2>📅 Monthly Assessment</h2>

        <p>Member ID</p>

        <strong>{id}</strong>

        <br /><br />

        <div className="form-group">
          <label>Date</label>

          <input
            type="date"
            name="assessment_date"
            value={form.assessment_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Weight (kg)</label>

          <input
            type="number"
            name="weight"
            value={form.weight}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Body Fat %</label>

          <input
            type="number"
            name="body_fat"
            value={form.body_fat}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Chest</label>

          <input
            type="number"
            name="chest"
            value={form.chest}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Waist</label>

          <input
            type="number"
            name="waist"
            value={form.waist}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Hips</label>

          <input
            type="number"
            name="hips"
            value={form.hips}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Left Arm</label>

          <input
            type="number"
            name="left_arm"
            value={form.left_arm}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Right Arm</label>

          <input
            type="number"
            name="right_arm"
            value={form.right_arm}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Left Forearm</label>

          <input
            type="number"
            name="left_forearm"
            value={form.left_forearm}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Right Forearm</label>

          <input
            type="number"
            name="right_forearm"
            value={form.right_forearm}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Left Thigh</label>

          <input
            type="number"
            name="left_thigh"
            value={form.left_thigh}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Right Thigh</label>

          <input
            type="number"
            name="right_thigh"
            value={form.right_thigh}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Left Calf</label>

          <input
            type="number"
            name="left_calf"
            value={form.left_calf}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Right Calf</label>

          <input
            type="number"
            name="right_calf"
            value={form.right_calf}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Neck</label>

          <input
            type="number"
            name="neck"
            value={form.neck}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Member Notes</label>

          <textarea
            rows="4"
            name="member_notes"
            value={form.member_notes}
            onChange={handleChange}
          />
        </div>

        <button className="btn btn-primary">
          Save Assessment
        </button>

      </div>

    </div>
  );
}