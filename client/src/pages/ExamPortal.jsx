import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ExamPortal = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();
  
  const currentUser = localStorage.getItem("username");

  // --- SECURITY ---
  const handleViolation = async () => {
    if (isSubmittingRef.current) return;
    try {
      await axios.post("http://localhost:5000/api/users/block", { username: currentUser });
      alert("⛔ SECURITY VIOLATION: Tab Switch Detected.\nYour account is BLOCKED.");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err) { localStorage.clear(); window.location.href = "/login"; }
  };

  useEffect(() => {
    if (!examStarted) return;
    const handleVis = () => { if (document.hidden) handleViolation(); };
    const handleBlur = () => { handleViolation(); };
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVis);
      window.removeEventListener("blur", handleBlur);
    };
  }, [examStarted]);

  // --- FETCHING ---
  const fetchQuestions = async () => {
    if (!selectedDomain) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/questions/student-fetch?domain=${selectedDomain.trim()}`);
      if (res.data.active) setQuestions(res.data.questions);
      else {
        setQuestions([]);
        if (examStarted) { alert("Exam Ended by Admin"); setExamStarted(false); }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 5000);
    return () => clearInterval(interval);
  }, [selectedDomain]);

  const handleStartExam = () => {
    if (!currentUser) return navigate("/login");
    setExamStarted(true);
    document.documentElement.requestFullscreen().catch(()=>{});
  };

  const handleAnswerChange = (qId, val) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const handleSubmitExam = async () => {
    isSubmittingRef.current = true;
    setTimeout(async () => {
      if (!window.confirm("Submit Exam?")) { isSubmittingRef.current = false; return; }
      try {
        await axios.post("http://localhost:5000/api/results/submit", {
          username: currentUser,
          domain: selectedDomain,
          answers,
          violationCount: 0
        });
        alert("✅ Submitted Successfully!");
        if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
        navigate("/login");
      } catch (err) { alert("Error submitting"); isSubmittingRef.current = false; }
    }, 200);
  };

  // --- RENDER INPUT BASED ON TYPE (FIXED) ---
  const renderInput = (q) => {
    // 1. MCQ
    if (q.type === 'mcq' && q.options && q.options.length > 0) {
      return (
        <div style={{display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px"}}>
          {q.options.map((opt, i) => (
            <label key={i} style={{background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px"}}>
              <input 
                type="radio" 
                name={`q_${q._id}`} 
                value={opt} 
                onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                checked={answers[q._id] === opt}
              />
              <span style={{color: "#ddd"}}>{opt}</span>
            </label>
          ))}
        </div>
      );
    } 
    // 2. CODE SNIPPET
    else if (q.type === 'code_snippet') {
      return (
        <div>
          <pre style={{background: "#111", padding: "15px", borderRadius: "5px", color: "#00f2ff", overflowX: "auto", fontFamily: "monospace", border: "1px solid #333", marginBottom: "10px"}}>
            <code>{q.codeSnippet}</code>
          </pre>
          <textarea rows="3" placeholder="Explain or complete code..." style={glassInput} onChange={(e) => handleAnswerChange(q._id, e.target.value)} />
        </div>
      );
    }
    // 3. TEXT (Fillups/Descriptive)
    else {
      return (
        <textarea rows="4" placeholder="Type your answer here..." style={glassInput} onChange={(e) => handleAnswerChange(q._id, e.target.value)} />
      );
    }
  };

  const glassInput = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "15px", borderRadius: "10px", width: "100%", fontSize: "1rem", outline: "none" };
  const optionStyle = { background: "#050505", color: "white" };

  return (
    <div style={{ padding: "40px", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: examStarted ? "flex-start" : "center" }}>
      {!examStarted ? (
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <h1 style={{ color: "#00f2ff", marginBottom: "10px" }}>WELCOME, {currentUser}</h1>
          <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} style={{ ...glassInput, cursor: "pointer", marginBottom: "30px" }}>
            <option style={optionStyle} value="">-- Select Domain --</option>
            <option style={optionStyle} value="Fullstack developer">Fullstack developer</option>
            <option style={optionStyle} value="IOT Engineer">IOT Engineer</option>
            <option style={optionStyle} value="UI/UX Designer">UI/UX Designer</option>
            <option style={optionStyle} value="Game developer">Game developer</option>
            <option style={optionStyle} value="3D designer">3D designer</option>
            <option style={optionStyle} value="App Developer">App Developer</option>
          </select>
          {selectedDomain && (
             <div style={{marginBottom: "20px", color: questions.length > 0 ? "#00f2ff" : "#ff0055"}}>
                {questions.length > 0 ? "✅ Exam is LIVE." : "⏳ Waiting for Admin..."}
             </div>
          )}
          <button disabled={questions.length === 0} onClick={handleStartExam} className="neon-btn" style={{ width: "100%", opacity: questions.length > 0 ? 1 : 0.5 }}>START EXAM</button>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: "40px", maxWidth: "800px", width: "100%" }}>
          <h2 style={{ color: "#00f2ff", marginBottom: "20px" }}>{selectedDomain}</h2>
          
          {/* Group by Sections */}
          {['1', '2', '3'].map(sec => {
            const secQuestions = questions.filter(q => q.section === sec);
            if(secQuestions.length === 0) return null;
            return (
              <div key={sec} style={{marginBottom: "30px"}}>
                <h3 style={{color: "#ff0055", borderBottom: "1px solid #333", paddingBottom: "10px", marginBottom: "15px"}}>
                  SECTION {sec}: {sec==='1'?'MCQ':sec==='2'?'TECHNICAL':'DESCRIPTIVE'}
                </h3>
                {secQuestions.map((q, i) => (
                  <div key={q._id} style={{ marginBottom: "30px" }}>
                    <h4 style={{ color: "white", marginBottom: "10px" }}>Q: {q.questionText}</h4>
                    {renderInput(q)}
                  </div>
                ))}
              </div>
            )
          })}
          
          <button onClick={handleSubmitExam} className="neon-btn" style={{ width: "100%" }}>SUBMIT</button>
        </div>
      )}
    </div>
  );
};

export default ExamPortal;