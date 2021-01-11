const express = require('express');
const { check, validationResult } = require('express-validator/check');
const passport = require('passport');
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
require('connect-flash');
require('dotenv').config();
//brute-force
var ExpressBrute = require('express-brute'),
    MemcachedStore = require('express-brute-memcached'),
    moment = require('moment'),
    store;

moment.locale('es-mx');

if (process.env.NODE_ENV == 'development') {
    store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
} else {
    // stores state with memcached
    store = new MemcachedStore(['127.0.0.1'], {
        prefix: 'NoConflicts'
    });
}

var failCallback = function (req, res, next, nextValidRequestDate) {
    req.flash('message', "Has hecho demasiados intentos de acceso. Por favor intenta nuevamente " + moment(nextValidRequestDate).fromNow());
    res.redirect('/login'); // brute force protection triggered, send them back to the login page
};
var handleStoreError = function (error) {
    log.error(error); // log this error so we can figure out what went wrong
    // cause node to exit, hopefully restarting the process fixes the problem
    throw {
        message: error.message,
        parent: error.parent
    };
}
// Start slowing requests after 5 failed attempts to do something for the same user
var userBruteforce = new ExpressBrute(store, {
    freeRetries: 3,
    minWait: 1 * 60 * 1000, // 1 minute,
    maxWait: 5 * 60 * 1000, // 5 minutes,
    failCallback: failCallback,
    handleStoreError: handleStoreError
});


//sequelize models
const models = require('../models/index');

router.get('/login', isNotLoggedIn, (req, res, next) => {
    res.render('login', { title: 'Iniciar sesión' });
});

router.get('/login2', isNotLoggedIn, (req, res, next) => {
    res.render('login2', { title: 'Iniciar sesión' });
});

router.get('/password/reset', isNotLoggedIn, (req, res, next) => {
    res.render('recuperar_pssw', { title: 'Recuperar contraseña' });
});

router.post('/login',
    userBruteforce.getMiddleware({
        key: function (req, res, next) {
            // prevent too many attempts for the same username
            next(req.body.username);
        }
    }),
    isNotLoggedIn, (req, res, next) => {
        passport.authenticate('local.signin', {
            successRedirect: '/inicio',
            failureRedirect: '/login',
            failureFlash: true
        })(req, res, next);
    });

router.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
});


router.get('/inicio', isLoggedIn, function (req, res, next) {
    //res.render('index', { title: 'Express' });
    res.render("inicio");
});

module.exports = router;