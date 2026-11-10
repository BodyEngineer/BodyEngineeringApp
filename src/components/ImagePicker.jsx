import { useRef } from "react";

export default function ImagePicker({
  label,
  image,
  setImage,
}) {
  const inputRef = useRef(null);

  return (
    <div className="image-picker">
      <h3>{label}</h3>

      <div className="image-preview">
        {image ? (
          <img
            src={
              image instanceof File
                ? URL.createObjectURL(image)
                : image
            }
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
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];

          if (file) {
            setImage(file);
          }

          e.target.value = "";
        }}
      />

      <button
        type="button"
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        📷 Camera / Gallery
      </button>

      {image && (
        <button
          type="button"
          className="remove-btn"
          onClick={() => {
            setImage(null);
            if (inputRef.current) {
              inputRef.current.value = "";
            }
          }}
        >
          ❌ Remove
        </button>
      )}
    </div>
  );
}