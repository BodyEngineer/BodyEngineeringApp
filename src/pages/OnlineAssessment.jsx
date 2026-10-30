import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { uploadAssessmentPhoto } from "../services/storageService";
import {
    addAssessment,
    updateAssessment,
  } from "../services/assessmentService";

export default function OnlineAssessment() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);

  const [frontPreview, setFrontPreview] = useState(null);
  const [sidePreview, setSidePreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  /*
  ========================================
  LOAD LOGGED-IN ONLINE CLIENT
  ========================================
  */

  useEffect(() => {
    loadClient();
  }, []);

  async function loadClient() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/member-login");
        return;
      }

      const { data, error } = await supabase
        .from("online_clients")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (error) throw error;

      setClient(data);
    } catch (error) {
      console.error("Online assessment client loading error:", error);
      setMessage(
        error.message || "Unable to load your client profile."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  ========================================
  FORM CHANGE
  ========================================
  */

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  /*
  ========================================
  PHOTO HANDLING
  ========================================
  */

  function handlePhoto(e, type) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    if (type === "front") {
      setFrontPhoto(file);
      setFrontPreview(previewUrl);
    }

    if (type === "side") {
      setSidePhoto(file);
      setSidePreview(previewUrl);
    }

    if (type === "back") {
      setBackPhoto(file);
      setBackPreview(previewUrl);
    }
  }

  /*
  ========================================
  STEP NAVIGATION
  ========================================
  */

  function nextStep() {
    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function prevStep() {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
  ========================================
  SAVE ASSESSMENT
  ========================================
  */

  async function saveAssessment() {
    if (saving) return;

    if (!client?.id) {
      alert("Client information is unavailable.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      /*
      ========================================
      STEP 1
      CREATE ASSESSMENT FIRST
      ========================================
      */

      const assessment = await addAssessment({
        online_member_id: client.id,

        assessment_date: form.assessment_date,

        weight: form.weight || null,
        body_fat: form.body_fat || null,

        chest: form.chest || null,
        waist: form.waist || null,
        hips: form.hips || null,

        left_arm: form.left_arm || null,
        right_arm: form.right_arm || null,

        left_forearm: form.left_forearm || null,
        right_forearm: form.right_forearm || null,

        left_thigh: form.left_thigh || null,
        right_thigh: form.right_thigh || null,

        left_calf: form.left_calf || null,
        right_calf: form.right_calf || null,

        neck: form.neck || null,

        member_notes: form.member_notes || null,

        /*
        Photos will be added AFTER
        we receive the assessment ID.
        */
        front_photo: null,
        side_photo: null,
        back_photo: null,
      });

      /*
      ========================================
      STEP 2
      GET NEW ASSESSMENT ID
      ========================================
      */

      const assessmentId = assessment.id;

      if (!assessmentId) {
        throw new Error(
          "Assessment was created but its ID could not be found."
        );
      }

      /*
      ========================================
      STEP 3
      UPLOAD PHOTOS USING ASSESSMENT ID
      ========================================
      */

      let frontUrl = null;
      let sideUrl = null;
      let backUrl = null;

      if (frontPhoto) {
        frontUrl = await uploadAssessmentPhoto(
          client.id,
          assessmentId,
          frontPhoto,
          "front"
        );
      }

      if (sidePhoto) {
        sideUrl = await uploadAssessmentPhoto(
          client.id,
          assessmentId,
          sidePhoto,
          "side"
        );
      }

      if (backPhoto) {
        backUrl = await uploadAssessmentPhoto(
          client.id,
          assessmentId,
          backPhoto,
          "back"
        );
      }

      /*
      ========================================
      STEP 4
      SAVE PHOTO URLS TO THAT SAME ASSESSMENT
      ========================================
      */

      if (frontUrl || sideUrl || backUrl) {
        await updateAssessment(assessmentId, {
          front_photo: frontUrl,
          side_photo: sideUrl,
          back_photo: backUrl,
        });
      }

      /*
      ========================================
      SUCCESS
      ========================================
      */

      alert(
        "🎉 Assessment submitted successfully!\n\nYour coach can now review your progress."
      );

      navigate("/online-dashboard");

    } catch (error) {

      console.error(
        "Online assessment save error:",
        error
      );

      alert(
        error.message ||
          "Unable to submit assessment. Please try again."
      );

    } finally {

      setSaving(false);

    }
  }
  /*
  ========================================
  LOADING
  ========================================
  */

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  /*
  ========================================
  ERROR
  ========================================
  */

  if (!client) {
    return (
      <div className="page">
        <div className="alert alert-error">
          {message || "Unable to load your profile."}
        </div>

        <button
          className="view-btn"
          onClick={() => navigate("/online-dashboard")}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  /*
  ========================================
  PAGE
  ========================================
  */

  return (
    <div className="page">

      {/* HEADER */}

      <div className="premium-hero">
        <div>
          <p className="hero-brand">
            BODY ENGINEERING
          </p>

          <h1>
            📋 Monthly Assessment
          </h1>

          <p>
            Complete your monthly check-in for your coach.
          </p>
        </div>

        <div className="hero-right">
          <button
            className="logout-btn"
            onClick={() =>
              navigate("/online-dashboard")
            }
          >
            ← Dashboard
          </button>
        </div>
      </div>

      {/* CLIENT INFO */}

      <section className="assessment-card">

        <h2>
          👋 Hello, {client.full_name}
        </h2>

        <p>
          Please enter your current measurements and
          upload your latest progress photos.
        </p>

        {/* PROGRESS */}

        <div className="wizard-progress">

          <div
            className={
              step >= 1
                ? "wizard-step active"
                : "wizard-step"
            }
          >
            1
          </div>

          <div
            className={
              step >= 2
                ? "wizard-step active"
                : "wizard-step"
            }
          >
            2
          </div>

          <div
            className={
              step >= 3
                ? "wizard-step active"
                : "wizard-step"
            }
          >
            3
          </div>

          <div
            className={
              step >= 4
                ? "wizard-step active"
                : "wizard-step"
            }
          >
            4
          </div>

        </div>

        {/* ==================================
            STEP 1
        ================================== */}

        {step === 1 && (
          <>
            <h3 className="step-title">
              📊 Basic Statistics
            </h3>

            <div className="form-group">

              <label>
                📅 Assessment Date
              </label>

              <input
                type="date"
                name="assessment_date"
                value={form.assessment_date}
                onChange={handleChange}
              />

            </div>

            <div className="form-group">

              <label>
                ⚖️ Weight (kg)
              </label>

              <input
                type="number"
                step="0.1"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="Enter your current weight"
              />

            </div>

            <div className="form-group">

              <label>
                🔥 Body Fat %
              </label>

              <input
                type="number"
                step="0.1"
                name="body_fat"
                value={form.body_fat}
                onChange={handleChange}
                placeholder="Enter body fat percentage"
              />

            </div>

            <div className="wizard-buttons">

              <button
                type="button"
                className="btn btn-primary"
                onClick={nextStep}
              >
                Next →
              </button>

            </div>
          </>
        )}

        {/* ==================================
            STEP 2
        ================================== */}

        {step === 2 && (
          <>
            <h3 className="step-title">
              📏 Body Measurements
            </h3>

            <p style={{ opacity: 0.7 }}>
              Enter your latest measurements in cm.
            </p>

            <div className="measurement-grid">

              {[
                ["chest", "Chest"],
                ["waist", "Waist"],
                ["hips", "Hips"],
                ["neck", "Neck"],
                ["left_arm", "Left Arm"],
                ["right_arm", "Right Arm"],
                ["left_forearm", "Left Forearm"],
                ["right_forearm", "Right Forearm"],
                ["left_thigh", "Left Thigh"],
                ["right_thigh", "Right Thigh"],
                ["left_calf", "Left Calf"],
                ["right_calf", "Right Calf"],
              ].map(([name, label]) => (

                <div
                  className="form-group"
                  key={name}
                >

                  <label>
                    {label}
                  </label>

                  <input
                    type="number"
                    step="0.1"
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    placeholder="cm"
                  />

                </div>

              ))}

            </div>

            <div className="wizard-buttons">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={prevStep}
              >
                ← Back
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={nextStep}
              >
                Next →
              </button>

            </div>
          </>
        )}

        {/* ==================================
            STEP 3
        ================================== */}

        {step === 3 && (
          <>
            <h3 className="step-title">
              📸 Progress Photos
            </h3>

            <p style={{ opacity: 0.7 }}>
              Upload your latest front, side and back
              progress photos.
            </p>

            <div className="photo-grid">

              {/* FRONT */}

              <div className="photo-card">

                <label
                  htmlFor="online-front-photo"
                  className="photo-upload"
                >

                  {frontPreview ? (
                    <img
                      src={frontPreview}
                      alt="Front progress"
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
                  id="online-front-photo"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handlePhoto(e, "front")
                  }
                />

              </div>

              {/* SIDE */}

              <div className="photo-card">

                <label
                  htmlFor="online-side-photo"
                  className="photo-upload"
                >

                  {sidePreview ? (
                    <img
                      src={sidePreview}
                      alt="Side progress"
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
                  id="online-side-photo"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handlePhoto(e, "side")
                  }
                />

              </div>

              {/* BACK */}

              <div className="photo-card">

                <label
                  htmlFor="online-back-photo"
                  className="photo-upload"
                >

                  {backPreview ? (
                    <img
                      src={backPreview}
                      alt="Back progress"
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
                  id="online-back-photo"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    handlePhoto(e, "back")
                  }
                />

              </div>

            </div>

            <div className="wizard-buttons">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={prevStep}
              >
                ← Back
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={nextStep}
              >
                Next →
              </button>

            </div>
          </>
        )}

        {/* ==================================
            STEP 4
        ================================== */}

        {step === 4 && (
          <>
            <h2>
              🏁 Final Review
            </h2>

            <p className="review-text">
              Review your information before
              submitting this month's assessment.
            </p>

            <div className="review-card">

              <h3>
                📊 Assessment Summary
              </h3>

              <p>
                <strong>Date:</strong>{" "}
                {form.assessment_date}
              </p>

              <p>
                <strong>Weight:</strong>{" "}
                {form.weight
                  ? `${form.weight} kg`
                  : "Not provided"}
              </p>

              <p>
                <strong>Body Fat:</strong>{" "}
                {form.body_fat
                  ? `${form.body_fat}%`
                  : "Not provided"}
              </p>

              <p>
                <strong>
                  Measurements:
                </strong>{" "}
                Completed ✅
              </p>

              <p>
                <strong>
                  Progress Photos:
                </strong>{" "}
                {frontPhoto ||
                sidePhoto ||
                backPhoto
                  ? "Uploaded ✅"
                  : "Not uploaded"}
              </p>

            </div>

            {/* MEMBER NOTES */}

            <div className="form-group">

              <label>
                📝 Check-in Notes
              </label>

              <textarea
                rows={6}
                name="member_notes"
                value={form.member_notes}
                onChange={handleChange}
                placeholder="Tell your coach about your month — energy, sleep, recovery, injuries, challenges, diet consistency, training, etc."
              />

            </div>

            <div
              className="review-card"
              style={{
                marginTop: 20,
              }}
            >

              <h3>
                👨‍🏫 Coach Review
              </h3>

              <p
                style={{
                  opacity: 0.7,
                  marginBottom: 0,
                }}
              >
                Your coach will review this assessment
                and provide feedback from the coach portal.
              </p>

            </div>

            <div className="wizard-buttons">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={prevStep}
                disabled={saving}
              >
                ← Back
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={saveAssessment}
                disabled={saving}
              >
                {saving
                  ? "⏳ Submitting..."
                  : "🚀 Submit Assessment"}
              </button>

            </div>
          </>
        )}

      </section>

    </div>
  );
}