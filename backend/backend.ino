#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <Scheduler.h>
#include <Task.h>

#include "chars.h"
#include "page.html.h"

uint8_t column[s] = {15, 13, 12, 14, 16};       /* Positive pins */
uint8_t row[s] = {0, 4, 5, 3, 1};               /* Negative pins */

bool customMode = false;
uint8_t custom[s][s] = {
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 0, 1, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0}
};

ESP8266WebServer server(80); // Server on port 80

/* Async HTTP request handler */
class HTTPTask : public Task {
protected:
	void loop() {
		server.handleClient();
	}
} httpLoop;
/* ========================== */

void delay_us(unsigned long us) {
	uint32_t start = micros();

	while(us > 0) {
		yield();
		while(us > 0 && (micros() - start) >= 1) {
			us--;
			start += 1;
		}
	}
}

void draw(const uint8_t pattern[s][s], uint32_t del) {
	for(int i = 0; i < s; ++i) {
		/* Connect or disconnect columns according to pattern. */
		for(int j = 0; j < s; ++j) {
			digitalWrite(column[j], pattern[i][j]);
		}

		/* Turn on whole row. */
		digitalWrite(row[i], LOW);

		// delay(del);
		delay_us(del * 250);

		/* Turn off whole row. */
		digitalWrite(row[i], HIGH);
	}
}

void Display(const uint8_t pattern[s][s], uint32_t duration_ms) {
	uint32_t start = millis();

	while((millis() - start) < duration_ms) {
		draw(pattern, 1);
	}
}

void Show(String text) {
	text.toLowerCase();

	for(int i = 0; i < text.length(); i++) {
		int id = img.indexOf(text.charAt(i));
		Display(id == -1 ? unknow : chars[id], 500);
	}
}

void Countdown(int Time) {
	int a = 10;
	int del = (Time - a) / a * 1000;

	for(int i = a - 1; i >= 0; i--) {
		Display(chars[i], del);
	}

	for(int i = a - 1; i >= 0; i--) {
		Display(chars[i], 1000);
	}

	Animate("times up!", 180);
}

void Animate(String text, uint32_t frame_duration_ms) {
	text.toLowerCase();

	int len = text.length();
	int Map[s][s * len + s];

	if(!len) return;

	Display(chars[img.indexOf(text.charAt(0))], 1000);

	if(!(len > 1)) return;

	for(int r = 0; r < s; r++) {
		for(int o = 0; o < s; o++) {
			Map[r][s * len + o] = 0;
		}
	}

	for(int i = 0; i < text.length(); i++) {
		int id = img.indexOf(text.charAt(i));

		for(int j = 0; j < s; j++) {
			for(int k = 0; k < s; k++) {
				Map[j][i * s + k] = id == -1 ? unknow[j][k] : chars[id][j][k];
			}
		}
	}

	uint8_t buffer[s][s];

	for(int i = 0; i < s * len + 1; i++) {
		for(int j = 0; j < s; j++) {
			for(int k = 0; k < s; k++) {
				buffer[j][k] = Map[j][i + k];
			}
		}
		Display(buffer, frame_duration_ms);
	}

	delay(500);
}

class DrawTask : public Task {
protected:
	void loop() {
		if(!customMode) return;
		draw(custom, 1);
	}
} drawLoop;

int map(int x, int in_min, int in_max, int out_min, int out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

void setup() {
	/* Turn all columns off by setting then low. */
	for(uint8_t i = 0; i < s; i++) {
		pinMode(column[i], OUTPUT);
		digitalWrite(column[i], LOW);
	}

	/* Turn all rows off by setting then high. */
	for(uint8_t i = 0; i < s; i++) {
		pinMode(row[i], OUTPUT);
		digitalWrite(row[i], HIGH);
	}

	WiFi.hostname("ESP8266");

	WiFi.softAP("LED Matrix", "24112003");

	server.on("/", []() {
		server.send(200, "text/html", PAGE_HTML);
	});

	server.on("/api/text", []() {
		server.send(200);
		yield();

		customMode = false;

		String data = server.arg("plain");

		uint8_t speed = (uint8_t)data.c_str()[0];
		String text = data.substring(1);

		uint32_t speed_ms = map(speed, 0, 255, 50, 500);

		Animate(text, speed_ms);
	});

	server.on("/api/countdown", []() {
		server.send(200);
		yield();

		customMode = false;

		Countdown(server.arg("a").toInt());
	});

	server.on("/api/test", []() {
		server.send(200);
		yield();

		customMode = false;

		for(int i = 1000 / s; i > 1; i--) { // 500
			draw(animation_frames[4], 1000 / i);
		}
	});

	// rrrrrrrr (dddddddd 000vvvvv * 5) * ffffffff
	// r: repeat count, f: number of frames, d: duration of a frame, v: pattern
	server.on("/api/sequence", []() {
		server.send(200);
		yield();

		String data = server.arg("plain");
		size_t len = data.length();

		if(len < 7) return server.send(400);
		if((len - 1) % 6 != 0) return server.send(400);

		customMode = false;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		int frames = (len - 1) / 6;
		uint8_t repeat = bytes[0];
		const uint8_t *seq = bytes + 1;

		uint8_t buffer[s][s];

		for(uint8_t i = 0; i < repeat; i++) {
			for(size_t f = 0; f < frames; f++) {
				size_t offset = f * (s + 1);

				uint8_t duration = seq[offset + 0];
				const uint8_t *pattern = seq + offset + 1;

				uint32_t duration_ms = map(duration, 0, 255, 16, 5000);

				for(uint8_t y = 0; y < s; y++) {
					for(uint8_t x = 0; x < s; x++) {
						buffer[y][x] = (pattern[y] >> (/* s -  */ x /* - 1 */)) & 0x1 ? 1 : 0;
					}
				}

				Display(buffer, duration_ms);
			}
		}

		server.send(200);
	});

	server.on("/api/custom/enable", []() {
		customMode = true;
		server.send(200);
	});

	server.on("/api/custom/disable", []() {
		customMode = false;
		server.send(200);
	});

	// 000vvvvv * 5
	// v: pattern
	server.on("/api/custom/pattern", []() {
		server.send(200);
		yield();

		String data = server.arg("plain");
		if(data.length() != s) return server.send(400);

		customMode = true;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		for(int i = 0; i < s; i++) {
			for(int j = 0; j < s; j++) {
				custom[i][j] = (bytes[i] >> j) & 0x1 ? 1 : 0;
			}
		}

		server.send(200);
	});

	// yyyyxxxx 0000000v
	// x: x-coordinate, y: y-coordinate, v: value
	server.on("/api/custom/led", []() {
		server.send(200);
		yield();

		String data = server.arg("plain");
		if(data.length() != 2) return server.send(400);

		customMode = true;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		uint8_t x = bytes[0] & 0x0F;
		uint8_t y = bytes[0] >> 4;

		if(x >= s || y >= s) return server.send(400);
		server.send(200);

		custom[y][x] = bytes[1] & 0x1 ? 1 : 0;
	});

	server.begin();

	int elements[5] = {0, 1, 2, 1, 0};
	for(uint8_t i = 0; i < 5; i++) {
		Display(animation_frames[elements[i]], 750);
	}
	Display(animation_frames[3], 2000);

	Scheduler.start(&httpLoop);
	Scheduler.start(&drawLoop);

	// Show the current IP address
	Animate(WiFi.softAPIP().toString(), 150);

	Scheduler.begin();
}

void loop() {

}
