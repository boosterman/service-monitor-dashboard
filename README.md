# Service Monitor Dashboard (met database)

Een eenvoudig monitoringdashboard dat services controleert via HTTP of TCP en hun status opslaat in een SQLite-database. De frontend toont de laatste bekende status per service.

---

## ✅ Functionaliteiten

- Realtime servicecontroles (via interval, niet per refresh)
- Types: `http`, `tcp`
- Statusopslag in SQLite (`monitor.db`)
- Publiek dashboard toont laatste bekende status
- Automatische verversing frontend elke minuut
- Tijdstip laatste vernieuwing zichtbaar
- Geen live check op elke frontend-refresh

---

## 📦 Installatie lokaal (voor test)

```bash
npm install
node server.js
```

---

## ☁️ Deployen op Render

1. Zet dit project op GitHub
2. Maak een nieuw Web Service-project aan in Render
3. Instellingen:

| Instelling        | Waarde             |
|-------------------|---------------------|
| Start Command     | `node server.js`    |
| Build Command     | *(leeg laten)*      |
| Node.js versie    | Laat Render zelf kiezen |
| Bestanden         | Voeg ook `monitor.db` toe aan de repo |

4. Klik op **Manual Deploy** na elke wijziging

---

## ➕ Services aanpassen

Je kunt de services in de database beheren (toevoegen/verwijderen) met een SQLite-tool, of ik bouw later een beheer-UI voor je.

---

## ⚠️ Let op

- Ping-checks zijn uitgeschakeld (Render blokkeert ICMP)
- `monitor.db` moet in de root van je project staan
- Backend voert elke minuut automatische check uit

---

Gemaakt door Bastiaan + GPT. Vragen of uitbreidingen? Gewoon aangeven.