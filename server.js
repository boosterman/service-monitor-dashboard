const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const net = require('net');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.ADMIN_TOKEN || 'your-secret-token';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const dataFile = path.join(__dirname, 'services.json');

function loadServices() {
  if (!fs.existsSync(dataFile)) return [];
  return JSON.parse(fs.readFileSync(dataFile));
}

function saveServices(services) {
  fs.writeFileSync(dataFile, JSON.stringify(services, null, 2));
}

function updateServiceStatus(service) {
  return new Promise((resolve) => {
    const result = { ...service, lastChecked: new Date().toISOString() };

    if (service.type === 'http') {
      axios.get(service.url, { timeout: 5000 })
        .then(() => resolve({ ...result, status: 'online' }))
        .catch(() => resolve({ ...result, status: 'offline' }));
    }

    else if (service.type === 'ping') {
      exec(`ping -c 1 ${service.host}`, (error) => {
        resolve({ ...result, status: error ? 'offline' : 'online' });
      });
    }

    else if (service.type === 'tcp') {
      const socket = new net.Socket();
      socket.setTimeout(5000);
      socket.on('connect', () => {
        socket.destroy();
        resolve({ ...result, status: 'online' });
      });
      socket.on('error', () => {
        resolve({ ...result, status: 'offline' });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ...result, status: 'offline' });
      });
      socket.connect(service.port, service.host);
    }

    else {
      resolve({ ...result, status: 'unknown' });
    }
  });
}

app.get('/api/services', async (req, res) => {
  const services = loadServices();
  const updated = await Promise.all(services.map(updateServiceStatus));
  res.json(updated);
});

app.post('/api/services', (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const services = loadServices();
  const newService = req.body;
  services.push(newService);
  saveServices(services);
  res.json({ success: true });
});

app.delete('/api/services/:id', (req, res) => {
  if (req.headers.authorization !== `Bearer ${TOKEN}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const services = loadServices().filter(s => s.id !== req.params.id);
  saveServices(services);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
