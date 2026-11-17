# DIY Finanzcoaching

Statische Website für **DIY Finanzcoaching – Oliver Nitsch**. Ziel ist es, Menschen zu befähigen, ihre Finanzen eigenständig zu verstehen, zu planen und umzusetzen – ohne Provisionsberater, ohne teure Honorarberatung.

Live unter: [diy-finanzcoaching.de](https://diy-finanzcoaching.de)

> **Das Angebot ist eingestellt (November 2026).** Die Startseite ist eine schlanke
> Abschiedsseite. Die frühere Startseite liegt als `_startseite-coaching.html` im Repo
> (Unterstrich = wird von GitHub Pages/Jekyll nicht veröffentlicht). Außer der Startseite
> sind nur noch Impressum und Datenschutz erreichbar; der Blog wurde entfernt (liegt in der
> Git-Historie), alte URLs landen auf der 404-Seite. Hintergrund und Schritte: `_docs/Plan_Coaching_Ende_Haushaltsplan_Standalone.md`.

---

## Projektstruktur

```
/
├── index.html              # Abschiedsseite (Angebot eingestellt)
├── _startseite-coaching.html  # Archiv: frühere Startseite (nicht veröffentlicht)
├── _entwurf.html           # Archiv: Entwurf (nicht veröffentlicht)
├── _docs/                  # Interne Doku (nicht veröffentlicht)
├── 404.html                # Fehlerseite (absolute Pfade, da unter beliebigen URLs ausgeliefert)
├── datenschutz.html        # Datenschutzerklärung
├── impressum.html          # Impressum
├── style.css               # Globales Stylesheet (CSS Custom Properties, kein Framework)
├── main.js                 # Interaktivität (Hinweisbalken „Angebot eingestellt“, Footer, Cookie-Banner, Scroll-Animationen)
├── _nav.html               # Zentrale Nav-Vorlage (Single Source of Truth, aktuell nur Logo)
├── inject_nav.py           # Skript: injiziert _nav.html in alle HTML-Dateien (außer `_`-Archivdateien)
└── Assets/                 # Bilder (Banner, Portrait, Logo)
```

---

## Navigation verwalten

Die Navigation ist **zentral** in `_nav.html` gepflegt. Seit der Einstellung des Angebots enthält sie nur noch das Logo. Den Hinweisbalken „Das Angebot DIY Finanzcoaching wurde eingestellt“ fügt `main.js` auf allen Seiten außer Startseite und 404-Seite (`body.page-farewell`) in die Nav ein. Änderungen dort werden automatisch in alle HTML-Dateien übernommen – entweder manuell oder per CI.

**Manuell ausführen:**

```bash
python inject_nav.py
```

**Automatisch via GitHub Actions:** Bei jedem Push auf `main`, der `_nav.html` oder eine `.html`-Datei berührt, läuft `.github/workflows/inject-nav.yml` und committet die aktualisierten Dateien zurück ins Repository.

---

## Lokale Entwicklung

Da es sich um eine rein statische Website ohne Build-Schritt handelt, reicht ein einfacher lokaler Webserver:

```bash
# Python (ab 3.x)
python -m http.server 8080
```

Dann im Browser: `http://localhost:8080`

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| HTML/CSS/JS | Vanilla – kein Framework, kein Build-Tool |
| Schriften | Google Fonts: Playfair Display, DM Sans |
| CI/CD | GitHub Actions |
| Hosting | GitHub Pages / statisches Hosting |

---

## Inhalt & Angebot

- **Angebot eingestellt** (November 2026): keine neuen Mitgliedschaften, keine Kennenlerngespräche, keine cal.com-Buchung mehr auf der Website (Code für das Buchungs-Overlay aus `main.js` entfernt, liegt in der Git-Historie).
- **Blog:** entfernt (November 2026). Die Artikel liegen in der Git-Historie; alte Blog-URLs führen auf die 404-Seite.
- **Früher:** Coaching-Mitgliedschaft 135 €/Jahr, Themen Finanzüberblick, Versicherungen, Geldanlage & ETFs, Kredit & Finanzierung (siehe `_startseite-coaching.html`).
