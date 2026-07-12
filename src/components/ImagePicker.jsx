import { useRef } from "react";

export default function ImagePicker({
  label,
  image,
  setImage,
}) {
  const inputRef = useRef();

  return (
    <div className="image-picker">
  
      <h3>{label}</h3>
  
      <div className="image-preview">
  
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt={label}
            className="progress-photo"
          />
        ) : (
          <div className="image-placeholder">
            📷
            <br />
            No Image Selected
          </div>
        )}
  
      </div>
  
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          if (e.target.files[0]) {
            setImage(e.target.files[0]);
          }
        }}
      />
  
      <button
        type="button"
        className="upload-btn"
        onClick={() => inputRef.current.click()}
      >
        📷 Camera / Gallery
      </button>
  
      {image && (
        <button
          type="button"
          className="remove-btn"
          onClick={() => setImage(null)}
        >
          ❌ Remove
        </button>
      )}
  
    </div>
  );
}