import "./ProgramsV3.css";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ProgramsV3() {
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
    <section className="programs-v3" id="programs">
      <div className="programs-header">

        <span className="program-tag">
          CHOOSE YOUR PATH
        </span>

        <h2>
          Programs Built For
          <span> Real Results.</span>
        </h2>

        <p>
          Every transformation starts with the right strategy.
          Choose the program that perfectly matches your goal.
        </p>

      </div>

      <div className="programs-wrapper">

        {programs.map((program, index) => (

          <div
            key={program.id}
            className={`program-showcase ${
              index % 2 !== 0 ? "reverse" : ""
            }`}
          >

            <div className="program-image">

              <img
                src={program.image_url}
                alt={program.title}
              />

            </div>

            <div className="glass-card">

              <div className="program-number">
                {String(index + 1).padStart(2, "0")}
              </div>

              <h3>{program.title}</h3>

              <p className="short-description">
                {program.short_description}
              </p>

              <p className="description">
                {program.description}
              </p>

              <div className="feature-grid">

                <div>✔ Personalized Coaching</div>
                <div>✔ Nutrition Guidance</div>
                <div>✔ Progress Tracking</div>
                <div>✔ Weekly Support</div>

              </div>

              <button
                className="consult-btn"
                onClick={goToConsultation}
              >
                Book Consultation →
              </button>

            </div>

          </div>

        ))}

      </div>
    </section>
  );
}