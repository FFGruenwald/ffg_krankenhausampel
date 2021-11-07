        /** Angabe der Landkreis OBJECTID! Bspw. 239 = Landkreis München
    	    OBJECTID hier ermitteln: https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0 */
            var landkreisObjectId = '239'; 

            /** Eingabe des Grenzwertes für die Fälle der 7-Tages-Hospitalisierungs-Inzidenz. Ab diesem Wert wird die Ampel GELB */
            var grenzwertHospitalisierung = 1200; //Bayern = 1200
    
            /** Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel GELB */
            var grenzwertIntensivBehandlungGelb = 450; //Bayern = 450

            /** Eingabe des Grenzwertes für die COVID-19 Fälle auf Intensivstationen. Ab diesem Wert wird die Ampel ROT */
            var grenzwertIntensivBehandlungRot = 600; //Bayern = 600
            
            /** Eingabe des Grenzwertes für 7-Tage Inzidenz im LANDKREIS (siehe landkreisObjectId). Ab diesem Wert gilt die 3G-Regel */
            var grenzwertInzidenz = 35;
    
            ////////////////////////////////////////////////////////////////////////////////////////////////////
            // Ab hier keine Aenderungen mehr erforderlich
            var hospitalisierteFaelle = 0;
            var faelleCovidAktuell = 0;
            var format = 'json';
    
            //** DEFAULT WERTE IN AMPEL SETZEN */
            document.getElementById("anzeigeAmpelGrenzwertHospitalisierung").innerHTML ="Grenzwert: " + grenzwertHospitalisierung + "&nbsp;";
            document.getElementById("anzeigeAmpelGrenzwertIntensivGelb").innerHTML ="Grenzwerte: " + grenzwertIntensivBehandlungGelb + "&nbsp;";
            document.getElementById("anzeigeAmpelGrenzwertIntensivRot").innerHTML = grenzwertIntensivBehandlungRot + "&nbsp;";
            //** DEFAULT WERTE ENDE */
    
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
    
            load(landkreisObjectId);
    
            function load (landkreisObjectId) {
                var client = new HttpClient();
                var restServiceUrl = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=OBJECTID%20%3E%3D%20'+landkreisObjectId+'%20AND%20OBJECTID%20%3C%3D%20'+landkreisObjectId+'&outFields=OBJECTID,death_rate,cases,deaths,cases_per_100k,cases_per_population,BL,BL_ID,county,last_update,cases7_per_100k,recovered,cases7_bl_per_100k&outSR=4326&f=json';
                client.get(restServiceUrl, function(response) {
                    var jsonLandkreis = JSON.parse(response);
                    jsonLandkreis = jsonLandkreis['features'][0]['attributes'];
                    //console.log(jsonLandkreis);
                    //Name des Bundeslandes
                    var bundeslandId = jsonLandkreis['BL_ID'];
    
                    // Name des Landkreises
                    var lk = document.querySelectorAll('[id="anzeigeLandkreisname"]');
                    for(var i = 0; i < lk.length; i++) {
                        lk[i].innerHTML = jsonLandkreis['county'].replace('LK', 'Landkreis');
                    }
                    // 7-Tages-Inzidenzwert
                    var inzidenz7 = Math.round((jsonLandkreis['cases7_per_100k'] * 100)) / 100;
                    var inz = document.querySelectorAll('[id="anzeige7TageInzidenzWert"]');
                    for(var i = 0; i < inz.length; i++) {
                        inz[i].innerHTML = inzidenz7;
                    }        
                    // Letztes Update / Letzter Stand vom RKI bereitgestellt
                    var letztesUpdate= document.querySelectorAll('[class="anzeigeLetztesUpdateRKI"]');
                    for(var i = 0; i < letztesUpdate.length; i++) {
                        letztesUpdate[i].innerHTML = jsonLandkreis['last_update'];
                    }
    
                    // Inzidenz Grenzwert 3G ersetzen
                    var grenzwert3G= document.querySelectorAll('[id="anzeigeGrenzeInzidenzWert3G"]');
                    for(var i = 0; i < grenzwert3G.length; i++) {
                        grenzwert3G[i].innerHTML = grenzwertInzidenz;
                    }
    
                    /** Setze den Zusatztext unter der Ampel (entweder 2G oder 3G) */
                    anzeigeAmpelzusatz = "";
                    text3GVisible = "none";
                    if(inzidenz7 >= grenzwertInzidenz){
                        anzeigeAmpelzusatz = "+ 3G-Regel";
                        text3GVisible = "contents";
                    } 
                    document.getElementById("hinweis3GRegel").setAttribute("style","display: " + text3GVisible + "");
                    document.getElementById("ampelzusatztext").innerHTML= anzeigeAmpelzusatz;
    
                    //muss verschachtelt werden, da wir das Bundesland erst von der RKI API bekommen
                    var nClient = new HttpClient();
                    var nRestServiceUrl = 'https://krankenhausampel.info/corona/v2/?bl_id=' + bundeslandId;
                    console.log('nRestServiceUrl: ' + nRestServiceUrl);
                    nClient.get(nRestServiceUrl, function(response1) {
                        var result = JSON.parse(response1);
                        var datenstandLGL = "";
                        var datenstandDIVI = "";
                        
                        faelleCovidAktuell = result["intensiv"];
                        hospitalisierteFaelle = result["hospitalisierung"];
                        inzidenz7TageHospitalisierung = result["hospitalisierung_inzidenz"];
                        if(result["datenstand_lgl"]) {
                            datenstandLGL = result["datenstand_lgl"];
                        }
                        if(result["datenstand_divi"]) {
                            datenstandDIVI = result["datenstand_divi"];
                        }
        
                        var anzeigeFaelleCovidAktuell= document.querySelectorAll('[class="anzeigeFaelleCovidAktuell"]');
                        for(var i = 0; i < anzeigeFaelleCovidAktuell.length; i++) {
                            anzeigeFaelleCovidAktuell[i].innerHTML = faelleCovidAktuell;
                        }
                        var anzeigeHospitalisierteFaelle= document.querySelectorAll('[class="anzeigeHospitalisierteFaelle"]');
                        for(var i = 0; i < anzeigeHospitalisierteFaelle.length; i++) {
                            anzeigeHospitalisierteFaelle[i].innerHTML = hospitalisierteFaelle;
                        }
                        var anzeigeLetztesUpdateDIVI= document.querySelectorAll('[class="anzeigeLetztesUpdateDIVI"]');
                        for(var i = 0; i < anzeigeLetztesUpdateDIVI.length; i++) {
                            anzeigeLetztesUpdateDIVI[i].innerHTML = datenstandDIVI;
                        }
        
                        var anzeigeLetztesUpdateLGL= document.querySelectorAll('[class="anzeigeLetztesUpdateLGL"]');
                        for(var i = 0; i < anzeigeLetztesUpdateLGL.length; i++) {
                            anzeigeLetztesUpdateLGL[i].innerHTML = datenstandLGL;
                        }

                        var anzeigeBundeslandName= document.querySelectorAll('[class="anzeigeBundeslandName"]');
                        for(var i = 0; i < anzeigeBundeslandName.length; i++) {
                            anzeigeBundeslandName[i].innerHTML = result['bundesland_name'];
                        }

                        var anzeigeBundeslandAdverb= document.querySelectorAll('[class="anzeigeBundeslandAdverb"]');
                        for(var i = 0; i < anzeigeBundeslandAdverb.length; i++) {
                            anzeigeBundeslandAdverb[i].innerHTML = result['bundesland_name_adverb'];
                        }

                        /** Anzeige der 7-Tages-Hospitalisierungs-Inzidenz (pro 100.000 Einwohner) | id=anzeige7TageInzidenzHospitalisierung */
                        //inzidenz7TageHospitalisierung = Math.round((hospitalisierteFaelle / 130.8) * 100) / 100; 
                        document.getElementById("anzeige7TageInzidenzHospitalisierung").innerHTML = inzidenz7TageHospitalisierung;
                        var ampelzusatztext = "";
                        /** Ampelfarbe setzen (rot schlaegt gelb...) */
                        cssClassAmpelfarbe = "ampelgruen"; //default gruen
                        //cssAmpeltextfarbe = "#fff"; //wenn Gelb, kann man den weissen Text in der Ampel nicht mehr lesen... in dem Fall auf dunklere Farbe setzen
                        ampelfarbeText = "Gr&uuml;n";                        
                        if(hospitalisierteFaelle >= grenzwertHospitalisierung) {
                            cssClassAmpelfarbe ="ampelgelb";
                            //cssAmpeltextfarbe = "#000";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3GPlus-Regel";
                        }
                        if (faelleCovidAktuell >= grenzwertIntensivBehandlungGelb) {
                            cssClassAmpelfarbe ="ampelgelb";
                            //cssAmpeltextfarbe = "#fff";
                            ampelfarbeText = "Gelb";
                            ampelzusatztext = "3G<font style='text-transform:lowercase;'>Plus</font>-Regel";
                        }
                        if (faelleCovidAktuell >= grenzwertIntensivBehandlungRot) {
                            cssClassAmpelfarbe ="ampelrot";
                            //cssAmpeltextfarbe = "#fff";
                            ampelfarbeText = "Rot";
                            ampelzusatztext = "2G-Regel";
                        }                        

                        /** Zusatztext unter der Ampel je nach Ampelfarbe (2G, 3G, 3GPlus,...) */
                        document.getElementById("ampelzusatztext").innerHTML = ampelzusatztext;
                
                        document.getElementById("ampeltext").setAttribute("style", "display:flex;");
                        document.getElementById("ampelfarbe").setAttribute("class", cssClassAmpelfarbe);
                        document.getElementById("ampeltext").innerHTML = ampelfarbeText;
                
                        /** Berechne Zeigerstellung  (#divHospitalisierungBreite) */
                        var zeigerStellung = 0;
                        zeigerStellung = Math.round((hospitalisierteFaelle * 67) / grenzwertHospitalisierung);
                        if(zeigerStellung >= 95) { zeigerStellung = 95; } //Verhindern dass Zeigerspitze rechts neben Balken landet...
                        if(zeigerStellung <= 2) { zeigerStellung = 2; } //Verhindern dass Zeigerspitze links neben Balken landet...
                
                        document.getElementById("divHospitalisierungBreite").setAttribute("style","width:" + zeigerStellung + "%");
                
                        /** Berechne Zeigerstellung  (#divBehandlungBreite) */
                        zeigerStellung = 0;
                        /** Beruecksichtigung Prozentangaben bei Ampelfarbenbreite IntensivBehandlung */
                        if(faelleCovidAktuell <= grenzwertIntensivBehandlungGelb) {
                            zeigerStellung = Math.round((faelleCovidAktuell * 34) / grenzwertIntensivBehandlungGelb);    
                        }
                        if(faelleCovidAktuell > grenzwertIntensivBehandlungGelb && faelleCovidAktuell < grenzwertIntensivBehandlungRot) {
                            zeigerStellung = Math.round( ((faelleCovidAktuell*100) / grenzwertIntensivBehandlungGelb) - 66);
                        }
                        if(faelleCovidAktuell >= grenzwertIntensivBehandlungRot) {
                            zeigerStellung = Math.round((faelleCovidAktuell * 67) / grenzwertIntensivBehandlungRot);
                        }
                                
                        if(zeigerStellung >= 95) { zeigerStellung = 95; } //Verhindern dass Zeigerspitze rechts neben Balken landet...
                        if(zeigerStellung <= 2) { zeigerStellung = 2; } //Verhindern dass Zeigerspitze links neben Balken landet...
                
                        document.getElementById("divBehandlungBreite").setAttribute("style","width:" + zeigerStellung + "%");
                
                    });                
                });
            }