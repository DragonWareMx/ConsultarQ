const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//sequelize models
const models = require('../models/index');

//AQUI SE DEFINE LA AUTENTICACIÓN DE USUARIO DEL PROGRAMA

//encriptacion
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async(req, email, password, done) => {
 
        models.User.findOne({
            where: {
                email: email
            }
        }).then(async (user) => {
            if (!user) {
                return done(null, false, {
                    message: 'El usuario no existe.'
                });
            }

            const isValidPassword = await helpers.matchPassword(password, user.password);
 
            if (!isValidPassword) {
                return done(null, false, {
                    message: 'Contraseña incorrecta.'
                });
            }
 
            var userinfo = user.get();
            return done(null, userinfo, req.flash('success','Bienvenido '+ user.name));
 
        }).catch(function(err) {
            console.log("Error:", err);
 
            return done(null, false, {
                message: 'Something went wrong with your Signin.'
            });
 
        });
    /*const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0 ){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword){
            console.log('si esta bien la contra');
            done(null, user, req.flash('success','Bienvenido' + user.name));
        }else{
            console.log('No esta bien la contra');
            done(null, false, req.flash('message','Contraseña incorrecta'));
        }
    } else{
        console.log('Ni si quiera existe ese usuario perro');
        done(null, false, req.flash('message','El correo no existe'));
    }*/
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
    
    models.User.findOne({
        where: {
            email: email
        }
    }).then( async (user) => {
     
        if (user){
            return done(null, false, {
                message: 'That email is already taken'
            });
        } else{   
            //encriptacion de la password
            const userPassword = await helpers.encryptPassword(password);

            var data =
                {
                    email: email,
                    password: userPassword,
                    name: req.body.name
                };
     
            models.User.create(data).then(function(newUser, created) {
                if (!newUser) {
                    return done(null, false);
                }
                else {
                    return done(null, newUser);
                }
            });
        }
    });

    /*let newUser = null;

    // Saving in the Database
    models.User.create({
        email: req.body.email,
        password: password,
        name: req.body.name
    }).then( user => {
      console.log(user);
      newUser = user;
      console.log(newUser)
    });

    return done(null, newUser);*/
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
/*const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
done(null, rows[0]);*/
    models.User.findOne({ 
        where: {id: id}}).then(function(user) {
        if (user) {
            done(null, user.get());
        } else {
            done(user.errors, null);
        }
    });
});