const express = require('express');
const { check, validationResult } = require('express-validator/check');
const passport = require('passport');
const router = express.Router();
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');

//sequelize models
const models = require('../models/index');

router.get('/login' , isNotLoggedIn ,(req,res,next) => {
    res.render('login', { title: 'Iniciar sesión' });
});

router.get('/login2' , isNotLoggedIn ,(req,res,next) => {
    res.render('login2', { title: 'Iniciar sesión' });
});

router.get('/recuperar-pssw' , isNotLoggedIn ,(req,res,next) => {
    res.render('recuperar_pssw', { title: 'Recuperar contraseña' });
});

router.post('/login', isNotLoggedIn ,(req, res, next) =>{
    passport.authenticate('local.signin',{
        successRedirect: '/inicio',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

/*
router.get('/register', isNotLoggedIn ,(req,res,next) => {
    res.render('register', { title: 'Registrarse' });
});

router.post(
    '/register',
    //validacion backend
    [
        check('email')
            .isEmail()
            .normalizeEmail(),
        check('password')
            .isLength({ min:6 })
    ],
    (req,res,next) => {
        //maneja los errores de la validacion
          const errors = validationResult(req);
          if(!errors.isEmpty()){
              console.log(errors);
              return res.status(422).json({ errors:errors.array() });
          }

          //insercion de datos a la bd
          models.User.create({
              email: req.body.email,
              password: req.body.password,
              name: req.body.name
          });
});*/

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
  });


router.get('/inicio', isLoggedIn, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("inicio");
});
  
module.exports = router;