const express = require("express");
const bcrypt = require('bcryptjs');
const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const { findUserByEmail, generateRandomString, urlsForUser } = require("./helpers");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["key"],
}));

// --DATA--

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: 'aJ48lW'
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: 'aJ48lW'
  }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: bcrypt.hashSync("abc", 10),
  },
  userRandomID2: {
    id: "userRandomID2",
    email: "user2@example.com",
    hashedPassword: bcrypt.hashSync("123", 10),
  },
};

// --ROUTES-- 

app.get("/", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];

  if (!user) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});

app.get("/urls/new", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = { user };

  if (!id) {
    return res.redirect("/login");
  }
  if (!user) {
    return res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = { user };
  res.render("registration", templateVars);
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  if (!email || !password || email === '""' || password === '""') {
    return res.status(400).send("email and password can't be blank");
  }
  const user = findUserByEmail(email);
  if (user) {
    return res.status(400).send("a user already exists with that email");
  }

  const id = generateRandomString();
  users[id] = {
    id,
    email,
    hashedPassword,
  };

  req.session.user_id = id;
  res.redirect("/urls");
});

app.get('/login', (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = { user };
  res.render('login', templateVars);
});

app.post("/login", function(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password || password === '""' || email === '""') {
    return res.status(400).send("email and password can't be blank");
  }
  const user = findUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("a user with that email does not exist");
  }
  if (!bcrypt.compareSync(password, user.hashedPassword)) {
    return res.status(403).send('password does not match');
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", function(req, res) {
  delete req.session.user_id;
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];
  const templateVars = { urls: urlsForUser(urlDatabase, id), user };

  if (!user) {
    return res.status(401).send('Please log in or register');
  }

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const id = req.session.user_id;
  const user = users[id];

  if (!user) {
    return res.send('Unauthorized');
  }

  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;
  const user = users[id];

  if (!urlDatabase[shortURL]) {
    return res.status(404).send('this website does not exist in the database');
  }
  if (!user) {
    return res.status(401).send('Please log in or register!');
  }
  if (user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('GTFO, this ish not yours');
  }

  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL].longURL) {
    return res.status(404).send('this website does not exist');
  }

  const hasHttp = urlDatabase[shortURL].longURL.indexOf('http://');
  if (hasHttp !== 0) {
    const url = `http://${urlDatabase[shortURL].longURL}`;
    res.redirect(url);
  }

  const long = urlDatabase[shortURL].longURL;
  res.redirect(long);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.session.user_id;
  const user = users[id];

  if (user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('Please log in or register');
  }

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.shortURL;
  const user = users[id];

  if (!user) {
    return res.status(401).send('Please log in or register');
  }
  if (user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('GTFO, this ish not yours');
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

