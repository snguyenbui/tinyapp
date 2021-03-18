const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const express = require("express");
const methodOverride = require("method-override");
const request = require('request');
const { findUserByEmail, generateRandomString, urlsForUser } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"]
}));

// URL database formatted as "shortURL" : { longURL: "page_link", userID: "session User ID" }
// i.e "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userID" }
const urlDatabase = {
};

// User Database formatted object of users = "User session ID" : { id: "User session ID", email: "example@domain.com", password: "hashed password"}
const userDatabase = {
};

app.get("/", (req, res) => {

  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }

});

app.get("/login", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: "user_id"
  };

  res.render("user_login", templateVars);

});

app.post("/login", (req, res) => {

  const login = findUserByEmail(req.body.email, userDatabase);

  if (login.email !== req.body.email) {
    res.send("Error 403: Email not found");
  } else if (!bcrypt.compareSync(req.body.password, login.password)) {
    res.send("Error 403: Incorrect password");
  } else {
    req.session.user_id = login.id;
    res.redirect("/urls");
  }

});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/urls");

});

app.get("/register", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: "user_id"
  };

  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("user_registration", templateVars);
  }

});

app.post("/register", (req, res) => {

  if (findUserByEmail(req.body.email, userDatabase) !== undefined) {
    res.send("Error 400: email already registered");
  }

  if (req.body.email !== "" && req.body.password !== "") {
    const userID = generateRandomString();
    const hashedPass = bcrypt.hashSync(req.body.password, 10);
    userDatabase[userID] = {
      id: userID,
      email: req.body.email,
      password: hashedPass
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  } else {
    res.send("Error 400: email and password cannot be blank");
  }

});

app.get("/urls", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: req.session.user_id,
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };

  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {

  if (req.session.user_id) {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id, dateCreated: new Date, visits: 0, uniqueVisits: 0 };
    res.redirect("/urls/" + newShortURL);
  } else {
    res.send("Please log in before trying to create a new short URL");
  }

});

app.get("/urls/new", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: req.session.user_id
  };

  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }

});

app.get("/u/:shortURL", (req, res) => {
  
  if (urlDatabase[req.params.shortURL] === undefined) {
    res.send("Invalid short URL");
  } else { 
    const longURL = urlDatabase[req.params.shortURL].longURL;
    urlDatabase[req.params.shortURL].visits++;
    
    if (!req.session.visitor_id) {
      urlDatabase[req.params.shortURL].uniqueVisits++;
      req.session.visitor_id = generateRandomString();
    }
    
    request(longURL, (error) => {
      if (error) {
        res.send("Invalid URL");
      } else {
        res.redirect(longURL);
      }
    });
  }
    
});

app.get("/urls/:shortURL", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: req.session.user_id,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    dateCreated: urlDatabase[req.params.shortURL].dateCreated,
    visits: urlDatabase[req.params.shortURL].visits,
    uniqueVisits: urlDatabase[req.params.shortURL].uniqueVisits
  };

  if (urlsForUser(req.session.user_id, urlDatabase)[req.params.shortURL]) {
    res.render("urls_show", templateVars);
  } else {
    res.send("That short URL does not belong to you or you're not logged in");
  }

});

app.put("/urls/:id", (req, res) => {

  if (!req.session.user_id) {
    res.send("Please log in before editting the source URL");
  }

  if (urlsForUser(req.session.user_id, urlDatabase)) {
    urlDatabase[req.params.id].longURL = req.body.longURL;
  } else {
    res.send("You can only edit URLs registered to your account");
  }

  res.redirect("/urls");

});

app.delete("/urls/:shortURL/delete", (req,res) => {

  if (!req.session.user_id) {
    res.send("Please log in before editting the source URL");
  }

  if (urlsForUser(req.session.user_id, urlDatabase).shortURL === req.body.shortURL) {
    delete urlDatabase[req.params.shortURL];
  } else {
    res.send("You can only delete URLs registered to your account");
  }

  res.redirect("/urls");

});

app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);

});

app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);

});