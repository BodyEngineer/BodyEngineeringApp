import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function WebsiteSettings() {
    const [settings, setSettings] = useState({
    studio_color: "#ff4438",
    studio_name: "",
    whatsapp_number: "",
    instagram_url: "",
    youtube_url: "",
    facebook_url: "",
    email: "",
    address: "",
    google_maps_url: "",
    footer_text: "",
    upi_id: "",
    gpay_qr_url: "",
  });

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from("website_settings")
      .select("*")
      .eq("id", 1)
      .single();
  
    if (data) {
      setSettings({
        studio_color: data.studio_color || "#ff4438",
        studio_name: data.studio_name || "",
        whatsapp_number: data.whatsapp_number || "",
        instagram_url: data.instagram_url || "",
        youtube_url: data.youtube_url || "",
        facebook_url: data.facebook_url || "",
        email: data.email || "",
        address: data.address || "",
        google_maps_url: data.google_maps_url || "",
        footer_text: data.footer_text || "",
        upi_id: data.upi_id || "",
        gpay_qr_url: data.gpay_qr_url || "",
      });
    }
  };
  

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value,
    });
  };

  const saveSettings = async () => {
  
    const { data, error } = await supabase
      .from("website_settings")
      .update({
        studio_name: settings.studio_name,
        studio_color: settings.studio_color,
        whatsapp_number: settings.whatsapp_number,
        instagram_url: settings.instagram_url,
        youtube_url: settings.youtube_url,
        facebook_url: settings.facebook_url,
        email: settings.email,
        address: settings.address,
        google_maps_url: settings.google_maps_url,
        footer_text: settings.footer_text,
        upi_id: settings.upi_id,
        gpay_qr_url: settings.gpay_qr_url,
      })
      .eq("id", 1)
      .select();
  
    if (error) {
      alert(error.message);
      return;
    }
  
    alert("Settings Updated Successfully");
loadSettings();
  };

  return (
    <div>
      <h1>Website Settings</h1>

      <input
        name="studio_name"
        value={settings.studio_name}
        onChange={handleChange}
        placeholder="Studio Name"
      />
      <input
        name="studio_color"
        value={settings.studio_color}
        onChange={handleChange}
        placeholder="Studio Color"
      />

      <input
        name="instagram_url"
        value={settings.instagram_url}
        onChange={handleChange}
        placeholder="Instagram URL"
      />

      <input
        name="whatsapp_number"
        value={settings.whatsapp_number}
        onChange={handleChange}
        placeholder="WhatsApp Number"
      />

<input
  name="gpay_qr_url"
  value={settings.gpay_qr_url}
  onChange={handleChange}
  placeholder="QR Image URL"
/>

<input
  name="upi_id"
  value={settings.upi_id}
  onChange={handleChange}
  placeholder="UPI ID"
/>

<input
  name="youtube_url"
  value={settings.youtube_url}
  onChange={handleChange}
  placeholder="YouTube URL"
/>

<input
  name="facebook_url"
  value={settings.facebook_url}
  onChange={handleChange}
  placeholder="Facebook URL"
/>

<input
  name="email"
  value={settings.email}
  onChange={handleChange}
  placeholder="Email"
/>

<textarea
  name="address"
  value={settings.address}
  onChange={handleChange}
  placeholder="Studio Address"
/>

<input
  name="google_maps_url"
  value={settings.google_maps_url}
  onChange={handleChange}
  placeholder="Google Maps URL"
/>

<textarea
  name="footer_text"
  value={settings.footer_text}
  onChange={handleChange}
  placeholder="Footer Text"
/>

<button
  style={{
    padding: "12px 24px",
    background: "red",
    color: "white",
    marginTop: "20px",
    cursor: "pointer",
  }}
  onClick={() => {
    saveSettings();
  }}
>
  Save Settings
</button>
    </div>
  );
}