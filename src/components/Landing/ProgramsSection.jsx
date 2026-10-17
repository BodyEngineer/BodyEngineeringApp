import "./ProgramsSection.css";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";


export default function ProgramsSection() {

  const [programs, setPrograms] = useState([]);

useEffect(() => {
  fetchPrograms();
}, []);

const fetchPrograms = async () => {
  const { data, error } = await supabase
    .from("website_programs")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (!error) {
    setPrograms(data || []);
  }
};
  const goToConsultation = () => {
    const section = document.getElementById("consultation");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section id="programs" className="programs-section">

      <div className="programs-heading">
        <span className="programs-tag">CHOOSE YOUR PATH</span>

        <h2>
          Programs Built For
          <span> Real Results.</span>
        </h2>

        <p>
          Expert coaching designed around your goals, lifestyle
          and fitness journey.
        </p>
      </div>

      <div className="programs-grid">
        {programs.map((program, index) => (
          <div className="program-card" key={index}>

<img
  src={program.image_url}
  alt={program.title}
  className="program-image"
/>

<span className="program-label">
  {program.short_description}
</span>
            <h3>{program.title}</h3>

            <p>{program.description}</p>

            <button
              className="program-btn"
              onClick={goToConsultation}
            >
              Get Started →
            </button>

          </div>
        ))}
      </div>

    </section>
  );
}