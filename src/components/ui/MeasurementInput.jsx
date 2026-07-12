export default function MeasurementInput({
    label,
    name,
    value,
    onChange,
    unit = "cm",
  }) {
    return (
      <div className="measurement-input">
  
        <label>{label}</label>
  
        <div className="measurement-field">
  
          <input
            type="number"
            name={name}
            value={value}
            onChange={onChange}
            placeholder="0"
          />
  
          <span>{unit}</span>
  
        </div>
  
      </div>
    );
  }