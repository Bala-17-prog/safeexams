import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from "recharts";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("questions");
  
  // --- DATA STATE ---
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  
  // --- QUESTION FORM STATE ---
  const [domain, setDomain] = useState("Fullstack developer");
  const [session, setSession] = useState("1");
  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState("mcq");
  const [section, setSection] = useState("1");
  
  // Dynamic Fields
  const [options, setOptions] = useState(["", "", "", ""]);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(""); 
  
  const [editingId, setEditingId] = useState(null);

  // --- EXAM CONTROL STATE ---
  const [controlDomain, setControlDomain] = useState("Fullstack developer");
  const [controlSession, setControlSession] = useState("1");
  const [selectedResult, setSelectedResult] = useState(null);

  // --- NEW: FILTER STATE FOR QUESTION BANK ---
  const [filterDomain, setFilterDomain] = useState("All");

  const navigate = useNavigate();

  // --- 1. DATA LOADING ---
  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    try {
      const resResults = await axios.get("http://localhost:5000/api/results/all");
      const resQuestions = await axios.get("http://localhost:5000/api/questions/all-admin");
      const resBlocked = await axios.get("http://localhost:5000/api/users/blocked");
      setResults(resResults.data);
      setQuestions(resQuestions.data);
      setBlockedUsers(resBlocked.data);
    } catch (err) { console.error("Data Fetch Error:", err); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };

  // Auto-set section based on type
  useEffect(() => {
    if (type === "mcq") setSection("1");
    else if (type === "fill_ups" || type === "code_snippet") setSection("2");
    else setSection("3");
  }, [type]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // --- 2. SAVE QUESTION ---
  const handleSaveQuestion = async (e) => {
    e.preventDefault();

    if (!questionText.trim()) return alert("⚠️ Error: Question Text cannot be empty.");

    if (type === 'mcq') {
      if (options.some(opt => opt.trim() === "")) return alert("⚠️ Error: Please fill in all 4 Options for MCQ.");
      if (!correctAnswer) return alert("⚠️ Error: You must select a Correct Answer from the dropdown.");
    }

    if (type === 'code_snippet' && !codeSnippet.trim()) return alert("⚠️ Error: Please paste the code snippet.");

    try {
      const payload = { 
        questionText, domain, session, type, section, 
        options: type === 'mcq' ? options : [],
        codeSnippet: type === 'code_snippet' ? codeSnippet : "",
        correctAnswer: type === 'mcq' ? correctAnswer : ""
      };
      
      if (editingId) {
        await axios.put(`http://localhost:5000/api/questions/${editingId}`, payload);
        alert("✅ Question Updated Successfully!");
        setEditingId(null);
      } else {
        await axios.post("http://localhost:5000/api/questions/add", payload);
        alert("✅ Question Added Successfully!");
      }
      
      setQuestionText(""); setOptions(["", "", "", ""]); setCodeSnippet(""); setCorrectAnswer(""); 
      fetchData(); 
    } catch (err) { alert("❌ Server Error: Could not save question."); }
  };

  // --- 3. DANGER ZONE ---
  const handleClearDatabase = async (target) => {
    const confirmation = prompt(`⚠️ DANGER ZONE ⚠️\n\nType "DELETE" to confirm clearing ${target.toUpperCase()}.`);
    if (confirmation !== "DELETE") return alert("❌ Cancelled.");

    try {
      await axios.delete(`http://localhost:5000/api/questions/reset-database?target=${target}`);
      alert(`✅ SUCCESS: ${target.toUpperCase()} Cleared.`);
      fetchData(); 
    } catch (err) { alert("Error clearing database."); }
  };

  // --- 4. OTHER ACTIONS ---
  const handleDeleteQuestion = async (id) => {
    if(window.confirm("Delete this question?")) { await axios.delete(`http://localhost:5000/api/questions/${id}`); fetchData(); }
  };

  const startEditing = (q) => { 
    setEditingId(q._id); setQuestionText(q.questionText); setDomain(q.domain); setSession(q.session);
    setType(q.type || "descriptive"); 
    setOptions(q.options && q.options.length === 4 ? q.options : ["", "", "", ""]);
    setCodeSnippet(q.codeSnippet || "");
    setCorrectAnswer(q.correctAnswer || ""); 
    window.scrollTo({top:0, behavior:'smooth'}); 
  };

  const handleActivateExam = async () => { try { await axios.post("http://localhost:5000/api/questions/activate", { domain: controlDomain, session: controlSession, isActive: true }); alert("✅ EXAM STARTED!"); } catch (err) { alert("Error"); } };
  const handleStopExam = async () => { try { await axios.post("http://localhost:5000/api/questions/activate", { domain: controlDomain, session: controlSession, isActive: false }); alert("🛑 EXAM STOPPED."); } catch (err) { alert("Error"); } };
  const handleUnblockUser = async (id) => { if(window.confirm("Unblock this user?")) { await axios.post("http://localhost:5000/api/users/unblock", { userId: id }); fetchData(); alert("✅ Unblocked!"); } };
  
  // Helpers
  const getQuestionText = (id) => questions.find(q => q._id === id)?.questionText || "Unknown Question";
  const passed = results.filter(r => r.status === "Pass").length;
  const failed = results.filter(r => r.status === "Fail").length;
  const pieData = [{ name: "Pass", value: passed, color: "#00f2ff" }, { name: "Fail", value: failed, color: "#ff0055" }];

  // DOMAIN OPTIONS COMPONENT
  const DomainOptions = () => (
    <>
      <option value="Fullstack developer">Fullstack developer</option>
      <option value="IOT Engineer">IOT Engineer</option>
      <option value="UI/UX Designer">UI/UX Designer</option>
      <option value="Game developer">Game developer</option>
      <option value="3D designer">3D designer</option>
      <option value="App Developer">App Developer</option>
    </>
  );

  // --- FILTER LOGIC ---
  const filteredQuestions = questions.filter(q => 
    filterDomain === "All" ? true : q.domain === filterDomain
  );

  // Styles
  const glassPanel = { background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "15px", padding: "20px", marginBottom: "20px" };
  const inputStyle = { width: "100%", padding: "12px", background: "#050505", border: "1px solid #333", color: "white", borderRadius: "8px", marginBottom: "10px", outline: "none" };
  const tabStyle = (isActive, color="#00f2ff") => ({ padding: "10px 20px", cursor: "pointer", borderBottom: isActive ? `2px solid ${color}` : "none", color: isActive ? color : "#888" });

  return (
    <div style={{ padding: "40px", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <h1 style={{ color: "white" }}>ADMIN.DASHBOARD</h1>
        <button onClick={handleLogout} className="neon-btn" style={{borderColor: "#ff0055", color: "#ff0055"}}>LOGOUT</button>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", borderBottom: "1px solid #333" }}>
        <div onClick={() => setActiveTab("questions")} style={tabStyle(activeTab === "questions")}>MANAGE QUESTIONS</div>
        <div onClick={() => setActiveTab("analytics")} style={tabStyle(activeTab === "analytics")}>ANALYTICS</div>
        <div onClick={() => setActiveTab("blocked")} style={tabStyle(activeTab === "blocked", "#ff0055")}>BLOCKED USERS</div>
      </div>

      {/* --- TAB 1: MANAGE QUESTIONS --- */}
      {activeTab === "questions" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          
          {/* FORM */}
          <div style={glassPanel}>
            <h2 style={{color: "#fff", marginBottom: "20px"}}>{editingId ? "Edit Question" : "Add New Question"}</h2>
            <form onSubmit={handleSaveQuestion}>
              <div style={{display: "flex", gap: "10px"}}>
                <div style={{flex: 1}}>
                  <label style={{color:"#888"}}>Domain</label>
                  <select value={domain} onChange={(e) => setDomain(e.target.value)} style={inputStyle}>
                    <DomainOptions />
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label style={{color:"#888"}}>Session</label>
                  <select value={session} onChange={(e) => setSession(e.target.value)} style={inputStyle}>
                    <option value="1">Session 1</option>
                    <option value="2">Session 2</option>
                    <option value="3">Session 3</option>
                  </select>
                </div>
              </div>

              <div style={{display: "flex", gap: "10px"}}>
                <div style={{flex: 1}}>
                  <label style={{color:"#888"}}>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                    <option value="mcq">MCQ</option>
                    <option value="fill_ups">Fill in Blanks</option>
                    <option value="code_snippet">Code Snippet</option>
                    <option value="descriptive">Q/A</option>
                  </select>
                </div>
                <div style={{flex: 1}}>
                  <label style={{color:"#888"}}>Section</label>
                  <input value={section} readOnly style={{...inputStyle, background: "#111", cursor: "not-allowed"}} />
                </div>
              </div>

              <label style={{color:"#888"}}>Question Text</label>
              <textarea rows="3" value={questionText} onChange={(e) => setQuestionText(e.target.value)} style={inputStyle} placeholder="Enter question..." />

              {/* DYNAMIC MCQ FIELDS */}
              {type === "mcq" && (
                <div style={{background: "rgba(0, 242, 255, 0.05)", padding: "10px", borderRadius: "10px", marginBottom: "15px"}}>
                  <label style={{color: "#00f2ff"}}>Options & Key</label>
                  {options.map((opt, i) => (
                    <input key={i} placeholder={`Option ${i+1}`} value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} style={{...inputStyle, marginBottom: "5px"}} />
                  ))}
                  <select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)} style={inputStyle}>
                    <option value="">-- Select Correct Answer --</option>
                    {options.map((opt, i) => opt && <option key={i} value={opt}>{opt}</option>)}
                  </select>
                </div>
              )}

              {type === "code_snippet" && (
                <textarea rows="4" value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} style={{...inputStyle, fontFamily: "monospace"}} placeholder="// Code..." />
              )}

              <button type="submit" className="neon-btn" style={{width: "100%"}}>SAVE</button>
            </form>
          </div>

          <div>
             {/* EXAM CONTROL */}
             <div style={{...glassPanel, border: "1px solid #00f2ff"}}>
              <h2 style={{color: "#00f2ff", marginBottom: "10px"}}>🚀 Start Test Control</h2>
              <div style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
                 <select value={controlDomain} onChange={(e)=>setControlDomain(e.target.value)} style={inputStyle}>
                    <DomainOptions />
                 </select>
                 <select value={controlSession} onChange={(e)=>setControlSession(e.target.value)} style={inputStyle}>
                    <option value="1">Session 1</option>
                    <option value="2">Session 2</option>
                    <option value="3">Session 3</option>
                 </select>
              </div>
              <div style={{display:"flex", gap:"10px"}}>
                 <button onClick={handleActivateExam} className="neon-btn" style={{flex:1}}>ACTIVATE</button>
                 <button onClick={handleStopExam} className="neon-btn" style={{borderColor:"red", color:"red"}}>STOP</button>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div style={{...glassPanel, border: "1px solid #ff0055"}}>
              <h3 style={{color: "#ff0055", marginBottom: "10px"}}>⚠️ Danger Zone</h3>
              <div style={{display:"flex", gap:"10px"}}>
                <button onClick={() => handleClearDatabase("results")} style={{flex:1, background:"#330000", border:"1px solid #ff0055", color:"#ff0055", padding:"10px", cursor:"pointer"}}>CLEAR RESULTS</button>
                <button onClick={() => handleClearDatabase("questions")} style={{flex:1, background:"#330000", border:"1px solid #ff0055", color:"#ff0055", padding:"10px", cursor:"pointer"}}>CLEAR QUESTIONS</button>
              </div>
            </div>

            {/* QUESTION BANK LIST WITH FILTER */}
            <div style={{...glassPanel, maxHeight: "300px", overflowY: "auto"}}>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", borderBottom: "1px solid #333", paddingBottom: "10px"}}>
                <h3 style={{color: "white"}}>Question Bank ({filteredQuestions.length})</h3>
                {/* FILTER DROPDOWN */}
                <select 
                  value={filterDomain} 
                  onChange={(e) => setFilterDomain(e.target.value)} 
                  style={{padding: "5px", background: "#000", color: "#fff", border: "1px solid #333", borderRadius: "5px"}}
                >
                  <option value="All">All Domains</option>
                  <DomainOptions />
                </select>
              </div>

              {filteredQuestions.length === 0 ? <p style={{color: "#666", textAlign: "center"}}>No questions found for this filter.</p> : 
                filteredQuestions.map(q => (
                <div key={q._id} style={{padding:"10px", borderBottom:"1px solid #333", marginBottom: "5px"}}>
                  <div style={{display: "flex", justifyContent: "space-between"}}>
                    <span style={{color: "#00f2ff", fontSize: "0.7rem", textTransform: "uppercase"}}>[{q.type}] {q.domain} - S{q.session}</span>
                    <div>
                      <button onClick={()=>startEditing(q)} style={{color:"#aaa", background:"none", border:"none", cursor:"pointer", marginRight:"10px"}}>EDIT</button>
                      <button onClick={()=>handleDeleteQuestion(q._id)} style={{color:"red", background:"none", border:"none", cursor:"pointer"}}>DEL</button>
                    </div>
                  </div>
                  <div style={{color: "#ddd"}}>{q.questionText}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ANALYTICS --- */}
      {activeTab === "analytics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          <div style={glassPanel}>
            <h3 style={{color:"white", marginBottom:"10px"}}>Success Rate</h3>
            <div style={{width:"100%", height:"250px"}}>
              <ResponsiveContainer><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value"><Cell fill="#00f2ff"/><Cell fill="#ff0055"/></Pie><Tooltip contentStyle={{background:"#000"}}/><Legend/></PieChart></ResponsiveContainer>
            </div>
          </div>
          <div style={{...glassPanel, maxHeight: "400px", overflowY: "auto"}}>
            <h3 style={{color:"white"}}>Recent Results</h3>
            {results.map(res => (
              <div key={res._id} style={{padding:"10px", borderBottom:"1px solid #222", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div><div style={{color:"white", fontWeight:"bold"}}>{res.username}</div><div style={{color:"#888", fontSize:"0.8rem"}}>{res.domain}</div></div>
                <div style={{display:"flex", gap:"15px", alignItems:"center"}}>
                  {res.violationCount > 0 && <span style={{color:"#ff0055", fontSize:"0.8rem"}}>⚠️ {res.violationCount} Violations</span>}
                  <div style={{color: res.status==="Pass"?"#00f2ff":"#ff0055", fontWeight:"bold"}}>{res.score}%</div>
                  <button onClick={()=>setSelectedResult(res)} style={{background:"#333", border:"none", color:"white", padding:"5px 10px", borderRadius:"5px", cursor:"pointer"}}>View Answers</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: BLOCKED USERS --- */}
      {activeTab === "blocked" && (
        <div style={{...glassPanel, textAlign:"center", maxWidth: "800px", margin: "0 auto"}}>
           <h3 style={{color:"#ff0055"}}>Blocked Users ({blockedUsers.length})</h3>
           {blockedUsers.length === 0 ? <p style={{color: "#aaa", marginTop: "20px"}}>No blocked users.</p> : 
             blockedUsers.map(u => (
             <div key={u._id} style={{padding:"15px", borderBottom:"1px solid #333", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
               <span style={{color:"white", fontSize: "1.2rem"}}>{u.username}</span>
               <button onClick={()=>handleUnblockUser(u._id)} className="neon-btn" style={{borderColor: "#00f2ff", color: "#00f2ff"}}>UNLOCK ACCESS</button>
             </div>
           ))}
        </div>
      )}

      {/* MODAL: VIEW ANSWERS */}
      {selectedResult && (
        <div style={{position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.8)", backdropFilter:"blur(5px)", display:"flex", justifyContent:"center", alignItems:"center", zIndex:100}}>
          <div style={{background:"#050505", border:"1px solid #00f2ff", padding:"30px", borderRadius:"15px", maxWidth:"600px", width:"90%", maxHeight:"80vh", overflowY:"auto"}}>
            <div style={{display:"flex", justifyContent:"space-between", marginBottom:"20px"}}>
              <h2 style={{color:"#fff"}}>{selectedResult.username}</h2>
              <button onClick={()=>setSelectedResult(null)} style={{background:"transparent", border:"none", color:"#ff0055", fontSize:"1.5rem", cursor:"pointer"}}>✖</button>
            </div>
            {selectedResult.answers && Object.entries(selectedResult.answers).map(([qId, answer], i) => (
              <div key={i} style={{marginBottom:"20px", borderBottom:"1px solid #333", paddingBottom:"10px"}}>
                <p style={{color:"#00f2ff", marginBottom:"5px", fontSize:"0.9rem"}}>Question {i+1}: {getQuestionText(qId)}</p>
                <div style={{background:"#111", padding:"10px", borderRadius:"5px", color:"#ddd"}}>{String(answer)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;