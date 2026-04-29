"use client";

import React from "react";

export default function LoginPage() {

  const handleGoogleLogin = () => {
    window.location.href =
      "https://codepulse-backend-ktl0.onrender.com/oauth2/authorization/google";
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      gap: "20px"
    }}>
      
      <h1>Login to CodePulse</h1>

      {/* Normal Login (optional) */}
      <input type="text" placeholder="Email" />
      <input type="password" placeholder="Password" />

      <button style={{
        padding: "10px 20px",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "5px"
      }}>
        Sign In
      </button>

      <p>OR</p>

      {/* 🔥 GOOGLE LOGIN BUTTON */}
      <button
        onClick={handleGoogleLogin}
        style={{
          padding: "10px 20px",
          background: "#db4437",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        Sign in with Google
      </button>

    </div>
  );
}