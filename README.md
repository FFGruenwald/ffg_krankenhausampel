# COVID-19 Krankenhaus-Ampel

Die Krankenhaus-Ampel für alle Webseitenbetreiber zur grafischen (oder textuellen) Anzeige auf Webseiten. 
Kostenlos, frei konfigurierbar, für alle Landkreise und Bundesländer. 

> **Ampeltest und Live-Konfiguration unter: https://krankenhausampel.info**

Dieses GitHub-Projekt stellt ein Skript zur Verfügung, welches die aktuelle COVID-19 Hospitalisierungsrate sowie der Auslastung von Intensivbetten durch Corona-Erkrankte in einem Bundesland grafisch gegenüber stellt. Daraus wird die gültige Ampelfarbe abgeleitet und angezeigt. Lokale Hotspots (auf Landkreisebene) werden berücksichtigt. 
Zur Datenermittlung werden die folgenden beiden APIs verwendet:
* [api.corona-zahlen.org vom Robert-Koch-Institut (RKI)](https://api.corona-zahlen.org)
* [Lankreisdaten mit COVID-ITS-Fällen und ITS-Kapazitäten vom DIVI-Intensivregister](https://www.intensivregister.de/#/aktuelle-lage/downloads)

Das Krankenhaus-Ampel Skript verwendet reinen HTML/CSS/JavaScript-Code, womit eine barrierefreie Anzeige möglich ist: 
    
    > Lesbar mit Screenreader
    > Anzeige der Farbnamen für Menschen mit Rot-Grün-Schwäche


## Installation & Grundanpassungen
Die folgenden Schritte sind nötig um die Krankenhausampel für einen beliebigen Landkreis anzuzeigen.
 1) GitHub Projekt auschecken 
    * Alternativ den Source Code des [letzten Releases](https://github.com/mario-fliegner/ffg_krankenhausampel/releases) herunterladen und entpacken.
 2) In der Datei **[js/ampel.js](./js/ampel.js)** die Werte für folgende Parameter anpassen:
    * **`gemeindeSchluessel`** - Angabe des Gemeindeschlüssels (AGS). Aus dem AGS wird der Landkreis sowie das zugehörige Bundesland ermittelt, zu denen die Daten angezeigt werden. Den AGS kann man bspw. im [Statistikportal](https://www.statistikportal.de/de/gemeindeverzeichnis) ermitteln. Für die Krankenhausampel reichen die ersten 5 Stellen (von 8 Stellen). Beispiel: *`09184`*.
    * **`grenzwertHospitalisierung`** - Der Grenzwert für hospitalisierte Fälle der letzten 7 Tage, ab dem die Ampel auf Gelb springt. Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`1200`* für Bayern - d.h., wenn in den letzten 7 Tagen mehr als 1200 Patienten mit COVID-19 in Krankenhäuser aufgenommen wurden, springt die Ampel für Bayern auf Gelb.
    * **`grenzwertIntensivBehandlungGelb`** - Der Grenzwert für Fälle in intensivmedizinischer Behandlung, ab dem die Ampel auf Gelb springt.  Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`450`* für Bayern - d.h., werden mehr als 450 Patienten mit COVID-19 auf Intensivstationen mit behandelt, springt die Ampel für Bayern auf Gelb. 
    * **`grenzwertIntensivBehandlungRot`** - Der Grenzwert für Fälle in intensivmedizinischer Behandlung, ab dem die Ampel auf Rot springt.  Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`600`* für Bayern - d.h., werden mehr als 600 Patienten mit COVID-19 auf Intensivstationen behandelt, springt die Ampel für Bayern auf Rot.
    * **`grenzwertInzidenz3GRegel`** - Der Grenzwert für eine 7-Tages-Inzidenz im Landkreis, ab dem die 3G-Regel (Genese, Geimpft, Getestet) gilt. Ab diesem Wert wird ein Hinweis im Text und unter der Ampel angezeigt.
    * **Hotspotdefinition:** Werden die folgenden beiden Grenzwerte überschritten, springt die Ampel sofort auf Rot, ohne Hospitalisierungsrate und intensivmedizinische Behandlungen zu berücksichtigen:
        * **`grenzwertHotspotInzidenz7Tage`** Der Grenzwert für eine 7-Tages-Inzidenz, ab der ein Landkreis als Hotspot eingestuft wird. Beispiel: *`300`* für Bayern.
        * **`grenzwertHotspotIntensivbettenAuslastung`** - Der Grenzwert (in Prozent) von belegten Intensivbetten im Landkreis, ab dem er als Hotspot eingestuft wird. Beispiel: *`80`* (%) für Bayern. 
3) Nachdem die Werte angepasst wurden, funktioniert die Ampel und kann verwendet werden:
    * Ein Beispiel HTML-Code zur grafischen Anzeige findet sich in der Datei **`ampel.html`**. Diese braucht nach der Anpassung der Parameter im lokalen Projekt nur noch aufgerufen werden und stellt die Ampel für den angegebenen Gemeindeschlüssel dar.
    * Sollen die Daten in einem Fließtext verwendet werden, enthält die Datei **`text.html`** alle verfügbaren Anzeigelemente, mit denen sich die Daten anzeigen lassen (inkl. Dokumentation). Auch diese Datei kann nach der Anpassung der Parameter im lokalen Projekt einfach aufgerufen werden. 
        
Soll die Ampel für einen Landkreis in Bayern angezeigt werden, muss lediglich der Wert für **`gemeindeSchluessel`** angepasst werden. Alle anderen Werte sind im Projekt bereits für Bayern voreingestellt.

## Konfiguration
Die Ampel kann beliebig verändert und den eigenen Bedürfnissen angepasst werden. Lediglich die Bezugsquellen der verwendeten Daten (vom Robert-Koch-Institut sowie vom Intensivregister) müssen ersichtlich bleiben.

* Anpassung des [Textes für die 3G-Regel](https://github.com/mario-fliegner/ffg_krankenhausampel/blob/main/ampel.html#L45).
* Anpassung des [Textes für die 3Gplus-Regel](https://github.com/mario-fliegner/ffg_krankenhausampel/blob/main/ampel.html#L49). 
* Anpassung des [Textes für die 2G-Regel](https://github.com/mario-fliegner/ffg_krankenhausampel/blob/main/ampel.html#L53). 
* Anpassung des [Textes für einen Hotspot](https://github.com/mario-fliegner/ffg_krankenhausampel/blob/main/ampel.html#L57). 
