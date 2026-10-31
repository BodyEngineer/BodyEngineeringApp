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

    if (error) {
      console.error("Could not load programs:", error);
      return;
    }

    setPrograms(data || []);
  };

  const goToConsultation = () => {
    document.getElementById("consultation")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="programs-v3" id="programs">
      <div className="programs-header">
        <span className="program-tag">CHOOSE YOUR PATH</span>

        <h2>
          Programs Built For
          <span> Real Results.</span>
        </h2>

        <p>
          Every transformation starts with the right strategy.
          Choose the program that matches your goals.
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
              {program.video_url ? (
              <video
              className="program-workout-video"
              src={program.video_url}
              poster={program.image_url || undefined}
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              controls={false}
              disablePictureInPicture
              preload="metadata"
              aria-label={`${program.title} workout video`}
            />
              ) : (
                <img
                  src={program.image_url}
                  alt={`${program.title} program`}
                  loading="lazy"
                />
              )}
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
                {[1, 2, 3, 4].map((number) => {
                  const feature = program[`feature${number}`];

                  return feature ? (
                    <div key={number}>✔ {feature}</div>
                  ) : null;
                })}
              </div>

              <button
                className="consult-btn"
                onClick={goToConsultation}
              >
                {program.button_text || "Book Consultation"} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}