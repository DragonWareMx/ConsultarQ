const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async(req, email, password, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
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
    }
}));

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, async (req, email, password, done) => {
  
    const { name } = req.body;
    let newUser = {
      name,
      email,
      password
    };
    newUser.password = await helpers.encryptPassword(password);
    // Saving in the Database
    const result = await pool.query('INSERT INTO users SET ? ', newUser);
    newUser.id = result.insertId;
    return done(null, newUser);
  }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
done(null, rows[0]);
});