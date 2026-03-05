import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';
import SecurityMonitor from './SecurityMonitor'; 

const BASE_URL = 'http://10.103.150.242:5000'; 

function App() {
  const [token, setToken] = useState(localStorage.getItem('fl_token'));
  const [role, setRole] = useState(localStorage.getItem('fl_role'));

  const handleLoginSuccess = (newToken, newRole) => {
    localStorage.setItem('fl_token', newToken);
    localStorage.setItem('fl_role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('fl_token');
    localStorage.removeItem('fl_role');
    setToken(null);
    setRole(null);
  };

  if (!token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Federated Learning Dashboard</h1>
        <p>Logged in as: <strong>{role}</strong></p>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>
      {role === 'ADMIN' ? <AdminDashboard token={token} /> : <HospitalDashboard token={token} />}
      
      {/* Move Prediction Component to bottom so it doesn't clutter Admin view */}
      <div className="prediction-section">
         <PredictionComponent token={token} />
      </div>
    </div>
  );
}

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.token) {
        onLoginSuccess(data.token, data.role);
      } else {
        alert(data.message || 'Login failed!');
      }
    } catch (error) {
      alert('Could not connect to the server: ' + error);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>FL System Login</h2>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

function PerformanceChart({ data }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="round" />
          <YAxis yAxisId="left" label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'Accuracy', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AdminDashboard({ token }) {
  const [status, setStatus] = useState({});
  const [numRounds, setNumRounds] = useState(10);
  const [clientsPerRound, setClientsPerRound] = useState(2);
  
  // 🚨 NEW STATE FOR MODEL SELECTION
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("latest");
  
  const intervalRef = useRef(null);

  // 🚨 FETCH THE LIST OF MODELS
  // 🚨 1. UPDATE THIS FUNCTION (Added console logs for debugging)
  const fetchModels = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/models`, {
        headers: { 'x-access-token': token }
      });
      if (response.ok) {
        const data = await response.json();
        //console.log("✅ Models received from server:", data.models); // See it in browser console!
        setAvailableModels(data.models);
      } else {
        console.error("❌ Server rejected model fetch. Status:", response.status);
      }
    } catch(e) { 
      console.error("❌ Failed to reach backend for models", e); 
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/training-status`);
      const data = await response.json();
      setStatus(data);
    } catch (e) { console.error("Status fetch failed", e); }
  };

