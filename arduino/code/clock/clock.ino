struct DateTime {
  int year;
  int month;
  int day;
  int hours;
  int minutes;
  int seconds;
};

// Bibliotheken einbinden
#include <ESP8266WiFi.h>
#include <NTP.h>
#include <WiFiUdp.h>
#include <U8g2lib.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

#define SPEAKER D5
int BassTab[] = { 1911, 1702, 1516, 1431, 1275, 1136, 1012 };  //bass 1~7

//Datenbank Konfiguartion
#define API_KEY "..."
#define DATABASE_URL "https://studipcal.firebaseio.com/"
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
// OLED Display Konfiguration
U8G2_SSD1306_128X64_NONAME_1_HW_I2C oled(U8G2_R0, U8X8_PIN_NONE);
// WiFi Konfiguration
char Router[] = "...";
char Passwort[] = "...";

// NTP Konfiguration
WiFiUDP wifiUdp;
NTP ntp(wifiUdp);

// DHT Sensor Konfiguration
#define DHTPIN D4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// Zeitintervalle
static unsigned long GesicherteStartZeit = 0;
unsigned long Startzeit;
unsigned long TestStartzeit;
const unsigned long Intervall = 30000;        // 30 Sekunden für das NTP-Update
const unsigned long AnzeigeIntervall = 1000;  // 1 Sekunden für das Schalten der Anzeige
const unsigned long SensorIntervall = 1800000;
static unsigned long GesicherteSensorZeit = 0;
static unsigned long TestGesicherteSensorZeit = 0;
unsigned long Sensorzeit;
DateTime NextTimer;
DateTime Today;
// Variablen zur Anzeigeumschaltung
enum AnzeigeModus { DATUM,
                    TEMPERATUR,
                    LUFTFEUCHTIGKEIT };
AnzeigeModus aktuellerModus = DATUM;

bool IsRinging;
void setup() {
  Serial.begin(9600);
  delay(500);
  IsRinging = false;
  pinMode(SPEAKER, OUTPUT);
  digitalWrite(SPEAKER, LOW);
  // WiFi starten
  WiFi.begin(Router, Passwort);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  //Datenbank Konfiguration
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("ok");
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  // Verbindungsinformationen anzeigen
  //Serial.print("Verbunden mit ");
  //Serial.println(WiFi.SSID());
  //Serial.print("IP: ");
  //Serial.println(WiFi.localIP());

  // NTP Konfiguration
  ntp.ruleDST("CEST", Last, Sun, Mar, 2, 120);
  ntp.ruleSTD("CET", Last, Sun, Oct, 3, 60);
  ntp.begin();
  ntp.update();
  // OLED initialisieren
  oled.begin();
  oled.setFont(u8g2_font_courB24_tf);
  oled.setDrawColor(1);
  oled.setFontDirection(0);
  // DHT Sensor initialisieren
  dht.begin();
  setToday();
  createDocumentInDatabase();
  getNextTimer();
}

