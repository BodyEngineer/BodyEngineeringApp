import "./ConsultationSection.css";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { FaWhatsapp } from "react-icons/fa";


export default function ConsultationSection() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    goal: "",
  });

  const [settings, setSettings] = useState({
    whatsapp_number: "",
    email: "",
    address: "",
    google_maps_url: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!settings.whatsapp_number) {
      alert("WhatsApp number is currently unavailable. Please try again later.");
      return;
    }

    const message = `Hi Body Engineering!

  I'm interested in a free consultation.

  Name: ${form.name}
  Phone: ${form.phone}
  Goal: ${form.goal}

  Please share more details. Thank you!`;

    const whatsappUrl = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <section
      id="consultation"
      className="consultation-section"
    >
      <div className="consultation-wrapper">

        {/* LEFT SIDE */}

        <div className="consultation-content">

          <span className="consultation-tag">
            YOUR JOURNEY STARTS HERE
          </span>

          <h2>
            Ready To Become
            <span> Your Strongest Self?</span>
          </h2>

          <p className="consultation-description">
            Tell us your goal and take the first step toward
            becoming stronger, healthier and more confident.
            We'll help you find the right path for your journey.
          </p>

          <div className="consultation-benefits">

            <div>
              <span>✓</span>
              Personalized Guidance
            </div>

            <div>
              <span>✓</span>
              Goal-Based Training
            </div>

            <div>
              <span>✓</span>
              Nutrition Support
            </div>

            <div>
              <span>✓</span>
              Continuous Progress Tracking
            </div>

          </div>

          <div className="consultation-trust">
            <strong>1000+</strong>
            <span>Lives Transformed</span>

            <div className="trust-divider"></div>

            <strong>12+</strong>
            <span>Years Experience</span>
          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="consultation-card">

          <div className="consultation-card-heading">

            <span>FREE CONSULTATION</span>

            <h3>
              Let’s Talk About
              <br />
              Your Goal.
            </h3>

            <p>
              Share a few details and connect with us directly
              on WhatsApp.
            </p>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>Your Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>Phone Number</label>

              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>What is your primary goal?</label>

              <select
                name="goal"
                value={form.goal}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select your goal
                </option>

                <option value="Fat Loss">
                  Fat Loss
                </option>

                <option value="Strength & Conditioning">
                  Strength & Conditioning
                </option>

                <option value="Personal Coaching">
                  Personal Coaching
                </option>

                <option value="Online Transformation">
                  Online Transformation
                </option>

                <option value="General Fitness">
                  General Fitness
                </option>

              </select>

            </div>

            <button
              type="submit"
              className="consultation-submit"
            >
              <FaWhatsapp />

              Start Free Consultation
            </button>

          </form>

          <div className="contact-info">

  <p>
    📞 {settings.whatsapp_number}
  </p>

  <p>
    ✉️ {settings.email}
  </p>

  <p>
    📍 {settings.address}
  </p>

</div>

{
  settings.google_maps_url && (
    <a
      href={settings.google_maps_url}
      target="_blank"
      rel="noreferrer"
      className="map-btn"
    >
      View Location
    </a>
  )
}

          <p className="consultation-note">
            No commitment. Just a conversation about your goals.
          </p>

        </div>

      </div>
    </section>
  );
}