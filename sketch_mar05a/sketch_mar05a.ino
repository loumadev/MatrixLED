#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h>
#include <Scheduler.h>
#include "chars.h"
/*#include "snake.cpp"*/

#define PI 3.14159265359

int column[s] = {15,13,12,14,16};       /* Positive pins */
int row[s] = {0,4,5,3,1};               /* Negative pins */

bool customMode = false;
int custom[s][s] = {
  {0,0,0,0,0},
  {0,0,0,0,0},
  {0,0,1,0,0},
  {0,0,0,0,0},
  {0,0,0,0,0}
};
 
ESP8266WebServer server(80); //Server on port 80

/* Async HTTP requset handler */
class HTTPTask : public Task {
protected:
    void loop()  {
        server.handleClient();
    } 
} httpLoop;
/* ========================== */

void draw(int patt[s][s],int del) {
    
    for (int i=0; i<s; ++i) {
        /* Connect or disconnect columns according to pattern. */
        for (int j=0; j<s; ++j) {
            digitalWrite(column[j], patt[i][j]);                    
        }
        
        /* Turn on whole row. */
        digitalWrite(row[i], LOW);

        delay(del);

        /* Turn off whole row. */
        digitalWrite(row[i], HIGH);
    }
}

void Display(int patt[s][s], int del) {

    for(int i=0;i<del/s;i++) {
        draw(patt, 1);
    }
    
}

void Show(String text) {
    text.toLowerCase();
   
    for(int i=0; i<text.length(); i++) {
        int id = img.indexOf(text.charAt(i));
        Display(id == -1 ? unknow : chars[id], 500);
    }
  
}

void Countdown(int Time) {
    int a = 10;
    int del = (Time-a)/a*1000;

    for(int i=a-1;i>=0;i--) {
        Display(chars[i], del);  
    }

    for(int i=a-1;i>=0;i--) {
        Display(chars[i], 1000);  
    }
    
    Animate("times up!", 180);
}

void Animate(String text, int del) {
  text.toLowerCase();

  int len = text.length();
  int Map[s][s*len+s];

  if(!len) return;

  Display(chars[img.indexOf(/*String(*/text.charAt(0))/*)*/], 1000);

  if(!(len>1)) return;

  for(int r=0;r<s;r++){for(int o=0;o<s;o++){Map[r][s*len+o]=0;}}

  for(int i=0; i<text.length(); i++) {
    int id = /*String(*/img.indexOf(text.charAt(i));/*)*/

    for(int j=0; j<s; j++) {
      for(int k=0; k<s; k++) {
        Map[j][i*s+k] = id == -1 ? unknow[j][k] : chars[id][j][k];
      }
    }
  }


  int Buffer[s][s];
  
  for(int i=0; i<s*len+1; i++) {
    for(int j=0; j<s; j++) {
      for(int k=0; k<s; k++) {
        Buffer[j][k] = Map[j][i+k];
      }
    }
    Display(Buffer, del);
  }

  delay(500);
}

class DrawTask : public Task {
protected:
    void loop()  {
        snakeHandler();
        if(!customMode) return;
        draw(custom, 1);
    } 
} drawLoop;

