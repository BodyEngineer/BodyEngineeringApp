import "./Footer.css";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa";

export default function Footer() {
  const [settings, setSettings] = useState({
    studio_name: "Body Engineering",
    whatsapp_number: "",
    instagram_url: "",
    youtube_url: "",
    facebook_url: "",
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

  return (
    <footer className="footer">
      <div className="footer-content">

      <h2 className="footer-title">
  {settings.studio_name}
</h2>

        <p className="footer-tagline">
        Built By Science. Proven By Results.
        </p>

        <div className="footer-socials">

          {settings.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
            >
              <FaInstagram />
            </a>
          )}

          {settings.whatsapp_number && (
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp />
            </a>
          )}

          {settings.youtube_url && (
            <a
              href={settings.youtube_url}
              target="_blank"
              rel="noreferrer"
            >
              <FaYoutube />
            </a>
          )}

          {settings.facebook_url && (
            <a
              href={settings.facebook_url}
              target="_blank"
              rel="noreferrer"
            >
              <FaFacebook />
            </a>
          )}

        </div>

        <p className="footer-copy">
          ©️ 2026 {settings.studio_name}. All Rights Reserved.
        </p>

      </div>
    </footer>
  );
}