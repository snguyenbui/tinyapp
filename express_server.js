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

  if (req.session_user_id) {
    res.redirect("/url");
  } else {
    res.render("user_login", templateVars);
  }

});

app.post("/login", (req, res) => {

  const login = findUserByEmail(req.body.email, userDatabase);

  if (login !== undefined){
    if (login.email !== req.body.email) {
      res.send("Error 403: Email not found");
    } else if (!bcrypt.compareSync(req.body.password, login.password)) {
      res.send("Error 403: Incorrect password");
    } else {
      req.session.user_id = login.id;
      res.redirect("/urls");
    }
  } else {
    res.send("Error 403: Email not found");
  }
    
});

app.post("/logout", (req, res) => {

  req.session = null;
  res.redirect("/login");

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
  } else {
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
  }

});

app.get("/urls", (req, res) => {

  const templateVars = {
    userDatabase: userDatabase,
    userID: req.session.user_id,
    urls: urlsForUser(req.session.user_id, urlDatabase)
  };

  if (req.session.user_id) {
    res.render("urls_index", templateVars);
  } else {
    res.send("Error, not currently signed in")
  }

});

app.post("/urls", (req, res) => {

  if (req.session.user_id) {
    const newShortURL = generateRandomString();
    urlDatabase[newShortURL] = { longURL: req.body.longURL, userID: req.session.user_id, dateCreated: new Date, visits: 0, uniqueVisits: [] };
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
    
    if (urlDatabase[req.params.shortURL].uniqueVisits.indexOf(req.session.visitor_id) === -1) {
      req.session.visitor_id = generateRandomString();
      urlDatabase[req.params.shortURL].uniqueVisits.push(req.session.visitor_id);
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
  };

  if (urlsForUser(req.session.user_id, urlDatabase)[req.params.shortURL] === undefined) {
    res.send("That short URL does not belong to you or you're not logged in");
  } else {
    if (urlsForUser(req.session.user_id, urlDatabase)[req.params.shortURL]) {
      templateVars.longURL = urlDatabase[req.params.shortURL].longURL,
      templateVars.dateCreated = urlDatabase[req.params.shortURL].dateCreated,
      templateVars.visits = urlDatabase[req.params.shortURL].visits,
      templateVars.uniqueVisits = urlDatabase[req.params.shortURL].uniqueVisits
      res.render("urls_show", templateVars);
    } else {
      res.send("That short URL does not belong to you or you're not logged in");
    }
  }

});

app.put("/urls/:id", (req, res) => {

  if (!req.session.user_id) {
    res.send("Please log in before editting the source URL");
  } else { 
    if (urlsForUser(req.session.user_id, urlDatabase)) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
      res.redirect("/urls");
    } else {
      res.send("You can only edit URLs registered to your account");
    }
  }

});

app.delete("/urls/:shortURL/delete", (req,res) => {

  if (!req.session.user_id) {
    res.send("Please log in before editting the source URL");
  } else {
    if (urlsForUser(req.session.user_id, urlDatabase).shortURL === req.body.shortURL) {
      res.redirect("/urls");
      delete urlDatabase[req.params.shortURL];
    } else {
      res.send("You can only delete URLs registered to your account");
    }
  }


});

app.get("/urls.json", (req, res) => {

  res.json(urlDatabase);

});

app.listen(PORT, () => {

  console.log(`Example app listening on port ${PORT}!`);

});