void loop() {
  Startzeit = millis();
  Sensorzeit = millis();
  TestStartzeit = millis();

  // Timer für um den Wecker zuchecken 1 sek
  if (TestStartzeit - TestGesicherteSensorZeit > AnzeigeIntervall) {
    TestGesicherteSensorZeit = TestStartzeit;
    ntp.update();
    if (IsRinging) {
      getNextTimer();
    } else {
      if (ntp.year() == NextTimer.year && ntp.month() == NextTimer.month && ntp.day() == NextTimer.day) {
        if (ntp.hours() == NextTimer.hours && ntp.minutes() == NextTimer.minutes && ntp.seconds() == NextTimer.seconds) {
          IsRinging = true;
          delay(10);
          updateTimerDataInDatabank(IsRinging);
          Serial.println("Alarm Triggered");
        }
      }
    }
  }

  if (IsRinging) {
    //playSound();
    Serial.println("Alarm ON");
  }

  // Wenn das Intervall für das NTP-Update erreicht ist 30 sek
  if (Startzeit - GesicherteStartZeit > Intervall || Startzeit < 0) {
    getNextTimer();
    updateSensorDataInDatabank(dht.readTemperature(), dht.readHumidity());
    ntp.update();
    GesicherteStartZeit = Startzeit;
  }
  //30min
  if (Sensorzeit - GesicherteSensorZeit > SensorIntervall || Sensorzeit < 0) {
    updateSensorDataInDatabank(dht.readTemperature(), dht.readHumidity());
    if (Today.year < ntp.year() && Today.month < ntp.month() < Today.day < ntp.day()) {
      setToday();
      createDocumentInDatabase();
    }
  }



  // Wenn das Intervall für die Anzeigeumschaltung erreicht ist
  static unsigned long letzteAnzeigeUmschaltung = 0;
  if (Startzeit - letzteAnzeigeUmschaltung > AnzeigeIntervall) {
    aktuellerModus = static_cast<AnzeigeModus>((aktuellerModus + 1) % 3);
    letzteAnzeigeUmschaltung = Startzeit;
  }
  oled.clearDisplay();
  oled.firstPage();
  do {
    oled.setCursor(2, 15);
    oled.setFont(u8g2_font_t0_22_te);

    if (aktuellerModus == DATUM) {
      oled.print(showDate('.'));
    } else if (aktuellerModus == TEMPERATUR) {
      showTemperature();
    } else if (aktuellerModus == LUFTFEUCHTIGKEIT) {
      showHumidity();
    }

    // Horizontale Linie und Uhrzeit anzeigen
    oled.drawHLine(1, 22, oled.getDisplayWidth());
    oled.setCursor(2, 63);
    oled.setFont(u8g2_font_logisoso32_tf);
    if (ntp.hours() < 10) oled.print("0");
    oled.print(String(ntp.hours()) + ":");
    if (ntp.minutes() < 10) oled.print("0");
    oled.print(String(ntp.minutes()));
  } while (oled.nextPage());
}

void setToday() {
  Today.year = ntp.year();
  Today.month = ntp.month();
  Today.day = ntp.day();
}
// Datum anzeigen
String showDate(char seperator) {
  String day;
  String month;
  String year;
  if (ntp.day() < 10) {
    day = "0";
  }
  day += ntp.day();
  //oled.print(seperator);
  if (ntp.month() < 10) {
    month = "0";
  }
  month += ntp.month();
  //oled.print(seperator);
  year = ntp.year();
  return day + seperator + month + seperator + year;
}

// Luftfeuchtigkeit anzeigen
void showHumidity() {
  float h = dht.readHumidity();
  if (isnan(h)) {
    oled.print("Humidity Error");
  } else {
    oled.print("Hum: ");
    oled.print(h);
    // Serial.print(h);
    oled.print(" %");
  }
}

// Temperatur anzeigen
void showTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) {
    oled.print("Temp Error");
  } else {
    oled.print("Temp: ");
    //Serial.print(t - 5);
    oled.print(t - 5);
    oled.print(" C");
  }
}

FirebaseJson content;
void createDocumentInDatabase() {
  content.clear();
  // Read temperature and humidity from the sensor
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  // Add temperature and humidity to the array
  // Create a JSON object with an array field
  String path = "temperature/" + showDate('_');
  uint8_t index = setIndexFromTime();
  for (uint8_t i = 0; i <= 23; i++) {
    if (i != index) {
      content.set("fields/temperature/arrayValue/values/[" + String(i) + "]/nullValue", 0);
      content.set("fields/humidity/arrayValue/values/[" + String(i) + "]/nullValue", 0);
    }
  }
  if (index >= 0 && index <= 24) {
    content.set("fields/temperature/arrayValue/values/[" + String(index) + "]/doubleValue", temperature);
    content.set("fields/humidity/arrayValue/values/[" + String(index) + "]/doubleValue", humidity);
  }
  // Create the path for the document
  // Attempt to create the document in Firestore
  if (Firebase.Firestore.createDocument(&fbdo, "studipcal", "", path.c_str(), content.raw())) {
    Serial.println("Document created successfully");
  } else {
    Serial.println(fbdo.errorReason());
  }
}

