const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const path = require('path');

const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');


const recipeRoutes = require('./routes/recipeRoutes');
const Admin = require('./models/data/adminModels');
const Meal = require('./models/data/mealModels');


const app = express();
require('dotenv').config();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//mongoose setup
mongoose.connect(process.env.DATABASE_REMOTE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  },
  () => {
    console.log("Db connected");
  }
);

  
//express-session and method-override
 app.use(methodOverride('_method'));
app.use(
    session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection:mongoose.connection})

  })
  );

  //passport 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy({ usernameField: 'username'}, Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());

//middleware for connect flash
app.use(flash());

//setting up messages globally
app.use((req, res, next) => {
  res.locals.success_msg = req.flash(('success_msg'));
  res.locals.error_msg = req.flash(('error_msg'));
  res.locals.error = req.flash(('error'));
  res.locals.currentUser = req.user;
  next();
})

app.use(recipeRoutes);



const port = process.env.PORT || 4000;
app.listen(port, ()=> {
    console.log(`Server up on port ${port}`);
});