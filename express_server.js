const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require('morgan');
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser"); //form via POST é enviado via buffer e parser make readable for us humans
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    user_id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    user_id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  },
  "test": {
    user_id: "test", 
    email: "t@t.com", 
    password: "ttt"
  }
}

const getUserByEmail = function(email) {
  const auxUsers = Object.values(users);
  for (const user of auxUsers) {
    if (user.email === email) {
      return user
    }
  }
} 

function generateRandomString() {
  const length = 6;
  let randomString = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let x = 1; x <= length; x++) {
    randomString += characters[Math.floor(Math.random() * characters.length)];
  }
  return randomString;
}

//Adding Routes
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { user };
  res.render("urls_new", templateVars);
 
});

//new route handler for "/urls" and use res.render() to pass the URL data to our template.
app.get("/urls", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { urls: urlDatabase, user };
  res.render("urls_index", templateVars);
});

//pego parametro(valor) q veio da urls req.params.shortURL
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies.user_id;
  const user = users[user_id];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  //console.log(req.body.longURL);              // Log the POST request body to the console
  urlDatabase[`${newKey}`] = req.body.longURL;  // add newKey and url in urlDatabase
  res.redirect(`/urls/${newKey}`);              // Redirect to the new
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls")
});

//Recebendo shortURL e longURLEdit update
app.post("/urls/:shortURL", (req, res) => {
  // const user_id = req.cookies.user_id;
  // const user = users[user_id];
  // const templateVars = { user };
  let longURLEdit = req.body.longURLEdit
  urlDatabase[req.params.shortURL] = req.body.longURLEdit;
  res.redirect("/urls")
});

//Create a Registration form
app.get("/login", (req, res) => {
  res.render("urls_login" , {"user": null} );
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if ( !email || !password ) {
    res.status(400).send("e-mail or password is empty")
    return;
  }  
  const userAux = getUserByEmail(email)
  //if (getUserByEmail(email)) {
  if (userAux) { 
    if (userAux.email === email && userAux.password === password) {
      res.cookie('email', req.body.email) 
      res.cookie('user_id', userAux.user_id);
      res.redirect("/urls")
      return;
    } else { 
      res.status(403).send("Sorry, try again!")
      return;
    } 
  } else {
    res.status(403).send("Sorry!")
  } 
  
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.cookies.user_id);
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//Create a Registration form
app.get("/register", (req, res) => {
  res.render("urls_register" , {"user": null} );
});

// Recebendo form - Create a Registration Handler 
app.post("/register", (req, res) => {
  
  const email = req.body.email;
  const password = req.body.password;
 
  if ( !email || !password ) {
    res.status(400).send("e-mail or password is empty")
    return;
  }  

  if (getUserByEmail(email)) {
    res.status(400).send("User already exist")
    return;
  } 

  const user_id = generateRandomString();
  //create newUser (object)
  users[user_id] = { user_id, email, password };
  // Colocando user_id no cookie
  res.cookie('user_id', user_id);

  res.redirect("/urls")
});




// app.get("/", (req, res) => {
//   res.send("Hello!");
// });


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });