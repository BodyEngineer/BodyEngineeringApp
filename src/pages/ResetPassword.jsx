import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdatePassword = async (
    e
  ) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage(
        "Passwords do not match."
      );
      return;
    }

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
        if (
            error.message.includes("Auth session missing")
          ) {
            setMessage(
              "This password reset link has expired. Please request a new reset link."
            );
          } else {
            setMessage(error.message);
          };
    } else {
      setMessage(
        "Password updated successfully."
      );

      setTimeout(() => {
        navigate("/member-login");
      }, 1500);
    }
  };

  return (
    <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background:
        "linear-gradient(135deg,#080808,#121212)",
      padding: "20px",
    }}
  >
      <form
  style={{
    width: "100%",
    maxWidth: "450px",
    background: "#111",
    padding: "35px",
    borderRadius: "20px",
    border: "1px solid rgba(255,68,56,.25)",
    boxShadow:
      "0 20px 50px rgba(0,0,0,.5)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  }}
        onSubmit={handleUpdatePassword}
      >
       <>
  <h2
    style={{
      color: "#fff",
      margin: 0,
      textAlign: "center",
    }}
  >
    Reset Password
  </h2>

  <p
    style={{
      color: "#888",
      textAlign: "center",
      marginTop: "-5px",
    }}
  >
    Create your new secure password
  </p>
</>

        <div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="New Password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #333",
      background: "#111",
      color: "#fff",
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    style={{
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#ff4438",
    }}
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>


<div style={{ position: "relative" }}>
  <input
    type={showConfirmPassword ? "text" : "password"}
    placeholder="Confirm Password"
    value={confirmPassword}
    onChange={(e) =>
      setConfirmPassword(e.target.value)
    }
    required
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "10px",
      border: "1px solid #333",
      background: "#111",
      color: "#fff",
    }}
  />

  <button
    type="button"
    onClick={() =>
      setShowConfirmPassword(
        !showConfirmPassword
      )
    }
    style={{
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#ff4438",
    }}
  >
    {showConfirmPassword
      ? <EyeOff size={18} />
      : <Eye size={18} />}
  </button>
</div>

<button
  type="submit"
  style={{
    background: "#ff4438",
    color: "#fff",
    padding: "12px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "10px",
  }}
>
  Update Password
</button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}