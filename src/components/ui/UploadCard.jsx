export default function UploadCard({
    title,
    preview,
    onChange,
  }) {
    return (
      <label className="upload-card">
  
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="upload-preview"
          />
        ) : (
          <div className="upload-placeholder">
  
            <div className="upload-icon">
              📷
            </div>
  
            <h3>{title}</h3>
  
            <p>Tap to Upload</p>
  
          </div>
        )}
  
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={onChange}
        />
  
      </label>
    );
  }