# 🌐 Federated Learning Interactive Dashboard

This is the interactive frontend interface for the **Secure Federated Learning System**. Built with React, it provides a real-time command center for Hospital Administrators and Global Network Admins.

It visualizes live AI training metrics, monitors the immutable blockchain ledger for security breaches, and features a state-of-the-art **Multi-Modal Diagnostic Hub** that includes MRI brain tumor classification with Explainable AI (XAI) and a Hierarchical Blood Report Triage system.

---

## ✨ Core Features

### 👑 Role-Based Dashboards

* **Admin Dashboard:** Full control over the global training loop. Admins can configure hyperparameters (rounds, clients per round), select historical base models (checkpoints) to resume training, and monitor global progress.
* **Hospital Dashboard:** A streamlined interface for hospital nodes to securely register and connect to the global federation.

### 📊 Real-Time Analytics

* Integrates **Recharts** to dynamically plot Model Accuracy and Loss metrics as the federated training rounds complete.

### 🛡️ Zero-Trust Security & Blockchain Monitor

* **Live Audit Ledger:** Displays a real-time table of the cryptographic blockchain stored on the central server.
* **Tamper Detection:** Features a `Verify Integrity` engine. If the central database is hacked, the UI instantly throws a **Red Security Lockdown Banner** and halts operations to protect patient data.

### 🩺 Multi-Modal Medical AI Hub

* **Brain Tumor MRI (Grad-CAM XAI):** Upload MRI scans for instant classification. Features an "Explain AI" modal that generates Grad-CAM heatmaps, showing doctors exactly *where* the AI looked to make its prediction.
* **Hierarchical Blood Panel:** A clinical pathology input system that runs a Tier-1 General Triage AI, automatically routing critical abnormalities to a Tier-2 Specialist diagnosis system.

---

## 📂 Project Structure

```text
📁 frontend/
 ├── 📁 public/
 ├── 📁 src/
 │    ├── 📄 App.js               # Main React Application & Routing
 │    ├── 📄 App.css              # Custom styling for dashboards and cards
 │    ├── 📄 SecurityMonitor.js   # Live logging component
 │    └── 📄 index.js             # React Entry Point
 ├── 📄 package.json              # NPM Dependencies
 └── 📄 README.md                 # You are here!

```

---

## ⚙️ Installation & Setup

### 1. Prerequisites

* **Node.js** (v14 or higher)
* **npm** (Node Package Manager)

### 2. Install Dependencies

Clone the repository, open your terminal inside the frontend folder, and run:

```bash
npm install

```

*(This will install React, Recharts, and all required UI dependencies).*

### 3. Network Configuration 🚨

Because this system runs across a local network (e.g., connecting multiple PCs over Wi-Fi), you must tell the React app where the Central Python Server is located.

Open `src/App.js` and locate line 6:

```javascript
const BASE_URL = 'http://10.103.150.242:5000'; 

```

Change the IP address (`10.103.150.242`) to the exact IPv4 address of the computer running your Python `server.py`.

---

## 🚀 Running the Dashboard

Start the local development server:

```bash
npm start

```

The application will automatically open in your default web browser at `http://localhost:3000`.

---

## 🔐 Default Login Roles

The system uses JWT (JSON Web Tokens) for authentication. Ensure your Python backend has these roles configured in its login route:

* **Admin Access:** Requires a username mapped to the `ADMIN` role.
* **Hospital Access:** Requires a username mapped to the `HOSPITAL` role.

Tokens are securely managed in the browser's `localStorage` and automatically attached to the headers of all secure API requests (`x-access-token`).

---

## ⚠️ Troubleshooting

**"Could not connect to the server" / Dashboard is frozen**

* **Cause:** The React app cannot reach the Python backend.
* **Fix:** Check your terminal running the Python `server.py`. Ensure it is active. Double-check that the `BASE_URL` in `App.js` exactly matches the IP address of the server.

**"Models drop-down menu is empty"**

* **Cause:** The system has not completed a training round yet, so no `.pth` files exist on the server.
* **Fix:** Run at least one training round. The dropdown automatically polls the server and will populate the moment a round completes!

**"Security Lockdown Banner is flashing"**

* **Cause:** The backend blockchain validation failed.
* **Fix:** Click the `Verify Integrity` button in the Blockchain Audit Log panel. If the blockchain was intentionally altered for a hacking demonstration, the database must be wiped and the server restarted to clear the lockdown.
