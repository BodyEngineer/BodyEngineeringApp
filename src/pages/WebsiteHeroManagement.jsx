import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function WebsiteHeroManagement() {

  const [hero, setHero] = useState({
    heading: "",
    subheading: "",
    description: "",
    button_text: "",
    image_url: ""
  });

  useEffect(() => {
    fetchHero();
  }, []);
  
  const fetchHero = async () => {
    const { data, error } = await supabase
      .from("website_hero")
      .select("*")
      .single();
  
      if (error) {
        console.log("ERROR:", error);
      }
      
      if (data) {
        console.log("DATA:", data);
        setHero(data);
      }
  };

  const saveHero = async () => {
    const { error } = await supabase
      .from("website_hero")
      .update({
        heading: hero.heading,
        subheading: hero.subheading,
        description: hero.description,
        button_text: hero.button_text,
      })
      .eq("id", hero.id);
  
    if (error) {
      alert("Failed to save");
      console.log(error);
    } else {
      alert("Hero updated successfully");
    }
  };

  return (
    <div style={{padding:"40px", color:"white"}}>
      <h1>Hero Management</h1>

      <input
        value={hero.heading}
        onChange={(e)=>
          setHero({...hero, heading:e.target.value})
        }
        placeholder="Heading"
      />

<input
  value={hero.subheading || ""}
  onChange={(e) =>
    setHero({ ...hero, subheading: e.target.value })
  }
  placeholder="Subheading"
/>

<textarea
  value={hero.description || ""}
  onChange={(e) =>
    setHero({ ...hero, description: e.target.value })
  }
  placeholder="Description"
/>

<input
  value={hero.button_text || ""}
  onChange={(e) =>
    setHero({ ...hero, button_text: e.target.value })
  }
  placeholder="Button Text"
/>

<button onClick={saveHero}>
  Save Hero Content
</button>
    </div>
  );
}