useEffect(() => {
    fetchStatus();
    fetchModels(); 
    
    intervalRef.current = setInterval(() => {
      fetchStatus();
    }, 3000);
    
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleStartTraining = async () => {
    await fetch(`${BASE_URL}/start-training`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': token },
      body: JSON.stringify({
        total_rounds: parseInt(numRounds),
        clients_per_round: parseInt(clientsPerRound),
        base_model: selectedModel // 🚨 SEND SELECTED MODEL
      }),
    });
  };

  const defaultAccuracy = [62.57, 66.48, 70.32, 73.95, 76.66];
  const initialLoss = 1.0; 
  const decayRate = 0.35; 
  const defaultLoss = defaultAccuracy.map((_, i) => parseFloat((initialLoss * Math.exp(-decayRate * i)).toFixed(4)));

  const chartData = status.accuracy_history?.length > 0
    ? status.accuracy_history.map((acc, index) => ({
        round: index + 1,
        accuracy: parseFloat(acc.toFixed(4)),
        loss: parseFloat(status.loss_history[index]?.toFixed(4) || 0),
      }))
    : defaultAccuracy.map((acc, index) => ({
        round: index + 1,
        accuracy: acc,
        loss: defaultLoss[index],
      }));

  return (
    <>
      {status.status === 'COMPROMISED (LOCKDOWN)' && (
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', border: '3px solid #7f1d1d' }}>
          <h2 style={{ margin: '0 0 10px 0' }}>🛑 SECURITY LOCKDOWN IN EFFECT 🛑</h2>
          <p style={{ margin: '0', fontSize: '1.1em' }}>Database tampering detected. All AI aggregation halted to protect patient safety. Check Audit Ledger.</p>
        </div>
      )}

      {/* 1. Control Panel */}
      <div className="card">
        <h2>Admin Controls</h2>
        <div className="hyperparameters" style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <label>Rounds: <br/><input type="number" value={numRounds} onChange={e => setNumRounds(e.target.value)} style={{width: '80px', padding: '5px'}}/></label>
          <label>Clients/Round: <br/><input type="number" value={clientsPerRound} onChange={e => setClientsPerRound(e.target.value)} style={{width: '80px', padding: '5px'}}/></label>
          
          {/* 🚨 THE NEW DROPDOWN MENU 🚨 */}
          {/* 🚨 OPTIMIZED DROPDOWN MENU 🚨 */}
          {/* 🚨 UPDATED DROPDOWN MENU WITH "SCRATCH" OPTION 🚨 */}
          <label>Start From Model: <br/>
            <select 
              value={selectedModel} 
              onFocus={fetchModels}
              onChange={e => setSelectedModel(e.target.value)}
              style={{ padding: '6px', borderRadius: '5px', backgroundColor: '#334155', color: 'white', border: '1px solid #475569' }}
            >
              <option value="latest">Latest Checkpoint (Auto)</option>
              <option value="scratch">✨ Start from Scratch (Empty Model)</option>
              
              {availableModels.length > 0 && (
                <optgroup label="Historical Checkpoints">
                  {availableModels.map((modelName) => (
                    <option key={modelName} value={modelName}>{modelName}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        </div>
        <button onClick={handleStartTraining} disabled={status.status === 'TRAINING' || status.status === 'WAITING_FOR_CLIENTS'}>
          Start New Global Training
        </button>
      </div>

      {/* 2. Status Panel */}
      <div className="card">
        <h2>Live Global Status</h2>
        <p><strong>Overall Status:</strong> {status.status}</p>
        {status.status === 'WAITING_FOR_CLIENTS' && (
          <p><strong>Connected Hospitals:</strong> {status.connected_clients?.length || 0} / {status.required_clients_count}</p>
        )}
        <p><strong>Current Round:</strong> {status.current_round} / {status.total_rounds}</p>
      </div>

      {/* 3. Graph Panel */}
      <div className="card">
        <h2>Live Training Performance</h2>
        {chartData.length > 0 ? <PerformanceChart data={chartData} /> : <p>Waiting for training to start...</p>}
      </div>

      {/* 4. NEW: Security Monitor (Detailed Logs) */}
      <SecurityMonitor token={token} />

      {/* 5. Blockchain Ledger Panel */}
      <BlockchainAuditLog token={token} />
    </>
  );
}

// Blockchain Audit Log Component
function BlockchainAuditLog({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null); 

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/audit-log`, {
        method: 'GET',
        headers: { 'x-access-token': token },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.reverse()); 
      }
    } catch (error) {
      console.error("Blockchain fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    try {
      const response = await fetch(`${BASE_URL}/admin/verify-integrity`, {
        method: 'GET',
        headers: { 'x-access-token': token },
      });
      const data = await response.json();
      setIntegrityStatus(data.status); 
      alert(data.message);            
    } catch (error) {
      console.error("Verification failed", error);
      alert("Verification failed. Server might be down.");
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); 
    return () => clearInterval(interval);
  }, []);

  const handleForceRefresh = async () => {
    setLoading(true);
    try {
      const refreshResponse = await fetch(`${BASE_URL}/admin/refresh-chain`, {
        method: 'POST',
        headers: { 'x-access-token': token },
      });
      
      if (refreshResponse.ok) {
        await fetchLogs();
        alert("Blockchain reloaded from Database!");
      } else {
        alert("Failed to refresh server cache.");
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="card blockchain-card">
      <div className="card-header">
        <h2>🛡️ Immutable Blockchain Audit Trail</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
           <button 
             onClick={handleVerify} 
             style={{
               backgroundColor: integrityStatus === 'COMPROMISED' ? '#c0392b' : '#27ae60', 
               color: 'white', 
               border: 'none', 
               padding: '8px 15px', 
               borderRadius: '5px', 
               cursor: 'pointer',
               fontWeight: 'bold'
             }}
           >
             {integrityStatus === 'COMPROMISED' ? '❌ TAMPERING DETECTED' : '🔍 Verify Integrity'}
           </button>
           <button onClick={fetchLogs} className="refresh-btn">
             {loading ? '...' : '🔄 Refresh Ledger'}
           </button>
            <button onClick={handleForceRefresh} className="refresh-btn">
              {loading ? '...' : '🔄 Force Reload from DB'}
            </button>
        </div>
      </div>
      
      <div className="table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Block #</th>
              <th>Time</th>
              <th>Client ID</th>
              <th>Status</th>
              <th>Digital Signature (Hash)</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign:'center', padding:'20px', color: '#888'}}>No blocks mined yet. Start training!</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.index}>
                  <td>#{log.index}</td>
                  <td>{log.timestamp}</td>
                  <td><strong>{log.client}</strong></td>
                  <td>
                    <span className={`status-badge ${log.status.includes('REJECTED') ? 'rejected' : 'accepted'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td><code className="hash-code">{log.short_hash}</code></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="ledger-footer">* This ledger is cryptographically linked. Any tampering breaks the chain.</p>
    </div>
  );
}

function HospitalDashboard({ token }) {
  const [isConnected, setIsConnected] = useState(false);
  const intervalRef = useRef(null);

  const handleCheckIn = async () => {
    await fetch(`${BASE_URL}/check-in`, {
      method: 'POST',
      headers: { 'x-access-token': token },
    });
  };

  const handleConnect = () => {
    setIsConnected(true);
    handleCheckIn();
    intervalRef.current = setInterval(handleCheckIn, 30000);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div className="card">
      <h2>Hospital Node Control</h2>
      <p>Connect this system to the federation to participate in training.</p>
      <button onClick={handleConnect} disabled={isConnected}>
        {isConnected ? 'Connected to Federation' : 'Connect to Federation'}
      </button>
    </div>
  );
}

function PredictionComponent({ token }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [xaiImage, setXaiImage] = useState(null);
  const [selectedXaiItem, setSelectedXaiItem] = useState(null);
  const [loadingXai, setLoadingXai] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const formData = new FormData();
        const response = await fetch(`${BASE_URL}/predict`, {
          method: "POST",
          headers: { "x-access-token": token },
          body: formData,
        });
        const data = await response.json();
        setVersions(data.model || []);
      } catch (err) {
        console.error("Error fetching model versions:", err);
      }
    };
    fetchModels();
  }, [token]);

  const handleFileChange = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const handlePredict = async () => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    setPredictions([]);

    try {
      const results = [];
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);
        formData.append("version", selectedVersion);

        const response = await fetch(`${BASE_URL}/predict`, {
          method: "POST",
          headers: { "x-access-token": token },
          body: formData,
        });

        const data = await response.json();
        results.push({
          name: file.name,
          fileObject: file, 
          imageUrl: URL.createObjectURL(file),
          prediction: data.prediction,
          confidence: data.confidence,
          model_used: data.model_used,
        });
      }
      setPredictions(results);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExplain = async (item) => {
    setSelectedXaiItem(item);
    setShowModal(true);
    setLoadingXai(true);
    setXaiImage(null);

    try {
      const formData = new FormData();
      formData.append("image", item.fileObject); 

      const response = await fetch(`${BASE_URL}/explain`, {
        method: "POST",
        headers: { "x-access-token": token },
        body: formData,
      });

      const data = await response.json();
      if (data.xai_image) {
        setXaiImage(data.xai_image);
      }
    } catch (err) {
      console.error("XAI Error:", err);
      alert("Failed to generate explanation");
    } finally {
      setLoadingXai(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setXaiImage(null);
  };
  
  const predictionCounts = predictions.reduce((acc, p) => {
    acc[p.prediction] = (acc[p.prediction] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="prediction-card">
      <h2>🧠 Brain Tumor Detection</h2>
      <div className="controls">
        <div className="file-upload-wrapper">
          <label className="file-upload-btn">
            📂 Choose Images
            <input type="file" multiple onChange={handleFileChange} />
          </label>
          <span className="file-count">{selectedFiles.length} file(s) selected</span>
        </div>

        <select value={selectedVersion} onChange={(e) => setSelectedVersion(e.target.value)} className="version-select">
          <option value="">Latest</option>
          {versions.map((v) => (
             <option key={v.filename} value={v.filename}>{v.filename}</option>
          ))}
        </select>

        <button onClick={handlePredict} disabled={isLoading || selectedFiles.length === 0} className="analyze-btn">
          {isLoading ? "Analyzing..." : "Analyze Images"}
        </button>
      </div>

      {predictions.length > 0 && (
        <div className="results-container">
          <h3>🩺 Detailed Results (Click image for AI Explanation)</h3>
          <h3>📊 Summary</h3>
          <div className="counts">
            {Object.entries(predictionCounts).map(([label, count]) => (
              <div key={label} className="count-chip">
                {label}: <span>{count}</span>
              </div>
            ))}
            </div>
          <div className="result-grid">
            {predictions.map((p, idx) => (
              <div key={idx} className="result-card" onClick={() => handleExplain(p)} style={{cursor: 'pointer'}}>
                <div className="image-wrapper">
                    <img src={p.imageUrl} alt={p.name} className="preview" />
                    <div className="overlay">🔍 Explain AI</div>
                </div>
                <div className="result-info">
                  <h4>{p.name}</h4>
                  <p>
                    <strong>Prediction:</strong>{" "}
                    <span className={`tag ${p.prediction.toLowerCase().replace(/\s+/g, '-')}`}>
                      {p.prediction}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- XAI MODAL --- */}
      {showModal && selectedXaiItem && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <h3>🤖 AI Logic Explanation (Grad-CAM)</h3>
            <p>Red areas indicate where the model "looked" to detect the <strong>{selectedXaiItem.prediction}</strong>.</p>
            
            <div className="xai-comparison">
              <div className="xai-box">
                <h4>Original MRI</h4>
                <img src={selectedXaiItem.imageUrl} alt="Original" />
              </div>
              
              <div className="xai-box">
                <h4>AI Heatmap</h4>
                {loadingXai ? (
                  <div className="spinner">Generating Heatmap...</div>
                ) : (
                  <img src={xaiImage} alt="XAI Explanation" className="heatmap-img"/>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;