# Plan: DIY Finanzcoaching beenden – Haushaltsplan als eigenständiges Tool weiterführen

## Kontext
Das Coaching-Angebot (Mitgliedschaft 135 €/Jahr, Kennenlerngespräch via cal.com, Stripe-Kauf, Lernmodule, Lernkarten, Downloads) wird eingestellt. Gewünscht:
- **Website** `diy-finanzcoaching` (statisch, GitHub Pages): schlanke Abschiedsseite statt Startseite; die alte Startseite bleibt im Repo, wird aber nicht veröffentlicht.
- **App** `membership` (React/Vite/Supabase, `app.diy-finanzcoaching.de`): Sie läuft nur noch als **„Haushaltsplan“** mit neutralem Branding. Der Login bleibt, und das CRM wird zu einer **User-Verwaltung**. Alles andere wird über ein **Feature-Flag** abgeschaltet, der Code bleibt drin. Dazu kommt ein Git-Tag als Sicherungspunkt.
- Bestehende Mitglieder behalten ihren Login und sehen nur noch den Haushaltsplan.

Betroffene Repos: `oliver-nitsch-dev/membership` (App) und `oliver-nitsch-dev/diy-finanzcoaching` (Website). Dieses Dokument liegt identisch in beiden Repos (`membership/docs/`, `diy-finanzcoaching/_docs/` – Unterstrich, damit GitHub Pages es nicht veröffentlicht).

Status: **Plan, noch nicht umgesetzt** (Stand 2026-11-06, Analyse auf `membership@f09d947` / `diy-finanzcoaching@b7f55dc`).

Wichtige Erkenntnisse aus der Analyse:
- Zugang zur App hängt heute nur an einer Supabase-Session (`ProtectedRoute`). Mitgliedschaften gaten nichts, daher ist für Bestandsnutzer nichts zu migrieren.
- `Login.tsx` nutzt `signInWithOtp` ohne `shouldCreateUser: false`. Damit kann sich **jede E-Mail selbst registrieren**. Für „nur Freunde“ muss das zu.
- Der Haushaltsplan ist eigenständig und hat keine Abhängigkeit von Mitgliedschaft oder CRM.
- Vorbild für ein abschaltbares Feature: `BUDGETS_ENABLED` in `src/tools/haushaltsplan/config.ts` (Konstante zur Compile-Zeit, dokumentiert in CLAUDE.md).
- Einen „neuen Haupt-User anlegen“-Flow gibt es nicht. User entstehen bisher per Stripe-Webhook oder Self-Signup.

---

## Teil A – App (Repo `membership`)

### A0. Sicherungspunkt
Git-Tag `suite-final` auf den aktuellen `main`-Stand setzen und pushen (`git tag suite-final f09d947`).

### A1. Feature-Flag
Neue Datei `src/config.ts` nach dem Muster von `BUDGETS_ENABLED`:
```ts
/** Gesamte Coaching-Suite (Lernmodule, Lernkarten, Downloads, Mitgliedschaft, Coaching-Kauf/Termine,
 *  Kennenlernen, CRM-Coaching-Teile). false = App läuft als reiner „Haushaltsplan“. Code bleibt erhalten. */
export const SUITE_ENABLED = false
export const APP_NAME = SUITE_ENABLED ? 'DIY Finanzcoaching' : 'Haushaltsplan'
export const HOME_PATH = SUITE_ENABLED ? '/dashboard' : '/tools/haushaltsplan'
```

### A2. Routing – `src/App.tsx`
- Suite-Routen nur bei `SUITE_ENABLED` registrieren: `/coaching`, `/termin*`, `/lernmodule*`, `/tools`, `/downloads`, `/kennenlernen`, `/mitgliedschaft`, `/tools/lernkarten`.
- `/dashboard`: bei ausgeschalteter Suite `<Navigate to={HOME_PATH} replace />`. So funktionieren alte Lesezeichen, die Magic-Link-Redirects und die PWA-`start_url` `/` weiter.
- `/` leitet auf `HOME_PATH`.
- Catch-all `*` leitet auf `/`.
- `/crm` bleibt admin-gated und wird zur User-Verwaltung (siehe A5).

