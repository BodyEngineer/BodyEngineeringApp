import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./CoachProfileManagement.css";

export default function CoachProfileManagement() {
  const { openSidebar } = useOutletContext();
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [photosToDelete, setPhotosToDelete] = useState([]);

  const [coachProfile, setCoachProfile] = useState({
    id: null,
    founder_one: "",
    founder_two: "",
    tagline: "",
    heading: "",
    description: "",
  
    main_photo: "",
    secondary_photo: "",
  
    experience: "",
    clients_coached: "",
  
    achievement_1_title: "",
    achievement_1_subtitle: "",
    achievement_2_title: "",
    achievement_2_subtitle: "",
    achievement_3_title: "",
    achievement_3_subtitle: "",
    achievement_4_title: "",
    achievement_4_subtitle: "",
    achievement_5_title: "",
    achievement_5_subtitle: "",
    achievement_6_title: "",
    achievement_6_subtitle: "",
  });

  useEffect(() => {
    loadCoachProfile();
  }, []);
  
  const deleteCoachPhoto = async (photoUrl) => {
    if (!photoUrl) return;
  
    try {
      const marker = "/storage/v1/object/public/profile-photos/";
  
      if (!photoUrl.includes(marker)) {
        return;
      }
  
      const filePath = photoUrl.split(marker)[1];
  
      if (!filePath) return;
  
      const { data, error } = await supabase.storage
  .from("profile-photos")
  .remove([filePath]);

if (error) {
  console.error("Failed to delete old coach photo:", error);
}
    } catch (error) {
      console.error("Photo cleanup error:", error);
    }
  };

  const uploadCoachPhoto = async (file, fieldName) => {
    if (!file) return;
  
    try {
        setUploadingPhoto(fieldName);
        setSuccessMessage("");
        
        const oldPhotoUrl = coachProfile[fieldName];
  
      const fileExt = file.name.split(".").pop();
      const fileName = `coach-${fieldName}-${Date.now()}.${fileExt}`;
  
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file, {
          upsert: true,
        });
  
      if (uploadError) {
        console.error(uploadError);
        alert("Failed to upload photo");
        return;
      }
  
      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);
  
        const photoUrl = data.publicUrl;

        if (oldPhotoUrl && oldPhotoUrl !== photoUrl) {
          setPhotosToDelete((prev) => [
            ...prev,
            oldPhotoUrl,
          ]);
        }
        
        setCoachProfile((prev) => ({
          ...prev,
          [fieldName]: photoUrl,
        }));
  
      setSuccessMessage("Photo uploaded successfully. Click Save Changes to publish it.");
  
    } catch (error) {
      console.error(error);
      alert("Something went wrong while uploading");
    } finally {
      setUploadingPhoto("");
    }
  };

  const loadCoachProfile = async () => {
    const { data } = await supabase
      .from("coach_profile")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);
  
    if (data?.length > 0) {
      setCoachProfile(data[0]);
    }
  };

  const saveCoachProfile = async () => {
    try {
      setSavingProfile(true);
      setSuccessMessage("");
  
      const { error } = await supabase
        .from("coach_profile")
        .update({
          founder_one: coachProfile.founder_one,
          founder_two: coachProfile.founder_two,
          tagline: coachProfile.tagline,
          heading: coachProfile.heading,
          description: coachProfile.description,
  
          main_photo: coachProfile.main_photo,
          secondary_photo: coachProfile.secondary_photo,
  
          experience: coachProfile.experience,
          clients_coached: coachProfile.clients_coached,
  
          achievement_1_title: coachProfile.achievement_1_title,
          achievement_1_subtitle: coachProfile.achievement_1_subtitle,
  
          achievement_2_title: coachProfile.achievement_2_title,
          achievement_2_subtitle: coachProfile.achievement_2_subtitle,
  
          achievement_3_title: coachProfile.achievement_3_title,
          achievement_3_subtitle: coachProfile.achievement_3_subtitle,
  
          achievement_4_title: coachProfile.achievement_4_title,
          achievement_4_subtitle: coachProfile.achievement_4_subtitle,
  
          achievement_5_title: coachProfile.achievement_5_title,
          achievement_5_subtitle: coachProfile.achievement_5_subtitle,
  
          achievement_6_title: coachProfile.achievement_6_title,
          achievement_6_subtitle: coachProfile.achievement_6_subtitle,
        })
        .eq("id", coachProfile.id);
  
      if (error) {
        console.error(error);
        setSuccessMessage("");
        alert("Failed to save profile");
        return;
      }

      for (const photoUrl of photosToDelete) {
        await deleteCoachPhoto(photoUrl);
      }
      
      setPhotosToDelete([]);
  
      setSuccessMessage("Coach profile updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="page">
      <Header
        title="Coach Profile"
        subtitle="Manage coach information"
        onMenuClick={openSidebar}
      />

<section className="dashboard-section">
<div className="coach-cms-card">

<h2 className="coach-cms-title">
  Coach Profile Management
</h2>

{successMessage && (
  <div className="coach-success-message">
    {successMessage}
  </div>
)}

        <div style={{ maxWidth: "700px" }}>

        <div className="coach-form-group">
  <label>Founder One</label>

  <input
    type="text"
    value={coachProfile.founder_one || ""}
    onChange={(e) =>
      setCoachProfile({
        ...coachProfile,
        founder_one: e.target.value,
      })
    }
  />
</div>

<br /><br />

<div className="coach-form-group">
  <label>Founder Two</label>

  <input
    type="text"
    value={coachProfile.founder_two || ""}
    onChange={(e) =>
      setCoachProfile({
        ...coachProfile,
        founder_two: e.target.value,
      })
    }
  />
</div>

<br /><br />

<div className="coach-form-group">
  <label>Tagline</label>

  <input
    type="text"
    value={coachProfile.tagline || ""}
    onChange={(e) =>
      setCoachProfile({
        ...coachProfile,
        tagline: e.target.value,
      })
    }
  />
</div>

<div className="coach-form-group">
  <label>Heading</label>

  <input
    type="text"
    value={coachProfile.heading || ""}
    onChange={(e) =>
      setCoachProfile({
        ...coachProfile,
        heading: e.target.value,
      })
    }
  />
</div>

<br /><br />

{/* =========================================
    COACH PHOTOS
========================================= */}

<h3 className="coach-section-title">
  Coach Photos
</h3>

<div className="coach-photo-grid">

  {/* Main Photo */}
  <div className="coach-photo-card">

    <h4>Main Coach Photo</h4>

    <div className="coach-photo-preview">
      {coachProfile.main_photo ? (
        <img
          src={coachProfile.main_photo}
          alt="Main Coach"
        />
      ) : (
        <span>No photo selected</span>
      )}
    </div>

    <label className="coach-upload-btn">
    {uploadingPhoto === "main_photo"
  ? "Uploading..."
  : "Replace Main Photo"}

      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          uploadCoachPhoto(
            e.target.files?.[0],
            "main_photo"
          )
        }
      />
    </label>

  </div>


  {/* Secondary Photo */}
  <div className="coach-photo-card">

    <h4>Secondary Coach Photo</h4>

    <div className="coach-photo-preview">
      {coachProfile.secondary_photo ? (
        <img
          src={coachProfile.secondary_photo}
          alt="Secondary Coach"
        />
      ) : (
        <span>No photo selected</span>
      )}
    </div>

    <label className="coach-upload-btn">
    {uploadingPhoto === "secondary_photo"
  ? "Uploading..."
  : "Replace secondary Photo"}

      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) =>
          uploadCoachPhoto(
            e.target.files?.[0],
            "secondary_photo"
          )
        }
      />
    </label>

  </div>

