import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";



export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState({
    instagram_url: "",
    whatsapp_number: "",
    studio_name: "Body Engineering",
    studio_color: "#ff4438",
  });


useEffect(() => {
  const loadSettings = async () => {
    const { data } = await supabase
      .from("website_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (data) {
      setSettings(data);
    }
  };

  loadSettings();
}, []);

  const scrollToSection = (id) => {
    if (location.pathname === "/") {
      const section = document.getElementById(id);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }

      return;
    }

    navigate(`/#${id}`);
  };

  const goHome = () => {
    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate("/");
    }
  };

  const openInstagram = () => {
    if (!settings.instagram_url) return;
  
    window.open(
      settings.instagram_url,
      "_blank",
      "noopener,noreferrer"
    );
  };
  
  const openWhatsApp = () => {
    if (!settings.whatsapp_number) return;
  
    const message =
      "Hi Body Engineering, I'm interested in joining and would like to know more about your fitness programs.";
  
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div className="logo" onClick={goHome}>
  Body{" "}
  <span
    style={{
      color: settings.studio_color,
    }}
  >
    Engineering
  </span>
</div>

      {/* NAVIGATION */}
      <div className="nav-links">

        <button onClick={() => scrollToSection("transformations")}>
          Transformations
        </button>

        <button onClick={() => scrollToSection("programs")}>
          Programs
        </button>

        <button onClick={() => scrollToSection("reviews")}>
          Reviews
        </button>

        <button onClick={() => scrollToSection("consultation")}>
          Consultation
        </button>

      </div>

      {/* RIGHT SIDE */}
      <div className="nav-buttons">

        {/* SOCIAL ICONS */}
        <div className="nav-socials">

          <button
            className="social-btn instagram-btn"
            onClick={openInstagram}
            aria-label="Instagram"
            title="Instagram"
          >
            <FaInstagram />
          </button>

          <button
            className="social-btn whatsapp-btn"
            onClick={openWhatsApp}
            aria-label="WhatsApp"
            title="WhatsApp"
          >
            <FaWhatsapp /> 
          </button>

        </div>

        {/* OWNER */}
        <button
          className="owner-login-btn"
          onClick={() => navigate("/login")}
          title="Owner Portal"
        >
          ⚙ <span>Owner</span>
        </button>

        {/* MEMBER */}
        <button
          className="login-btn"
          onClick={() => navigate("/member-login")}
        >
          Member Login
        </button>

        {/* JOIN */}
        <button
          className="join-btn"
          onClick={() => scrollToSection("consultation")}
        >
          Join Now
        </button>

      </div>

    </nav>
  );
}