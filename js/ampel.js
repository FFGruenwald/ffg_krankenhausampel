            /** Angabe des Gemeindeschlüssels, aus dem der Landkreis ermittelt wird! Es genügen die erste 5 Zahlen!
            /** Gemeindeschlüssel hier ermitteln: https://www.riserid.eu/data/user_upload/downloads/info-pdf.s/Diverses/Liste-Amtlicher-Gemeindeschluessel-AGS-2015.pdf */
            var gemeindeSchluessel = '09184'; //die ersten 5 Zahlen des Gemeindeschlüssels! Beispiel: Gemeinde Grünwald, Landkreis München: 09184

            /** Eingabe des Grenzwertes für die Fälle der 7-Tages-Hospitalisierungs-Inzidenz. Ab diesem Wert wird die Ampel GELB */
            var grenzwertHospitalisierung = 1200; //Bayern = 1200
    
            /** Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel GELB */
            var grenzwertIntensivBehandlungGelb = 450; //Bayern = 450

            /** Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel ROT */
            var grenzwertIntensivBehandlungRot = 600; //Bayern = 600
            
            /** Eingabe des Grenzwertes für 7-Tage Inzidenz im Landkreis (siehe gemeindeSchluessel). Ab diesem Wert gilt die 3G-Regel */
            var grenzwertInzidenz3GRegel = 35;

            /** Hotspot-Definition: 7-Tage Inzidenzwert Landkreis und Angabe Intensivbettenauslastung ab dem die Hotspot-Regel greift (Ampel ROT) */
            var grenzwertHotspotInzidenz7Tage = 300;
            var grenzwertHotspotIntensivbettenAuslastung = 80; //in Prozent

            ////////////////////////////////////////////////////////////////////////////////////////////////////
            // Ab hier sind keine Aenderungen mehr erforderlich

            var rkiHospitalisierteFaelle = 0;
            var diviFaelleCovidAktuell = 0;
            var rkiDatenstand = "";
            var diviDatenstand = "";
            var format = 'json';
            var rkiLandkreisName = '';
            var rkiLandkreis7TagesInzidenz = '';
            var rkiLandkreisLastUpdate = '';
            var rkiLandkreisBundeslandKurzname = '';
            var rkiLandkreisBundesland = '';
            var rkiBundeslandNameAdverb = '';
    
            //** Start: Default Werte setzen und Ampel initialisieren */
            document.getElementById("anzeigeAmpelGrenzwertHospitalisierung").innerHTML ="Grenzwert: " + grenzwertHospitalisierung + "&nbsp;";
            document.getElementById("anzeigeAmpelGrenzwertIntensivGelb").innerHTML ="Grenzwerte: " + grenzwertIntensivBehandlungGelb + "&nbsp;";
            document.getElementById("anzeigeAmpelGrenzwertIntensivRot").innerHTML = grenzwertIntensivBehandlungRot + "&nbsp;";
            document.getElementById("hinweisHotspot").style.display ="none";
            document.getElementById("hinweis2GRegel").style.display ="none";
            document.getElementById("hinweis3GRegel").style.display ="none";
            document.getElementById("hinweis3GplusRegel").style.display ="none";
            document.getElementById("ampeltext").innerHTML = "";
            document.getElementById("ampelfarbe").setAttribute("class", "ampelFarbeInitial");
            //** Ende: Default Werte setzen und Ampel initialisieren */
    
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
    
            load(gemeindeSchluessel);
    
            /**
             * Lädt die Ampel initial mit dem Gemeindeschluessel.
             * @param {*} gemeindeSchluessel 
             */
            function load (gemeindeSchluessel) {
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
                //Zu echten Zahlen parsen
                grenzwertHospitalisierung = parseInt(grenzwertHospitalisierung);
                grenzwertIntensivBehandlungGelb = parseInt(grenzwertIntensivBehandlungGelb);
                grenzwertIntensivBehandlungRot = parseInt(grenzwertIntensivBehandlungRot);
                var client = new HttpClient();
                var restServiceUrl = 'https://api.corona-zahlen.org/districts/' + gemeindeSchluessel;
                client.get(restServiceUrl, function(response) {              
                    var data = JSON.parse(response);
                    if(data["error"]) {
                        console.error("Fehler bei Aufruf von " + restServiceUrl + "! Fehlermeldung: " + data["error"]["message"] + " - Stack: ");
                        console.error(data["error"]);
                        return;
                    }
                    var meta = data['meta'];
                    var landkreisDaten = data['data'][gemeindeSchluessel];

                    //Start: Alle Werte, die ueber die RKI API api.corona-zahlen.org verfuegbar sind, und verwendet werden koennen,
                    //d.h., nicht alle Werte werden in der Krankenhausampel verwendet.                
                    rkiLandkreisName                            = landkreisDaten['county'].replace('LK', 'Landkreis');
                    rkiLandkreis7TagesInzidenz                  = Math.round((landkreisDaten['weekIncidence'] * 100)) / 100;
                    rkiLandkreisLastUpdate                      = new Date(meta['lastUpdate']).toLocaleDateString("de-DE", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' Uhr';
                    rkiLandkreisBundeslandKurzname              = landkreisDaten['stateAbbreviation']; // bspw. BY, SN, RP, BW,...
                    rkiLandkreisBundesland                      = landkreisDaten['state']; //Bayern, Sachsen, Rheinland-Pfalz,... 
                    rkiLandkreisEinwohnerAnzahl                 = parseInt(landkreisDaten['population']);
                    rkiLandkreisCOVID19Faelle                   = parseInt(landkreisDaten['cases']);
                    rkiLandkreisCOVID19FaelleTod                = parseInt(landkreisDaten['deaths']);
                    rkiLandkreisCOVID19FaellePro100kEinwohner   = parseInt(landkreisDaten['casesPer100k']);
                    rkiLandkreisCOVID19FaelleLetzte7Tage        = parseInt(landkreisDaten['casesPerWeek']);
                    rkiLandkreisCOVID19FaelleLetzte7TageTod     = parseInt(landkreisDaten['deathsPerWeek']);
                    rkiLandkreisCOVID19FaelleGenesen            = parseInt(landkreisDaten['recovered']);
                    
                    //Setzen der ermittelten Werte fuer die Anzeige im HTML Teil.
                    // Name des Landkreises:  <span id="anzeigeLandkreisname"></span>
                    var lk = document.querySelectorAll('[class="anzeigeLandkreisname"]');
                    for(var i = 0; i < lk.length; i++) {
                        lk[i].innerHTML = rkiLandkreisName;
                    }

                    // 7-Tages-Inzidenzwert
                    var inz = document.querySelectorAll('[id="anzeige7TageInzidenzWert"]');
                    for(var i = 0; i < inz.length; i++) {
                        inz[i].innerHTML = rkiLandkreis7TagesInzidenz;
                    }        

                    // Letztes Update RKI Daten 
                    var letztesUpdate= document.querySelectorAll('[class="anzeigeLetztesUpdateRKI"]');
                    for(var i = 0; i < letztesUpdate.length; i++) {
                        letztesUpdate[i].innerHTML = rkiLandkreisLastUpdate;
                    }
    
                    // Inzidenz Grenzwert 3G ersetzen
                    var grenzwert3G= document.querySelectorAll('[id="anzeigeGrenzeInzidenzWert3G"]');
                    for(var i = 0; i < grenzwert3G.length; i++) {
                        grenzwert3G[i].innerHTML = grenzwertInzidenz3GRegel;
                    }
    
                    //Rest API Aufrufe muessen verschachtelt werden, da Bundesland erst von der RKI API ermittelt wird
                    var nClient = new HttpClient();
                    var nRestServiceUrl = 'https://krankenhausampel.info/corona/v3/?bl=' + rkiLandkreisBundeslandKurzname + '&gs=' + gemeindeSchluessel;
                    nClient.get(nRestServiceUrl, function(response1) {
                        var result = JSON.parse(response1);
                        
                        //Start: Alle Werte, die ueber unsere Krankenausampel API verfuegbar sind, und verwendet werden koennen, 
                        //d.h., nicht alle Werte werden auch in der Krankenhausampel verwendet - waeren aber verfuegbar.
                        //Da Aufruf asynchron ist, sollten alle Variablen ausserhalb der Funktion und des Restcalls definiert werden.
                        rkiHospitalisierteFaelle                = parseInt(result["rki_hospitalisierung"]);
                        rkiInzidenz7TageHospitalisierung        = parseFloat(result["rki_hospitalisierung_inzidenz"]);
                        rkiDatenstand                           = result["rki_datenstand"];                                            
                        diviFaelleCovidAktuell                  = parseInt(result["divi_intensiv"]);
                        diviDatenstand                          = result["divi_datenstand"];
                        diviLandkreisAnzahlStandorte            = parseInt(result["divi_lk_anzahl_standorte"]);
                        diviLandkreisAnzahlMeldebereich         = parseInt(result["divi_lk_anzahl_meldebereiche"]);
                        diviLandkreisIntensivbettenAuslastung   = parseFloat(result["divi_lk_prozent_anteil_belegte_betten_an_gesamtbetten"]);
                        diviLandkreisBettenFrei                 = parseInt(result["divi_lk_betten_frei"]);
                        diviLandkreisBettenBelegt               = parseInt(result["divi_lk_betten_belegt"]);
                        diviLandkreisCOVIDFaelleAktuell         = parseInt(result["divi_lk_faelle_covid_aktuell"]);
                        diviLandkreisCOVIDFaelleAktuellBeatmet  = parseInt(result["divi_lk_faelle_covid_aktuell_invasiv_beatmet"]);
                        rkiBundeslandNameAdverb                 = result['bundesland_name_adverb']
                        //Ende: Alle verfuegbaren Werte aus der API

                        var istHotspot = false;
                        if(rkiLandkreis7TagesInzidenz >= grenzwertHotspotInzidenz7Tage && diviLandkreisIntensivbettenAuslastung >= grenzwertHotspotIntensivbettenAuslastung){
                            istHotspot = true;
                            console.log('Der ' + rkiLandkreisName + ' wurde als Hotspot identifiziert, da Auslastung der Intensivbetten >= ' + grenzwertHotspotIntensivbettenAuslastung + '% (ist: ' + diviLandkreisIntensivbettenAuslastung + '%) UND 7-Tages-Inzidenzwert >= ' + grenzwertHotspotInzidenz7Tage + ' (ist: ' + rkiLandkreis7TagesInzidenz + ')!');
                        }
        
                        var anzeigeFaelleCovidAktuell= document.querySelectorAll('[class="anzeigeFaelleCovidAktuell"]');
                        for(var i = 0; i < anzeigeFaelleCovidAktuell.length; i++) {
                            anzeigeFaelleCovidAktuell[i].innerHTML = diviFaelleCovidAktuell;
                        }
                        var anzeigeHospitalisierteFaelle= document.querySelectorAll('[class="anzeigeHospitalisierteFaelle"]');
                        for(var i = 0; i < anzeigeHospitalisierteFaelle.length; i++) {
                            anzeigeHospitalisierteFaelle[i].innerHTML = rkiHospitalisierteFaelle;
                        }
                        var anzeigeLetztesUpdateDIVI= document.querySelectorAll('[class="anzeigeLetztesUpdateDIVI"]');
                        for(var i = 0; i < anzeigeLetztesUpdateDIVI.length; i++) {
                            anzeigeLetztesUpdateDIVI[i].innerHTML = diviDatenstand;
                        }
        
                        var anzeigeLetztesUpdateLGL= document.querySelectorAll('[class="anzeigeLetztesUpdateLGL"]');
                        for(var i = 0; i < anzeigeLetztesUpdateLGL.length; i++) {
                            anzeigeLetztesUpdateLGL[i].innerHTML = rkiDatenstand;
                        }

                        var anzeigeBundeslandName= document.querySelectorAll('[class="anzeigeBundeslandName"]');
                        for(var i = 0; i < anzeigeBundeslandName.length; i++) {
                            anzeigeBundeslandName[i].innerHTML = rkiLandkreisBundesland;
                        }

                        var anzeigeBundeslandAdverb= document.querySelectorAll('[class="anzeigeBundeslandAdverb"]');
                        for(var i = 0; i < anzeigeBundeslandAdverb.length; i++) {
                            anzeigeBundeslandAdverb[i].innerHTML = rkiBundeslandNameAdverb;
                        }

                        document.getElementById("anzeige7TageInzidenzHospitalisierung").innerHTML = rkiInzidenz7TageHospitalisierung;

                        /** Setze den Zusatztext unter der Ampel fuer 3G */
                        var ampelzusatztext = "";
                        if(rkiLandkreis7TagesInzidenz >= grenzwertInzidenz3GRegel){
                            hinweiseAnzeigen("hinweis3GRegel");
                            ampelzusatztext = "3G-Regel";
                        } 
                        /** Ampelfarbe setzen (rot schlaegt gelb) */
                        cssClassAmpelfarbe = "ampelgruen"; //default gruen
                        //cssAmpeltextfarbe = "#fff"; //wenn Gelb, kann man den weissen Text in der Ampel nicht mehr lesen... in dem Fall auf dunklere Farbe setzen
                        ampelfarbeText = "Gr&uuml;n";
                        if(rkiHospitalisierteFaelle >= grenzwertHospitalisierung) {
                            cssClassAmpelfarbe ="ampelgelb";
                            //cssAmpeltextfarbe = "#000";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3GPlus-Regel";
                            hinweiseAnzeigen("hinweis3GplusRegel");
                        }
                        if (diviFaelleCovidAktuell >= grenzwertIntensivBehandlungGelb) {
                            cssClassAmpelfarbe ="ampelgelb";
                            //cssAmpeltextfarbe = "#fff";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3G<font style='text-transform:lowercase;'>Plus</font>-Regel";
                            hinweiseAnzeigen("hinweis3GplusRegel");
                        }
                        if (diviFaelleCovidAktuell >= grenzwertIntensivBehandlungRot) {
                            cssClassAmpelfarbe ="ampelrot";
                            //cssAmpeltextfarbe = "#fff";
                            ampelfarbeText = "Rot";
                            ampelzusatztext = "2G-Regel";
                            hinweiseAnzeigen("hinweis2GRegel");
                        }
                        //Hotspot schlaegt alle Farben:
                        if(istHotspot) {
                            cssClassAmpelfarbe ="ampelrot";
                            //cssAmpeltextfarbe = "#fff";
                            ampelfarbeText = "Rot";
                            ampelzusatztext = "2G-Regel";
                            document.getElementById("hinweisHotspot").style.display = "contents";
                        }

                        /** Zusatztext unter der Ampel je nach Ampelfarbe (2G, 3G, 3GPlus,...) */
                        document.getElementById("ampelzusatztext").innerHTML = ampelzusatztext;
                
                        document.getElementById("ampeltext").setAttribute("style", "display:flex;");
                        document.getElementById("ampelfarbe").setAttribute("class", cssClassAmpelfarbe);
                        document.getElementById("ampeltext").innerHTML = ampelfarbeText;
                
                        /** Berechne Zeigerstellung  (#divHospitalisierungBreite) */
                        var zeigerStellung = 0;
                        zeigerStellung = Math.round((rkiHospitalisierteFaelle * 67) / grenzwertHospitalisierung);
                        if(zeigerStellung >= 95) { zeigerStellung = 95; } //Verhindern dass Zeigerspitze rechts neben Balken landet...
                        if(zeigerStellung <= 2) { zeigerStellung = 2; } //Verhindern dass Zeigerspitze links neben Balken landet...
                
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
                
                        document.getElementById("divBehandlungBreite").setAttribute("style","width:" + zeigerStellung + "%");
                    });                
                });
                console.log('Die angezeigte Krankenhausampel ist kostenlos und konfigurierbar als Skript verfuegbar: www.krankenhausampel.info');
            }

            /**
             * Anzeige des <span> Tags mit der id in Parmeter "hinweisAn".
             * Alle anderen Elemente werden auf 'display:none' gesetzt.
             * @param {*} hinweisAn - CSS id des Elementes, was angezeigt werden soll (hinweis2GRegel, hinweis3GRegel oder hinweis2GplusRegel)
             */
            function hinweiseAnzeigen(hinweisAn) {
                document.getElementById("hinweis3GplusRegel").style.display = "none";
                document.getElementById("hinweis3GRegel").style.display = "none";
                document.getElementById("hinweis2GRegel").style.display = "none";
                document.getElementById(hinweisAn).style.display = "contents";
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