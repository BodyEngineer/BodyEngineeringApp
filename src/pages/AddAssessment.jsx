import Header from "../components/Header";
import { useOutletContext, useParams } from "react-router-dom";
import { useState } from "react";
import { uploadAssessmentPhoto } from "../services/storageService";
import { addAssessment } from "../services/assessmentService";

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

  const [step, setStep] = useState(1);
  

  const [frontPreview, setFrontPreview] = useState(null);
const [sidePreview, setSidePreview] = useState(null);
const [backPreview, setBackPreview] = useState(null);

const [frontPhoto, setFrontPhoto] = useState(null);
const [sidePhoto, setSidePhoto] = useState(null);
const [backPhoto, setBackPhoto] = useState(null);

const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function handlePhoto(e, type) {

    const file = e.target.files[0];

    if (!file) return;

    if (type === "front") {
        setFrontPhoto(file);
        setFrontPreview(URL.createObjectURL(file));
    }

    if (type === "side") {
        setSidePhoto(file);
        setSidePreview(URL.createObjectURL(file));
    }

    if (type === "back") {
        setBackPhoto(file);
        setBackPreview(URL.createObjectURL(file));
    }
}
  function nextStep() {
    setStep((prev) => prev + 1);
  }
  

  function prevStep() {
    setStep((prev) => prev - 1);
  }
  
  async function saveAssessment() {

    if (saving) return;
  
    setSaving(true);
  
    try {
  
      let frontUrl = "";
      let sideUrl = "";
      let backUrl = "";
  
      if (frontPhoto) {
        frontUrl = await uploadAssessmentPhoto(id, frontPhoto, "front");
      }
  
      if (sidePhoto) {
        sideUrl = await uploadAssessmentPhoto(id, sidePhoto, "side");
      }
  
      if (backPhoto) {
        backUrl = await uploadAssessmentPhoto(id, backPhoto, "back");
      }
  
      await addAssessment({
        online_member_id: id,
  
        assessment_date: form.assessment_date,
  
        weight: form.weight,
        body_fat: form.body_fat,
  
        chest: form.chest,
        waist: form.waist,
        hips: form.hips,
  
        left_arm: form.left_arm,
        right_arm: form.right_arm,
  
        left_forearm: form.left_forearm,
        right_forearm: form.right_forearm,
  
        left_thigh: form.left_thigh,
        right_thigh: form.right_thigh,
  
        left_calf: form.left_calf,
        right_calf: form.right_calf,
  
        neck: form.neck,
  
        member_notes: form.member_notes,
  
        front_photo: frontUrl,
        side_photo: sideUrl,
        back_photo: backUrl,
      });
  
      alert("🎉 Assessment Saved Successfully!");
  
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
    finally {
        setSaving(false);
    }
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

        <div className="wizard-progress">

    <div className={step >= 1 ? "wizard-step active" : "wizard-step"}>
        1
    </div>

    <div className={step >= 2 ? "wizard-step active" : "wizard-step"}>
        2
    </div>

    <div className={step >= 3 ? "wizard-step active" : "wizard-step"}>
        3
    </div>

    <div className={step >= 4 ? "wizard-step active" : "wizard-step"}>
        4
    </div>

</div>

{step === 1 && (
  <>
    <div className="form-group">
      <label>📅 Assessment Date</label>
      <input
        type="date"
        name="assessment_date"
        value={form.assessment_date}
        onChange={handleChange}
      />
    </div>

    <div className="form-group">
      <label>⚖️ Weight (kg)</label>
      <input
        type="number"
        name="weight"
        value={form.weight}
        onChange={handleChange}
      />
    </div>

    <div className="form-group">
      <label>🔥 Body Fat %</label>
      <input
        type="number"
        name="body_fat"
        value={form.body_fat}
        onChange={handleChange}
      />
    </div>
  </>
)}
<div className="wizard-buttons">

{step > 1 && (
  <button
    type="button"
    className="btn"
    onClick={prevStep}
  >
    ← Back
  </button>
)}

<button
  type="button"
  className="btn btn-primary"
  onClick={nextStep}
>
  Next →
</button>

</div>

{step === 2 && (
  <>
    <h3 className="step-title">📏 Body Measurements</h3>

    <div className="measurement-grid">

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
        <label>Neck</label>
        <input
          type="number"
          name="neck"
          value={form.neck}
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

    </div>

    <div className="wizard-buttons">
      <button
        className="btn btn-secondary"
        onClick={prevStep}
      >
        ← Back
      </button>

      <button
        className="btn btn-primary"
        onClick={nextStep}
      >
        Next →
      </button>
    </div>
  </>
)}

{step === 3 && (
<>
<h3 className="step-title">📸 Progress Photos</h3>

<div className="photo-grid">

    {/* Front */}

    <label className="photo-card">

        {
            frontPreview
            ?

            <img src={frontPreview} alt="" />

            :

            <div className="photo-upload">

    <label htmlFor="frontPhoto">

        {frontPhoto ? (
            <img
                src={URL.createObjectURL(frontPhoto)}
                alt="Front"
                className="photo-preview"
            />
        ) : (
            <>
                📷
                <br />
                Front Photo
            </>
        )}

    </label>

    <input
        id="frontPhoto"
        type="file"
        accept="image/*"
        hidden
        onChange={(e)=>setFrontPhoto(e.target.files[0])}
    />

</div>
        }

        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e)=>handlePhoto(e,"front")}
        />

    </label>

    {/* Side */}

    <label className="photo-card">

        {
            sidePreview
            ?

            <img src={sidePreview} alt="" />

            :

            <div className="photo-upload">

            <label htmlFor="sidePhoto">
        
                {sidePhoto ? (
                    <img
                        src={URL.createObjectURL(sidePhoto)}
                        alt="Side"
                        className="photo-preview"
                    />
                ) : (
                    <>
                        📷
                        <br />
                        Side Photo
                    </>
                )}
        
            </label>
        
            <input
                id="sidePhoto"
                type="file"
                accept="image/*"
                hidden
                onChange={(e)=>setSidePhoto(e.target.files[0])}
            />
        
        </div>
        }

        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e)=>handlePhoto(e,"side")}
        />

    </label>

    {/* Back */}

    <label className="photo-card">

        {
            backPreview
            ?

            <img src={backPreview} alt="" />

            :

            <div className="photo-upload">

            <label htmlFor="backPhoto">
        
                {backPhoto ? (
                    <img
                        src={URL.createObjectURL(backPhoto)}
                        alt="Back"
                        className="photo-preview"
                    />
                ) : (
                    <>
                        📷
                        <br />
                        Back Photo
                    </>
                )}
        
            </label>
        
            <input
                id="backPhoto"
                type="file"
                accept="image/*"
                hidden
                onChange={(e)=>setBackPhoto(e.target.files[0])}
            />
        
        </div>
        }

        <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e)=>handlePhoto(e,"back")}
        />

    </label>

