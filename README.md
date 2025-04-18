# Service Monitor Dashboard

A simple and extensible dashboard to monitor the status and uptime of external services (HTTP and TCP). Designed to be user-friendly and require no programming experience.

---

## 🔧 Functionality

### 🧩 Features

- A **dashboard** (`index.html`) that shows the status and uptime of all registered services
- A **management page** (`beheer.html`) to add, update, and delete services
- Support for both `HTTP` (via URL) and `TCP` (via host and port) checks
- Automatic **uptime calculation** for the last 24 hours
- Background checking every minute — fully automated
- Simple web interface — no technical knowledge required

### 🖥 Technical Overview

- Built with **Node.js** and **Express**
- Uses a **SQLite** database (`monitor.db`) to store service information and status logs
- Frontend communicates with backend via **REST API**:
  - `GET /api/services` → current status overview
  - `GET /api/uptime` → uptime percentages (last 24h)
  - `POST / PUT / DELETE /api/services` → manage services
- Periodic checks implemented using:
  - `axios.get(url)` for HTTP
  - TCP socket connection for TCP
- Results are stored in the `status_logs` table
- Statuses are visualized with color indicators (green = online, red = offline, orange = unknown)

### 📂 File Structure

| File            | Purpose                                      |
|-----------------|----------------------------------------------|
| `server.js`     | Node.js backend and REST API                 |
| `index.html`    | Live dashboard interface                     |
| `beheer.html`   | Web interface for managing services          |
| `monitor.db`    | SQLite database with services and logs       |
| `package.json`  | Project config and dependencies              |
| `README.md`     | Project documentation                        |

### 📌 Project Setup

- Run the server with `node server.js`
- The server automatically hosts files in the `public/` directory (if used)
- Services will begin monitoring immediately based on the configured interval

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2025 Bastiaan Oosterman.