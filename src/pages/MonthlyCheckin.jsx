import Header from "../components/Header";
import ProgressHeader from "../components/ui/ProgressHeader";
import SectionCard from "../components/ui/SectionCard";
import UploadCard from "../components/ui/UploadCard";
import { useOutletContext } from "react-router-dom";

export default function MonthlyCheckin() {
  const { openSidebar } = useOutletContext();

  return (
    <div className="page">

      <Header
        title="Monthly Check-in"
        subtitle="Update your monthly transformation"
        onMenuClick={openSidebar}
      />

      <ProgressHeader
        title="Monthly Check-in"
        subtitle="Let's review your progress"
        step={1}
        totalSteps={5}
      />

      <SectionCard
        title="📷 Progress Photos"
        subtitle="Upload clear photos in good lighting."
      >

        <div className="upload-grid">

          <UploadCard title="Front Photo" />

          <UploadCard title="Side Photo" />

          <UploadCard title="Back Photo" />

        </div>

      </SectionCard>

      <button className="btn btn-primary wizard-btn">
        Continue →
      </button>

    </div>
  );
}