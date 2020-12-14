var express = require('express');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
var validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const bodyParser = require('body-parser');

// Intializations
var app = express();
require('./lib/passport');

// Settings
//app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
  //autenticacion
app.use(session({
  secret: 'consultarq',
  resave: false,
  saveUninitialized: false,
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Global variables
app.use((req, res, next) => {
  app.locals.messages = req.flash('message');
  app.locals.successes = req.flash('success');
  app.locals.user = req.user;
  next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/usuarios',require('./routes/users'));

// Public
app.use(express.static(path.join(__dirname, 'public')));

// Starting
/*app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});*/

module.exports = app;