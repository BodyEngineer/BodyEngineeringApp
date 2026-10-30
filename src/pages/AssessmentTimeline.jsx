import Header from "../components/Header";
import { useOutletContext, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  getAssessments,
  updateAssessment,
} from "../services/assessmentService";

export default function AssessmentTimeline() {
  const { openSidebar } = useOutletContext();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);

  // Coach review states
  const [coachNotes, setCoachNotes] = useState({});
  const [savingReview, setSavingReview] = useState(null);
  const [savedReview, setSavedReview] = useState(null);

  useEffect(() => {
    loadAssessments();
  }, [id]);

  async function loadAssessments() {
    try {
      setLoading(true);

      const data = await getAssessments(id);

      setAssessments(data || []);
    } catch (err) {
      console.error("Assessment timeline error:", err);
    } finally {
      setLoading(false);
    }
  }

  /*
  ========================================
  SAVE COACH REVIEW
  ========================================
  */

  async function saveCoachReview(assessmentId) {
    try {
      setSavingReview(assessmentId);
      setSavedReview(null);

      const notes = coachNotes[assessmentId] ?? "";

      await updateAssessment(assessmentId, {
        coach_notes: notes.trim() || null,
      });

      // Update timeline immediately
      setAssessments((prev) =>
        prev.map((item) =>
          item.id === assessmentId
            ? {
                ...item,
                coach_notes: notes.trim() || null,
              }
            : item
        )
      );

      // Show saved state
      setSavedReview(assessmentId);

      // Return button to normal after 2.5 seconds
      setTimeout(() => {
        setSavedReview((current) =>
          current === assessmentId ? null : current
        );
      }, 2500);
    } catch (error) {
      console.error("Coach review save error:", error);

      alert(
        error.message ||
          "Unable to save coach review. Please try again."
      );
    } finally {
      setSavingReview(null);
    }
  }

  /*
  ========================================
  FORMAT DATE
  ========================================
  */

  function formatDate(date) {
    if (!date) return "Not specified";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  /*
  ========================================
  RENDER VALUE
  ========================================
  */

  function renderValue(value, suffix = "") {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    return `${value}${suffix}`;
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
  PAGE
  ========================================
  */

  return (
    <div className="page">

      <Header
        title="Transformation Timeline"
        subtitle="Review monthly client progress"
        onMenuClick={openSidebar}
      />

      {assessments.length === 0 ? (
        <div className="assessment-card">

          <h3>
            📋 No Assessments Yet
          </h3>

          <p>
            This online client has not submitted any
            assessments yet.
          </p>

        </div>
      ) : (
        assessments.map((item) => (
          <div
            key={item.id}
            className="assessment-card"
            style={{
              marginBottom: "24px",
            }}
          >

            {/* ==================================
                HEADER
            ================================== */}

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
                    fontSize: "13px",
                    opacity: 0.7,
                  }}
                >
                  MONTHLY ASSESSMENT
                </p>

                <h2
                  style={{
                    marginTop: "6px",
                  }}
                >
                  📅 {formatDate(item.assessment_date)}
                </h2>

              </div>

              <span className="coaching-badge">
                SUBMITTED
              </span>

            </div>

            {/* ==================================
                BASIC STATS
            ================================== */}

            <div
              className="quick-grid"
              style={{
                marginTop: "20px",
              }}
            >

              <div className="quick-card">

                <h3>
                  Weight
                </h3>

                <p>
                  ⚖️ {renderValue(item.weight, " kg")}
                </p>

              </div>

              <div className="quick-card">

                <h3>
                  Body Fat
                </h3>

                <p>
                  🔥 {renderValue(item.body_fat, "%")}
                </p>

              </div>

            </div>

            {/* ==================================
                BODY MEASUREMENTS
            ================================== */}

            <div
              style={{
                marginTop: "25px",
              }}
            >

              <h3 className="step-title">
                📏 Body Measurements
              </h3>

              <div className="measurement-grid">

                <div className="metric-card">
                  <label>Chest</label>
                  <strong>
                    {renderValue(item.chest)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Waist</label>
                  <strong>
                    {renderValue(item.waist)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Hips</label>
                  <strong>
                    {renderValue(item.hips)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Neck</label>
                  <strong>
                    {renderValue(item.neck)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Left Arm</label>
                  <strong>
                    {renderValue(item.left_arm)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Right Arm</label>
                  <strong>
                    {renderValue(item.right_arm)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Left Forearm</label>
                  <strong>
                    {renderValue(item.left_forearm)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Right Forearm</label>
                  <strong>
                    {renderValue(item.right_forearm)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Left Thigh</label>
                  <strong>
                    {renderValue(item.left_thigh)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Right Thigh</label>
                  <strong>
                    {renderValue(item.right_thigh)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Left Calf</label>
                  <strong>
                    {renderValue(item.left_calf)}
                  </strong>
                </div>

                <div className="metric-card">
                  <label>Right Calf</label>
                  <strong>
                    {renderValue(item.right_calf)}
                  </strong>
                </div>

              </div>

            </div>

            {/* ==================================
                PROGRESS PHOTOS
            ================================== */}

            <div
              style={{
                marginTop: "30px",
              }}
            >

              <h3 className="step-title">
                📸 Progress Photos
              </h3>

              <div className="photo-grid">

                {item.front_photo && (
                  <div className="photo-card">

                    <h4>
                      Front
                    </h4>

                    <img
                      src={item.front_photo}
                      alt="Front progress"
                      className="photo-preview"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                      }}
                    />

                  </div>
                )}

                {item.side_photo && (
                  <div className="photo-card">

                    <h4>
                      Side
                    </h4>

                    <img
                      src={item.side_photo}
                      alt="Side progress"
                      className="photo-preview"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                      }}
                    />

                  </div>
                )}

                {item.back_photo && (
                  <div className="photo-card">

                    <h4>
                      Back
                    </h4>

                    <img
                      src={item.back_photo}
                      alt="Back progress"
                      className="photo-preview"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                      }}
                    />

                  </div>
                )}

              </div>

            </div>

            {/* ==================================
                CLIENT NOTES
            ================================== */}

            {item.member_notes && (
              <div
                style={{
                  marginTop: "30px",
                  padding: "18px",
                  borderRadius: "12px",
                  background:
                    "rgba(255,255,255,0.04)",
                }}
              >

                <h3>
                  📝 Client Notes
                </h3>

                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                  }}
                >
                  {item.member_notes}
                </p>

              </div>
            )}

            {/* ==================================
                COACH REVIEW
            ================================== */}

            <div
              style={{
                marginTop: "30px",
                padding: "20px",
                borderRadius: "14px",
                background:
                  "rgba(255,255,255,0.04)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >

              <h3>
                👨‍🏫 Coach Review
              </h3>

              <p
                style={{
                  opacity: 0.7,
                  marginBottom: "15px",
                }}
              >
                Add your feedback, observations and
                recommendations for this month's
                assessment.
              </p>

              <textarea
                rows={6}
                value={
                  coachNotes[item.id] !== undefined
                    ? coachNotes[item.id]
                    : item.coach_notes || ""
                }
                onChange={(e) =>
                  setCoachNotes((prev) => ({
                    ...prev,
                    [item.id]: e.target.value,
                  }))
                }
                placeholder="Write your review for the client..."
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "10px",
                  border:
                    "1px solid rgba(255,255,255,0.12)",
                  background:
                    "rgba(0,0,0,0.2)",
                  color: "inherit",
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "15px",
                }}
              >

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    saveCoachReview(item.id)
                  }
                  disabled={
                    savingReview === item.id ||
                    savedReview === item.id
                  }
                >
                  {savingReview === item.id
                    ? "⏳ Saving..."
                    : savedReview === item.id
                    ? "✓ Review Saved"
                    : "💾 Save Coach Review"}
                </button>

              </div>

            </div>

          </div>
        ))
      )}

    </div>
  );
}