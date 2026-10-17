import "./CoachSection.css";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CoachSection() {

  const [coachProfile, setCoachProfile] = useState(null);

  useEffect(() => {
    loadCoachProfile();
  }, []);
  
  const loadCoachProfile = async () => {
    const { data, error } = await supabase
      .from("coach_profile")
      .select("*")
      .order("id", { ascending: false })
      .limit(1);
  
    if (error) {
      console.log(error);
      return;
    }
  
    if (data?.length > 0) {
      setCoachProfile(data[0]);
    }
  };
  const achievements = [
    {
      icon: "🏆",
      title:
        coachProfile?.achievement_1_title || "International",
      subtitle:
        coachProfile?.achievement_1_subtitle || "Powerlifter",
    },
    {
      icon: "💪",
      title:
        coachProfile?.achievement_2_title || "12+ Years",
      subtitle:
        coachProfile?.achievement_2_subtitle || "Experience",
    },
    {
      icon: "🌍",
      title:
        coachProfile?.achievement_3_title || "Specialist",
      subtitle:
        coachProfile?.achievement_3_subtitle || "Women Fitness",
    },
    {
      icon: "❤️",
      title:
        coachProfile?.achievement_4_title || "1000+",
      subtitle:
        coachProfile?.achievement_4_subtitle || "Women Coached",
    },
    {
      icon: "🥇",
      title:
        coachProfile?.achievement_5_title || "Gold's Gym",
      subtitle:
        coachProfile?.achievement_5_subtitle || "Certified",
    },
    {
      icon: "🧘",
      title:
        coachProfile?.achievement_6_title || "Yoga",
      subtitle:
        coachProfile?.achievement_6_subtitle || "Certified",
    },
  ];
  return (
    <section className="coach-section">

<div className="founder-signature">

<p className="founder-label">
  FOUNDED BY
</p>

<h3 className="founder-names">

<span>
  {coachProfile?.founder_one || "HEENA PERVIN"}
</span>

<span className="divider">&</span>

<span>
  {coachProfile?.founder_two || "MANISH B."}
</span>

</h3>

<p className="founder-tagline">

  Transforming Lives Through

  <br />

  <strong>
  {coachProfile?.tagline ||
    "Science • Strength • Consistency"}
</strong>

</p>

</div>

      <div className="coach-wrapper">

        {/* LEFT */}

        <div className="coach-left">

          <div className="coach-images">

          <img
  src={coachProfile?.main_photo || "/coach.png"}
  alt="Founder"
  className="main-photo"
/>

<img
  src={coachProfile?.secondary_photo || "/coach2.jpeg"}
  alt="Coaching"
  className="floating-photo"
/>

          </div>

        </div>

        {/* RIGHT */}

        <div className="coach-right">

         

          <h2>
  {coachProfile?.heading ||
    "Your Transformation Starts Here."}
</h2>
<p className="coach-description">
  {coachProfile?.description ||
    "Every woman deserves to feel stronger, healthier and more confident."}
</p>

          <div className="achievement-grid">

            {achievements.map((item, index) => (

              <div
                className="achievement-card"
                key={index}
              >

                <div className="icon">

                  {item.icon}

                </div>

                <h4>{item.title}</h4>

                <span>{item.subtitle}</span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}