### A3. Navigation und Branding
- `src/components/Layout.tsx`: Ist die Suite aus, enthält `navItems` nur „Haushaltsplan“ (`/tools/haushaltsplan`). Im Admin-Bereich steht nur „Benutzer“ (`/crm`), „Kennenlerngespräch“ entfällt. Der Logo-Text kommt aus `APP_NAME`. `fetchIsAdmin` wird künftig aus `src/data/profile.ts` importiert statt über den Haushaltsplan-Re-Export.
- `src/components/ToolLayout.tsx`: `backTo`/`backLabel` werden optional, ohne sie erscheint kein Breadcrumb. `src/tools/haushaltsplan/index.tsx` übergibt sie nur bei `SUITE_ENABLED`, weil `/tools` sonst nicht existiert.
- `src/pages/Login.tsx`:
  - Titel kommt aus `APP_NAME`, „MITGLIEDERBEREICH“ entfällt bei ausgeschalteter Suite.
  - `shouldCreateUser: false` wird gesetzt.
  - Der Supabase-Fehler „Signups not allowed…“ wird auf eine freundliche Meldung gemappt: „Diese E-Mail-Adresse hat keinen Zugang. Bitte wende dich an Oliver.“
  - `emailRedirectTo` zeigt auf `HOME_PATH`.
- `index.html`: `<title>Haushaltsplan</title>`, `apple-mobile-web-app-title` auf „Haushaltsplan“.
- `vite.config.ts`: Im PWA-Manifest werden `name`, `short_name` und `description` aus `src/config.ts` importiert. Die Farben bleiben.

### A4. Login nur für eingeladene User
- Clientseitig über `shouldCreateUser: false` (A3).
- **Manueller Schritt für dich:** im Supabase-Dashboard unter *Authentication → Sign In / Providers* den Punkt „Allow new users to sign up“ deaktivieren. Erst damit ist Self-Signup auch über die API zu. `auth.admin.createUser` aus der Edge Function funktioniert weiterhin.

### A5. User-Verwaltung (CRM reduziert)
**DB-Migration** `supabase/migrations/20261106_admin_list_users.sql`:
- Neue SECURITY-DEFINER-RPC `admin_list_users()`, abgesichert über `is_admin()`. Sie liefert `user_id, email, display_name, role, created_at, last_sign_in_at, banned_until` aus `profiles` × `auth.users` und schließt Zweit-Logins aus, wie `admin_list_customers` in `20260725_account_members.sql`.
- `admin_list_customers` bleibt für die Suite unverändert.

**Edge Function** `supabase/functions/account-emails/index.ts` (Admin-geprüft via `requireAdmin`) erhält zusätzliche Actions:
- `create-user { email, displayName? }`: legt den User über `findUserId` und `auth.admin.createUser({ email, email_confirm: true })` an, nach dem Muster von `_shared/provisioning.ts`, und setzt optional den `display_name`. Es geht keine Mail raus. Der Freund meldet sich danach per Magic Link an.
- `set-blocked { userId, blocked }`: `auth.admin.updateUserById(userId, { ban_duration: blocked ? '876000h' : 'none' })`. Admins können sich nicht selbst sperren.
- `delete-user { userId }`: löscht den Auth-User, die Daten verschwinden per Cascade. Davor gibt es eine Bestätigung im UI (`ConfirmModal`), und das eigene Konto ist ausgeschlossen. Vorher prüfe ich die FK-Cascades in den Haushaltsplan-Migrationen.
- `ownerUserId` ist nur noch für `list`, `add` und `remove` Pflicht.

