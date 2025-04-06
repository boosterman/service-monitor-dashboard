
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

app.get('/api/services', (req, res) => {
  const query = `
    SELECT s.id, s.name, s.type, sl.status, sl.timestamp
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
      ROUND(
        100.0 * SUM(CASE WHEN sl.status = 'online' THEN 1 ELSE 0 END) / COUNT(sl.id), 1
      ) AS uptime,
      COUNT(sl.id) AS checks
    FROM services s
    JOIN status_logs sl ON s.id = sl.service_id
    WHERE sl.timestamp >= datetime('now', '-24 hours')
    GROUP BY s.id
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/services/all', (req, res) => {
  db.all('SELECT * FROM services', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/services/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Service niet gevonden' });
    res.json(row);
  });
});

app.post('/api/services/:id/check-now', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
    if (err || !service) return res.status(404).json({ error: 'Service niet gevonden' });
    checkService(service, (status) => {
      db.run('INSERT INTO status_logs (service_id, status) VALUES (?, ?)', [id, status]);
      res.json({ status });
    });
  });
});

app.post('/api/services', (req, res) => {
  const { id, name, type, url, host, port, interval_minutes } = req.body;

  if (!id || !name || !type || (!url && (!host || !port))) {
    return res.status(400).json({ error: 'Vereiste velden ontbreken' });
  }

  const sql = `
    INSERT INTO services (id, name, type, url, host, port, interval_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [id, name, type, url, host, port, interval_minutes || 1], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ created: id });
  });
});

app.put('/api/services/:id', (req, res) => {
  const id = req.params.id;
  const { name, type, url, host, port, interval_minutes } = req.body;
  const sql = `
    UPDATE services
    SET name = ?, type = ?, url = ?, host = ?, port = ?, interval_minutes = ?
    WHERE id = ?
  `;
  db.run(sql, [name, type, url, host, port, interval_minutes, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/services/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM services WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

function checkService(service, callback) {
  if (service.type === 'http') {
    axios.get(service.url, { timeout: 5000 })
      .then(() => callback('online'))
      .catch(() => callback('offline'));
  } else if (service.type === 'tcp') {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on('connect', () => {
      socket.destroy();
      callback('online');
    });
    socket.on('error', () => callback('offline'));
    socket.on('timeout', () => {
      socket.destroy();
      callback('offline');
    });
    socket.connect(service.port, service.host);
  } else {
    callback('unknown');
  }
}

function scheduleChecks() {
  db.all('SELECT * FROM services', [], (err, services) => {
    if (err) return;
    services.forEach(service => {
      const interval = (service.interval_minutes || 1) * 60000;
      if (intervals[service.id]) clearInterval(intervals[service.id]);
      intervals[service.id] = setInterval(() => {
        checkService(service, (status) => {
          db.run('INSERT INTO status_logs (service_id, status) VALUES (?, ?)', [service.id, status]);
        });
      }, interval);
    });
  });
}

scheduleChecks();
setInterval(scheduleChecks, 10 * 60000); // herlaad configuratie elke 10 minuten

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
