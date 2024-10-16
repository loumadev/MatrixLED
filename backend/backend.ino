#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <Scheduler.h>
#include <Task.h>

#include "chars.h"
#include "page.html.h"


/* Settings */

#define AP_SSID "LED Matrix"
#define AP_PASS "led123"


/* Globals & Constants */

const uint8_t COLUMN[SIZE] = {15, 13, 12, 14, 16};  // Positive pins
const uint8_t ROW[SIZE] = {0, 4, 5, 3, 1};          // Negative pins

bool g_custom_mode = false;
uint8_t g_custom_buffer[SIZE][SIZE] = {
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 0, 1, 0, 0},
	{0, 0, 0, 0, 0},
	{0, 0, 0, 0, 0}
};

ESP8266WebServer g_server(80); // Server on port 80


/* Helper Functions */

/**
 * Maps a given integer from one range to another.
 *
 * @param x The integer to be mapped.
 * @param in_min The lower bound of the input range.
 * @param in_max The upper bound of the input range.
 * @param out_min The lower bound of the output range.
 * @param out_max The upper bound of the output range.
 * @return The mapped value within the output range.
 */
int map(int x, int in_min, int in_max, int out_min, int out_max) {
	return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

/**
 * Delays the program execution for a specified number of microseconds.
 * @param us The number of microseconds to delay.
 */
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


/* API Functions */

/**
 * Draws a single frame on an LED matrix for a fraction of a second.
 * @param frame A 2D array of size `SIZE * SIZE` representing the frame to be displayed.
 * @param del The delay value in microseconds for how long each row is displayed.
 */
void draw_frame(const uint8_t frame[SIZE][SIZE], uint32_t del) {
	for(int i = 0; i < SIZE; ++i) {
		// Connect or disconnect columns according to pattern.
		for(int j = 0; j < SIZE; ++j) {
			digitalWrite(COLUMN[j], frame[i][j]);
		}

		// Turn on whole row.
		digitalWrite(ROW[i], LOW);

		// Keep the row on for a while.
		// delay(del);
		delay_us(del * 250);

		// Turn off whole row.
		digitalWrite(row[i], HIGH);
	}
}

/**
 * Displays a frame for a specified duration.
 * @param pattern A 2D array of size `SIZE * SIZE` representing the frame to be displayed.
 * @param duration_ms The duration in milliseconds for which the frame is displayed.
 */
void display_frame(const uint8_t pattern[SIZE][SIZE], uint32_t duration_ms) {
	uint32_t start = millis();

	while((millis() - start) < duration_ms) {
		draw_frame(pattern, 1);
	}
}

/**
 * Displays a countdown on the LED matrix.
 * @param Time The time in seconds for the countdown.
 */
void Countdown(int Time) {
	int a = 10;
	int del = (Time - a) / a * 1000;

	for(int i = a - 1; i >= 0; i--) {
		display_frame(chars[i], del);
	}

	for(int i = a - 1; i >= 0; i--) {
		display_frame(chars[i], 1000);
	}

	animate_text("times up!", 180);
}

/**
 * Animates a text on the LED matrix.
 * @param text The text to be displayed.
 * @param frame_duration_ms The duration in milliseconds for which each frame is displayed.
 */
void animate_text(String text, uint32_t frame_duration_ms) {
	text.toLowerCase();

	int len = text.length();
	if(!len) return;

	// Allocate a buffer for the text + 1 blank frame at the end
	uint8_t buffer[SIZE][SIZE * len + SIZE];

	// Show the first character for 1 second
	int first_char_id = img.indexOf(text.charAt(0));
	display_frame(first_char_id == -1 ? unknow : chars[first_char_id], 1000);

	if(len <= 1) return;

	// Set the frame after last character to 0
	for(int y = 0; y < SIZE; y++) {
		for(int x = 0; x < SIZE; x++) {
			buffer[y][SIZE * len + x] = 0;
		}
	}

	// Fill the buffer with the characters
	for(int i = 0; i < len; i++) {
		int id = img.indexOf(text.charAt(i));

		for(int y = 0; y < SIZE; y++) {
			for(int x = 0; x < SIZE; x++) {
				buffer[y][i * SIZE + x] = id == -1 ? unknow[y][x] : chars[id][y][x];
			}
		}
	}

	// Prepare a temp buffer for each frame
	uint8_t temp[SIZE][SIZE];

	// Display each frame
	for(int i = 0; i < SIZE * len + 1; i++) {
		// Fill the temp buffer with the current frame
		for(int y = 0; y < SIZE; y++) {
			for(int x = 0; x < SIZE; x++) {
				temp[y][x] = buffer[y][i + x];
			}
		}

		// Display the frame
		display_frame(temp, frame_duration_ms);
	}

	delay(500);
}


/* Tasks */

// Async HTTP request handler
class HTTPTask : public Task {
protected:
	void loop() {
		g_server.handleClient();
	}
} g_http_loop;

// Async draw loop
class DrawTask : public Task {
protected:
	void loop() {
		if(!g_custom_mode) return;
		draw_frame(g_custom_buffer, 1);
	}
} g_draw_loop;


/* Setup */

/**
 * Sets up the HTTP server endpoints.
 */
void setup_endpoints() {
	g_server.on("/api/text", []() {
		g_server.send(200);
		yield();

		g_custom_mode = false;

		String data = g_server.arg("plain");

		uint8_t speed = (uint8_t)data.c_str()[0];
		String text = data.substring(1);

		uint32_t speed_ms = map(speed, 0, 255, 50, 500);

		animate_text(text, speed_ms);
	});

	g_server.on("/api/countdown", []() {
		g_server.send(200);
		yield();

		g_custom_mode = false;

		Countdown(g_server.arg("a").toInt());
	});

	g_server.on("/api/test", []() {
		g_server.send(200);
		yield();

		g_custom_mode = false;

		for(int i = 1000 / SIZE; i > 1; i--) { // 500
			draw_frame(animation_frames[4], 1000 / i);
		}
	});

	// rrrrrrrr (dddddddd 000vvvvv * 5) * ffffffff
	// r: repeat count, f: number of frames, d: duration of a frame, v: pattern
	g_server.on("/api/sequence", []() {
		g_server.send(200);
		yield();

		String data = g_server.arg("plain");
		size_t len = data.length();

		if(len < 7) return g_server.send(400);
		if((len - 1) % 6 != 0) return g_server.send(400);

		g_custom_mode = false;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		int frames = (len - 1) / 6;
		uint8_t repeat = bytes[0];
		const uint8_t *seq = bytes + 1;

		uint8_t buffer[SIZE][SIZE];

		for(uint8_t i = 0; i < repeat; i++) {
			for(size_t f = 0; f < frames; f++) {
				size_t offset = f * (SIZE + 1);

				uint8_t duration = seq[offset + 0];
				const uint8_t *pattern = seq + offset + 1;

				uint32_t duration_ms = map(duration, 0, 255, 16, 5000);

				for(uint8_t y = 0; y < SIZE; y++) {
					for(uint8_t x = 0; x < SIZE; x++) {
						buffer[y][x] = (pattern[y] >> x) & 0x1 ? 1 : 0;
					}
				}

				display_frame(buffer, duration_ms);
			}
		}

		g_server.send(200);
	});

	g_server.on("/api/custom/enable", []() {
		g_custom_mode = true;
		g_server.send(200);
	});

	g_server.on("/api/custom/disable", []() {
		g_custom_mode = false;
		g_server.send(200);
	});

	// 000vvvvv * 5
	// v: pattern
	g_server.on("/api/custom/pattern", []() {
		g_server.send(200);
		yield();

		String data = g_server.arg("plain");
		if(data.length() != SIZE) return g_server.send(400);

		g_custom_mode = true;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		for(int i = 0; i < SIZE; i++) {
			for(int j = 0; j < SIZE; j++) {
				g_custom_buffer[i][j] = (bytes[i] >> j) & 0x1 ? 1 : 0;
			}
		}

		g_server.send(200);
	});

	// yyyyxxxx 0000000v
	// x: x-coordinate, y: y-coordinate, v: value
	g_server.on("/api/custom/led", []() {
		g_server.send(200);
		yield();

		String data = g_server.arg("plain");
		if(data.length() != 2) return g_server.send(400);

		g_custom_mode = true;

		const uint8_t *bytes = (const uint8_t*)data.c_str();

		uint8_t x = bytes[0] & 0x0F;
		uint8_t y = bytes[0] >> 4;

		if(x >= SIZE || y >= SIZE) return g_server.send(400);
		g_server.send(200);

		g_custom_buffer[y][x] = bytes[1] & 0x1 ? 1 : 0;
	});
}

/**
 * The setup function for the Arduino sketch.
 */
void setup() {
	// Turn all columns off by setting then low
	for(uint8_t i = 0; i < SIZE; i++) {
		pinMode(COLUMN[i], OUTPUT);
		digitalWrite(COLUMN[i], LOW);
	}

	// Turn all rows off by setting then high
	for(uint8_t i = 0; i < SIZE; i++) {
		pinMode(ROW[i], OUTPUT);
		digitalWrite(ROW[i], HIGH);
	}

	// Set up a WiFi access point
	WiFi.hostname("ESP8266");
	WiFi.softAP(AP_SSID, AP_PASS);

	// Set up the HTTP server
	g_server.on("/", []() {
		server.send(200, "text/html", PAGE_HTML);
	});

	setup_endpoints();

	g_server.begin();

	// Display the startup animation
	int elements[5] = {0, 1, 2, 1, 0};
	for(uint8_t i = 0; i < 5; i++) {
		display_frame(animation_frames[elements[i]], 750);
	}
	display_frame(animation_frames[3], 2000);

	// Start the tasks
	Scheduler.start(&g_http_loop);
	Scheduler.start(&g_draw_loop);

	// Show the current IP address
	animate_text(WiFi.softAPIP().toString(), 150);

	// Run the scheduler
	Scheduler.begin();
}

/**
 * The loop function for the Arduino sketch.
 * This function is empty because the tasks are handled by the scheduler
 * and the execution flow never reaches this point. It is only here to
 * satisfy the Arduino sketch requirements.
 */
void loop() {}
