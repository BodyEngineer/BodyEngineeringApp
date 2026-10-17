import Header from "../components/Header";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addOnlineClient } from "../services/onlineClientServices";

export default function AddOnlineClient() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    goal: "",
    package_type: "",
  });

  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }
  function generatePassword() {
    return Math.random().toString(36).slice(-8);
  }

  async function handleSave() {
    try {
      setSaving(true);
  
      const password = generatePassword();
  
      await addOnlineClient({
        ...form,
        password,
        type: "online",
      });
  
      alert(
        `✅ Online client added!
  
  Email: ${form.email}
  
  Password: ${password}`
      );
  
      navigate("/online-clients");
  
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <Header
        title="Add Online Client"
        subtitle="Register a new online coaching client"
        onMenuClick={openSidebar}
      />

      <div className="assessment-card">
        <h2>New Online Client</h2>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
        </div>

        <div className="form-group">
          <label>Phone</label>
          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
          />
        </div>

        <div className="form-group">
          <label>Goal</label>
          <input
            type="text"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            placeholder="Weight Loss / Muscle Gain"
          />
        </div>

        <div className="form-group">
          <label>Package Type</label>
          <input
            type="text"
            name="package_type"
            value={form.package_type}
            onChange={handleChange}
            placeholder="Monthly / Quarterly"
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Online Client"}
        </button>
      </div>
    </div>
  );
}