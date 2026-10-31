import "./ManagePrograms.css";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const IMAGE_BUCKET = "program-images";
const VIDEO_BUCKET = "website-media";

export default function ManagePrograms() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("website_programs")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Could not fetch programs:", error);
      return;
    }

    setPrograms(data || []);
  };

  const openEditor = (program) => {
    setSelectedProgram({ ...program });
    setSelectedImage(null);
    setSelectedVideo(null);
    setRemoveVideo(false);
  };

  const closeEditor = () => {
    setSelectedProgram(null);
    setSelectedImage(null);
    setSelectedVideo(null);
    setRemoveVideo(false);
  };

  const updateField = (field, value) => {
    setSelectedProgram((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveProgram = async () => {
    if (!selectedProgram || saving) return;

    setSaving(true);

    try {
      let imageUrl = selectedProgram.image_url || null;
      let videoUrl = selectedProgram.video_url || null;

      // Upload new program image
      if (selectedImage) {
        const imageName = `${Date.now()}-${selectedImage.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        )}`;

        const { error: imageError } = await supabase.storage
          .from(IMAGE_BUCKET)
          .upload(imageName, selectedImage);

        if (imageError) throw imageError;

        const { data: imageData } = supabase.storage
          .from(IMAGE_BUCKET)
          .getPublicUrl(imageName);

        imageUrl = imageData.publicUrl;
      }

      // Upload new workout video
      if (selectedVideo) {
        const videoName = `programs/${selectedProgram.id}/${Date.now()}-${selectedVideo.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        )}`;

        const { error: videoError } = await supabase.storage
          .from(VIDEO_BUCKET)
          .upload(videoName, selectedVideo);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from(VIDEO_BUCKET)
          .getPublicUrl(videoName);

        videoUrl = videoData.publicUrl;
      }

      if (removeVideo) {
        videoUrl = null;
      }

      // Save program information
      const { error } = await supabase
        .from("website_programs")
        .update({
          title: selectedProgram.title,
          short_description: selectedProgram.short_description,
          description: selectedProgram.description,
          feature1: selectedProgram.feature1,
          feature2: selectedProgram.feature2,
          feature3: selectedProgram.feature3,
          feature4: selectedProgram.feature4,
          image_url: imageUrl,
          video_url: videoUrl,
        })
        .eq("id", selectedProgram.id);

      if (error) throw error;

      await fetchPrograms();
      closeEditor();

      alert("Program updated successfully!");
    } catch (error) {
      console.error("Program update failed:", error);
      alert(error.message || "Could not update program. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="programs-admin">
      <h1>Programs Management</h1>

      <p>Total Programs: {programs.length}</p>

      {programs.map((program) => (
        <div key={program.id} className="program-card">
          <img
            src={program.image_url || ""}
            alt={program.title}
            className="program-image"
          />

          <div className="program-info">
            <h3>{program.title}</h3>
            <p>{program.short_description}</p>

            <div className="program-actions">
              <button
                className="edit-btn"
                onClick={() => openEditor(program)}
              >
                Edit Program
              </button>
            </div>
          </div>
        </div>
      ))}

      {selectedProgram && (
        <div className="edit-modal">
          <div className="edit-box">
            <h2>Edit Program</h2>

            <input
              type="text"
              value={selectedProgram.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Program Title"
            />

            <textarea
              value={selectedProgram.short_description || ""}
              onChange={(e) =>
                updateField("short_description", e.target.value)
              }
              placeholder="Short Description"
            />

            <textarea
              value={selectedProgram.description || ""}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              placeholder="Program Description"
            />

            {[1, 2, 3, 4].map((number) => (
              <input
                key={number}
                type="text"
                placeholder={`Feature ${number}`}
                value={selectedProgram[`feature${number}`] || ""}
                onChange={(e) =>
                  updateField(`feature${number}`, e.target.value)
                }
              />
            ))}

            <div className="program-media-upload">
              <h3>Program Image</h3>

              {selectedProgram.image_url && (
                <img
                  src={selectedProgram.image_url}
                  alt="Current program"
                  className="admin-media-preview"
                />
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setSelectedImage(e.target.files?.[0] || null)
                }
              />

              {selectedImage && (
                <p>Selected image: {selectedImage.name}</p>
              )}
            </div>

            <div className="program-media-upload">
              <h3>Workout Video</h3>

              {selectedVideo ? (
                <video
                  className="admin-media-preview"
                  src={URL.createObjectURL(selectedVideo)}
                  controls
                  playsInline
                />
              ) : selectedProgram.video_url && !removeVideo ? (
                <video
                  className="admin-media-preview"
                  src={selectedProgram.video_url}
                  controls
                  playsInline
                />
              ) : (
                <p className="no-video-message">
                  No workout video selected.
                </p>
              )}

              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (!file) return;

                  if (!file.type.startsWith("video/")) {
                    alert("Please select a valid video file.");
                    return;
                  }

                  setSelectedVideo(file);
                  setRemoveVideo(false);
                }}
              />

              {selectedVideo && (
                <p>New video: {selectedVideo.name}</p>
              )}

              {selectedProgram.video_url && !removeVideo && (
                <button
                  type="button"
                  className="remove-video-btn"
                  onClick={() => {
                    setSelectedVideo(null);
                    setRemoveVideo(true);
                  }}
                >
                  Remove Existing Video
                </button>
              )}

              {removeVideo && (
                <p className="no-video-message">
                  Existing video will be removed from this program when saved.
                </p>
              )}
            </div>

            <button
              className="save-btn"
              onClick={saveProgram}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              className="edit-btn"
              onClick={closeEditor}
              disabled={saving}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}