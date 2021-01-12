var express = require('express');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
var validator = require('express-validator');
const passport = require('passport');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const MySQLStore = require('express-mysql-session')(session);

//sequelize models
const models = require('./models/index');

// Intializations
var app = express();
require('./lib/passport');

// Settings
//app.set('port', process.env.PORT || 4000);
app.set('views', [path.join(__dirname, 'views'),
path.join(__dirname, 'views/usuarios'),
path.join(__dirname, 'views/profile'),
path.join(__dirname, 'views/roles'),
path.join(__dirname, 'views/clientes'),
path.join(__dirname, 'views/servicios'),
path.join(__dirname, 'views/caja'),
path.join(__dirname, 'views/proyectos'),
]
);
app.set('view engine', 'pug');

var database = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  checkExpirationInterval: 1800000,
  clearExpired: true,
  expiration: 1800000
};

// Middlewares
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//autenticacion
app.use(session({
  secret: 'consultarq',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore(database)
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(validator());

// Global variables
app.use(async (req, res, next) => {
  app.locals.messages = req.flash('message');
  app.locals.successes = req.flash('success');

  try {
    var usuario = await models.User.findOne({
      where: { id: req.user.id }, include: [
        { model: models.Employee },
        {
          model: models.Role,
          include: {
            model: models.Permission
          }
        }
      ]
    });
    app.locals.user = usuario;

    //permisos
    uR = false

    if (usuario.Role && usuario.Role.Permissions) {
      usuario.Role.Permissions.forEach(permiso => {
        if (permiso.name == 'ur')
          uR = true
      });
    }

    app.locals.uR = uR;
  }
  catch (error) {
    app.locals.user = req.user
  }
  next();
});

// Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use('/usuarios', require('./routes/users'));
app.use('/perfil', require('./routes/perfil'));
app.use('/roles', require('./routes/roles'));
app.use('/clientes', require('./routes/clientes'));
app.use('/servicios', require('./routes/servicios'));
app.use('/caja', require('./routes/caja'));
app.use('/prestadores_externos', require('./routes/providers'));
app.use('/proyectos', require('./routes/proyectos'));
app.use('/conceptos', require('./routes/conceptos'));
app.use('/tipos_de_pago', require('./routes/pa_types'));

// Public
app.use(express.static(path.join(__dirname, 'public')));

// Starting
/*app.listen(app.get('port'), () => {
  console.log('Server is in port', app.get('port'));
});*/

module.exports = app;
