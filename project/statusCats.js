export default async function (code, reason="You asked for it.") {
    let coolText;
    if (code==100) coolText = "100 Buffering Btw.";
    if (code==101) coolText = "101 Blinding Lights";
    if (code==102) coolText = "102 Uh... *Still Thinking what to write here*";
    if (code == 200) coolText = "200 Veri Veri Okei.";
    if (code == 201) coolText = "201 I created these!";
    if (code == 202) coolText = "202 Thanks for the pizza!";
    if (code == 203) coolText = "203 I no here! I ran away, go right!";
    if (code == 204) coolText = "204 This is empty...";
    if (code == 206) coolText = "206 Who is stronger now?";
    if (code == 207) coolText = "207 I am rare btw";
    if (code == 404) coolText = "404 Can't find my pants!";
    if (code == 500) coolText = "500 Internal Server Go Brrr!!!";
    if (code == 403) coolText = "403 Who asked?";
    if (code == 400) coolText = "400 What you doing?";
    if (code == 401) coolText = "401 Taste of Failure!";
    if (code == 408) coolText = "408 Dies from Cringeness...";
    if (code == 502) coolText = "502 Ah This Hurts!";
    if (code == 503) coolText = "503 I am on a holiday.";
    if (code == 504) coolText = "504 I got no idea what I'm doing.";
    if (code == 505) coolText = "505 Peekaboo! Found you!";
    if (code == 506) coolText = "506 I'm not good at this.";
    if (code == 507) coolText = "507 Is it me or does it look kinda <bold>THICC</bold>?";
    if (code == 508) coolText = "508 I go round and round~";
    if (code == 509) coolText = "509 Welcome to Mumbai! We got no houses for you though.";
    if (code == 510) coolText = "510 Don't look at me please";
    if (code == 511) coolText = "511 Show me your fingerprints!";
    return `<!DOCTYPE HTML>
      <html>
      <head><title>REEE!!!</title></head>
      <body style="background-color: #121212;color: #FFF;">
      <center>
      <h1>${coolText || code}</h1>
      <h2>Ree.js Server v0.1</h2>
      <img src="https://http.cat/${code}" />
      <p>More Information: ${reason}</p>
      </center>
      </body>
      </html>`;
}