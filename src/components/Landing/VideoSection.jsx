import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./VideoSection.css";

const BUCKET_NAME = "website-media";

export default function VideoSection() {
  const [heroVideoUrl, setHeroVideoUrl] = useState(
    "/body-engineering.mp4"
  );

  const [heroContent, setHeroContent] = useState({
    heading: "TRAIN. TRANSFORM. BECOME.",
    subheading: "Premium Women's Fitness Studio",
    description:
      "More than a workout. Build strength, discipline and a body engineered for your goals.",
    button_text: "Book Consultation",
  });

  useEffect(() => {
    const loadHeroVideo = async () => {
      try {
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .list("hero", {
            limit: 20,
            sortBy: {
              column: "updated_at",
              order: "desc",
            },
          });

        if (error) {
          console.error("Could not load hero video:", error);
          return;
        }

        const heroFile = data?.find((file) =>
          file.name.startsWith("hero-video.")
        );

        if (heroFile) {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(`hero/${heroFile.name}`);

          if (publicUrlData?.publicUrl) {
            setHeroVideoUrl(
              `${publicUrlData.publicUrl}?v=${heroFile.updated_at || Date.now()}`
            );
          }
        }
      } catch (error) {
        console.error("Error loading hero video:", error);
      }
    };

    const loadHeroContent = async () => {
      try {
        const { data, error } = await supabase
          .from("website_hero")
          .select("*")
          .single();

        if (error) {
          console.error("Could not load hero content:", error);
          return;
        }

        if (data) {
          setHeroContent({
            heading: data.heading || "TRAIN. TRANSFORM. BECOME.",
            subheading:
              data.subheading || "Premium Women's Fitness Studio",
            description:
              data.description ||
              "More than a workout. Build strength, discipline and a body engineered for your goals.",
            button_text: data.button_text || "Book Consultation",
          });
        }
      } catch (error) {
        console.error("Error loading hero content:", error);
      }
    };

    loadHeroVideo();
    loadHeroContent();
  }, []);

  const handleVideoReady = (event) => {
    const video = event.currentTarget;

    video.muted = true;
    video.defaultMuted = true;

    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.log("Video autoplay could not start:", error);
      });
    }
  };

  const handleConsultationClick = () => {
    const section = document.getElementById("consultation");

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className="cinematic-video-section">
      <div className="cinematic-video-wrap">
        <video
          key={heroVideoUrl}
          className="cinematic-video"
          autoPlay
          muted
          defaultMuted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          onLoadedMetadata={handleVideoReady}
          onCanPlay={handleVideoReady}
        >
          <source src={heroVideoUrl} type="video/mp4" />
        </video>

        <div className="cinematic-video-overlay" />

        <div className="cinematic-video-content">
          <span className="cinematic-eyebrow">
            {heroContent.subheading}
          </span>

          <h2>{heroContent.heading}</h2>

          <p>{heroContent.description}</p>

          <button
            className="hero-cta-btn"
            onClick={handleConsultationClick}
          >
            {heroContent.button_text}
          </button>
        </div>
      </div>
    </section>
  );
}