</div>

<div className="wizard-buttons">

<button
className="btn btn-secondary"
onClick={prevStep}
>
← Back
</button>

<button
className="btn btn-primary"
onClick={nextStep}
>
Next →
</button>

</div>

</>
)}

{step === 4 && (



<div className="assessment-card">

    <h2>🏁 Final Review</h2>

    <p className="review-text">
        You're one step away from completing this month's assessment.
    </p>

    <div className="review-card">

        <h3>📊 Summary</h3>

        <p><strong>Date:</strong> {form.assessment_date}</p>

        <p><strong>Weight:</strong> {form.weight} kg</p>

        <p><strong>Body Fat:</strong> {form.body_fat}%</p>

        <p><strong>Measurements:</strong> Completed ✅</p>

        <p><strong>Photos:</strong> Uploaded ✅</p>

    </div>

    <div className="form-group">

        <label>📝 Member Notes</label>

        <textarea
            rows={5}
            name="member_notes"
            value={form.member_notes}
            onChange={handleChange}
            placeholder="How was your month? Any injuries? Energy level? Sleep? Water intake?"
        />

    </div>

    <div className="form-group">

        <label>👨‍🏫 Coach Notes</label>

        <textarea
            rows={5}
            disabled
            placeholder="Coach will review your assessment and add personalized feedback."
        />

    </div>

    <div className="wizard-buttons">

        <button
            className="btn btn-secondary"
            onClick={prevStep}
        >
            ← Back
        </button>

        <button
    className="btn btn-primary"
    onClick={saveAssessment}
    disabled={saving}
>
    {saving ? "⏳ Uploading..." : "🚀 Submit Assessment"}
</button>

    </div>

</div>

)}

      </div>

    </div>
  );
}