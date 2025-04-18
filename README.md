# Service Monitor Dashboard

A simple and extensible web dashboard to monitor the availability and uptime of services (HTTP or TCP).

## 🚀 Features

- Live monitoring of HTTP and TCP services
- Auto-refresh frontend to show current status
- Uptime percentage calculated for the last 24 hours
- Manual and scheduled service checks
- REST API for managing services
- Lightweight: uses Express and SQLite
- Easy deployment on platforms like Render.com

## 📁 Project Structure

```
/public             => Static frontend (HTML/CSS/JS)
/server.js          => Main Express backend with API routes and monitoring logic
/monitor.db         => SQLite database file
```

## ⚙️ API Endpoints

### Services

- `GET /api/services`  
  Get all services with their most recent status.

- `GET /api/services/all`  
  Get all service metadata.

- `GET /api/services/:id`  
  Get detailed info for a single service.

- `POST /api/services`  
  Add a new service. Required fields: `id`, `name`, `type` (`http` or `tcp`), and either `url` or `host` + `port`.

- `PUT /api/services/:id`  
  Update an existing service.

- `DELETE /api/services/:id`  
  Remove a service from monitoring.

- `POST /api/services/:id/check-now`  
  Trigger a manual check for a service immediately.

### Uptime

- `GET /api/uptime`  
  Retrieve 24-hour uptime percentages for all services.

## 🧠 How it works

- When a service is added, it's immediately checked and monitoring begins via `setInterval`.
- All checks are logged in the `status_logs` table.
- The frontend retrieves the latest data via REST API and refreshes every minute.
- Uptime percentage is calculated based on the last 24 hours of status logs.

## 🛠️ Requirements

- Node.js
- SQLite (automatically created as `monitor.db`)

## 📦 Deployment

You can deploy this project easily to platforms like [Render](https://render.com):

1. Upload the code to GitHub
2. Connect your GitHub repo to Render
3. Set the build command to `npm install`
4. Set the start command to `node server.js`

The app will run on the default Render port (provided by environment).

## 📌 Notes

- New services trigger an immediate check and monitoring cycle
- No authentication is included — be sure to add security if used in production

---

Created by Adaptable (https://adaptable.nl)
