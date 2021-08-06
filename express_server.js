const express = require("express");
const {  getUserByEmail } = require('./helpers');
const morgan = require('morgan');
//const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 8080; // default port 8080

//middware
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
const bodyParser = require("body-parser"); //form via POST é enviado via buffer e parser make readable for us humans
//app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.set("view engine", "ejs");

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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

const users = {
  "userRandomID": {
    user_id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "test1": {
    user_id: "test1",
    email: "t1@t1.com",
    password: "t1"
  },
  "test": {
    user_id: "test",
    email: "t@t.com",
    password: "ttt"
  }
}

// const getUserByEmail = function (email, database) {
//   for (const user in database) {
//     if (email === database[user].email) {
//       return database[user]
//     }
//   }
//   return false
// }

const urlsForUser = function (user_id) {
  //const auxIdDatabase = Object.values(urlDatabase);
  const resp = [];
  for (const idURL in urlDatabase) {
    if (urlDatabase[idURL].user_ID === user_id) {
      resp.push({ longURL: urlDatabase[idURL].longURL, shortURL: idURL })
    }
  } return resp
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
    res.render("error_page", { "message": "User is not login" , user: null });
    return;
  }

  const urlsFromUser = urlsForUser(user_id);

  const templateVars = { urls: urlsFromUser, user };
  res.render("urls_index", templateVars);
});

//pego parametro(valor) q veio da urls req.params.shortURL
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  if (!user_id) {
    res.render("error_page", {"message": "User is not login" , user: null });
    return;
  }
  console.log(urlDatabase);
  const user = users[user_id];

  if (!urlDatabase[req.params.shortURL]) {
    res.render("error_page", {"message": "Wrong short url" , user: null });
    return;
  }

  if (urlDatabase[req.params.shortURL].user_ID !== user_id){
    res.render("error_page", {"message": "Is not your URL" , user: null });
    return;
  }


  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user };


  //const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {

  if (!urlDatabase[req.params.shortURL]) {
    res.render("error_page", {"message": "Wrong short url" , user: null });
    return;
  }
  const longURL = urlDatabase[req.params.shortURL].longURL;


  res.redirect(longURL);
});

app.get("/", (req, res) => {
  res.redirect('/login');
});

app.post("/urls", (req, res) => {
  let newKey = generateRandomString();
  //console.log(req.body.longURL);                  // Log the POST request body to the console
  const user_ID = req.session.user_id;

  if (!user_ID) {
    res.render("error_page", { "user": null });
    return;
  }
  const longURL = req.body.longURL
  urlDatabase[`${newKey}`] = { longURL, user_ID };  // add newKey and url in urlDatabase
  res.redirect(`/urls/${newKey}`);                 // Redirect to the new
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.session.user_id;
  if (urlDatabase[req.params.shortURL].user_ID === user_id) {
    delete urlDatabase[req.params.shortURL]
  }
  res.redirect('/urls')
});


//Recebendo shortURL e longURLEdit update
app.post("/urls/:shortURL", (req, res) => {
  const user_id = req.session.user_id;
  if (!(req.body.longURLEdit).includes('http')) {
    req.body.longURLEdit = 'http://' + req.body.longURLEdit;
  }
  // const user = users[user_id];
  // const templateVars = { user };
  //let longURLEdit = req.body.longURLEdit ****
  if (urlDatabase[req.params.shortURL].user_ID === user_id) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURLEdit;
  }

  res.redirect("/urls")
});

//Create a Registration form
app.get("/login", (req, res) => {
  res.render("urls_login", { "user": null });
});

app.post("/login", (req, res) => {
  const user_id = req.session.user_id;

  // if (users[user_id]){
  //   //res.redirect('/urls');
  //   return 
  // }

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
// bcrypt.compare(password, userAux.password).then((data)=>{
//   console.log("is here ------",data);
// });

  if (!bcrypt.compareSync(password, userAux.hashedPassword)) {
    res.status(403).send("Sorry, password and user no match")
    return;
  } 
  //res.cookie('email', req.body.email)
  //res.cookie('user_id', userAux.user_id);
  req.session.user_id = userAux.user_id;

  res.redirect("/urls")
  return;

});

app.post("/logout", (req, res) => {
  //res.clearCookie('user_id', req.cookies.user_id);
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

// Recebendo form - Create a Registration Handler 
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {

    res.status(400).send("Missing email or password. <a href='/login'>Please try again 😀</a>")
    return;
  }

  if (getUserByEmail(email , users)) {
    res.status(400).send("Email already exist <a href='/login'>Please try again 😀</a>")
    return;
  }
  //HASH
  const hashedPassword = bcrypt.hashSync(password, 10);

  const user_id = generateRandomString();
 
  users[user_id] = { user_id, email, hashedPassword };   //create newUser (object)
  console.log(users[user_id]);
  //res.cookie('user_id', user_id);                        // Colocando user_id no cookie
  req.session.user_id = user_id;
  res.redirect("/urls")
});




// app.get("/", (req, res) => {
//   res.send("Hello!");
// });


// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });