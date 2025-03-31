
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

// Functie om status van service te checken
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

// Periodieke check van alle services
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

// Start interval: elke 60 sec
setInterval(performChecks, 60000);
performChecks(); // ook meteen bij start

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
