# Service Monitor Dashboard

Een eenvoudige monitoring-tool om HTTP-, Ping- en TCP-services in de gaten te houden. Inclusief publiek dashboard en afgeschermde API voor beheer.

## ✅ Functionaliteit
- Realtime statuscheck van services
- Ondersteunt: HTTP(S), Ping, TCP
- Publiek dashboard
- Beveiligde API voor toevoegen/verwijderen van services

## ⚙️ Installatie (lokaal)
1. Installeer [Node.js](https://nodejs.org)
2. Open een terminal en voer uit:
   ```bash
   npm install
   node server.js
   ```
3. Open je browser en ga naar `http://localhost:3000`

## 🔐 Services toevoegen (voorbeeld via curl)
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test",
    "name": "Voorbeeldservice",
    "type": "http",
    "url": "https://example.com"
  }'
```

## ☁️ Online zetten via Render.com
1. Ga naar [render.com](https://render.com)
2. Maak een account aan
3. Koppel je GitHub of kies "Deploy from a Git repository"
4. Kies deze map (of upload als eigen repo)
5. Instellingen:
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment: `ADMIN_TOKEN=your-secret-token`

Je dashboard draait dan op een eigen URL, 24/7 online.
