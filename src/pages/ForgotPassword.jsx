import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin + "/reset-password",
      }
    );

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Password reset link sent to your email."
      );
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <form
  onSubmit={handleReset}
  style={{
    maxWidth: "400px",
    margin: "100px auto",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  }}
>
        <h2>Forgot Password</h2>

        <input
  style={{
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #444",
  }}
          type="email"
          placeholder="Enter Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

<button
  type="submit"
  style={{
    background: "#ff4438",
    color: "#fff",
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    marginTop: "15px",
    display: "block",
    cursor: "pointer",
  }}
>
          {loading
            ? "Sending..."
            : "Send Reset Link"}
        </button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}