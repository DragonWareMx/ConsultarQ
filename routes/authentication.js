const express = require('express');
const passport = require('passport');
const router = express.Router();
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');

router.get('/login' , isNotLoggedIn ,(req,res,next) => {
    res.render('login', { title: 'Iniciar sesión' });
});

router.post('/login', isNotLoggedIn ,(req, res, next) =>{
    passport.authenticate('local.signin',{
        successRedirect: '/inicio',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/register', isNotLoggedIn ,(req,res,next) => {
    res.render('register', { title: 'Registrarse' });
});

router.post('/register', isNotLoggedIn,(req, res, next) =>{
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
    res.render("inicio");
});
  
module.exports = router;