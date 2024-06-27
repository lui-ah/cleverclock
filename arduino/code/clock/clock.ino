#include <ESP8266WiFi.h>
#include <NTP.h>
#include <WiFiUdp.h>
#include <U8g2lib.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

#define SPEAKER D5
int BassTab[] = { 1911, 1702, 1516, 1431, 1275, 1136, 1012 };  // bass 1~7

#define API_KEY "..."
#define DATABASE_URL "https://studipcal.firebaseio.com/"

struct DateTime {
  int year;
  int month;
  int day;
  int hours;
  int minutes;
  int seconds;
};

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

U8G2_SSD1306_128X64_NONAME_1_HW_I2C oled(U8G2_R0, U8X8_PIN_NONE);

char Router[] = "...";
char Passwort[] = "...";

WiFiUDP wifiUdp;
NTP ntp(wifiUdp);

#define DHTPIN D4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

static unsigned long GesicherteStartZeit = 0;
static unsigned long GesicherteSensorZeit = 0;
static unsigned long TestGesicherteSensorZeit = 0;
unsigned long Startzeit;
const unsigned long Intervall = 30000;        // 30 Sekunden für das NTP-Update
const unsigned long AnzeigeIntervall = 1000;  // 1 Sekunde für das Schalten der Anzeige
const unsigned long SensorIntervall = 30 * 60 * 1000;
DateTime NextTimer;
DateTime Today;

enum AnzeigeModus { DATUM,
                    TEMPERATUR,
                    LUFTFEUCHTIGKEIT };
AnzeigeModus aktuellerModus = DATUM;

bool IsRinging = false;
FirebaseJson content;

void setup() {
  Serial.begin(9600);
  delay(500);

  pinMode(SPEAKER, OUTPUT);
  digitalWrite(SPEAKER, LOW);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(Router, Passwort);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi connected.");

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase authentication successful.");
  } else {
    Serial.printf("Firebase authentication failed: %s\n", config.signer.signupError.message.c_str());
  }
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  ntp.ruleDST("CEST", Last, Sun, Mar, 2, 120);
  ntp.ruleSTD("CET", Last, Sun, Oct, 3, 60);
  ntp.begin();
  ntp.update();

  oled.begin();
  oled.setFont(u8g2_font_courB24_tf);
  oled.setDrawColor(1);
  oled.setFontDirection(0);

  dht.begin();

  setToday();
  createDocumentInDatabase();
  getNextTimer();
  Serial.println("Setup completed.");
}

void loop() {
  unsigned long currentMillis = millis();

  // Debug-Nachricht: 1 Sekunden Intervall
  if (currentMillis - GesicherteStartZeit >= AnzeigeIntervall) {
    GesicherteStartZeit = currentMillis;
    ntp.update();
    checkAlarm();
    updateDisplay();
    Serial.println("1 Sekunde vergangen.");
  }

  // Debug-Nachricht: 30 Sekunden Intervall
  if (currentMillis - TestGesicherteSensorZeit >= Intervall || currentMillis < 0) {
    TestGesicherteSensorZeit = currentMillis;
    getNextTimer();
    printCurrentTime();
    Serial.println("30 Sekunden vergangen.");
  }

  unsigned long currentMillisSensor = millis();
  // Debug-Nachricht: 10 Minuten Intervall
  if (currentMillisSensor - GesicherteSensorZeit >= SensorIntervall) {
    GesicherteSensorZeit = currentMillisSensor;
    updateSensorDataInDatabank(dht.readTemperature(), dht.readHumidity());
    if (isNewDay()) {
      if (ntp.hours() > 8) {
        setToday();
        createDocumentInDatabase();
      }
    }
    Serial.println("10 Minuten vergangen.");
  }

  if (IsRinging) {
    playSound();
    Serial.println("Alarm ON");
  }
}

void setToday() {
  Today.year = ntp.year();
  Today.month = ntp.month();
  Today.day = ntp.day();
  Today.hours = ntp.hours();
  if(Today.hours <= 8 ){
  Today.day = ntp.day()-1;
  }
  Today.minutes = ntp.minutes();
  Today.seconds = ntp.seconds();
}

bool isNewDay() {
  return Today.year < ntp.year() || (Today.year == ntp.year() && (Today.month < ntp.month() || (Today.month == ntp.month() && Today.day < ntp.day())));
}

void switchDisplayMode() {
  aktuellerModus = static_cast<AnzeigeModus>((aktuellerModus + 1) % 3);
}

void updateDisplay() {
  switchDisplayMode();
  oled.clearDisplay();
  oled.firstPage();
  do {
    oled.setCursor(2, 15);
    oled.setFont(u8g2_font_t0_22_te);

    switch (aktuellerModus) {
      case DATUM:
        oled.print(showDate('.'));
        break;
      case TEMPERATUR:
        showTemperature();
        break;
      case LUFTFEUCHTIGKEIT:
        showHumidity();
        break;
    }

    oled.drawHLine(1, 22, oled.getDisplayWidth());
    oled.setCursor(2, 63);
    oled.setFont(u8g2_font_logisoso32_tf);
    oled.print((ntp.hours() < 10 ? "0" : "") + String(ntp.hours()) + ":");
    oled.print((ntp.minutes() < 10 ? "0" : "") + String(ntp.minutes()));
  } while (oled.nextPage());
}

String showDate(char separator) {
return showDate(separator, getDateTimeNow());
}

