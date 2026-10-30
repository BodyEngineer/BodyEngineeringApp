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

      // Give React time to render the scanner container
      await new Promise((resolve) => setTimeout(resolve, 300));

      const scanner = new Html5Qrcode("attendance-qr-reader");

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },

        {
          fps: 15,

          // IMPORTANT:
          // No qrbox.
          // The entire camera view can now detect the QR.
          disableFlip: false,
        },

        async (decodedText) => {
          console.log("QR SCANNED:", decodedText);

          // Prevent multiple detections
          if (!scannerRef.current) return;

          setMessage("QR detected. Verifying...");

          await stopScanner();

          await verifyQRCode(decodedText);
        },

        (errorMessage) => {
          // Normal scanning errors are ignored.
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

      const scannedValue = qrValue.trim();

      console.log("=================================");
      console.log("QR VALUE SCANNED:", scannedValue);
      console.log("=================================");

      let scannedUrl;

      try {
        scannedUrl = new URL(scannedValue);
      } catch (err) {
        console.error("QR is not a valid URL:", scannedValue);

        setError(
          `❌ Invalid QR format.\nScanned: ${scannedValue}`
        );

        return;
      }

      console.log("QR HOST:", scannedUrl.hostname);
      console.log("QR PATH:", scannedUrl.pathname);

      /*
       * Normalize the path.
       *
       * These will all be accepted:
       *
       * /member-attendance
       * /member-attendance/
       * /member-attendance?anything
       */

      const scannedPath =
        scannedUrl.pathname.replace(/\/+$/, "");

      const expectedPath = "/member-attendance";

      if (scannedPath !== expectedPath) {
        setError(
          `❌ Invalid QR code.\nScanned path: ${scannedUrl.pathname}`
        );

        return;
      }

      /*
       * QR is valid.
       */

      setMessage("✅ QR detected. Recording attendance...");

      /*
       * Check if member is already checked in.
       */
      const { data: existingSessions, error: existingError } =
      await supabase
        .from("attendance")
        .select("*")
        .eq("member_id", member.id)
        .is("check_out", null)
        .order("check_in", { ascending: false })
        .limit(1);

    if (existingError) {
      throw existingError;
    }

    const existingSession = existingSessions?.[0] || null;

    if (existingSession) {
        const checkOutTime = new Date().toISOString();

        const { error: checkoutError } = await supabase
          .from("attendance")
          .update({
            check_out: checkOutTime,
          })
          .eq("id", existingSession.id);

        if (checkoutError) {
          console.error("CHECKOUT UPDATE ERROR:", checkoutError);
          throw checkoutError;
        }

        console.log(
          "CHECKOUT SAVED SUCCESSFULLY:",
          existingSession.id,
          checkOutTime
        );

        const checkInTime = new Date(existingSession.check_in);
        const checkOut = new Date(checkOutTime);

        const durationMinutes = Math.floor(
          (checkOut - checkInTime) / 60000
        );

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        const durationText =
          hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes}m`;

        setMessage(
          `✅ Check-out successful! Gym duration: ${durationText}`
        );

        return;
      }

      /*
       * Create attendance record.
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
    background: "#000",
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