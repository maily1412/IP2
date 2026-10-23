# Projektspezifikation: Lebensmittel-Inventar-App (Prototyp)

## 1. Ziel
Eine Web-App, mit der Privatpersonen den Überblick über ihre Lebensmittel zu Hause behalten. So sollen Doppelkäufe vermieden werden.

## 2. Plattform & Technik
- Responsive Web-App für Smartphone und Rechner, zusätzlich als **PWA** installierbar.
- Die Erfassung läuft über die Smartphone-Kamera. Dafür ist HTTPS nötig.
- Zentrale Datenbank auf dem Server, damit alle Geräte denselben Bestand sehen (Details: [Technik.md](Technik.md)).
  - **[OFFEN]** Hosting.
- Kein Haushalts- oder Nutzerkonzept: Wer den Bestand teilen will, nutzt einen **gemeinsamen Login**.

## 3. Datenmodell
- Der Bestand besteht aus **Produkttypen** (z. B. „Bio-Karotten“), jeweils mit einer **Stückzahl** als ganzer Zahl.
- Es gibt keine Marke, kein MHD, keinen Lagerort, keine Packungsgröße und keine Einheiten.
- Zuordnungen von Barcode zu Produkttyp werden in der eigenen Datenbank gespeichert.

## 4. Funktionen im Prototyp

### 4.1 Bestandsübersicht
- Liste aller Produkttypen mit Stückzahl.

### 4.2 Hinzufügen per Barcode
- Die App schlägt den Barcode in einer **externen Produktdatenbank** (Open Food Facts) nach. Aus dem Produktnamen und den vorhandenen Produkttypen schlägt ein **LLM** einen Produkttyp vor. Der Nutzer bestätigt oder korrigiert.
- Die App speichert korrigierte oder unbekannte Barcodes und verwendet die Zuordnung beim nächsten Scan.
- Jeder weitere Scan desselben Produkts zählt hoch (+1). Zusätzlich gibt es einen Zähler (+/−) zum Korrigieren.

### 4.3 Hinzufügen per Kassenzettel
- Ein einzelnes, **lokal laufendes Vision-Modell** (Ollama, Start mit Qwen-VL ~7B) erkennt die Artikel.
- Danach erscheint eine **Bestätigungsliste**, in der man Artikel abwählen, korrigieren und die Anzahl anpassen kann.
  - **[OFFEN]** Konkretes Modell nach Tests an echten Kassenzetteln.

### 4.4 Manuelle Eingabe
- Man gibt Name und Stückzahl ein.
- Beim Tippen schlägt die App bekannte Produkttypen vor (Autovervollständigung), damit keine Dubletten entstehen.

### 4.5 Bestand anpassen
- Stückzahl verringern oder Produkt entfernen, manuell oder per Scan.
- Fällt die Stückzahl auf 0, **verschwindet der Produkttyp** aus der Bestandsübersicht. Technisch wird er nur ausgeblendet und nicht gelöscht, damit Barcode-Zuordnung und Autovervollständigung erhalten bleiben.

## 5. Spätere Erweiterungen
- Einheiten (Stück/g/ml) und Teilverbrauch
- Packungsgröße aus der Produktdatenbank
- MHD: speichern, „läuft bald ab“-Anzeige, Bereich für abgelaufene Produkte
- Lagerort mit Filter
- Knappheitswarnung (rote Markierung oder Notification)
- Einkaufsliste, eventuell automatisch befüllt, wenn ein Produkt auf 0 fällt
- Rezeptvorschläge auf Basis des Bestands
- Haushalte mit eigenen Nutzerkonten und Beitritt per Einladungslink
- Ensemble aus mehreren Modellen für den Kassenzettel, falls die Erkennung zu unzuverlässig ist
- Abgleich manueller Eingaben mit dem externen Katalog („Meinst du …?“)

## 6. Offene Punkte
- Konkretes Modell für die Kassenzettel-Erkennung (nach Tests)
- Hosting (das lokale LLM braucht Zugriff auf eine GPU)
