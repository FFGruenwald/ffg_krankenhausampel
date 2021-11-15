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
    * **`gemeindeSchluessel`** ([Zeile 3](js/ampel.js#L3)) - Angabe des Gemeindeschlüssels (AGS). Aus dem AGS wird der Landkreis sowie das zugehörige Bundesland ermittelt, zu denen die Daten angezeigt werden. Den AGS kann man bspw. im [Statistikportal](https://www.statistikportal.de/de/gemeindeverzeichnis) ermitteln. Für die Krankenhausampel reichen die ersten 5 Stellen (von 8 Stellen). Beispiel: *`09184`*.
    * **`grenzwertHospitalisierung`** ([Zeile 6](js/ampel.js#L6)) - Der Grenzwert für hospitalisierte Fälle der letzten 7 Tage, ab dem die Ampel auf Gelb springt. Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`1200`* für Bayern - d.h., wenn in den letzten 7 Tagen mehr als 1200 Patienten mit COVID-19 in Krankenhäuser aufgenommen wurden, springt die Ampel für Bayern auf Gelb.
    * **`grenzwertIntensivBehandlungGelb`** ([Zeile 9](js/ampel.js#L9))- Der Grenzwert für Fälle in intensivmedizinischer Behandlung, ab dem die Ampel auf Gelb springt.  Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`450`* für Bayern - d.h., werden mehr als 450 Patienten mit COVID-19 auf Intensivstationen mit behandelt, springt die Ampel für Bayern auf Gelb. 
    * **`grenzwertIntensivBehandlungRot`** ([Zeile 12](js/ampel.js#L12)) - Der Grenzwert für Fälle in intensivmedizinischer Behandlung, ab dem die Ampel auf Rot springt.  Dieser Wert unterscheidet sich in den Bundesländern. Beispiel: *`600`* für Bayern - d.h., werden mehr als 600 Patienten mit COVID-19 auf Intensivstationen behandelt, springt die Ampel für Bayern auf Rot.
    * **`grenzwertInzidenz3GRegel`** ([Zeile 15](js/ampel.js#L15)) - Der Grenzwert für eine 7-Tages-Inzidenz im Landkreis, ab dem die 3G-Regel (Genese, Geimpft, Getestet) gilt. Ab diesem Wert wird ein Hinweis im Text und unter der Ampel angezeigt.
    * **Hotspotdefinition:** Werden die folgenden beiden Grenzwerte überschritten, springt die Ampel sofort auf Rot, ohne Hospitalisierungsrate und intensivmedizinische Behandlungen zu berücksichtigen:
        * **`grenzwertHotspotInzidenz7Tage`** ([Zeile 18](js/ampel.js#L18)) - Der Grenzwert für eine 7-Tages-Inzidenz, ab der ein Landkreis als Hotspot eingestuft wird. Beispiel: *`300`* für Bayern.
        * **`grenzwertHotspotIntensivbettenAuslastung`** ([Zeile 19](js/ampel.js#L19)) - Der Grenzwert (in Prozent) von belegten Intensivbetten im Landkreis, ab dem er als Hotspot eingestuft wird. Beispiel: *`80`* (%) für Bayern. 
3) Nachdem die Werte angepasst wurden, funktioniert die Ampel und kann verwendet werden:
    * Ein Beispiel HTML-Code zur grafischen Anzeige findet sich in der Datei **`ampel.html`**. Diese braucht nach der Anpassung der Parameter im lokalen Projekt nur noch aufgerufen werden und stellt die Ampel für den angegebenen Gemeindeschlüssel dar.
    * Sollen die Daten in einem Fließtext verwendet werden, enthält die Datei **`text.html`** alle verfügbaren Anzeigelemente, mit denen sich die Daten anzeigen lassen (inkl. Dokumentation). Auch diese Datei kann nach der Anpassung der Parameter im lokalen Projekt einfach aufgerufen werden. 
        
Soll die Ampel für einen Landkreis in Bayern angezeigt werden, muss lediglich der Wert für **`gemeindeSchluessel`** angepasst werden. Alle anderen Werte sind im Projekt bereits für Bayern voreingestellt.

## Weitere Anpassungen
Die Ampel kann beliebig verändert und den eigenen Bedürfnissen angepasst werden. Lediglich die Bezugsquellen der verwendeten Daten (Fußnoten) müssen ersichtlich bleiben. Die folgenden Änderungen beziehen sich alle auf die Beispieldatei [**`ampel.html`**](ampel.html): 

* **Ampel ohne Rahmen:** Um den Rahmen zu entfernen, einfach das `<div>`-Element mit der `id="ampelBox"` um die CSS-Klasse _`rahmenlos`_ erweitern - bzw. [Zeile 17](ampel.html#L17) entfernen und dafür [Zeile 18](ampel.html#L18) verwenden (=Kommentar entfernen). 
* **Farbnamen auf Balken:** Wenn es nicht gewünscht ist, die Farbnamen ("Gelb" und "Rot") auf den Balken der Ampel-Indikatoren anzuzeigen, muss  die CSS-Klasse _`farbnameSichtbar`_ auf den `<div>`-Elementen
     * `id="balkenFarbeGelbHospitalisierteFaelle"`
     * `id="balkenFarbeGelbIntensivbehandlung"` und
     * `id="balkenFarbeRot"`
     
     entfernt werden. Einfach mit `STRG+F` nach _`farbnameSichtbar`_ suchen und alle Vorkommnisse entfernen.

* **Farbname in Ampel:** Um den Farbnamen in der Ampel nicht in voller Deckkraft sondern etwas transparenter (_stylischer_) anzuzeigen kann bei dem `<div>`-Element mit der `id="ampeltext"` die CSS-Klasse _`farbnameVolleDeckkraft`_ entfernt werden.

* **Anpassung der Text für die angezeigten Regeln:** Die Texte zu den aktuell geltenden Regeln (2G, 3G, 3Gplus) können beliebig angepasst werden: 
   * Text für die 3G-Regel in [Zeile 45](ampel.html#L45)
   * Text für die 3Gplus-Regel in [Zeile 49](ampel.html#L49). 
   * Text für die 2G-Regel [Zeile 53](ampel.html#L53). 
   * Text für einen identifizierten Hotspot Landkreis [Zeile 57](ampel.html#L57). 
