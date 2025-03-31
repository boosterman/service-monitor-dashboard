# Service Monitor Dashboard (met beheer en database)

Een intuïtief en uitbreidbaar monitoringdashboard waarmee je eenvoudig de status van externe services (HTTP of TCP) bewaakt. Inclusief database-opslag, automatische updates én een beheerpagina.

---

## ✅ Functionaliteiten

- Live statuscontrole via achtergrond-checks (elke minuut)
- Types: `http` en `tcp`
- Opslag van statussen in `monitor.db` (SQLite)
- Frontend dashboard toont laatste bekende status
- Beheerpagina voor:
  - Toevoegen
  - Verwijderen
  - ✏️ Wijzigen van services
- Automatische verversing frontend elke minuut
- Tijdstip “Laatst bijgewerkt” zichtbaar in dashboard
- Volledig zonder programmeerkennis te gebruiken

---

## 📦 Installatie lokaal (voor testen)

```bash
npm install
node server.js
```

Bezoek:
- [http://localhost:3000](http://localhost:3000) → Dashboard
- [http://localhost:3000/beheer.html](http://localhost:3000/beheer.html) → Beheerpagina

---

## ☁️ Deployen op Render

1. Zet dit project op GitHub
2. Maak een nieuwe Web Service aan op [Render.com](https://render.com)
3. Instellingen:

| Instelling        | Waarde             |
|-------------------|---------------------|
| Start Command     | `node server.js`    |
| Build Command     | *(leeg laten)*      |
| Node.js versie    | Laat Render kiezen  |

4. Upload ook `monitor.db`, `package.json`, `public/`, enz.
5. Klik op **Manual Deploy**

---

## ➕ Services beheren

Gebruik de beheerpagina `/beheer.html` om services:
- Toe te voegen
- Te wijzigen
- Te verwijderen

Alles gebeurt direct in de SQLite-database. Geen Postman of curl nodig.

---

## ⚠️ Let op

- `monitor.db` moet aanwezig zijn in root van het project
- Render ondersteunt geen ICMP-ping (alleen HTTP/TCP werken)
- Tijdzone wordt automatisch aangepast in de frontend

---

Gemaakt door Bastiaan + GPT. Klaar voor meldingen, rapportage of grafieken? Open de volgende fase!