import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Header from "../components/Header";
import MemberForm from "../components/MemberForm";
import ImagePicker from "../components/ImagePicker";
import LoadingSpinner from "../components/LoadingSpinner";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function EditMember() {
  const { id } = useParams();
  const { openSidebar } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMember();
  }, [id, user]);

  async function fetchMember() {
    if (!user) return;

    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (error) {
      setError(error.message);
    } else {
      setMember(data);
    }

    setLoading(false);
  }

  async function handleSubmit(form) {
    setSaving(true);
    setError("");

    let profilePhotoUrl = member.profile_photo;

    if (profilePhoto) {
      setUploading(true);

      const fileName = `${id}-${Date.now()}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, profilePhoto);

      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);

      profilePhotoUrl = data.publicUrl;

      setUploading(false);
    }

    const { data, error: functionError } =
    await supabase.functions.invoke("update-member", {
      body: {
        member_id: id,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        membership_type: form.membership_type,
        membership_start: form.membership_start,
        membership_end: form.membership_end,
        batch_timing: form.batch_timing.trim() || null,
        notes: form.notes.trim() || null,
      },
    });
  
  if (functionError) {
    setError(functionError.message);
    setSaving(false);
    return;
  }
  
  if (!data?.success) {
    setError(data?.error || "Member update failed");
    setSaving(false);
    return;
  }
  
  // Save profile photo URL if a new photo was uploaded
  if (profilePhoto) {
    const { error: photoError } = await supabase
      .from("members")
      .update({ profile_photo: profilePhotoUrl })
      .eq("id", id)
      .eq("owner_id", user.id);
  
    if (photoError) {
      setError(
        "Member details updated, but profile photo update failed: " +
        photoError.message
      );
      setSaving(false);
      return;
    }
  }
  
  navigate(`/members/${id}`);
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="page">

      <Header
        title="Edit Member"
        subtitle={member.full_name}
        onMenuClick={openSidebar}
      />

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="form-card">

        <ImagePicker
          label="Profile Photo"
          image={profilePhoto}
          setImage={setProfilePhoto}
        />

        {uploading && (
          <div className="alert alert-info">
            Uploading image...
          </div>
        )}

        <MemberForm
          member={member}
          onSubmit={handleSubmit}
          loading={saving}
          submitLabel="Save Changes"
        />

      </div>

    </div>
  );
}