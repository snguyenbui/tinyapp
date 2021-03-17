const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "userID" }
};

const userDatabase = {
  "userID" : {
    id: "userID",
    email: "example@domain.com",
    password: "password"
  },
  "userID2" : {
    id: "userID",
    email: "example2@domain.com",
    password: "password"
  }
};

// In order to simulate generating a "unique" shortURL, for now we will implement a function that returns a string of 6 random alphanumeric characters:
const generateRandomString = () => {

  let output = "";
  while (output.length < 6) {

    //Generating code point value between 0 and 122
    let codePoint = Math.floor(Math.random() * 1000);
    if (codePoint > 122) {
      codePoint = Math.floor(codePoint / 10);
    }

    //Checks if codePoint is alphanumeric; 48-57 is numbers, 65-90 is uppercase letters, 97-122 is lowercase letters
    if ((48 <= codePoint && codePoint <= 57) || (65 <= codePoint && codePoint <= 90) || (97 <= codePoint && codePoint <= 122)) {
      output += String.fromCodePoint(codePoint);
    }
  }

  return output;
};

const findUserByEmail = (email) => {
  for (let user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
  return '';
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  const templateVars = {
    userDatabase: userDatabase,
    userID: "user_id"
  };
  res.render("user_login", templateVars);
});

app.post("/login", (req, res) => {
  const login = findUserByEmail(req.body.email);
  if (login.email !== req.body.email) {
    res.send("Error 403: Email not found");
  }
  if (login.password !== req.body.password) {
    res.send("Error 403: Incorrect password");
  }
  res.cookie("user_id", login.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const templateVars = {
    userDatabase: userDatabase,
    userID: "user_id"
  };
  res.render("user_registration", templateVars);
});

app.post("/register", (req, res) => {
  if (findUserByEmail(req.body.email).email === req.body.email) {
    res.send("Error 400: email already registered");
  }

  if (req.body.email !== "" && req.body.password !== "") {
    const userID = generateRandomString();
    userDatabase[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id", userID);
    res.redirect("/urls");
  } else {
    res.send("Error 400: email and password cannot be blank");
  }
});

app.get("/urls", (req, res) => {
  const templateVars = {
    userDatabase: userDatabase,
    userID: req.cookies["user_id"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const newShortURL = generateRandomString();
  urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
  res.redirect("/urls/" + newShortURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    userDatabase: userDatabase,
    userID: req.cookies["user_id"]
  };
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    userDatabase: userDatabase,
    userID: req.cookies["user_id"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.id;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req,res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
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
