const express = require("express");
const bcrypt = require('bcryptjs');
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

const urlsForUser = (urlDatabase, user_id) => {
  let obj = {};
  for (let url in urlDatabase) {
    if (user_id === urlDatabase[url].userID) {
      obj[url] = urlDatabase[url];
    }
  }
  return obj;
}

const findUserEmail = (email) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
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

  if(!id) {
    return res.redirect("/login");
  }

  if(!user) {
    return res.redirect("/login");
  }
  
  res.render("urls_new", templateVars);
});

//GET REGISTER

app.get("/register", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { user };
  res.render("registration", templateVars);
});

//POST REGISTER

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!email || !password || email === '""' || password === '""') {
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
    hashedPassword,
  };
  console.log(users);
  res.cookie("user_id", id);
  res.redirect("/urls");
});

//LOGIN!!!

app.get('/login', (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { urls: urlDatabase, user };
  res.render('login', templateVars);
});

app.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password || password === '""' || email === '""') {
    return res.status(400).send("email and password can't be blank");
  }

  const user = findUserEmail(email);
  if (!user) {
    return res.status(403).send("a user with that email does not exist");
  }
//(user.password !== password)
  if (!bcrypt.compareSync(password, user.hashedPassword)) {
    return res.status(403).send('password does not match')
  }
  
  res.cookie("user_id", user.id);
  res.redirect("/urls");

  // const id = req.cookies.user_id;
  // const user = users[id];
  // const templateVars = { user };
});

//LOGOUT!!

app.post("/logout", function (req, res) {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const id = req.cookies.user_id;
  const user = users[id];
  const templateVars = { urls: urlsForUser(urlDatabase, id), user };
  if (!user) {
    return res.status(401).send('Please log in or register');
  } 
  res.render("urls_index", templateVars); 
});

app.post("/urls", (req, res) => {
  const id = req.cookies.user_id;
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
  const id = req.cookies.user_id;
  const user = users[id];
  if(!urlDatabase[shortURL]) {
    return res.status(404).send('this website does not exist in the database');
  }
  if (!user) {
    return res.status(401).send('Please log in or register!');
  } 
  if (user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('GTFO, this ish not yours');
  } 
  const templateVars = { 
    urls: urlsForUser(urlDatabase, id),
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user
  };
  res.render("urls_show", templateVars);
});

//FOR USERS LOGGED IN OR NOT
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if(!urlDatabase[shortURL]) {
    return res.status(404).send('this website does not exist in the database');
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});


//EDIT 
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = req.cookies.user_id;
  const user = users[id];
  if (user.id !== urlDatabase[shortURL].userID) {
    return res.status(401).send('Please log in or register');
  } 
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID: id };
  const templateVars = {
    urls: urlsForUser(urlDatabase, id),
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user
  };
  res.redirect("/urls");
});

//DELETE!
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.cookies.user_id;
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


//FOR USERS LOGGED IN OR NOT
// app.get("/u/:id", (req, res) => {
  // const id = req.cookies.user_id;
  // const user = users[id];
  // if(!id) {
  //   return res.send('unauthorized');
  // }
  // const templateVars = {
  //   shortURL: req.params.shortURL,
  //   longURL: urlDatabase[req.params.shortURL].longURL,
  //   user
  // };
//   res.render("urls_show", templateVars);
// });

 // let short = req.params.shortURL;
  // const id = req.cookies.user_id;
  // const user = users[id];
  // const longURL = urlDatabase[req.params.shortURL].longURL;
  // const templateVars = {
  //   shortURL: req.params.shortURL,
  //   longURL: urlDatabase[req.params.shortURL].longURL,
  //   user
  // };