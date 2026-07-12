import { useEffect, useState } from "react";
import ImagePicker from "../components/ImagePicker";
import { useMember } from "../hooks/useMember";
import {
  updateMember,
} from "../services/memberService";
import {
  uploadProfilePhoto,
} from "../services/storageService";

export default function MemberProfile() {

  const {
    member,
    loading,
    refresh,
  } = useMember();

  const [profilePhoto, setProfilePhoto] = useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

   // Initialize form once
   useEffect(() => {
    if (member) {
      setForm({
        full_name: member.full_name || "",
        email: member.email || "",
        phone: member.phone || "",
      });
    }
  }, [member]);

  // Wait until member loads
  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  // Prevent rendering before data exists
  if (!member) {
    return (
      <div className="page">
        Member not found.
      </div>
    );
  }

 

  async function handleSave() {
  if (!profilePhoto) {
    alert("Please select a profile photo.");
    return;
  }

  try {
    setSaving(true);

    const photoUrl = await uploadProfilePhoto(
      member.id,
      profilePhoto
    );

    console.log("Photo URL:", photoUrl);
    console.log("Member ID:", member.id);
    console.log("member.auth_user_id =", member.auth_user_id);

    await updateMember(member.id, {
      profile_photo: photoUrl,
    });

    // await refresh();

    setProfilePhoto(null);

    alert("✅ Profile photo updated successfully!");

  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setSaving(false);
  }
}
  return (
    <div className="page">
  
      <div className="assessment-card">
  
        <h1>👤 My Account</h1>
  
        <ImagePicker
          label="Profile Photo"
          image={profilePhoto}
          setImage={setProfilePhoto}
        />
  
  <div className="profile-item">
  <label>Full Name</label>
  <p>{member.full_name}</p>
</div>

<div className="profile-item">
  <label>Phone</label>
  <p>{member.phone}</p>
</div>

<div className="profile-item">
  <label>Email</label>
  <p>{member.email}</p>
</div>

<div className="profile-item">
  <label>Membership</label>
  <p>{member.membership_type}</p>
</div>

<div className="profile-item">
  <label>Membership Valid Till</label>
  <p>{member.membership_end}</p>
</div>

      <div className="form-group">

        <label>Membership</label>

        <input
          className="form-input"
          value={member.membership_type}
          disabled
        />

      </div>

      <div className="form-group">

        <label>Membership Start</label>

        <input
          className="form-input"
          value={member.membership_start}
          disabled
        />

      </div>

      <div className="form-group">

        <label>Membership Expiry</label>

        <input
          className="form-input"
          value={member.membership_end}
          disabled
        />

      </div>

      <div className="form-actions">

<button
  className="btn btn-primary"
  onClick={handleSave}
  disabled={saving}
>
  {saving ? "Saving..." : "💾 Save Changes"}
</button>

</div>

</div>

</div>
);
}