import "./ManagePrograms.css";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";



export default function ManagePrograms() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const saveProgram = async () => {

    let imageUrl = selectedProgram.image_url;

if (selectedImage) {
  const fileName = `${Date.now()}-${selectedImage.name}`;

  const { error: uploadError } = await supabase.storage
    .from("program-images")
    .upload(fileName, selectedImage);

  if (uploadError) {
    alert("Image upload failed");
    return;
  }

  const { data } = supabase.storage
    .from("program-images")
    .getPublicUrl(fileName);

  imageUrl = data.publicUrl;
}
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
      })
      .eq("id", selectedProgram.id);
  
    if (!error) {
      fetchPrograms();
      setSelectedProgram(null);
      alert("Program updated successfully!");
    } else {
      console.log(error);
    }
  };

  const fetchPrograms = async () => {
    const { data, error } = await supabase
      .from("website_programs")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error) {
      setPrograms(data || []);
    } else {
      console.log(error);
    }
  };

  

  return (
    <div className="programs-admin">
      <h1>Programs Management</h1>

      <p>Total Programs: {programs.length}</p>

      {programs.map((program) => (
        <div key={program.id} className="program-card">

        <img
          src={program.image_url}
          alt={program.title}
          className="program-image"
        />
      
        <div className="program-info">
      
          <h3>{program.title}</h3>
      
          <p>{program.short_description}</p>
      
          <div className="program-actions">
      
          <button
  className="edit-btn"
  onClick={() => setSelectedProgram(program)}
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

      <h2>{selectedProgram.title}</h2>

      <button
        onClick={() => setSelectedProgram(null)}
      >
        Close
      </button>

    </div>
  </div>
)}

{selectedProgram && (
  <div className="edit-modal">
    <div className="edit-box">

      <h2>Edit Program</h2>

      <input
        type="text"
        value={selectedProgram.title}
        onChange={(e) =>
          setSelectedProgram({
            ...selectedProgram,
            title: e.target.value,
          })
        }
      />

      <textarea
        value={selectedProgram.short_description}
        onChange={(e) =>
          setSelectedProgram({
            ...selectedProgram,
            short_description: e.target.value,
          })
        }
      />

<textarea
  value={selectedProgram.description || ""}
  onChange={(e) =>
    setSelectedProgram({
      ...selectedProgram,
      description: e.target.value,
    })
  }
/>

<input
  type="text"
  placeholder="Feature 1"
  value={selectedProgram.feature1 || ""}
  onChange={(e) =>
    setSelectedProgram({
      ...selectedProgram,
      feature1: e.target.value,
    })
  }
/>

<input
  type="text"
  placeholder="Feature 2"
  value={selectedProgram.feature2 || ""}
  onChange={(e) =>
    setSelectedProgram({
      ...selectedProgram,
      feature2: e.target.value,
    })
  }
/>

<input
  type="text"
  placeholder="Feature 3"
  value={selectedProgram.feature3 || ""}
  onChange={(e) =>
    setSelectedProgram({
      ...selectedProgram,
      feature3: e.target.value,
    })
  }
/>

<input
  type="text"
  placeholder="Feature 4"
  value={selectedProgram.feature4 || ""}
  onChange={(e) =>
    setSelectedProgram({
      ...selectedProgram,
      feature4: e.target.value,
    })
  }
/>

<input
  type="file"
  accept="image/*"
  onChange={(e) => setSelectedImage(e.target.files[0])}
/>

<button
  className="save-btn"
  onClick={saveProgram}
>
  Save Changes
</button>

      <button
      className="edit-btn"
        onClick={() => setSelectedProgram(null)}
      >
        Close
      </button>

    </div>
  </div>
)}
    </div>
  );
}
