const express = require("express");
const { getUserByEmail, generateRandomString } = require('./helpers');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080;

//middware
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
const bodyParser = require("body-parser"); //form via POST é enviado via buffer e parser make readable for us humans
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    user_ID: "test1"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    user_ID: "test"
  },
  ertert: {
    longURL: "https://www.er.com",
    user_ID: "test"
  }
};

//userDataBase
const users = {

}

const urlsForUser = function (user_id) {
  const resp = [];
  for (const idURL in urlDatabase) {
    if (urlDatabase[idURL].user_ID === user_id) {
      resp.push({ longURL: urlDatabase[idURL].longURL, shortURL: idURL })
    }
  } return resp
};

//Adding Routes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.render("urls_login", { "user": null });
    return;
  }

  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//new route handler for "/urls" and use res.render() to pass the URL data to our template.
app.get("/urls", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id];

  if (!user_id) {
    res.render("error_page", { "message": "User is not login", user: null });
    return;
  };

  const urlsFromUser = urlsForUser(user_id);
  const templateVars = { urls: urlsFromUser, user };
  res.render("urls_index", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.render("error_page", { "message": "User is not login", user: null });
    return;
  };
  console.log(urlDatabase);
  const user = users[user_id];

  if (!urlDatabase[req.params.shortURL]) {
    res.render("error_page", { "message": "Wrong short url", user: null });
    return;
  };

  if (urlDatabase[req.params.shortURL].user_ID !== user_id) {
    res.render("error_page", { "message": "Is not your URL", user: null });
    return;
  };

  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.render("error_page", { "message": "Wrong short url", user: null });
    return;
  };
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  const user_ID = req.session.user_id;

  if (!user_ID) {
    res.render("error_page", { "user": null });
    return;
  };

  if (!req.body.longURL) {
    res.render("error_page", { "message": "Empty URL", user: null });
    return;
  };

  if (!(req.body.longURL).includes('http')) {
    req.body.longURL = 'http://' + req.body.longURL;
  }

  const longURL = req.body.longURL;

  urlDatabase[`${newKey}`] = { longURL, user_ID };  // add newKey and url in urlDatabase
  res.redirect(`/urls/${newKey}`);

  app.post("/urls/:shortURL/delete", (req, res) => {
    const user_id = req.session.user_id;
    if (urlDatabase[req.params.shortURL].user_ID === user_id) {
      delete urlDatabase[req.params.shortURL];
    };
    res.redirect('/urls');
  });
});

//Recebendo shortURL e longURLEdit update
app.post("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;

  if (!(req.body.longURLEdit).includes('http')) {
    req.body.longURLEdit = 'http://' + req.body.longURLEdit;
  }

  if (urlDatabase[req.params.shortURL].user_ID === user_id) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURLEdit;
  }

  res.redirect("/urls")
});

app.get("/login", (req, res) => {
  res.render("urls_login", { "user": null });
});

app.post("/login", (req, res) => {
  const user_id = req.session.user_id;

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Missing email or password. <a href='/login'>Please try again 😀</a>")
    return;
  }

  const userAux = getUserByEmail(email, users)

  if (!userAux) {
    res.status(403).send("Sorry, please try again <a href='/login'>Please try again 😀</a>")
    return;
  }

  if (!bcrypt.compareSync(password, userAux.hashedPassword)) {
    res.status(403).send("Sorry, password and user no match")
    return;
  }

  req.session.user_id = userAux.user_id;

  res.redirect("/urls")
  return;

});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Create a Registration form
app.get("/register", (req, res) => {
  res.render("urls_register", { "user": null });
});

//Create a Registration Handler 
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {

    res.status(400).send("Missing email or password. <a href='/login'>Please try again 😀</a>")
    return;
  }

  if (getUserByEmail(email, users)) {
    res.status(400).send("Email already exist <a href='/login'>Please try again 😀</a>")
    return;
  }

  //HASH
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log(hashedPassword);

  const user_id = generateRandomString();

  users[user_id] = { user_id, email, hashedPassword };   //create newUser (object)
  console.log(users[user_id]);
  req.session.user_id = user_id;
  res.redirect("/urls")
});

