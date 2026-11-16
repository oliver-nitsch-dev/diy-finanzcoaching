# DIY Finanzcoaching

Statische Website für **DIY Finanzcoaching – Oliver Nitsch**. Ziel ist es, Menschen zu befähigen, ihre Finanzen eigenständig zu verstehen, zu planen und umzusetzen – ohne Provisionsberater, ohne teure Honorarberatung.

Live unter: [diy-finanzcoaching.de](https://diy-finanzcoaching.de)

> **Das Angebot ist eingestellt (November 2026).** Die Startseite ist eine schlanke
> Abschiedsseite. Die frühere Startseite liegt als `_startseite-coaching.html` im Repo
> (Unterstrich = wird von GitHub Pages/Jekyll nicht veröffentlicht). Der Blog bleibt per URL
> erreichbar. Hintergrund und Schritte: `_docs/Plan_Coaching_Ende_Haushaltsplan_Standalone.md`.

---

## Projektstruktur

```
/
├── index.html              # Abschiedsseite (Angebot eingestellt)
├── _startseite-coaching.html  # Archiv: frühere Startseite (nicht veröffentlicht)
├── _entwurf.html           # Archiv: Entwurf (nicht veröffentlicht)
├── _docs/                  # Interne Doku (nicht veröffentlicht)
├── datenschutz.html        # Datenschutzerklärung
├── impressum.html          # Impressum
├── style.css               # Globales Stylesheet (CSS Custom Properties, kein Framework)
├── main.js                 # Interaktivität (Hinweisbalken „Angebot eingestellt“, Footer, Cookie-Banner, Scroll-Animationen)
├── _nav.html               # Zentrale Nav-Vorlage (Single Source of Truth, aktuell nur Logo)
├── inject_nav.py           # Skript: injiziert _nav.html in alle HTML-Dateien (außer `_`-Archivdateien)
├── blog/
│   ├── index.html          # Blog-Übersicht
│   ├── sind-nachhaltige-geldanlagen-wirklich-sinnvoll.html
│   └── excel-tool-vs-finanzguru.html
└── Assets/                 # Bilder (Banner, Portrait, Blog-Thumbnails)
```

---

## Navigation verwalten

Die Navigation ist **zentral** in `_nav.html` gepflegt. Seit der Einstellung des Angebots enthält sie nur noch das Logo. Den Hinweisbalken „Das Angebot DIY Finanzcoaching wurde eingestellt“ fügt `main.js` auf allen Seiten außer der Startseite (`body.page-farewell`) in die Nav ein. Änderungen dort werden automatisch in alle HTML-Dateien übernommen – entweder manuell oder per CI.

**Manuell ausführen:**

```bash
python inject_nav.py
```

**Automatisch via GitHub Actions:** Bei jedem Push auf `main`, der `_nav.html` oder eine `.html`-Datei berührt, läuft `.github/workflows/inject-nav.yml` und committet die aktualisierten Dateien zurück ins Repository.

---

## Neuen Blogartikel anlegen

1. Neue HTML-Datei in `blog/` erstellen (z. B. `blog/mein-neuer-artikel.html`).
2. Bestehenden Artikel als Vorlage kopieren und Inhalt anpassen.
3. Artikel in der Blog-Übersicht (`blog/index.html`) verlinken.
4. Committen und auf `main` pushen – die Nav wird automatisch injiziert.

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
- **Blog:** bleibt per URL erreichbar, ist aber weder in der Nav noch auf der Startseite verlinkt.
- **Früher:** Coaching-Mitgliedschaft 135 €/Jahr, Themen Finanzüberblick, Versicherungen, Geldanlage & ETFs, Kredit & Finanzierung (siehe `_startseite-coaching.html`).
