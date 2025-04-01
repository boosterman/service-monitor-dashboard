# Service Monitor Dashboard

Een visueel dashboard om externe services (zoals websites en servers) te monitoren. Ondersteunt HTTP- en TCP-checks, automatische statusopslag en een beheerpagina voor het eenvoudig toevoegen, wijzigen en verwijderen van services.

---

## ✅ Functionaliteiten

- HTTP en TCP monitoring
- Dashboard met live status en uptime over laatste 24 uur
- Backend-API met SQLite opslag
- Automatisch elke minuut controleren
- Beheerpagina voor services (toevoegen, wijzigen, verwijderen)
- Gebruiksvriendelijk zonder programmeerkennis

---

## 📦 Installatie lokaal

```bash
npm install
node server.js
```

Toegang tot:
- Dashboard: [http://localhost:3000](http://localhost:3000)
- Beheerpagina: [http://localhost:3000/beheer.html](http://localhost:3000/beheer.html)

---

## ☁️ Deployen op Render

1. Upload dit project naar GitHub
2. Maak een nieuwe Web Service op [https://render.com](https://render.com)
3. Instellingen:

| Instelling        | Waarde              |
|-------------------|---------------------|
| Start command     | `node server.js`    |
| Build command     | *(leeg laten)*      |
| Node.js versie    | Laat Render kiezen  |

---

## 🔒 Let op

- ICMP ping wordt niet ondersteund op Render (alleen HTTP en TCP)
- Tijdstempels zijn UTC, frontend converteert automatisch naar lokale tijd
- Databasebestand `monitor.db` moet aanwezig zijn voor correcte werking

---

Gemaakt met zorg — en nu compleet. Laat het dashboard voor je werken.