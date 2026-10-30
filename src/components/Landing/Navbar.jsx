import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FaInstagram, FaWhatsapp } from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const [settings, setSettings] = useState({
    instagram_url: "",
    whatsapp_number: "",
    studio_name: "Body Engineering",
    studio_color: "#ff4438",
  });

  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from("website_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setSettings(data);
      }
    };

    loadSettings();
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    setMenuOpen(false);

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
    setMenuOpen(false);

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
    <nav className={`navbar ${menuOpen ? "menu-open" : ""}`}>

      {/* LOGO */}
      <div className="logo" onClick={goHome}>
        Body{" "}
        <span style={{ color: settings.studio_color }}>
          Engineering
        </span>
      </div>

      {/* DESKTOP / MOBILE NAVIGATION */}
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

      {/* RIGHT SIDE BUTTONS */}
      <div className="nav-buttons">

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

        <button
          className="owner-login-btn"
          onClick={() => {
            setMenuOpen(false);
            navigate("/login");
          }}
          title="Owner Portal"
        >
          ⚙ <span>Owner Portal</span>
        </button>

        <button
          className="login-btn"
          onClick={() => {
            setMenuOpen(false);
            navigate("/member-login");
          }}
        >
          Member Login
        </button>

        <button
          className="join-btn"
          onClick={() => scrollToSection("consultation")}
        >
          Join Now
        </button>

      </div>

      {/* MOBILE HAMBURGER */}
      <button
        className={`menu-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((previous) => !previous)}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

    </nav>
  );
}