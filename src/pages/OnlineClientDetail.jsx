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

      <div className="assessment-card">
        <h2>📈 Transformation Timeline</h2>

        <p>Member ID</p>

        <strong>{id}</strong>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <p>Loading assessments...</p>
        ) : assessments.length === 0 ? (
          <div className="assessment-card">
            <h3>No Monthly Assessments Yet</h3>

            <p>
              Click "Add Assessment" to create the first monthly
              transformation record.
            </p>


<button
  className="btn btn-primary"
  onClick={() => navigate(`/online-clients/${id}/add-assessment`)}
>
  + Add Assessment
</button>
          </div>
        ) : (
          assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="assessment-card"
              style={{ marginBottom: 16 }}
            >
              <h3>{assessment.assessment_date}</h3>

              <p>⚖️ Weight : {assessment.weight || "-"} kg</p>

              <p>📏 Waist : {assessment.waist || "-"} cm</p>

              <p>📏 Chest : {assessment.chest || "-"} cm</p>

              <p>📝 {assessment.member_notes || "No notes"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}