#!/usr/bin/env python3
"""
inject_nav.py – DIY Finanzcoaching
Ersetzt den <nav>...</nav>-Block in allen HTML-Dateien automatisch.
Nav-Inhalt wird zentral in _nav.html gepflegt.

Der Platzhalter {ROOT} wird je nach Verzeichnistiefe relativ zum
Repo-Root ersetzt: Root-Seiten → ./, Unterordner → ../ usw.;
404.html bekommt immer den absoluten Pfad /.
"""

import os
import re

REPO_ROOT     = os.path.dirname(os.path.abspath(__file__))
NAV_FILE      = os.path.join(REPO_ROOT, "_nav.html")
EXCLUDE_FILES = {"_nav.html"}
EXCLUDE_DIRS  = {".git", "Assets"}


def load_nav():
    with open(NAV_FILE, "r", encoding="utf-8") as f:
        return f.read().strip()


def inject_nav_into_file(filepath, nav_html):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(r"<nav>.*?</nav>", re.DOTALL)

    if not pattern.search(content):
        print(f"  SKIP (kein <nav> gefunden): {filepath}")
        return

    new_content = pattern.sub(f"<nav>\n{nav_html}\n</nav>", content)

    if new_content == content:
        print(f"  UNVERÄNDERT: {filepath}")
        return

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"  AKTUALISIERT: {filepath}")


def root_prefix_for(dirpath):
    """Gibt den relativen Pfad vom Verzeichnis zum Repo-Root zurück."""
    rel = os.path.relpath(dirpath, REPO_ROOT)
    if rel == ".":
        return "./"
    depth = len(rel.split(os.sep))
    return "../" * depth


def main():
    nav_template = load_nav()
    print(f"Nav geladen aus: {NAV_FILE}\n")

    for dirpath, dirnames, filenames in os.walk(REPO_ROOT):
        # Versteckte Ordner und Assets überspringen
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS and not d.startswith(".")]

        prefix   = root_prefix_for(dirpath)
        nav_html = nav_template.replace("{ROOT}", prefix)

        for filename in filenames:
            if not filename.endswith(".html") or filename in EXCLUDE_FILES:
                continue
            # Archivdateien (_startseite-coaching.html, _entwurf.html) werden
            # nicht veröffentlicht und behalten ihre historische Nav.
            if filename.startswith("_"):
                continue
            # 404.html wird von GitHub Pages unter beliebigen (auch tiefen)
            # URLs ausgeliefert – daher absoluter Pfad statt relativem.
            html = nav_template.replace("{ROOT}", "/") if filename == "404.html" else nav_html
            inject_nav_into_file(os.path.join(dirpath, filename), html)

    print("\nFertig.")


if __name__ == "__main__":
    main()
