const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// In order to simulate generating a "unique" shortURL, for now we will implement a function that returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {

  let output = "";
  while (output.length < 6) {

    //Generating code point value between 0 and 122
    let codePoint = Math.floor(Math.random()*1000)
    if (codePoint > 122) {
      codePoint = Math.floor(codePoint / 10);
    }

    //Checks if codePoint is alphanumeric; 48-57 is numbers, 65-90 is uppercase letters, 97-122 is lowercase letters
    if ((48 <= codePoint && codePoint <= 57) || (65 <= codePoint && codePoint <= 90) || (97 <= codePoint && codePoint <= 122)) {
      output += String.fromCodePoint(codePoint);
    }
  }

  return output;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