**Frontend** (`src/tools/crm/`):
- `data/queries.ts`: neue Funktionen `fetchUsers`, `createUser`, `setUserBlocked` und `deleteUser`. Sie nutzen das vorhandene `callFunction` und `accessToken`.
- `types.ts`: neuer Typ `UserListItem`.
- `pages/Kundenliste.tsx`:
  - Bei ausgeschalteter Suite heißt die Seite „Benutzer“.
  - Spalten: Name/E-Mail, Angelegt, Letzter Login, Status (aktiv/gesperrt).
  - Button „Benutzer anlegen“ öffnet ein Modal mit E-Mail und Name (vorhandene `Modal`/`Field`/`Button` aus `components/ui`).
  - Bei eingeschalteter Suite bleibt die bisherige Kundenansicht.
- `pages/Kundendetail.tsx`:
  - Bei ausgeschalteter Suite werden die Abschnitte „Mitgliedschaft“, „Lernfortschritt“ und „Gesprächsnotizen“ ausgeblendet. Sie bleiben im Code und sind über `SUITE_ENABLED` umschaltbar.
  - Sichtbar bleiben: Anzeigename, „Weitere E-Mail-Adressen“ (Zweit-Logins für Paare, gemeinsamer Haushaltsplan) und der neue Abschnitt „Zugang“ mit Sperren/Entsperren und Löschen.

### A6. Dokumentation
- `CLAUDE.md`: Abschnitt „Suite abgeschaltet (`SUITE_ENABLED`)“ mit
  - einer Liste, was ausgeblendet ist,
  - einer Reaktivierungs-Checkliste (Flag auf `true`, `index.html`-Titel, Supabase-Signups, Stripe/cal.com),
  - den neuen Routen und der neuen RPC/Function-Action.
- `README.md` aktualisieren. Das Repo verlangt laut CLAUDE.md, dass Doku-Updates im selben Commit landen.

### A7. Was nicht angefasst wird
Die Coaching-Edge-Functions (`checkout`, `stripe-webhook`, `cal-webhook`, `hydrate`, `link-anfordern`, `termin-status`), `mail.ts`, CSP-Header und die Tabellen bleiben, wie sie sind. Ohne die Kauf-Routen sind sie nicht mehr erreichbar.

**Manuelle Schritte für dich**, die ich auflisten werde:
- Stripe: Payment Link/Produkt deaktivieren, eventuelle wiederkehrende Abos prüfen.
- cal.com: Event-Typen deaktivieren.
- Edge Function `account-emails` neu deployen.
- Migration ausführen.
- Signups abschalten (A4).

---

## Teil B – Website (Repo `diy-finanzcoaching`)

### B1. Alte Startseite archivieren
- `index.html` wird zu `_startseite-coaching.html`.
- `entwurf.html` wird zu `_entwurf.html`.

Dateien mit `_` am Anfang veröffentlicht GitHub Pages/Jekyll nicht. Es gibt kein `.nojekyll`; `_nav.html` nutzt das schon so. Die Dateien bleiben aber im Repo.

### B2. Neue `index.html` – Abschiedsseite
Gleicher `<head>`-Aufbau (Fonts, `style.css`, Favicons, GA-Consent über `main.js`), injizierte `<nav>` und eine Hero-artige Sektion (`.hero`/`.legal-hero`, `.section-label`, `.btn-primary`). Textentwurf:
- **Überschrift:** „DIY Finanzcoaching ist beendet“
- **Text:**
  - „Ich habe mich entschieden, mein Angebot DIY Finanzcoaching einzustellen. Neue Mitgliedschaften und Kennenlerngespräche sind nicht mehr möglich.“
  - Dank an alle Mitglieder und Interessierten.
- **Box** (`.legal-highlight`): „Du bist bereits Mitglied? Dein Login zum Haushaltsplan bleibt bestehen.“ mit dem Button „Zum Login →“ (`app.diy-finanzcoaching.de`).
- **Kontakt:** „Fragen? Schreib mir an hallo@diy-finanzcoaching.de“

