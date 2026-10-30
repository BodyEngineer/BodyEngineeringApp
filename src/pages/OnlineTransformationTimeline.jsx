import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getAssessments } from "../services/assessmentService";

export default function OnlineTransformationTimeline() {
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ========================================
  LOAD ONLINE CLIENT
  ========================================
  */

  useEffect(() => {
    loadTransformation();
  }, []);

  async function loadTransformation() {
    try {
      setLoading(true);
      setError("");

      /*
      GET LOGGED-IN USER
      */

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

      /*
      GET ONLINE CLIENT
      */

      const { data, error: clientError } =
        await supabase
          .from("online_clients")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

      if (clientError) {
        throw clientError;
      }

      setClient(data);

      /*
      GET ASSESSMENTS
      */

      const assessmentData = await getAssessments(
        data.id
      );

      setAssessments(assessmentData || []);

    } catch (err) {
      console.error(
        "Online transformation loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your transformation timeline."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
  ========================================
  FORMAT DATE
  ========================================
  */

  function formatDate(date) {
    if (!date) {
      return "Not specified";
    }

    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  /*
  ========================================
  FORMAT VALUE
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
  ERROR
  ========================================
  */

  if (error) {
    return (
      <div className="page">

        <div className="alert alert-error">
          {error}
        </div>

        <button
          className="view-btn"
          onClick={() =>
            navigate("/online-dashboard")
          }
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

      {/* ==================================
          HEADER
      ================================== */}

      <div className="premium-hero">

        <div>

          <p className="hero-brand">
            BODY ENGINEERING
          </p>

          <h1>
            📈 Transformation Timeline
          </h1>

          <p>
            Track your monthly progress,
            measurements, photos and coach feedback.
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

      {/* ==================================
          CLIENT INFO
      ================================== */}

      {client && (
        <section className="assessment-card">

          <h2>
            👋 {client.full_name}
          </h2>

          <p
            style={{
              opacity: 0.7,
              marginBottom: 0,
            }}
          >
            Your transformation journey with
            Body Engineering.
          </p>

        </section>
      )}

      {/* ==================================
          NO ASSESSMENTS
      ================================== */}

      {assessments.length === 0 ? (

        <div className="assessment-card">

          <h3>
            📋 No Assessments Yet
          </h3>

          <p>
            Your monthly assessment history will
            appear here after you submit your
            first assessment.
          </p>

          <button
            className="btn btn-primary"
            onClick={() =>
              navigate(
                "/online-dashboard/assessment"
              )
            }
          >
            📋 Complete Assessment
          </button>

        </div>

      ) : (

        <>

          {/* ==================================
              LATEST PROGRESS
          ================================== */}

          <div
            className="assessment-card"
            style={{
              marginTop: "24px",
            }}
          >

            <p
              style={{
                margin: 0,
                fontSize: "13px",
                opacity: 0.7,
              }}
            >
              LATEST ASSESSMENT
            </p>

            <h2
              style={{
                marginTop: "6px",
              }}
            >
              📅{" "}
              {formatDate(
                assessments[0].assessment_date
              )}
            </h2>

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
                  ⚖️{" "}
                  {renderValue(
                    assessments[0].weight,
                    " kg"
                  )}
                </p>

              </div>

              <div className="quick-card">

                <h3>
                  Body Fat
                </h3>

                <p>
                  🔥{" "}
                  {renderValue(
                    assessments[0].body_fat,
                    "%"
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* ==================================
              TIMELINE TITLE
          ================================== */}

          <div
            style={{
              marginTop: "35px",
              marginBottom: "10px",
            }}
          >

            <h2>
              📅 Monthly Progress
            </h2>

            <p
              style={{
                opacity: 0.7,
              }}
            >
              Your complete assessment history.
            </p>

          </div>

          {/* ==================================
              ASSESSMENT TIMELINE
          ================================== */}

          {assessments.map((item) => (

            <div
              key={item.id}
              className="assessment-card"
              style={{
                marginBottom: "24px",
              }}
            >

              {/* HEADER */}

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
                    📅{" "}
                    {formatDate(
                      item.assessment_date
                    )}
                  </h2>

                </div>

                <span className="coaching-badge">
                  SUBMITTED
                </span>

              </div>

              {/* ==================================
                  BASIC STATISTICS
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
                    ⚖️{" "}
                    {renderValue(
                      item.weight,
                      " kg"
                    )}
                  </p>

                </div>

                <div className="quick-card">

                  <h3>
                    Body Fat
                  </h3>

                  <p>
                    🔥{" "}
                    {renderValue(
                      item.body_fat,
                      "%"
                    )}
                  </p>

                </div>

              </div>

              {/* ==================================
                  BODY MEASUREMENTS
              ================================== */}

              <div
                style={{
                  marginTop: "30px",
                }}
              >

                <h3 className="step-title">
                  📏 Body Measurements
                </h3>

                <div className="measurement-grid">

                  {[
                    ["chest", "Chest"],
                    ["waist", "Waist"],
                    ["hips", "Hips"],
                    ["neck", "Neck"],
                    ["left_arm", "Left Arm"],
                    ["right_arm", "Right Arm"],
                    [
                      "left_forearm",
                      "Left Forearm",
                    ],
                    [
                      "right_forearm",
                      "Right Forearm",
                    ],
                    [
                      "left_thigh",
                      "Left Thigh",
                    ],
                    [
                      "right_thigh",
                      "Right Thigh",
                    ],
                    [
                      "left_calf",
                      "Left Calf",
                    ],
                    [
                      "right_calf",
                      "Right Calf",
                    ],
                  ].map(
                    ([field, label]) => (

                      <div
                        className="metric-card"
                        key={field}
                      >

                        <label>
                          {label}
                        </label>

                        <strong>
                          {renderValue(
                            item[field]
                          )}
                        </strong>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* ==================================
                  PROGRESS PHOTOS
              ================================== */}

              {(item.front_photo ||
                item.side_photo ||
                item.back_photo) && (

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
                            borderRadius:
                              "12px",
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
                            borderRadius:
                              "12px",
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
                            borderRadius:
                              "12px",
                          }}
                        />

                      </div>

                    )}

                  </div>

                </div>

              )}

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
                    📝 My Check-in Notes
                  </h3>

                  <p
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      lineHeight: 1.7,
                      marginBottom: 0,
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
                    item.coach_notes
                      ? "rgba(255,68,56,0.08)"
                      : "rgba(255,255,255,0.04)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",
                }}
              >

                <h3>
                  👨‍🏫 Coach Review
                </h3>

                {item.coach_notes ? (

                  <p
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      lineHeight: 1.8,
                      marginBottom: 0,
                    }}
                  >
                    {item.coach_notes}
                  </p>

                ) : (

                  <p
                    style={{
                      opacity: 0.65,
                      marginBottom: 0,
                    }}
                  >
                    Your coach has not added
                    feedback for this assessment yet.
                  </p>

                )}

              </div>

            </div>

          ))}

        </>

      )}

    </div>
  );
}