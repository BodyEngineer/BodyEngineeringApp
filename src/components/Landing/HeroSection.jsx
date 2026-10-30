import "./HeroSection.css";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/body-engineering-logo.png";

export default function HeroSection() {
  const navigate = useNavigate();

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
    <section className="hero">

      <div className="hero-overlay"></div>

      <div className="hero-content">

      <img
  src={logo}
  className="hero-logo"
  alt="Body Engineering"
/>
        <h1 className="hero-title">
          BODY <span> ENGINEERING </span>
        </h1>

        <h2 className="hero-subtitle">
          Premium Women's Fitness Studio
        </h2>

        <p className="hero-tagline">
          Transform Your Body.
          <br />
          Transform Your Life.
        </p>

        <div className="hero-buttons">

          <button
            className="primary-btn"
            onClick={() => navigate("/member-login")}
          >
            🚀 Start Your Journey
          </button>

          <button
            className="secondary-btn"
            onClick={goToConsultation}
          >
            📅 Free Consultation
          </button>

        </div>

        <div className="hero-stats">

          <div>
            <h2>500+</h2>
            <p>Transformations</p>
          </div>

          <div>
            <h2>12+</h2>
            <p>Years Experience</p>
          </div>

          <div>
            <h2>1000+</h2>
            <p>Happy Members</p>
          </div>

        </div>

        <div className="scroll-down">
          ↓
        </div>

      </div>

    </section>
  );
}