void setup()
{

    //for(int r=0;r<s;r++){for(int o=0;o<s;o++){Map[r][o]=0;}}
  
    /* Turn all columns off by setting then low. */
    for(int i=0; i<s; i++) { 
        pinMode(column[i], OUTPUT);
        digitalWrite(column[i], LOW);
    }
    
    /* Turn all rows off by setting then high. */
    for(int i=0; i<s; i++) { 
        pinMode(row[i], OUTPUT);
        digitalWrite(row[i], HIGH);
    }

    WiFi.hostname("ESP8266");
    
    WiFi.softAP("LED Matrix", "24112003");

    server.on("/", []() {
        server.send(200, "text/html","<!DOCTYPE html><html><meta name='viewport' content='width=device-width, initial-scale=1.0'><head></head><body><input type='text' placeholder='text'><br><input type='number' value='165' placeholder='speed'> <button onclick='a(1)'>Draw</button><br><br><input type='datetime-local' value=''> <button onclick='a(2)'>Start</button><br><input type='number' placeholder='seconds'> <button onclick='a(3)'>Start</button><script type='text/javascript'>function a(a){var b=document.getElementsByTagName('input');if(a==1){var x=b[0].value;var y=b[1].value;if(x==''||!y||y<1)return;var xhttp=new XMLHttpRequest();xhttp.open('POST','/draw?a='+x+'&b='+y,true);xhttp.send();}else if(a==2){var x=b[2].value;var y=c(new Date(x).getTime())-c(new Date().getTime());if(x==''||y<0)return;var xhttp=new XMLHttpRequest();xhttp.open('POST','/count?a='+y,true);xhttp.send();}else if(a==3){var x=b[3].value;if(x=='')return;var xhttp=new XMLHttpRequest();xhttp.open('POST','/count?a='+Math.abs(x),true);xhttp.send();}}function c(a){return parseInt(a/1000)}</script></body></html>");
    });

    server.on("/draw", []() {
        server.send(200);
        Animate(server.arg("a"), server.arg("b").toInt());
    });

    server.on("/count", []() {
        server.send(200);
        Countdown(server.arg("a").toInt());
    });

    server.on("/move", []() {
        server.send(200);
        snakeMove(server.arg("a").toInt());
    });

    server.on("/test", []() {
        server.send(200);
        
        for(int i=2500/s;i>1;i--) {   //500
            draw(anim[4], 500/i);
        }
        
    });

    server.on("/custom", []() {
        if(server.arg("a") == "true") customMode = true;
        else if(server.arg("a") == "false") customMode = false;
        else if(server.hasArg("b") && server.hasArg("c")) custom[String(server.arg("b").charAt(0)).toInt()][String(server.arg("b").charAt(1)).toInt()] = server.arg("c").toInt();
        else server.send(400);
        server.send(200);
        //Animate(server.arg("a"), server.arg("b").toInt());
    });


    server.begin();

    int animation[5] = {0,1,2,1,0};
    for(int i=0;i<5;i++) Display(anim[animation[i]],750);
    Display(anim[3],2000);

    /*int x = 0, y = 0, r = 3;
    for(int i=0;i<360;i++) {
      int Buffer[s][s];
      for(int r=0;r<s;r++){for(int o=0;o<s;o++){Buffer[r][o]=0;}}
      x = round(cos(i*PI/180)*r+r);
      y = round(sin(i*PI/180)*r+r);
      Buffer[x][y] = 1;
      Display(Buffer, 1);
    }*/

    //Countdown(60);

    snakeSetState(true);
    snakeMove(0);

    Scheduler.start(&httpLoop);
    Scheduler.start(&drawLoop);
    Scheduler.begin();
}



/* ============================================================ */

int snakeX = 0;
int snakeY = 0;

int snakeXval = 0;
int snakeYval = 0;

int snakeSpeed = 300;

int snakeState = false;

int snakeSnake[3][2] = {
  {0,0},
  {0,1},
  {0,2}
};

long snakeTime;

bool snakeGetState() {
  return snakeState;
}

void snakeSetState(bool state) {
  snakeState = state;
  snakeTime = millis();
}

void snakeMove(int dir) {   //0:w, 1:a, 2:s, 3:d
  switch(dir) {
    case 0: snakeXval = -1; snakeYval = 0; break;
    case 1: snakeXval = 0; snakeYval = -1; break;
    case 2: snakeXval = 1; snakeYval = 0; break;
    case 3: snakeXval = 0; snakeYval = 1; break;
  }
}

void snakeHandler() {
  snakeDraw();
  if(!snakeState) return;
  if(snakeTime > millis()) return;
  
  int a = s-1;

  for(int i=0;i<3;i++) {
    int b = snakeSnake[i][0] + snakeXval;
    int c = snakeSnake[i][1] + snakeYval;
    
    if(b<0) snakeSnake[i][0] = a;
    else if(b>s) snakeSnake[i][0] = 0;
    else snakeSnake[i][0] += snakeXval;
    
    if(c<0) snakeSnake[i][1] = a;
    else if(c>s) snakeSnake[i][1] = 0;
    else snakeSnake[i][1] += snakeYval;
  }
  
  snakeTime = millis() + snakeSpeed;
}

void snakeDraw() {
  int Buffer[s][s] = {
    {0,0,0,0,0},
    {0,0,0,0,0},
    {0,0,0,0,0},
    {0,0,0,0,0},
    {0,0,0,0,0}
  };

  for(int i=0;i<3;i++) {
    Buffer[snakeSnake[i][0]][snakeSnake[i][1]] = 1;
  }
  
  draw(Buffer, 1);
}


/* ============================================================ */



void loop()
{
  
}

