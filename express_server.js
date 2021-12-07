const express = require('express');
const app = express();
const PORT = 8080; 


const generateRandomString = () => {
  let string = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 6);
  return string;
}

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;  // Log the POST request body to the console
  //const pair = { [shortURL]: urlDatabase[shortURL] };
  //console.log(pair);
  //console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);                 // Respond with 'Ok' (we will replace this)
});

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get('/urls/:shortURL', (req, res) => {
  //res.send(req.params) DO NOT INCLUDE
  let shortURL = req.params.shortURL;
  let longURL = urlDatabase[req.params.shortURL];
  const templateVars = { shortURL, longURL };
  res.render('urls_show', templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  //console.log(urlDatabase);
  const longURL = urlDatabase[req.params.shortURL];
  //console.log( req.params.shortURL, longURL );
  res.redirect(longURL);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

//DELETE
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

