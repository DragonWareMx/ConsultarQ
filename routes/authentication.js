const express = require('express');
const passport = require('passport');
const router = express.Router();

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

module.exports = router;