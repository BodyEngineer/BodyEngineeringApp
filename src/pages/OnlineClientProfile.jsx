import { useState } from "react";
import Header from "../components/Header";
import { useOutletContext, useParams, Link } from "react-router-dom";
import { useOnlineClient } from "../hooks/useOnlineClient";
import { useAssessments } from "../hooks/useAssessments";
import { supabase } from "../lib/supabase";

export default function OnlineClientProfile() {
  const { openSidebar } = useOutletContext();
  const { id } = useParams();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    goal: "",
    start_date: "",
    expiry_date: "",
  });

  const { client, loading } = useOnlineClient(id);

  const startEditing = () => {
    setEditForm({
      full_name: client?.full_name || "",
      phone: client?.phone || "",
      email: client?.email || "",
      goal: client?.goal || "",
      start_date: client?.start_date || "",
      expiry_date: client?.expiry_date || "",
    });
  
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim()) {
      alert("Please enter the client's name.");
      return;
    }

    if (!editForm.phone.trim()) {
      alert("Please enter the client's phone number.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("online_clients")
      .update({
        full_name: editForm.full_name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        goal: editForm.goal.trim(),
        start_date: editForm.start_date || null,
        expiry_date: editForm.expiry_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Update online client error:", error);
      alert("Could not update client profile.");
      setSaving(false);
      return;
    }

    alert("Client profile updated successfully! ✅");

    setEditing(false);
    setSaving(false);

    window.location.reload();
  };

  const {
    assessments,
    loading: assessmentLoading,
  } = useAssessments(id);

  const latestAssessment = assessments?.[0];

  const latestPhoto =
    latestAssessment?.front_photo ||
    latestAssessment?.side_photo ||
    latestAssessment?.back_photo;

    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    console.log("✅ OnlineClientProfile Loaded");
console.log("Client:", client);
console.log("Assessments:", assessments);

const handleProfilePhotoUpload = async (event) => {
  const file = event.target.files?.[0];

  if (!file || !client) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select an image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("Please select an image smaller than 5 MB.");
    return;
  }

  try {
    setUploadingPhoto(true);

    const fileExt = file.name.split(".").pop();

    const filePath = `online-clients/${client.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    const photoUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from("online_clients")
      .update({
        profile_photo: photoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (updateError) throw updateError;

    alert("Profile photo updated successfully! ✅");

    window.location.reload();
  } catch (error) {
    console.error("Profile photo upload error:", error);
    alert(error.message || "Failed to update profile photo.");
  } finally {
    setUploadingPhoto(false);
  }
};
    return (

        <div className="page">

            <Header
                title="Online Client"
                subtitle="Client Profile"
                onMenuClick={openSidebar}
            />

<div className="assessment-card">

{loading ? (

    <p>Loading...</p>

) : (

    <>

{/* Profile Photo */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "35px",
  }}
>
  <h3 style={{ marginBottom: "15px" }}>
    👤 Profile Photo
  </h3>

  {client?.profile_photo ? (
    <img
      src={client.profile_photo}
      alt={client.full_name}
      style={{
        width: "180px",
        height: "180px",
        objectFit: "cover",
        borderRadius: "50%",
        border: "4px solid #ff3b30",
        boxShadow: "0 0 25px rgba(255,59,48,.35)",
        marginBottom: "18px",
      }}
    />
  ) : (
    <div
      style={{
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: "linear-gradient(135deg,#ff4d4d,#ff8a00)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "55px",
        fontWeight: "700",
        color: "#fff",
        marginBottom: "18px",
      }}
    >
      {client?.full_name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()}
    </div>
  )}

  <label
    className="btn btn-primary"
    style={{
      cursor: uploadingPhoto ? "not-allowed" : "pointer",
      opacity: uploadingPhoto ? 0.6 : 1,
    }}
  >
    {uploadingPhoto
      ? "Uploading..."
      : "📷 Change Profile Photo"}

    <input
      type="file"
      accept="image/*"
      onChange={handleProfilePhotoUpload}
      disabled={uploadingPhoto}
      style={{ display: "none" }}
    />
  </label>
</div>

<div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "25px",
  }}
>
  {latestPhoto ? (
    <img
      src={latestPhoto}
      alt="Progress"
      style={{
        width: "180px",
        height: "180px",
        objectFit: "cover",
        borderRadius: "20px",
        border: "3px solid #ff3b30",
        boxShadow: "0 0 20px rgba(255,59,48,.35)",
      }}
    />
  ) : (
    <div
      style={{
        width: "180px",
        height: "180px",
        borderRadius: "20px",
        background: "#1b2432",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        fontSize: "18px",
      }}
    >
      📷 No Photo
    </div>
  )}
</div>
        <h2>{client?.full_name}</h2>

        <p>📞 {client?.phone}</p>

        <p>📧 {client?.email}</p>

        <p>🎯 Goal: {client?.goal}</p>

        <br />

        <div
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "16px",
                marginTop: "20px",
            }}
        >

            <div className="assessment-card">
                <h4>⚖️ Weight</h4>
                <h2>{latestAssessment?.weight || "-"} kg</h2>
            </div>

            <div className="assessment-card">
                <h4>🔥 Body Fat</h4>
                <h2>{latestAssessment?.body_fat || "-"}%</h2>
            </div>

            <div className="assessment-card">
                <h4>📅 Assessments</h4>
                <h2>{assessments.length}</h2>
            </div>

            <div className="assessment-card">
                <h4>🏆 Status</h4>
                <h2>{client?.status}</h2>
            </div>

        </div>

        <br />

        <button
    type="button"
    className="btn btn-secondary"
    onClick={startEditing}
>
    ✏️ Edit Profile
</button>

{" "}

        <Link
            to={`/online-clients/${id}/add-assessment`}
            className="btn btn-primary"
        >
            ➕ New Assessment
        </Link>

        {" "}

        <Link
            to={`/online-clients/${id}/timeline`}
            className="btn btn-secondary"
        >
            📈 View Timeline
        </Link>

    </>

)}

</div>

{editing && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.78)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "20px",
    }}
    onClick={() => {
      if (!saving) setEditing(false);
    }}
  >
    <div
      className="assessment-card"
      style={{
        width: "100%",
        maxWidth: "520px",
        padding: "32px",
        borderRadius: "22px",
        boxSizing: "border-box",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "26px" }}>
            ✏️ Edit Client Profile
          </h2>

          <p
            style={{
              marginTop: "6px",
              marginBottom: 0,
              opacity: 0.65,
              fontSize: "14px",
            }}
          >
            Update your client's information
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          style={{
            border: "none",
            background: "rgba(255,255,255,0.08)",
            color: "#fff",
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            fontSize: "20px",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {/* Full Name */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
          }}
        >
          👤 Full Name
        </label>

        <input
          type="text"
          value={editForm.full_name}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              full_name: e.target.value,
            })
          }
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "#fff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Phone */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
          }}
        >
          📞 Phone Number
        </label>

        <input
          type="tel"
          value={editForm.phone}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              phone: e.target.value,
            })
          }
          disabled={saving}
          placeholder="10-digit mobile number"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "#fff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
          }}
        >
          📧 Email Address
        </label>

        <input
          type="email"
          value={editForm.email}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              email: e.target.value,
            })
          }
          disabled={saving}
          placeholder="client@email.com"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "#fff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Goal */}
      <div style={{ marginBottom: "28px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: "600",
          }}
        >
          🎯 Fitness Goal
        </label>

        <input
          type="text"
          value={editForm.goal}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              goal: e.target.value,
            })
          }
          disabled={saving}
          placeholder="e.g. Muscle Gain"
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: "12px",
            border: "1px solid #444",
            background: "#1e1e1e",
            color: "#fff",
            fontSize: "16px",
            boxSizing: "border-box",
          }}
        />

<label>Membership Start Date</label>
<input
  type="date"
  value={editForm.start_date}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      start_date: e.target.value,
    })
  }
/>

<label>Membership End Date</label>
<input
  type="date"
  value={editForm.expiry_date}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      expiry_date: e.target.value,
    })
  }
/>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setEditing(false)}
          disabled={saving}
          style={{
            minWidth: "110px",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSaveProfile}
          disabled={saving}
          style={{
            minWidth: "150px",
          }}
        >
          {saving ? "Saving..." : "💾 Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}
        </div>

    );

}