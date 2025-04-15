
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const net = require('net');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
const db = new sqlite3.Database('./monitor.db');

const intervals = {}; // service-id -> interval reference

function logStatus(serviceId, status) {
  const stmt = db.prepare('INSERT INTO status_logs (service_id, status, timestamp) VALUES (?, ?, ?)');
  stmt.run(serviceId, status, new Date().toISOString());
  stmt.finalize();
}

function checkService(service) {
  if (service.type === 'http') {
    axios.get(service.name)
      .then(() => logStatus(service.id, 'up'))
      .catch(() => logStatus(service.id, 'down'));
  } else if (service.type === 'tcp') {
    const [host, port] = service.name.split(':');
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.connect(port, host, () => {
      logStatus(service.id, 'up');
      socket.destroy();
    });
    socket.on('error', () => {
      logStatus(service.id, 'down');
    });
    socket.on('timeout', () => {
      logStatus(service.id, 'down');
      socket.destroy();
    });
  }
}

function startMonitoring() {
  db.all('SELECT * FROM services', [], (err, services) => {
    if (err) return console.error(err.message);
    services.forEach(service => {
      if (intervals[service.id]) clearInterval(intervals[service.id]);
      const intervalMs = parseInt(service.interval_minutes) * 60000;
      checkService(service); // start meteen een eerste check
      intervals[service.id] = setInterval(() => checkService(service), intervalMs);
    });
  });
}

// API-routes
app.get('/api/services', (req, res) => {
  const query = `
    SELECT s.id, s.name, s.type, s.interval_minutes, sl.status, sl.timestamp
    FROM services s
    LEFT JOIN (
      SELECT service_id, status, MAX(timestamp) as timestamp
      FROM status_logs
      GROUP BY service_id
    ) sl ON s.id = sl.service_id
    ORDER BY s.name
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/uptime', (req, res) => {
  const sql = `
    SELECT s.id, s.name,
      ROUND(SUM(CASE WHEN status = 'up' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS uptime_percentage
    FROM services s
    JOIN status_logs sl ON s.id = sl.service_id
    WHERE sl.timestamp >= datetime('now', '-1 day')
    GROUP BY s.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startMonitoring(); // start monitoring per service
});
