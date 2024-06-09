// Bibliotheken einbinden
#include <ESP8266WiFi.h>
#include <NTP.h>
#include <WiFiUdp.h>
#include <U8g2lib.h>
#include "DHT.h"

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
int Intervall = 30000; // 30 Sekunden für das NTP-Update
int AnzeigeIntervall = 5000; // 10 Sekunden für das Schalten der Anzeige

// Variablen zur Anzeigeumschaltung
enum AnzeigeModus { DATUM, TEMPERATUR, LUFTFEUCHTIGKEIT };
AnzeigeModus aktuellerModus = DATUM;

void setup()
{
  Serial.begin(9600);
  delay(500);

  // WiFi starten
  WiFi.begin(Router, Passwort);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
  }

  // Verbindungsinformationen anzeigen
  Serial.print("Verbunden mit ");
  Serial.println(WiFi.SSID());
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // NTP Konfiguration
  ntp.ruleDST("CEST", Last, Sun, Mar, 2, 120);
  ntp.ruleSTD("CET", Last, Sun, Oct, 3, 60);
  ntp.begin();

  // OLED initialisieren
  oled.begin();
  oled.setFont(u8g2_font_courB24_tf);
  oled.setDrawColor(1);
  oled.setFontDirection(0);

  // DHT Sensor initialisieren
  dht.begin();
}

void loop()
{
  Startzeit = millis();

  // Wenn das Intervall für das NTP-Update erreicht ist
  if (Startzeit - GesicherteStartZeit > Intervall)
  {
    ntp.update();
    GesicherteStartZeit = Startzeit;
  }

  // Wenn das Intervall für die Anzeigeumschaltung erreicht ist
  static unsigned long letzteAnzeigeUmschaltung = 0;
  if (Startzeit - letzteAnzeigeUmschaltung > AnzeigeIntervall)
  {
    aktuellerModus = static_cast<AnzeigeModus>((aktuellerModus + 1) % 3);
    letzteAnzeigeUmschaltung = Startzeit;

    oled.clearDisplay();
    oled.firstPage();
    do
    {
      oled.setCursor(2, 15);
      oled.setFont(u8g2_font_t0_22_te);

      if (aktuellerModus == DATUM)
      {
        // Datum anzeigen
        if (ntp.day() < 10) oled.print("0");
        oled.print(ntp.day());
        oled.print(".");
        if (ntp.month() < 10) oled.print("0");
        oled.print(ntp.month());
        oled.print(".");
        oled.print(ntp.year());
      }
      else if (aktuellerModus == TEMPERATUR)
      {
        // Temperatur anzeigen
        int t = dht.readTemperature();
        if (isnan(t))
        {
          oled.print("Temp Error");
        }
        else
        {
          oled.print("Temp: ");
          Serial.print(t-5);
          oled.print(t-5);
          oled.print(" C");
        }
      }
      else if (aktuellerModus == LUFTFEUCHTIGKEIT)
      {
        // Luftfeuchtigkeit anzeigen
        int h = dht.readHumidity();
        if (isnan(h))
        {
          oled.print("Humidity Error");
        }
        else
        {
          oled.print("Hum: ");
          oled.print(h);
          Serial.print(h);
          oled.print(" %");
        }
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
}
