# CleverClock
Ein Projekt im Rahmen des Moduls SSTK.

## Anforderungen:
- Die Möglichkeit mittels eines Lautsprechers einen Alarmton abzuspielen.
  - Eine ausreichende Lautstärke.
- Die Möglichkeit die Funktionalität des Weckers über ein Webinterface zu steuern im Gegensatz zu Hardware Knöpfen
- Die Möglichkeit eine Verbindung mit dem Internet her zu stellen.
- Die möglichkeit das Arretieren des Signaltons hinter einer Bedingung zu Setzen
  - Das lösen einer Matheaufgabe die jeden tag neu ist, und an dieses Tag gebunden ist.
  - Das einscannen eines QR-Codes (physisch getrennt vom Nutzer) direkt auf der Web-App
  - Das eingeben eines Codes, der nur abrufbar ist, durch den Zugriff auf ein Dokument das physisch vom Nutzer getrennt ist.
  - Die möglichkeiten diese Anforderungen zu varieren und zu Kombinieren.
  - Ankhi anbindung mit upload Datei. Damit auch die Mathe aufgaben implementieren? Dann wäre das einheitlich.
    - WAS IST WENN MAN DIE AUFGABEN NICHT SCHAFFT
  - 5s Strafe wenn man eine Frage falsch hat oder skipt mit einem 2min maximum

## Ideen
- Das hinzufügen von Sensoren um die Schlafquilität zu überwachen (CO2, Temperatur, ?Mikro?)
- Ein Display um Informationen zu Sammeln
- Eine Kamera die irgendetwas aufnimmt und analysiert? Bewegug? Denke da so ein bisschen an den Beitrag der anderen Gruppen die ja etwas größer denken


# Konkretisierung
- Verschiedene Rolle
  - Design/ Technik
  - Webinterface
  - Server
  - Dokumentation
  - Codierung
- Server in Node-Red erstellen oder in Node (falls @lui-ah das machen soll)
  - Wenn mit Node-Red brauchen wir ein MQTT Broker von der Uni
- Webinterface (Apple Shortcuts würde notfalls auch gehen). Das kann @lui-ah machen
- Design sollte ein Wenig interesant sein. Low-Tech Prototyp kann aber ein kleiner Karton sein
