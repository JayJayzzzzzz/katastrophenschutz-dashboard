**Testen:** Wir haben das Dashboard manuell im Browser und über den Produktions-Build geprüft, automatisierte Tests gibt es noch nicht. Beachtet werden musste vor allem, dass die Daten live von externen Quellen kommen: Werte müssen mit der Originalquelle übereinstimmen, und bei Ausfall einer Schnittstelle müssen die übrigen Kacheln weiter funktionieren. Da es meist keine aktive Warnung gibt, haben wir einen Testmodus mit Beispielwarnung eingebaut. Außerdem wurden Desktop, Tablet und Smartphone, alle fünf Sprachen und der Hoher-Kontrast-Modus geprüft.

**Dokumentation:** Wir dokumentieren getrennt für Entwickler (README mit Datenquellen, Start, Deployment) und für Anwender (Kurzanleitung im Dashboard). Wichtig ist, dass die Doku immer zum aktuellen Stand passt und Entscheidungen begründet, etwa warum eine Quelle verworfen wurde. Quellen und Grenzen der Daten werden offen genannt.

**Anwenderschulung:** Die Nutzer sind Fachleute im Katastrophenschutz mit wenig Zeit und Technikwissen, daher muss die Schulung kurz und praxisnah sein. Vermittelt werden, was sich automatisch aktualisiert, was anklickbar ist und wie Sprache und Kontrast eingestellt werden. Wichtig sind die Grenzen: Feuerwehrdaten sind Vortageswerte, Warnungen können bis zu 30 Minuten alt sein, und das Dashboard ersetzt weder die NINA-App noch den Notruf 112.

**Erweiterungen:** Sinnvoll wären Warnungen in Echtzeit statt nur beim Neubau, weitere Datenquellen, Benachrichtigungen bei neuen Warnungen oder hohem Pegel sowie automatisierte Tests. Mit Anmeldung und Rechteverwaltung könnten später auch interne Leitstellendaten angebunden werden.

**Datenschutz und Sicherheit:** Das Dashboard speichert keine Nutzerdaten und braucht keine Anmeldung. Nur Sprache und Kontrast merkt sich der Browser lokal. Alle Quellen sind öffentlich und kommen ohne API-Schlüssel aus.

**Wartung und Betrieb:** Externe Schnittstellen können sich ändern oder ausfallen, wie bei den Straßensperrungen, deren Daten nicht mehr gepflegt werden. Die Quellen müssen deshalb regelmäßig geprüft werden.
