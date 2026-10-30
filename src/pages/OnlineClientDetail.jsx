import Header from "../components/Header";
import {
  useOutletContext,
  useParams,
  useNavigate,
} from "react-router-dom";
import { useAssessments } from "../hooks/useAssessments";

export default function OnlineClientDetail() {
  const { openSidebar } = useOutletContext();
  const { id } = useParams();
  const navigate = useNavigate();

  const { assessments, loading } = useAssessments(id);

  return (
    <div className="page">

      <Header
        title="Online Member"
        subtitle="Transformation Timeline"
        onMenuClick={openSidebar}
      />

      {/* TOP ACTION */}

      <button
        className="btn btn-primary"
        onClick={() =>
          navigate(`/online-clients/${id}/timeline`)
        }
      >
        📈 View Transformation Timeline
      </button>

      {/* MEMBER / ASSESSMENT HEADER */}

      <div className="assessment-card">
        <h2>📋 Monthly Assessments</h2>

        <p>Online Member ID</p>

        <strong>{id}</strong>
      </div>

      {/* ASSESSMENTS */}

      <div style={{ marginTop: 20 }}>

        {loading ? (
          <div className="assessment-card">
            <p>Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (

          <div className="assessment-card">

            <h3>
              No Monthly Assessments Yet
            </h3>

            <p>
              This online member has not submitted
              a monthly assessment yet.
            </p>

          </div>

        ) : (

          assessments.map((assessment) => (

            <div
              key={assessment.id}
              className="assessment-card"
              style={{
                marginBottom: 20,
              }}
            >

              {/* DATE */}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >

                <div>

                  <p
                    style={{
                      margin: 0,
                      opacity: 0.7,
                    }}
                  >
                    Monthly Assessment
                  </p>

                  <h3
                    style={{
                      marginTop: 5,
                    }}
                  >
                    📅 {assessment.assessment_date}
                  </h3>

                </div>

              </div>

              {/* BASIC STATS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                  marginTop: 20,
                }}
              >

                <div className="review-card">
                  <strong>⚖️ Weight</strong>

                  <p>
                    {assessment.weight ?? "-"} kg
                  </p>
                </div>

                <div className="review-card">
                  <strong>🔥 Body Fat</strong>

                  <p>
                    {assessment.body_fat ?? "-"}%
                  </p>
                </div>

              </div>

              {/* MEASUREMENTS */}

              <div
                className="review-card"
                style={{
                  marginTop: 16,
                }}
              >

                <h3>📏 Body Measurements</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 10,
                    marginTop: 15,
                  }}
                >

                  <Measurement
                    label="Chest"
                    value={assessment.chest}
                  />

                  <Measurement
                    label="Waist"
                    value={assessment.waist}
                  />

                  <Measurement
                    label="Hips"
                    value={assessment.hips}
                  />

                  <Measurement
                    label="Neck"
                    value={assessment.neck}
                  />

                  <Measurement
                    label="Left Arm"
                    value={assessment.left_arm}
                  />

                  <Measurement
                    label="Right Arm"
                    value={assessment.right_arm}
                  />

                  <Measurement
                    label="Left Forearm"
                    value={assessment.left_forearm}
                  />

                  <Measurement
                    label="Right Forearm"
                    value={assessment.right_forearm}
                  />

                  <Measurement
                    label="Left Thigh"
                    value={assessment.left_thigh}
                  />

                  <Measurement
                    label="Right Thigh"
                    value={assessment.right_thigh}
                  />

                  <Measurement
                    label="Left Calf"
                    value={assessment.left_calf}
                  />

                  <Measurement
                    label="Right Calf"
                    value={assessment.right_calf}
                  />

                </div>

              </div>

              {/* PROGRESS PHOTOS */}

              <div
                className="review-card"
                style={{
                  marginTop: 16,
                }}
              >

                <h3>📸 Progress Photos</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 15,
                    marginTop: 15,
                  }}
                >

                  <ProgressPhoto
                    title="Front"
                    src={assessment.front_photo}
                  />

                  <ProgressPhoto
                    title="Side"
                    src={assessment.side_photo}
                  />

                  <ProgressPhoto
                    title="Back"
                    src={assessment.back_photo}
                  />

                </div>

              </div>

              {/* MEMBER NOTES */}

              <div
                className="review-card"
                style={{
                  marginTop: 16,
                }}
              >

                <h3>📝 Member Notes</h3>

                <p>
                  {assessment.member_notes ||
                    "No notes provided by the member."}
                </p>

              </div>

              {/* COACH NOTES */}

              <div
                className="review-card"
                style={{
                  marginTop: 16,
                }}
              >

                <h3>👨‍🏫 Coach Review</h3>

                <p>
                  {assessment.coach_notes ||
                    "No coach review added yet."}
                </p>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}


/*
========================================
MEASUREMENT COMPONENT
========================================
*/

function Measurement({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <strong>{label}</strong>

      <p
        style={{
          margin: "5px 0 0",
        }}
      >
        {value ?? "-"} cm
      </p>
    </div>
  );
}


/*
========================================
PROGRESS PHOTO COMPONENT
========================================
*/

function ProgressPhoto({ title, src }) {
  return (
    <div>

      <h4
        style={{
          marginBottom: 8,
        }}
      >
        {title}
      </h4>

      {src ? (
        <img
          src={src}
          alt={`${title} progress`}
          style={{
            width: "100%",
            maxHeight: 400,
            objectFit: "cover",
            borderRadius: 12,
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            opacity: 0.6,
          }}
        >
          No photo
        </div>
      )}

    </div>
  );
}