</div>

<h3 className="coach-section-title">
    Basic Information
</h3>

<label>Description</label>

<textarea
  rows={5}
  value={coachProfile.description || ""}
  onChange={(e) =>
    setCoachProfile({
      ...coachProfile,
      description: e.target.value,
    })
  }
  style={{ width: "100%" }}
/>

<br /><br />

<h3 className="coach-section-title">
  Professional Stats
</h3>

<label>Experience</label>

<input
  type="text"
  value={coachProfile.experience || ""}
  onChange={(e) =>
    setCoachProfile({
      ...coachProfile,
      experience: e.target.value,
    })
  }
/>

<br /><br />

<label>Clients Coached</label>

<input
  type="text"
  value={coachProfile.clients_coached || ""}
  onChange={(e) =>
    setCoachProfile({
      ...coachProfile,
      clients_coached: e.target.value,
    })
  }
/>

<br /><br />

<h3 className="coach-section-title">
  Achievements
</h3>

{[1, 2, 3, 4, 5, 6].map((number) => (
  <div key={number} className="coach-achievement-group">

    <label>
      Achievement {number} Title
    </label>

    <input
      type="text"
      value={coachProfile[`achievement_${number}_title`] || ""}
      onChange={(e) =>
        setCoachProfile({
          ...coachProfile,
          [`achievement_${number}_title`]: e.target.value,
        })
      }
    />

    <label>
      Achievement {number} Subtitle
    </label>

    <input
      type="text"
      value={coachProfile[`achievement_${number}_subtitle`] || ""}
      onChange={(e) =>
        setCoachProfile({
          ...coachProfile,
          [`achievement_${number}_subtitle`]: e.target.value,
        })
      }
    />

    <br />
    <br />

  </div>
))}

<button
  className="coach-save-btn"
  onClick={saveCoachProfile}
  disabled={savingProfile || uploadingPhoto}
>
  {savingProfile ? "Saving..." : "Save Changes"}
</button>
</div>
</div>

      </section>
    </div>
  );
}