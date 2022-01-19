            /**
             *  Angabe des Amtlichen Gemeindeschlüssels (AGS), aus dem der Landkreis und das Bundelsand ermittelt werden.
             *  Hier reichen die ersten 5 Stellen des ingesesamt 8-stelligen Schlüssels.
             *  Der Amtliche Gemeindeschlüssel kann bspw. hier ermittelt werden: https://www.statistikportal.de/de/gemeindeverzeichnis
             */
            var gemeindeSchluessel = '09184'; //die ersten 5 Zahlen des Gemeindeschlüssels! Beispiel: Gemeinde Grünwald, Landkreis München: 09184

            /** 
             *  OPTIONAL: Eingabe des Grenzwertes für die Fälle der 7-Tages-Hospitalisierungs-Inzidenz. Ab diesem Wert wird die Ampel GELB! 
             *  Bei Angabe der Zahl 0 (=Standard) wird der Wert automatisch auf Basis des Gemeindeschlüssels über unsere API ermittelt.
             *  Er kann hier jedoch manuell überschrieben werden. Beispiel: Bayern = 1200
             */
            var grenzwertHospitalisierung = 0;
    
            /** 
             *  OPTIONAL: Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel GELB!
             *  Bei Angabe der Zahl 0 (=Standard) wird der Wert automatisch auf Basis des Gemeindeschlüssels über unsere API ermittelt.
             *  Er kann hier jedoch manuell überschrieben werden. Beispiel: Bayern = 450
             */
            var grenzwertIntensivBehandlungGelb = 0;

            /** 
             *  OPTIONAL: Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel ROT!
             *  Bei Angabe der Zahl 0 (=Standard) wird der Wert automatisch auf Basis des Gemeindeschlüssels über unsere API ermittelt.
             *  Er kann hier jedoch manuell überschrieben werden. Beispiel: Bayern = 600
             */
            var grenzwertIntensivBehandlungRot = 0;
            
            /** Eingabe des Grenzwertes für die 7-Tages-Inzidenz im Landkreis, ab dem die 3G-Regel gilt (und der Hinweis dazu angezeigt wird) */
            var grenzwertInzidenz3GRegel = 35;

            /** 
             *  Hotspot-Definition: 
             *  -> grenzwertHotspotInzidenz7Tage: 7-Tages-Inzidenzwert für den Landkreis, ab dem er als Hotspot in Betracht kommt 
             *  -> grenzwertHotspotIntensivbettenAuslastung: Angabe der Intensivbettenauslastung in Prozent, ab dem er als Hotspot in Betracht kommt 
             *  Werden beide Werte überschritten, greift die Hotspot-Regel und die Ampel springt sofort auf Rot. 
             */
            var grenzwertHotspotInzidenz7Tage = 300;
            var grenzwertHotspotIntensivbettenAuslastung = 80; //in Prozent
            /* Falls zutreffend, Hinweis, dass Landkreis ein Hotspot ist immer anzeigen - auch wenn Ampel "regulär" schon auf Rot steht. */
            var hotspotHinweisImmerAnzeigen = false;

            ////////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////////
            // Ab hier sind keine Aenderungen mehr erforderlich!

            var HttpClient = function() {
                this.get = function(request, callback) {
                    var httpRequest = new XMLHttpRequest();
                    httpRequest.onreadystatechange = function() { 
                        if (httpRequest.readyState == 4 && httpRequest.status == 200)
                            callback(httpRequest.responseText);
                    }
                    httpRequest.open("GET", request, true);
                    httpRequest.send(null);
                }
            }
            
            var rkiHospitalisierteFaelle = 0;
            var diviFaelleCovidAktuell = 0;
            var rkiLandkreis7TagesInzidenz = '';
            var format = 'json';
            //Default Werte
            defaultWerteSetzen();
    
            //Ampelanzeige: Einstiegspunkt
            ampelAnzeigen(gemeindeSchluessel);
    
            /**
             * Lädt die Ampel initial mit dem Gemeindeschluessel.
             * @param {*} gemeindeSchluessel 
             */
            function ampelAnzeigen (gemeindeSchluessel) {
                ladeAmpel(gemeindeSchluessel, null, null, null);
            }
            
            /**
             * Laedt und initialisiert die Ampel sowie die im Text verwendeten Parameter mit aktuellen Werten 
             * bezogen auf den Landkreis, der ueber den gemeindeSchluessel ermittelt wird.
             * @param {*} gemeindeSchluessel 
             */
            function ladeAmpel (gemeindeSchluessel, gwHospitalisierung, gwIntensivGelb, gwIntensivRot) {
                gemeindeSchluessel = parseGemeindeschluessel(gemeindeSchluessel);
                if(gwHospitalisierung != null && gwIntensivGelb != null && gwIntensivRot != null) {
                    if(grenzwertIntensivBehandlungGelb < grenzwertIntensivBehandlungRot) {
                        grenzwertHospitalisierung = gwHospitalisierung;
                        grenzwertIntensivBehandlungGelb = gwIntensivGelb;
                        grenzwertIntensivBehandlungRot = gwIntensivRot;
                    }
                }

                var client = new HttpClient();
                var restServiceUrl = 'https://api.corona-zahlen.org/districts/' + gemeindeSchluessel;
                client.get(restServiceUrl, function(response) {              
                    var data = JSON.parse(response);
                    if(data["error"]) {
                        console.error("Fehler bei Aufruf von " + restServiceUrl + "! Fehlermeldung: " + data["error"]["message"] + " - Stack: ");
                        console.error(data["error"]);
                        return;
                    }
                    var landkreisDaten = data['data'][gemeindeSchluessel];
                    rkiLandkreis7TagesInzidenz = Math.round((landkreisDaten['weekIncidence'] * 100)) / 100;

                    //Rest API Aufrufe muessen verschachtelt werden, da Bundesland erst von der RKI API ermittelt wird
                    var nClient = new HttpClient();
                    var nRestServiceUrl = 'https://krankenhausampel.info/corona/v4/?bl=' + landkreisDaten['stateAbbreviation'] + '&gs=' + gemeindeSchluessel;
                    nClient.get(nRestServiceUrl, function(apiResponse) {
                        var result = JSON.parse(apiResponse);
                        //Nur fuer Berechnungen relevante Werte werden hier zugewiesen, 
                        //alle anderen Werte fuer eine Anzeige werden unten in der Funktion ausgelesen
                        rkiHospitalisierteFaelle                = parseInt(result["rki_hospitalisierung"]);
                        diviFaelleCovidAktuell                  = parseInt(result["divi_intensiv"]);
                        diviLandkreisIntensivbettenAuslastung   = parseFloat(result["divi_lk_prozent_anteil_belegte_betten_an_gesamtbetten"]);

                        //Grenzwerte ermitteln und ggfl. manuell überschreiben
                        if(isNaN(grenzwertHospitalisierung) || grenzwertHospitalisierung == 0 ) {
                            grenzwertHospitalisierung = result['bundesland_ampel_grenzwert1'];
                        }
                        if(isNaN(grenzwertIntensivBehandlungGelb) || grenzwertIntensivBehandlungGelb == 0 ) {
                            grenzwertIntensivBehandlungGelb = result['bundesland_ampel_grenzwert2'];
                        }
                        if(isNaN(grenzwertIntensivBehandlungRot) || grenzwertIntensivBehandlungRot == 0 ) {
                            grenzwertIntensivBehandlungRot = result['bundesland_ampel_grenzwert3'];
                        }
                        defaultGrenzwerteSetzen(grenzwertHospitalisierung, grenzwertIntensivBehandlungGelb, grenzwertIntensivBehandlungRot);
                        //Grenzwerte zu "echten" Zahlen parsen
                        grenzwertHospitalisierung = parseInt(grenzwertHospitalisierung);
                        grenzwertIntensivBehandlungGelb = parseInt(grenzwertIntensivBehandlungGelb);
                        grenzwertIntensivBehandlungRot = parseInt(grenzwertIntensivBehandlungRot);

                        //Ermitteln ob Landkreis ein Hotspot ist
                        var istHotspot = false;
                        if(rkiLandkreis7TagesInzidenz >= grenzwertHotspotInzidenz7Tage && diviLandkreisIntensivbettenAuslastung >= grenzwertHotspotIntensivbettenAuslastung){
                            istHotspot = true;
                            console.log('Der ' + landkreisDaten['county'] + ' wurde als Hotspot identifiziert, da Auslastung der Intensivbetten >= ' + grenzwertHotspotIntensivbettenAuslastung + '% (ist: ' + diviLandkreisIntensivbettenAuslastung + '%) UND 7-Tages-Inzidenzwert >= ' + grenzwertHotspotInzidenz7Tage + ' (ist: ' + rkiLandkreis7TagesInzidenz + ')!');
                        }

                        /** Setze den Zusatztext unter der Ampel fuer 3G */
                        var ampelzusatztext = "";
                        if(rkiLandkreis7TagesInzidenz >= grenzwertInzidenz3GRegel){
                            hinweiseAnzeigen("hinweis3GRegel");
                            ampelzusatztext = "3G-Regel";
                        } 
                        /** Ampelfarbe setzen (rot schlaegt gelb) */
                        cssClassAmpelfarbe = "ampelgruen"; //default gruen
                        ampelfarbeText = "Gr&uuml;n";
                        if(rkiHospitalisierteFaelle >= grenzwertHospitalisierung) {
                            cssClassAmpelfarbe ="ampelgelb";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3GPlus-Regel";
                            hinweiseAnzeigen("hinweis3GplusRegel");
                        }
                        if (diviFaelleCovidAktuell >= grenzwertIntensivBehandlungGelb) {
                            cssClassAmpelfarbe ="ampelgelb";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3G<font style='text-transform:lowercase;'>Plus</font>-Regel";
                            hinweiseAnzeigen("hinweis3GplusRegel");
                        }
                        if (diviFaelleCovidAktuell >= grenzwertIntensivBehandlungRot || istHotspot) {
                            cssClassAmpelfarbe ="ampelrot";
                            ampelfarbeText = "Rot";
                            ampelzusatztext = "2G-Regel";
                            hinweiseAnzeigen("hinweis2GRegel");
							//Falls LK als Hotspot identifiziert wurde, aber im BL die Faelle auf Intensivstationen noch nicht kritisch sind,
							//(Ampel Gruen oder Gelb) dann Hotspot-Hinweis immer anzeigen, auch wenn hotspotHinweisImmerAnzeigen auf FALSE steht.
							if(diviFaelleCovidAktuell < grenzwertIntensivBehandlungRot) hotspotHinweisImmerAnzeigen = true;
							if (istHotspot && hotspotHinweisImmerAnzeigen){
								if(document.getElementById("hinweisHotspot") != null)
									document.getElementById("hinweisHotspot").style.display = "contents";								
							}
                        }
                        
                        /** v4 - Aktuelles "Dauerrot" der Ampel fuer die Bundeslaender in der API berücksichtigen */
                        if(result["bundesland_ampel_dauerrot"] && result["bundesland_ampel_dauerrot"] === true){
                            console.log("Ampel steht aktuell für " + landkreisDaten['state'] + " auf Dauerrot! Es werden keine Inzidenz- oder Hospitalisierungswerte bei der Ampelfarbe zurberücksichtigt.");
                            cssClassAmpelfarbe ="ampelrot";
                            ampelfarbeText = "Rot";
                            ampelzusatztext = "2G-Regel";
                            hinweiseAnzeigen("hinweis2GRegel");
                        }

                        /** Zusatztext unter der Ampel je nach Ampelfarbe (2G, 3G, 3GPlus,...) */
                        if(document.getElementById("ampelzusatztext") != null)
                            document.getElementById("ampelzusatztext").innerHTML = ampelzusatztext;
                
                        if(document.getElementById("ampeltext") != null)
                            document.getElementById("ampeltext").setAttribute("style", "display:flex;");
                        
                        if(document.getElementById("ampelfarbe") != null)
                           document.getElementById("ampelfarbe").setAttribute("class", cssClassAmpelfarbe);
                        
                        if(document.getElementById("ampeltext") != null)
                            document.getElementById("ampeltext").innerHTML = ampelfarbeText;
                
                        /** Berechne Zeigerstellung  (#divHospitalisierungBreite) */
                        var zeigerStellung = 0;
                        zeigerStellung = Math.round((rkiHospitalisierteFaelle * 68) / grenzwertHospitalisierung);
                        if(zeigerStellung >= 95) { zeigerStellung = 95; } //Verhindern dass Zeigerspitze rechts neben Balken landet...
                        if(zeigerStellung <= 2) { zeigerStellung = 2; } //Verhindern dass Zeigerspitze links neben Balken landet...
                
                        if(document.getElementById("divHospitalisierungBreite") != null)
                            document.getElementById("divHospitalisierungBreite").setAttribute("style","width:" + zeigerStellung + "%");
                
                        /** Berechne Zeigerstellung  (#divBehandlungBreite) */
                        zeigerStellung = 0;
                        /** Beruecksichtigung Prozentangaben bei Ampelfarbenbreite IntensivBehandlung */
                        if(diviFaelleCovidAktuell <= grenzwertIntensivBehandlungGelb) {
                            zeigerStellung = Math.round((diviFaelleCovidAktuell * 34) / grenzwertIntensivBehandlungGelb);    
                        }
                        if(diviFaelleCovidAktuell > grenzwertIntensivBehandlungGelb && diviFaelleCovidAktuell < grenzwertIntensivBehandlungRot) {
                            zeigerStellung = Math.round( ((diviFaelleCovidAktuell*100) / grenzwertIntensivBehandlungGelb) - 66);
                        }
                        if(diviFaelleCovidAktuell >= grenzwertIntensivBehandlungRot) {
                            zeigerStellung = Math.round((diviFaelleCovidAktuell * 67) / grenzwertIntensivBehandlungRot);
                        }
                                
                        if(zeigerStellung >= 95) { zeigerStellung = 95; } //Verhindern dass Zeigerspitze rechts neben Balken landet...
                        if(zeigerStellung <= 2) { zeigerStellung = 2; } //Verhindern dass Zeigerspitze links neben Balken landet...

                        if(document.getElementById("divBehandlungBreite") != null)
                            document.getElementById("divBehandlungBreite").setAttribute("style","width:" + zeigerStellung + "%");

                        //Alle Daten zur Anzeige und Nutzung im Frontend vorbereiten
                        anzeigeWerte(gemeindeSchluessel, data, result, ampelfarbeText, istHotspot);
                    });                
                });
                console.log('Die angezeigte Krankenhausampel ist kostenlos und konfigurierbar als Skript verfuegbar: www.krankenhausampel.info');
            }

            /**
             * Anzeige des <span> Tags mit der id in Parmeter "hinweisAn".
             * Alle anderen Elemente werden auf 'display:none' gesetzt.
             * @param {*} hinweisAn - CSS id des Elementes, was angezeigt werden soll (hinweis2GRegel, hinweis2GplusRegel, hinweis3GRegel oder hinweis2GplusRegel)
             */
            function hinweiseAnzeigen(hinweisAn) {
                if (document.getElementById("hinweis3GplusRegel") != null) { document.getElementById("hinweis3GplusRegel").style.display = "none"; }
                if (document.getElementById("hinweis3GRegel") != null) { document.getElementById("hinweis3GRegel").style.display = "none"; }
                if (document.getElementById("hinweis2GRegel") != null) { document.getElementById("hinweis2GRegel").style.display = "none"; }
                if (document.getElementById("hinweis2GplusRegel") != null) { document.getElementById("hinweis2GplusRegel").style.display = "none"; }
                if (document.getElementById(hinweisAn) != null) { document.getElementById(hinweisAn).style.display = "contents"; }
            }

            /**
             * Gemeindeschluessel ermitteln: https://www.riserid.eu/data/user_upload/downloads/info-pdf.s/Diverses/Liste-Amtlicher-Gemeindeschluessel-AGS-2015.pdf
             * Es werden nur die ersten 5 Zahlen des 8-telligen Gemeindeschluessels benoetigt, 
             * da diese den Landkreis spezifizieren, zu dem die Daten ermittelt werden.
             * Siehe auch: https://de.wikipedia.org/wiki/Amtlicher_Gemeindeschl%C3%BCssel
             * @param {*} gemeindeSchluessel 
             */
            function parseGemeindeschluessel(gemeindeSchluessel){
                if(gemeindeSchluessel.length > 5) {
                    gemeindeSchluessel = gemeindeSchluessel.substring(0,5);
                }else if (gemeindeSchluessel.length < 5) {
                    console.error("Kein gueltiger Gemeindeschluessel! Der angegebene Gemeindeschluessel '" + gemeindeSchluessel + "' ist zu kurz.");
                    gemeindeSchluessel = '09184'; //Default: Landkreis Muenchen
                }
                return gemeindeSchluessel;
            }

            function defaultGrenzwerteSetzen(gw1, gw2, gw3){
                if(gw1 != null && gw2 != null && gw3 != null) {
                    grenzwertHospitalisierung = gw1;
                    grenzwertIntensivBehandlungGelb = gw2;
                    grenzwertIntensivBehandlungRot = gw3;
                }                
                //Grenzwerte setzen
                if(document.getElementById("anzeigeAmpelGrenzwertHospitalisierung") != null) { document.getElementById("anzeigeAmpelGrenzwertHospitalisierung").innerHTML ="Grenzwert: " + grenzwertHospitalisierung + "&nbsp;"; }
                if(document.getElementById("anzeigeAmpelGrenzwertIntensivGelb") != null) { document.getElementById("anzeigeAmpelGrenzwertIntensivGelb").innerHTML ="Grenzwerte: " + grenzwertIntensivBehandlungGelb + "&nbsp;"; }
                if(document.getElementById("anzeigeAmpelGrenzwertIntensivRot") != null) { document.getElementById("anzeigeAmpelGrenzwertIntensivRot").innerHTML = grenzwertIntensivBehandlungRot + "&nbsp;"; }
            }

            /**
             * Default Werte der Ampel setzen. 
             */
            function defaultWerteSetzen() {
                defaultGrenzwerteSetzen(null, null, null);
                //Hinweise mit Regeltexten (2G/3G/3Gplus/Hotspot) alle nicht sichtbar 
                if(document.getElementById("hinweisHotspot") != null) { document.getElementById("hinweisHotspot").style.display = "none"; }
                if(document.getElementById("hinweis2GplusRegel") != null) { document.getElementById("hinweis2GplusRegel").style.display = "none"; }
                if(document.getElementById("hinweis2GRegel") != null) { document.getElementById("hinweis2GRegel").style.display = "none"; }
                if(document.getElementById("hinweis3GRegel") != null) { document.getElementById("hinweis3GRegel").style.display = "none"; }
                if(document.getElementById("hinweis3GplusRegel") != null) { document.getElementById("hinweis3GplusRegel").style.display = "none"; }
                //Ampel Farbe + Text setzen
                if(document.getElementById("ampeltext") != null) { document.getElementById("ampeltext").innerHTML = ""; }
                if(document.getElementById("ampelfarbe") != null) { document.getElementById("ampelfarbe").setAttribute("class", "ampelFarbeInitial"); }
            }

            /**
             * Bereitet alle verfuegbaren Daten fuer eine Anzeige im Frontend vor. 
             * Der Key im "mapping" Array ist dabei der Name, den ein "class" Attribut in einem HTML-Tag bekommen muss,
             * damit der Wert angezeigt wird. Bspw: <span class="anzeigeLandkreisname"></span>
             * @param {*} datenCoronaAPI 
             * @param {*} datenKHAAPI 
             * @param {*} ampelFarbe 
             * @param {*} istHotspot
             */
            function anzeigeWerte (gemeindeSchluessel, datenCoronaAPI, datenKHAAPI, ampelFarbe, istHotspot) {
                var lkDaten = datenCoronaAPI['data'][gemeindeSchluessel];
                var hotspot = (istHotspot)? "Ja" :  "Nein"; 
                var hotspotText = "kein Hotspot";
                if(istHotspot) {
                    hotspotText = "Hotspot";
                }
                //Mapping aller verfuegbarer Daten fuer eine Anzeige.  
                var mapping = { "anzeigeLandkreisname": lkDaten['county'].replace('LK', 'Landkreis'),
                                "anzeigeLandkreisEinwohnerzahl": parseInt(lkDaten['population']),
                                "anzeige7TageInzidenzWert": (Math.round((lkDaten['weekIncidence'] * 100)) / 100).toFixed(2),
                                "anzeigeLetztesUpdateRKI": new Date( datenCoronaAPI['meta']['lastUpdate']).toLocaleDateString("de-DE", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' Uhr',
                                "anzeigeBundeslandName": lkDaten['state'],
                                "anzeigeHospitalisierteFaelle": datenKHAAPI["rki_hospitalisierung"],
                                "anzeige7TageInzidenzHospitalisierung": parseFloat(datenKHAAPI["rki_hospitalisierung_inzidenz"]).toFixed(2),
                                "anzeigeCOVID19FaelleAktuell": parseInt(datenKHAAPI["divi_intensiv"]),
                                "anzeigeLetztesUpdateDIVI": datenKHAAPI["divi_datenstand"],
                                "anzeigeBundeslandAdverb": datenKHAAPI['bundesland_name_adverb'],
                                "anzeigeBundeslandInfoUrl": datenKHAAPI['bundesland_info_url'],
                                "anzeigeAnzahlStandorte": parseInt(datenKHAAPI["divi_lk_anzahl_standorte"]),
                                "anzeigeAnzahlMeldebereiche": parseInt(datenKHAAPI["divi_lk_anzahl_meldebereiche"]),
                                "anzeigeAnzahlBettenFrei": parseInt(datenKHAAPI["divi_lk_betten_frei"]),
                                "anzeigeAnzahlBettenBelegt": parseInt(datenKHAAPI["divi_lk_betten_belegt"]),
                                "anzeigeCOVID19FaelleLKAktuell": parseInt(datenKHAAPI["divi_lk_faelle_covid_aktuell"]),
                                "anzeigeCOVID19FaelleAktuellBeatmet": parseInt(datenKHAAPI["divi_lk_faelle_covid_aktuell_invasiv_beatmet"]),
                                "anzeigeCOVID19FaelleGesamt": parseInt(lkDaten['cases']),
                                "anzeigeCOVID19FaelleGesamtTod": parseInt(lkDaten['deaths']),
                                "anzeigeCOVID19FaellePro100kEinwohner": parseFloat(lkDaten['casesPer100k']).toFixed(2),
                                "anzeigeCOVID19FaelleLetzte7Tage": parseInt(lkDaten['casesPerWeek']),
                                "anzeigeCOVID19FaelleLetzte7TageTod": parseInt(lkDaten['deathsPerWeek']),
                                "anzeigeCOVID19FaelleGesamtGenesen": parseInt(lkDaten['recovered']),
                                "anzeigeGrenzeInzidenzWert3G": grenzwertInzidenz3GRegel,
                                "anzeigeGrenzwertHospitalisierung": grenzwertHospitalisierung,
                                "anzeigeGrenzwertIntensivGelb": grenzwertIntensivBehandlungGelb,
                                "anzeigeGrenzwertIntensivRot": grenzwertIntensivBehandlungRot,
                                "anzeigeHotspotInzidenzGrenze7Tage": grenzwertHotspotInzidenz7Tage,
                                "anzeigeHotspotIntensivbettenAuslastungProzent": parseFloat(datenKHAAPI['divi_lk_prozent_anteil_belegte_betten_an_gesamtbetten']),
                                "anzeigeAmpelfarbe": ampelFarbe,
                                "anzeigeHotspotJaNein": hotspot,
                                "anzeigeHotspotText": hotspotText,
                                "anzeigeGemeindeschluessel": gemeindeSchluessel
                            };
                //Alle Elemente mit dem class Wert "key" finden und mit dem Wert ersetzen
                for (var key in mapping) {
                    var output= document.querySelectorAll('[class="'+key+'"]');
                    for(var i = 0; i < output.length; i++) {
                        //Sonderbehandlung: URLs
                        if("A" === output[i].tagName && key.indexOf("Url") != -1){
                            output[i].setAttribute("href", 'https://' + mapping[key]);
                            output[i].setAttribute("title", 'Webseite aufrufen: ' + mapping[key]);
                        }                    
                        output[i].innerHTML = mapping[key];                                                
                    }
                }
                return mapping;
            }