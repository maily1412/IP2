# Konsolidierte Projektspezifikation: Lebensmittel-Inventar-App

## 1. Systemübersicht & Zielsetzung
Entwicklung einer Anwendung zur Verwaltung des privaten Lebensmittelbestands. Das System ermöglicht Normalverbrauchern die digitale Nachverfolgung ihrer Bestände, um Doppelkäufe zu vermeiden und Transparenz über vorhandene Lebensmittel zu schaffen.

## 2. Kernfunktionen (Basisversion / Unverzichtbar)
* **Bestandsübersicht:** Anzeige aller aktuell im Haushalt verfügbaren Produkte inklusive Quantität/Mengenangabe.
* **Produkte hinzufügen:**
  * Einscannen von Barcodes einzelner Produkte via Kamera/Scanner.
  * Einscannen von Kassenzetteln zur automatischen Erkennung und Übernahme mehrerer Artikel.
  * Manuelle Eingabe über ein Formular (Eingabefelder für Name, Menge und ggf. Marke).
* **Bestand anpassen / Produkte entfernen:**
  * Funktion zur Reduzierung oder Löschung von Beständen bei Verbrauch (manuell oder durch Scannen vor dem Verbrauchen).
* **Datenverwaltung:**
  * Anlegen und Verwalten von Inventaren.

## 3. Erweiterungen & Erweiterungsideen (Zukünftig / Nice-to-have)
* **Knappheits-Warnung:** Visualisierung (z. B. rote Markierung oder Notification) bei niedrigem Lagerbestand.
* **MHD-Tracker:** Nachverfolgung des Mindesthaltbarkeitsdatums (erfordert zusätzliche Dateneingabe über den Kassenzettel hinaus).
* **Einkaufslisten & Rezeptideen:** Generierung von Rezeptvorschlägen basierend auf dem aktuellen Inventar.

## 4. Technische Rahmenbedingungen & Ungeklärte Punkte (Offen)

1. **Systemarchitektur & Hosting:**
   * Zentrale WebMobile-App mit Cloud-/Zentral-Datenbank.
2. **Datenmodellierung:**
   * reine Gruppierung nach Produkttyp (z. B. Bio-Karotten), hersteller/marke wird direkt verworfen.
3. **Erfassungslogik beim Barcode-Scan:**
   * Mehrfach scannen / einmal scannen und dann über counter manuell quantität setzen.
4. **Verarbeitung von Kassenzetteln:**
   * Vision-Language-Ensemble (mehrfach Scan und wenn 9/10 mal biokarotten erkannt werden dann werden die genommen), damit einzelne modellfehler nicht zu stark reinpfuschen
   * manuelle Eingabe (Text) möglich, wird regelmäßig in barcode-riesen-katalog gesucht und bei gegebener Sicherheit wird gefragt, ob das das Produkt ist und der NUtzer kann dann sagen, dass das so ist oder eben nicht
5. **Hardware-Einbindung:**
   * Reine Nutzung von Smartphone-Kameras
