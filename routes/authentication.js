const express = require('express');
const passport = require('passport');
const router = express.Router();
const {isLoggedIn} = require('../lib/auth');

router.get('/login',(req,res,next) => {
    res.render('login', { title: 'Iniciar sesión' });
});

router.post('/login',(req, res, next) =>{
    passport.authenticate('local.signin',{
        successRedirect: '/inicio',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/register',(req,res,next) => {
    res.render('register', { title: 'Registrarse' });
});

router.post('/register',(req, res, next) =>{
    passport.authenticate('local.signup',{
        successRedirect: '/inicio',
        failureRedirect: '/register',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
  });


router.get('/inicio', isLoggedIn, function(req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("test");
});
  
module.exports = router;