const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(cookieParser());

const generateRandomString = () => {
  let string = Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 6);
  return string;
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "abc",
  },
  userRandomID2: {
    id: "userRandomID2",
    email: "user2@example.com",
    password: "123",
  },
};

const findUserEmail = (email) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/", (req, res) => {
  res.send("Hello!");
  // if (userID true) {
  //   res.redirect('/urls');
  // } else {
  //   res.redirect('/login');
  // }
});

app.get("/urls/new", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//REGISTER

app.get("/register", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("email and password can't be blank");
  }

  const user = findUserEmail(email);
  if (user) {
    return res.status(400).send("a user already exists with that email");
  }

  const id = generateRandomString();
  users[id] = {
    id,
    email,
    password,
  };

  res.cookie("user_id", id);
  res.redirect("/urls");
});

//LOGIN!!!

app.post("/login", function (req, res) {
  //const userID = req.body.id;
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { user };
  res.redirect("/urls");
});

//LOGOUT!!

app.post("/logout", function (req, res) {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {

  const id = req.cookies.user_id;

  const user = users[id];
  const templateVars = { urls: urlDatabase, user };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//EDIT
app.post("/urls/:shortURL", (req, res) => {
  const id = req.cookies.user_id;
  let short = req.params.shortURL;
  urlDatabase[short] = req.body.longURL;
  const user = users[id];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user
  };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