uint8_t setIndexFromTime() {
  float hour = ntp.hours();
  if (ntp.minutes() >= 30) {
    hour += 0.5;
  }

  // Adjust the hour to start at 7:00 and end at 19:00
  hour -= 7;  // Shift start to 0:00

  // Calculate the index based on the current hour
  uint8_t index = hour * 2;
  Serial.println(index);
  return index;
}

void getNextTimer() {
  String path = "clock/state/";
  if (Firebase.Firestore.getDocument(&fbdo, "studipcal", "", path.c_str())) {
    //Serial.printf("ok\n%s\n\n", fbdo.payload().c_str());
    FirebaseJson payload;
    FirebaseJsonData data;
    payload.setJsonData(fbdo.payload().c_str());

    payload.get(data, "fields/isRinging/booleanValue", true);
    bool newIsRinging = data.boolValue;
    if (IsRinging != newIsRinging) {
      IsRinging = newIsRinging;
      Serial.print("IsRinging updated from database: ");
      Serial.println(IsRinging);
    } else {
      Serial.print("IsRinging unchanged: ");
      Serial.println(IsRinging);
    }
    payload.get(data, "fields/nextTimer/timestampValue", true);
    setNextAlarm(data.stringValue);
  } else {
    Serial.println(fbdo.errorReason());
  }
}

void updateSensorDataInDatabank(double temp, double hum) {
  uint8_t index = setIndexFromTime()+1;
  content.remove("fields/temperature/arrayValue/values/[" + String(index) + "]/nullValue");
  content.set("fields/temperature/arrayValue/values/[" + String(index) + "]/doubleValue", temp);
  content.remove("fields/humidity/arrayValue/values/[" + String(index) + "]/nullValue");
  content.set("fields/humidity/arrayValue/values/[" + String(index) + "]/doubleValue", hum);

  String path = "temperature/" + showDate('_');
  if (Firebase.Firestore.patchDocument(&fbdo, "studipcal", "", path.c_str(), content.raw(), "temperature,humidity")) {
    Serial.println("Document updated successfully");
  } else {
    Serial.println(fbdo.errorReason());
  }
}

void updateTimerDataInDatabank(bool isRinging) {
  FirebaseJson data;
  data.set("fields/isRinging/booleanValue", isRinging);
  Serial.println("Updating IsRinging in database to: " + String(isRinging));
  Serial.println(data.raw());

  String path = "clock/state/";
  if (Firebase.Firestore.patchDocument(&fbdo, "studipcal", "", path.c_str(), data.raw(), "isRinging")) {
    Serial.println("Document updated successfully");
  } else {
    Serial.println(fbdo.errorReason());
  }
}

void playSound() {
  for (uint8_t note_index = 0; note_index < 7; note_index++) {
    sound(note_index);
    delay(500);
  }
}

void sound(uint8_t note_index) {
  for (uint8_t i = 0; i < 100; i++) {
    digitalWrite(SPEAKER, HIGH);
    delayMicroseconds(BassTab[note_index]);
    digitalWrite(SPEAKER, LOW);
    delayMicroseconds(BassTab[note_index]);
  }
}

void setNextAlarm(String dateTime) {
  NextTimer.year = dateTime.substring(0, 4).toInt();
  NextTimer.month = dateTime.substring(5, 7).toInt();
  NextTimer.day = dateTime.substring(8, 10).toInt();
  NextTimer.hours = dateTime.substring(11, 13).toInt() + 2;
  NextTimer.minutes = dateTime.substring(14, 16).toInt();
  NextTimer.seconds = dateTime.substring(17, 19).toInt();
  Serial.print("Year: ");
  Serial.println(NextTimer.year);
  Serial.print("Month: ");
  Serial.println(NextTimer.month);
  Serial.print("Day: ");
  Serial.println(NextTimer.day);
  Serial.print("Hour: ");
  Serial.println(NextTimer.hours);
  Serial.print("Minute: ");
  Serial.println(NextTimer.minutes);
  Serial.print("Second: ");
  Serial.println(NextTimer.seconds);
}