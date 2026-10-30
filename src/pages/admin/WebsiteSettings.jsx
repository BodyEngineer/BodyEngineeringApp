import { useEffect, useState } from "react";
import {
  Palette,
  Building2,
  Phone,
  Globe,
  Mail,
  MapPin,
  CreditCard,
  Save,
  LoaderCircle,
  ExternalLink,
  CircleCheck,
  AlertCircle,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

const INITIAL_SETTINGS = {
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
};

const SECTIONS = [
  {
    title: "Studio Identity",
    description: "Your business name and brand colour.",
    icon: Building2,
    fields: [
      {
        name: "studio_name",
        label: "Studio Name",
        placeholder: "Body Engineering Female Fitness Studio",
        icon: Building2,
      },
    ],
  },
  {
    title: "Contact Information",
    description: "Help visitors connect with your studio.",
    icon: Phone,
    fields: [
      {
        name: "whatsapp_number",
        label: "WhatsApp Number",
        placeholder: "91XXXXXXXXXX",
        icon: Phone,
        type: "tel",
      },
      {
        name: "email",
        label: "Business Email",
        placeholder: "yourstudio@example.com",
        icon: Mail,
        type: "email",
      },
      {
        name: "address",
        label: "Studio Address",
        placeholder: "Enter your complete studio address",
        icon: MapPin,
        multiline: true,
      },
      {
        name: "google_maps_url",
        label: "Google Maps URL",
        placeholder: "https://maps.google.com/...",
        icon: MapPin,
        type: "url",
      },
    ],
  },
  {
    title: "Social Media",
    description: "Connect your public website to your social profiles.",
    icon: Globe,
    fields: [
      {
        name: "instagram_url",
        label: "Instagram URL",
        placeholder: "https://instagram.com/yourprofile",
        icon: Globe,
        type: "url",
      },
      {
        name: "youtube_url",
        label: "YouTube URL",
        placeholder: "https://youtube.com/@yourchannel",
        icon: Globe,
        type: "url",
      },
      {
        name: "facebook_url",
        label: "Facebook URL",
        placeholder: "https://facebook.com/yourpage",
        icon: Globe,
        type: "url",
      },
    ],
  },
  {
    title: "Payment Information",
    description: "Display your UPI details and payment QR code.",
    icon: CreditCard,
    fields: [
      {
        name: "upi_id",
        label: "UPI ID",
        placeholder: "yourname@bank",
        icon: CreditCard,
      },
      {
        name: "gpay_qr_url",
        label: "Payment QR Image URL",
        placeholder: "https://your-public-image-url",
        icon: Globe,
        type: "url",
      },
    ],
  },
  {
    title: "Website Footer",
    description: "Customise the message displayed at the bottom of your website.",
    icon: Globe,
    fields: [
      {
        name: "footer_text",
        label: "Footer Text",
        placeholder: "Your fitness journey starts here...",
        icon: Globe,
        multiline: true,
      },
    ],
  },
];

function SettingsField({ field, value, onChange, disabled }) {
  const FieldIcon = field.icon;

  return (
    <div className="ws-field">
      <label className="ws-label" htmlFor={field.name}>
        {field.label}
      </label>

      <div className={`ws-input-wrap ${field.multiline ? "ws-textarea-wrap" : ""}`}>
        <FieldIcon size={18} className="ws-input-icon" />

        {field.multiline ? (
          <textarea
            id={field.name}
            name={field.name}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            rows={4}
            disabled={disabled}
            className="ws-input ws-textarea"
          />
        ) : (
          <input
            id={field.name}
            name={field.name}
            type={field.type || "text"}
            value={value}
            onChange={onChange}
            placeholder={field.placeholder}
            disabled={disabled}
            className="ws-input"
          />
        )}
      </div>
    </div>
  );
}

export default function WebsiteSettings() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("website_settings")
        .select("*")
        .eq("id", 1)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setSettings({
          ...INITIAL_SETTINGS,
          ...Object.fromEntries(
            Object.keys(INITIAL_SETTINGS).map((key) => [
              key,
              data[key] ?? INITIAL_SETTINGS[key],
            ])
          ),
        });
      }
    } catch (err) {
      console.error("Load website settings:", err);
      setError(err.message || "Unable to load website settings.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setSettings((previous) => ({
      ...previous,
      [name]: value,
    }));
    setSuccess("");
    setError("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: saveError } = await supabase
        .from("website_settings")
        .update({
          studio_name: settings.studio_name.trim(),
          studio_color: settings.studio_color,
          whatsapp_number: settings.whatsapp_number.trim(),
          instagram_url: settings.instagram_url.trim(),
          youtube_url: settings.youtube_url.trim(),
          facebook_url: settings.facebook_url.trim(),
          email: settings.email.trim(),
          address: settings.address.trim(),
          google_maps_url: settings.google_maps_url.trim(),
          footer_text: settings.footer_text.trim(),
          upi_id: settings.upi_id.trim(),
          gpay_qr_url: settings.gpay_qr_url.trim(),
        })
        .eq("id", 1);

      if (saveError) throw saveError;

      setSuccess("Website settings saved successfully.");
    } catch (err) {
      console.error("Save website settings:", err);
      setError(err.message || "Unable to save website settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="ws-loading">
          <LoaderCircle className="ws-spin" size={30} />
          <p>Loading website settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page ws-page">
      <style>{`
        .ws-page {
          --ws-accent: ${/^#[0-9a-fA-F]{6}$/.test(settings.studio_color) ? settings.studio_color : "#ff4438"};
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 48px;
        }
        .ws-hero {
          position: relative;
          overflow: hidden;
          padding: 30px;
          margin-bottom: 24px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(255,68,56,.17), rgba(35,35,43,.94) 65%);
        }
        .ws-hero-top {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ws-hero-icon, .ws-section-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: white;
          background: var(--ws-accent);
          border-radius: 14px;
          width: 52px;
          height: 52px;
        }
        .ws-eyebrow {
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 800;
          color: var(--ws-accent);
          margin: 0 0 7px;
        }
        .ws-hero h1 {
          margin: 0;
          font-size: clamp(24px, 4vw, 34px);
        }
        .ws-hero p.ws-subtitle {
          color: #b8b8c3;
          margin: 10px 0 0;
          line-height: 1.6;
        }
        .ws-brand-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.1);
        }
        .ws-color-swatch {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          border: 2px solid rgba(255,255,255,.4);
          background: var(--ws-accent);
        }
        .ws-muted {
          color: #a8a8b5;
          font-size: 13px;
        }
        .ws-section {
          padding: 24px;
          margin-bottom: 20px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 18px;
          background: rgba(255,255,255,.035);
        }
        .ws-section-head {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }
        .ws-section-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(255,68,56,.14);
          color: var(--ws-accent);
        }
        .ws-section-head h2 {
          font-size: 18px;
          margin: 0 0 5px;
        }
        .ws-section-head p {
          margin: 0;
          color: #a8a8b5;
          font-size: 13px;
          line-height: 1.5;
        }
        .ws-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }
        .ws-field { min-width: 0; }
        .ws-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 9px;
          color: #ececf2;
        }
        .ws-input-wrap {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 14px;
          min-height: 50px;
          border: 1px solid #41414d;
          border-radius: 12px;
          background: #17171d;
          transition: border-color .2s, box-shadow .2s;
        }
        .ws-input-wrap:focus-within {
          border-color: var(--ws-accent);
          box-shadow: 0 0 0 3px rgba(255,68,56,.12);
        }
        .ws-input-icon {
          color: #9292a0;
          flex-shrink: 0;
        }
        .ws-input {
          width: 100%;
          min-width: 0;
          padding: 14px 0;
          border: none;
          outline: none;
          background: transparent;
          color: #fff;
          font: inherit;
          font-size: 14px;
          box-sizing: border-box;
        }
        .ws-input::placeholder { color: #72727e; }
        .ws-textarea-wrap { align-items: flex-start; padding-top: 10px; }
        .ws-textarea { resize: vertical; min-height: 92px; }
        .ws-color-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .ws-color-picker {
          width: 52px;
          height: 50px;
          padding: 4px;
          flex-shrink: 0;
          border: 1px solid #41414d;
          border-radius: 12px;
          background: #17171d;
          cursor: pointer;
        }
        .ws-color-text { flex: 1; }
        .ws-qr-preview {
          margin-top: 12px;
          max-width: 150px;
          max-height: 150px;
          object-fit: contain;
          border-radius: 12px;
          background: white;
          padding: 8px;
        }
        .ws-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 14px 16px;
          margin-bottom: 20px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }
        .ws-error {
          color: #ffb4ad;
          border: 1px solid rgba(255,68,56,.3);
          background: rgba(255,68,56,.1);
        }
        .ws-success {
          color: #a6f0bd;
          border: 1px solid rgba(50,215,75,.25);
          background: rgba(50,215,75,.09);
        }
        .ws-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          padding: 20px 0;
        }
        .ws-save {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 48px;
          padding: 0 24px;
          border: none;
          border-radius: 12px;
          color: white;
          background: var(--ws-accent);
          font-weight: 800;
          cursor: pointer;
        }
        .ws-save:disabled { opacity: .65; cursor: wait; }
        .ws-preview-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #f0a29b;
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
        }
        .ws-loading {
          min-height: 50vh;
          display: grid;
          align-content: center;
          justify-items: center;
          color: #c8c8d0;
          gap: 10px;
        }
        .ws-spin { animation: ws-spin 1s linear infinite; }
        @keyframes ws-spin { to { transform: rotate(360deg); } }
        @media (max-width: 650px) {
          .ws-hero { padding: 22px; }
          .ws-section { padding: 18px; }
          .ws-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }
          .ws-actions { align-items: stretch; flex-direction: column-reverse; }
          .ws-save { width: 100%; }
        }
      `}</style>

      <section className="ws-hero">
        <div className="ws-hero-top">
          <div className="ws-hero-icon">
            <Palette size={27} />
          </div>
          <div>
            <p className="ws-eyebrow">BODY ENGINEERING</p>
            <h1>Website Settings</h1>
            <p className="ws-subtitle">
              Manage your studio identity, contact details, social links and payments.
            </p>
          </div>
        </div>

        <div className="ws-brand-preview">
          <span className="ws-color-swatch" />
          <div>
            <strong>{settings.studio_name || "Your Studio Name"}</strong>
            <div className="ws-muted">Live brand colour preview</div>
          </div>
          <span className="ws-muted">{settings.studio_color}</span>
        </div>
      </section>

      {error && (
        <div className="ws-notice ws-error" role="alert">
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="ws-notice ws-success" role="status">
          <CircleCheck size={19} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={saveSettings}>
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;

          return (
            <section className="ws-section" key={section.title}>
              <div className="ws-section-head">
                <div className="ws-section-icon">
                  <SectionIcon size={22} />
                </div>
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </div>

              <div className="ws-grid">
                {section.fields.map((field) => (
                  <SettingsField
                    key={field.name}
                    field={field}
                    value={settings[field.name]}
                    onChange={handleChange}
                    disabled={saving}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <section className="ws-section">
          <div className="ws-section-head">
            <div className="ws-section-icon">
              <Palette size={22} />
            </div>
            <div>
              <h2>Brand Appearance</h2>
              <p>Choose the accent colour for your studio branding.</p>
            </div>
          </div>

          <div className="ws-field" style={{ maxWidth: 440 }}>
            <label className="ws-label" htmlFor="studio_color">
              Studio Accent Colour
            </label>

            <div className="ws-color-row">
              <input
                className="ws-color-picker"
                type="color"
                value={
                  /^#[0-9a-fA-F]{6}$/.test(settings.studio_color)
                    ? settings.studio_color
                    : "#ff4438"
                }
                onChange={(event) =>
                  setSettings((previous) => ({
                    ...previous,
                    studio_color: event.target.value,
                  }))
                }
                disabled={saving}
                aria-label="Choose studio accent colour"
              />

              <div className="ws-input-wrap ws-color-text">
                <Palette size={18} className="ws-input-icon" />
                <input
                  id="studio_color"
                  name="studio_color"
                  value={settings.studio_color}
                  onChange={handleChange}
                  placeholder="#ff4438"
                  pattern="^#[0-9a-fA-F]{6}$"
                  title="Enter a six-digit hex colour, for example #ff4438"
                  className="ws-input"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </section>

        {settings.gpay_qr_url && (
          <section className="ws-section">
            <div className="ws-section-head">
              <div className="ws-section-icon">
                <CreditCard size={22} />
              </div>
              <div>
                <h2>Payment QR Preview</h2>
                <p>Preview the image linked in your payment settings.</p>
              </div>
            </div>

            <img
              className="ws-qr-preview"
              src={settings.gpay_qr_url}
              alt="Studio payment QR code"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </section>
        )}

        <div className="ws-actions">
          <a
            className="ws-preview-link"
            href="/"
            target="_blank"
            rel="noreferrer"
          >
            Preview Public Website <ExternalLink size={16} />
          </a>

          <button className="ws-save" type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle size={18} className="ws-spin" />
                Saving Settings...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Website Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}