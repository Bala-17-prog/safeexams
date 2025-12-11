// client/src/hooks/useSafeExam.js
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useSafeExam = (isExamActive) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isExamActive) return;

    // Function to handle violations
    const handleViolation = (reason) => {
      alert(`VIOLATION DETECTED: ${reason}. You are being logged out.`);
      
      // 1. Clear any stored tokens (Logout)
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");

      // 2. Redirect to Login
      navigate("/login");
    };

    // 1. Detect switching tabs or minimizing window
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("You switched tabs or minimized the browser");
      }
    };

    // 2. Detect clicking outside the browser window (Blur)
    const handleWindowBlur = () => {
      handleViolation("You clicked outside the exam window");
    };

    // 3. Prevent Right Click (Context Menu)
    const preventRightClick = (e) => {
      e.preventDefault();
    };

    // 4. Attempt to block Copy/Paste
    const preventCopyPaste = (e) => {
      e.preventDefault();
      alert("Copy/Paste is disabled!");
    };

    // Add Event Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", preventRightClick);
    document.addEventListener("copy", preventCopyPaste);
    document.addEventListener("paste", preventCopyPaste);

    // Cleanup listeners when component unmounts
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", preventRightClick);
      document.removeEventListener("copy", preventCopyPaste);
      document.removeEventListener("paste", preventCopyPaste);
    };
  }, [isExamActive, navigate]);
};

export default useSafeExam;