String showDate(char separator, DateTime time) {
  String day = (time.day < 10 ? "0" : "") + String(time.day);
  String month = (time.month < 10 ? "0" : "") + String(time.month);
  String year = String(time.year);
  return day + separator + month + separator + year;
}

void showHumidity() {
  float h = dht.readHumidity();
  oled.print(isnan(h) ? "Humidity Error" : "Hum: " + String(h) + " %");
}

void showTemperature() {
  float t = dht.readTemperature();
  oled.print(isnan(t) ? "Temp Error" : "Temp: " + String(t - 5) + " C");
}

void createDocumentInDatabase() {
  content.clear();
  float temperature = dht.readTemperature() - 5;
  float humidity = dht.readHumidity() - 5;
  String path = "temperature/" + showDate('_', Today);
  uint8_t index = setIndexFromTime();
  content.set("fields/date/timestampValue", timeToString(Today));
  for (uint8_t i = 0; i <= 23; i++) {
    if (i != index) {
      content.set("fields/temperature/arrayValue/values/[" + String(i) + "]/doubleValue", 0);
      content.set("fields/humidity/arrayValue/values/[" + String(i) + "]/doubleValue", 0);
    }
  }
  if (index <= 24) {
    content.set("fields/temperature/arrayValue/values/[" + String(index) + "]/doubleValue", temperature);
    content.set("fields/humidity/arrayValue/values/[" + String(index) + "]/doubleValue", humidity);
  }
  if (Firebase.Firestore.createDocument(&fbdo, "studipcal", "", path.c_str(), content.raw())) {
    Serial.println("Document created successfully");
  } else {
    Serial.println("Failed to create document: " + fbdo.errorReason());
  }
}

uint8_t setIndexFromTime() {
  float hour = ntp.hours() + (ntp.minutes() >= 30 ? 0.5 : 0);
  float adjustedHour = (hour >= 20 ? hour - 20 : hour + 4);
  return adjustedHour * 2;
}

void getNextTimer() {
  String path = "clock/state/";
  if (Firebase.Firestore.getDocument(&fbdo, "studipcal", "", path.c_str())) {
    Serial.println("Fetched clock state from database:");
    Serial.println(fbdo.payload().c_str());
    FirebaseJson payload;
    FirebaseJsonData data;
    payload.setJsonData(fbdo.payload().c_str());

    payload.get(data, "fields/isRinging/booleanValue", true);
    IsRinging = data.boolValue;

    payload.get(data, "fields/nextTimer/timestampValue", true);
    setNextAlarm(data.stringValue);
  } else {
    Serial.println("Failed to fetch clock state: " + fbdo.errorReason());
  }
}

void updateSensorDataInDatabank(double temp, double hum) {
  uint8_t index = setIndexFromTime();
  if (index <= 24) {
    content.set("fields/humidity/arrayValue/values/[" + String(index) + "]/doubleValue", hum - 5);
    content.set("fields/temperature/arrayValue/values/[" + String(index) + "]/doubleValue", temp - 5);

    String path = "temperature/" + showDate('_', Today);
    if (Firebase.Firestore.patchDocument(&fbdo, "studipcal", "", path.c_str(), content.raw(), "temperature,humidity")) {
      Serial.println("Document updated successfully");
    } else {
      Serial.println("Failed to update document: " + fbdo.errorReason());
    }
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
    Serial.println("Failed to update document: " + fbdo.errorReason());
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
  int hours = dateTime.substring(11, 13).toInt() + 2;

  // Adjust day if hours overflow past 24
  if (hours >= 24) {
    NextTimer.hours = hours - 24;
    NextTimer.day++;
  } else {
    NextTimer.hours = hours;
  }

  NextTimer.minutes = dateTime.substring(14, 16).toInt();
  NextTimer.seconds = dateTime.substring(17, 19).toInt();

  Serial.println("Next alarm set for: " + timeToString(NextTimer));
}

String timeToString(DateTime dateTime) {
  return String(dateTime.year) + '-' + String(dateTime.month) + '-' + String(dateTime.day) + 'T' + String(dateTime.hours) + ':' + String(dateTime.minutes) + ':' + String(dateTime.seconds) + 'Z';
}

void printCurrentTime() {
  Serial.println("Current Time:");
  Serial.println("Year: " + String(ntp.year()));
  Serial.println("Month: " + String(ntp.month()));
  Serial.println("Day: " + String(ntp.day()));
  Serial.println("Hour: " + String(ntp.hours()));
  Serial.println("Minute: " + String(ntp.minutes()));
  Serial.println("Second: " + String(ntp.seconds()));
}
DateTime getDateTimeNow(){
  DateTime now;
  now.year = ntp.year();
  now.month = ntp.month();
  now.day = ntp.day();
  now.hours = ntp.hours();
  now.minutes = ntp.minutes();
  now.seconds = ntp.seconds();
return now;
}
void checkAlarm() {
  DateTime now = getDateTimeNow();

  if (!IsRinging && now.year == NextTimer.year && now.month == NextTimer.month && now.day == NextTimer.day && now.hours == NextTimer.hours && now.minutes == NextTimer.minutes && now.seconds == NextTimer.seconds) {
    IsRinging = true;
    updateTimerDataInDatabank(IsRinging);
    Serial.println("Alarm detected at: " + timeToString(now));
  }
  if (IsRinging) {
    getNextTimer();
  }
}
