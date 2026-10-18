import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../lib/supabase";

export default function MemberAttendance() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [member, setMember] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const scannerRef = useRef(null);

  useEffect(() => {
    loadMember();

    return () => {
      stopScanner();
    };
  }, []);

  async function loadMember() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        navigate("/member-login");
        return;
      }

      const { data: memberData, error: memberError } =
        await supabase
          .from("members")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

      if (memberError) {
        throw memberError;
      }

      if (!memberData) {
        setError("Your member account could not be found.");
        return;
      }

      setMember(memberData);
    } catch (err) {
      console.error("Attendance member error:", err);

      setError(
        err.message ||
          "Unable to load your attendance information."
      );
    } finally {
      setLoading(false);
    }
  }

  async function startScanner() {
    setError("");
    setMessage("");
  
    if (!member) return;
  
    try {
      setScanning(true);
  
      // Wait for the scanner container to appear in the DOM
      await new Promise((resolve) => setTimeout(resolve, 500));
  
      const scanner = new Html5Qrcode("attendance-qr-reader");
  
      scannerRef.current = scanner;
  
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
  
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.min(
              viewfinderWidth,
              viewfinderHeight,
              280
            );
  
            return {
              width: size,
              height: size,
            };
          },
  
          aspectRatio: 1.0,
          disableFlip: false,
        },
  
        async (decodedText) => {
          console.log("QR SCANNED:", decodedText);
  
          setMessage("QR detected. Verifying...");
  
          await stopScanner();
  
          await verifyQRCode(decodedText);
        },
  
        (errorMessage) => {
          // Normal QR detection errors are ignored.
          // Scanner continues looking for the QR.
        }
      );
  
      console.log("Camera scanner started successfully");
  
    } catch (err) {
      console.error("CAMERA ERROR:", err);
  
      setScanning(false);
  
      setError(
        `${err.name || "CameraError"}: ${
          err.message || "Unable to open camera."
        }`
      );
    }
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();

        if (state === 2) {
          await scannerRef.current.stop();
        }

        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.error("Scanner stop error:", err);
    }

    setScanning(false);
  }

  async function verifyQRCode(qrValue) {
    if (!member) return;

    try {
      setError("");
      setMessage("");

      /*
       * The owner's QR currently contains the member-attendance URL.
       *
       * We verify that the scanned QR is actually the gym
       * attendance QR before allowing attendance.
       */

      const scannedUrl = qrValue.trim();

console.log("QR VALUE:", scannedUrl);

try {
  const url = new URL(scannedUrl);

  if (url.pathname !== "/member-attendance") {
    setError(
      "❌ Invalid QR code. Please scan the attendance QR displayed by the gym."
    );
    return;
  }
} catch (err) {
  console.error("QR URL error:", err);

  setError(
    "❌ Invalid QR code. Please scan the attendance QR displayed by the gym."
  );
  return;
}

      /*
       * Check if member is already checked in.
       */

      const { data: existingSession, error: existingError } =
        await supabase
          .from("attendance")
          .select("*")
          .eq("member_id", member.id)
          .is("check_out", null)
          .order("check_in", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingSession) {
        setMessage("✅ You are already checked in.");
        return;
      }

      /*
       * Create attendance record only after
       * successful QR verification.
       */

      const { error: insertError } =
        await supabase
          .from("attendance")
          .insert({
            owner_id: member.owner_id,
            member_id: member.id,
            check_in: new Date().toISOString(),
          });

      if (insertError) {
        throw insertError;
      }

      setMessage(
        "✅ Attendance recorded successfully!"
      );
    } catch (err) {
      console.error("QR attendance error:", err);

      setError(
        err.message ||
          "Unable to record attendance."
      );
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            background: "#111",
            border: "1px solid #333",
            borderRadius: "20px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            📱
          </div>

          <h1>Gym Attendance</h1>

          {member && (
            <p
              style={{
                fontSize: "18px",
                marginTop: "10px",
              }}
            >
              Welcome, <strong>{member.full_name}</strong>
            </p>
          )}

          {error && (
            <div
              className="alert alert-error"
              style={{ marginTop: "20px" }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="alert alert-success"
              style={{ marginTop: "20px" }}
            >
              {message}
            </div>
          )}

          {!message && (
            <>
              {!scanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  style={{
                    width: "100%",
                    marginTop: "25px",
                    padding: "15px",
                    border: "none",
                    borderRadius: "12px",
                    background: "#ff4438",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  📷 Scan Gym Attendance QR
                </button>
              ) : (
                <>
                  <div
                    id="attendance-qr-reader"
                    style={{
                      width: "100%",
                      marginTop: "25px",
                      borderRadius: "15px",
                      overflow: "hidden",
                    }}
                  />

                  <button
                    type="button"
                    onClick={stopScanner}
                    style={{
                      width: "100%",
                      marginTop: "15px",
                      padding: "14px",
                      border: "none",
                      borderRadius: "12px",
                      background: "#555",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Cancel Scan
                  </button>
                </>
              )}
            </>
          )}

          {message && (
            <button
              type="button"
              onClick={() => navigate("/member-dashboard")}
              style={{
                width: "100%",
                marginTop: "25px",
                padding: "15px",
                border: "none",
                borderRadius: "12px",
                background: "#555",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ← Back to Dashboard
            </button>
          )}

          <p
            style={{
              marginTop: "20px",
              fontSize: "13px",
              opacity: 0.6,
            }}
          >
            Body Engineering Female Fitness Studio
          </p>
        </div>
      </div>
    </div>
  );
}