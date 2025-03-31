const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const { exec } = require('child_process');
const net = require('net');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('./monitor.db');

// API: laatste status per service
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
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API: alle services ophalen (voor beheer)
app.get('/api/services/all', (req, res) => {
  db.all('SELECT id, name, type FROM services ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: service toevoegen
app.post('/api/services', (req, res) => {
  const { id, name, type, url, host, port } = req.body;
  const stmt = `INSERT INTO services (id, name, type, url, host, port) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(stmt, [id, name, type, url, host, port], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// API: service verwijderen
app.delete('/api/services/:id', (req, res) => {
  db.run('DELETE FROM services WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Check logica
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
    socket.on('error', () => {
      callback('offline');
    });
    socket.on('timeout', () => {
      socket.destroy();
      callback('offline');
    });
    socket.connect(service.port, service.host);
  } else {
    callback('unknown');
  }
}

// Periodieke checks
function performChecks() {
  db.all('SELECT * FROM services', [], (err, services) => {
    if (err) {
      console.error('DB read error:', err);
      return;
    }
    services.forEach(service => {
      checkService(service, (status) => {
        const insert = 'INSERT INTO status_logs (service_id, status) VALUES (?, ?)';
        db.run(insert, [service.id, status], (err) => {
          if (err) console.error('Insert error:', err);
        });
      });
    });
  });
}

// Start interval
setInterval(performChecks, 60000);
performChecks();

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));