Dazu `<meta name="description">` anpassen. Den finalen Text kannst du nach dem Commit noch anpassen. Ein konkretes Enddatum nenne ich nicht.

### B3. Navigation und `main.js`
- `_nav.html`: „Preise“, „Kontakt“-Anker und der cal.com-CTA entfallen. Es bleiben Logo und „Login →“. Danach `python inject_nav.py` lokal ausführen, damit alle Seiten konsistent sind; die CI würde das sonst auch tun.
- `main.js`:
  - Im Mobile-Drawer fällt „Termin buchen“ weg.
  - Der Cookie-Banner-Text verliert den cal.com-Hinweis.
  - Der cal.com-Popup-Code bleibt, er greift nur bei `[data-cal-book]`.
  - Neu ist ein kleiner Hinweisbalken unter der Nav auf allen Unterseiten außer der Startseite: „Das Angebot DIY Finanzcoaching wurde eingestellt. Mehr erfahren →“. Die zugehörigen CSS-Klassen `.offer-ended-bar` kommen in `style.css`.

### B4. Blog (per URL weiterhin erreichbar)
- `blog/index.html`: Der Coaching-CTA-Block (`.blog-cta-banner`, Zeilen 179–184) mit cal.com-Button wird entfernt.
- `blog/vorbereitung-bankgespraech-baufinanzierung/index.html`: Der cal.com-Kennenlern-Link (Zeile 169) wird entfernt bzw. umformuliert. Die Fließtext-Erwähnungen „im Coaching“ bleiben als Erfahrungswerte.

### B5. Rest
- `sitemap.xml`: `lastmod` für `/` aktualisieren.
- `README.md`: „Inhalt & Angebot“ auf „Angebot eingestellt“ ändern und die Archiv-Dateien dokumentieren.

**Hinweise an dich, ohne Änderung von mir:**
- `datenschutz.html` beschreibt noch cal.com und Stripe. Das kann für Altdaten bestehen bleiben.
- Abschnitte zu Supabase/App, Google Analytics, Google Fonts und web3forms fehlen schon heute. Das empfehle ich separat und rechtlich geprüft nachzuziehen.
- `impressum.html` hat noch die Tätigkeitsbeschreibung „Finanzcoaching“.

---

## Verifikation
**App:**
1. `npm ci`, `npm test` (vitest) und `npm run build` (`tsc` strict + vite) müssen fehlerfrei laufen.
2. `npm run dev` und Playwright-Smoke mit dem vorhandenen `scripts/e2e/testLogin.mjs`, sofern eine `.env` mit Test-Zugang verfügbar ist; sonst ein visueller Check der Login-Seite ohne Session. Zu prüfen:
   - `/` und `/dashboard` landen auf `/tools/haushaltsplan`.
   - `/lernmodule`, `/coaching` und `/mitgliedschaft` leiten auf `/` zurück.
   - Die Sidebar zeigt nur Haushaltsplan, beim Admin zusätzlich „Benutzer“.
   - `/crm` zeigt die Benutzerliste mit dem Button „Benutzer anlegen“.
3. Test mit `SUITE_ENABLED = true` lokal: `build` bleibt grün und die alte Navigation erscheint wieder. Das wird nicht committet.
4. Edge Function und Migration lassen sich hier nicht gegen echtes Supabase testen. Ich prüfe sie per Code-Review gegen die vorhandenen Muster und weise dich auf Deploy und Test hin.

**Website:**
1. `python inject_nav.py`, danach `python -m http.server`.
2. Playwright-Screenshots von `/`, `/blog/` und `/impressum.html` auf Desktop und Mobil.
3. Prüfen, dass keine `data-cal-book`-Links mehr gerendert werden (`grep`), außer in den `_`-Archivdateien.

**Abschluss:** In beiden Repos committen und pushen; den Tag `suite-final` im membership-Repo pushen. Danach die manuellen Schritte aus A4/A7 erledigen.
