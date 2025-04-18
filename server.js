const express = require('express'); // Import the Express framework
const path = require('path'); // Core module for file and directory paths
const cors = require('cors'); // Middleware for enabling CORS (Cross-Origin Resource Sharing)
const bodyParser = require('body-parser'); // Middleware to parse incoming JSON bodies
const sqlite3 = require('sqlite3').verbose(); // SQLite3 database driver
const net = require('net'); // Built-in TCP networking module
const axios = require('axios'); // HTTP client for making requests

const app = express(); // Create an Express application
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Enable parsing of JSON request bodies
app.use(express.static('public')); // Serve static files from 'public' directory
const db = new sqlite3.Database('./monitor.db'); // Initialize SQLite database connection

const intervals = {}; // service ID -> interval reference // Store interval references for each service ID

app.get('/api/services', (req, res) => { // Define GET API endpoint
  const query = `
    SELECT s.id, s.name, s.type, sl.status, sl.timestamp // SQL query to fetch data
    FROM services s
    LEFT JOIN (
      SELECT service_id, status, MAX(timestamp) as timestamp // SQL query to fetch data
      FROM status_logs
      GROUP BY service_id
    ) sl ON s.id = sl.service_id
    ORDER BY s.name
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    res.json(rows); // Send JSON response back to client
  });
});

app.get('/api/uptime', (req, res) => { // Define GET API endpoint
  const sql = `
    SELECT s.id, s.name, // SQL query to fetch data
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
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    res.json(rows); // Send JSON response back to client
  });
});

app.get('/api/services/all', (req, res) => { // Define GET API endpoint
  db.all('SELECT * FROM services', [], (err, rows) => { // SQL query to fetch data
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    res.json(rows); // Send JSON response back to client
  });
});

app.get('/api/services/:id', (req, res) => { // Define GET API endpoint
  const id = req.params.id;
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, row) => { // SQL query to fetch data
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    if (!row) return res.status(404).json({ error: 'Service not found' }); // Send error response if something goes wrong
    res.json(row); // Send JSON response back to client
  });
});

app.post('/api/services/:id/check-now', (req, res) => { // Define POST API endpoint
  const id = req.params.id;
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => { // SQL query to fetch data
    if (err || !service) return res.status(404).json({ error: 'Service not found' }); // Send error response if something goes wrong
    checkService(service, (status) => {
      db.run('INSERT INTO status_logs (service_id, status) VALUES (?, ?)', [id, status]);
      res.json({ status }); // Send JSON response back to client
    });
  });
});


app.post('/api/services', (req, res) => { // Define POST API endpoint
  let { id, name, type, url, host, port, interval_minutes } = req.body;
  id = id || name.toLowerCase().replace(/\s+/g, '-');

  if (!id || !name || !type || (!url && (!host || !port))) {
    return res.status(400).json({ error: 'Required fields are missing' }); // Send error response if something goes wrong
  }

  const sql = `
    INSERT INTO services (id, name, type, url, host, port, interval_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [id, name, type, url, host, port, interval_minutes || 1], function (err) {
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong

    // Immediate check after creation
    checkService({ id, name, type, url, host, port }, (status) => {
      db.run('INSERT INTO status_logs (service_id, status) VALUES (?, ?)', [id, status]);
    });

    // Immediately start interval
    const interval = (interval_minutes || 1) * 60000;
    if (intervals[id]) clearInterval(intervals[id]);
    intervals[id] = setInterval(() => {
      checkService({ id, name, type, url, host, port }, (status) => {
        db.run('INSERT INTO status_logs (service_id, status) VALUES (?, ?)', [id, status]);
      });
    }, interval);

    res.json({ created: id }); // Send JSON response back to client

  });
});

app.put('/api/services/:id', (req, res) => { // Define PUT API endpoint
  const id = req.params.id;
  const { name, type, url, host, port, interval_minutes } = req.body;
  const sql = `
    UPDATE services
    SET name = ?, type = ?, url = ?, host = ?, port = ?, interval_minutes = ?
    WHERE id = ?
  `;
  db.run(sql, [name, type, url, host, port, interval_minutes, id], function (err) {
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    res.json({ updated: this.changes }); // Send JSON response back to client
  });
});

app.delete('/api/services/:id', (req, res) => { // Define DELETE API endpoint
  const id = req.params.id;
  db.run('DELETE FROM services WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message }); // Send error response if something goes wrong
    res.json({ deleted: this.changes }); // Send JSON response back to client
  });
});

function checkService(service, callback) { // Function to check service availability (HTTP or TCP)
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

function scheduleChecks() { // Setup recurring checks for all services
  db.all('SELECT * FROM services', [], (err, services) => { // SQL query to fetch data
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
setInterval(scheduleChecks, 10 * 60000);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)); // Start the Express server
