const express = require('express');
const { check, validationResult } = require('express-validator/check');
const passport = require('passport');
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const helpers = require('../lib/helpers');
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
    res.render('login2', { title: 'Iniciar sesión' });
});

// router.get('/login2', isNotLoggedIn, (req, res, next) => {
//     res.render('login2', { title: 'Iniciar sesión' });
// });

router.get('/password/reset', isNotLoggedIn, (req, res, next) => {
    res.render('recuperar_pssw', { title: 'Recuperar contraseña' });
});

router.post('/password/reset', isNotLoggedIn, async (req, res, next) => {
    const { email } = req.body;
    const user = await models.User.findOne({ where: { email: email }, include: models.Employee });
    if (user === null) {
        req.flash('message', "No existe ningún usuario con ese correo electrónico.");
        return res.redirect('/password/reset');
    } else {
        const token = jwt.sign({ id: user.id }, process.env.RESET_PASSWORD_KEY, { expiresIn: '30min' });
        var transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'a03a4d385a4f7d', // generated ethereal user
                pass: '9baaf1e878972e', // generated ethereal password
            },
        });

        // send mail with defined transport object
        var mailOptions = {
            from: '"ConsultarQ 👻" <noreply@consultarq.com>', // sender address
            to: user.email, // list of receivers
            subject: "Notificación de recuperación de contraseña", // Subject line
            html: `
            <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                </head>
                <body style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -webkit-text-size-adjust: none; background-color: #ffffff; color: #718096; height: 100%; line-height: 1.4; margin: 0; padding: 0; width: 100% !important;">
                <style>
                @media  only screen and (max-width: 600px) {
                .inner-body {
                width: 100% !important;
                }

                .footer {
                width: 100% !important;
                }
                }

                @media  only screen and (max-width: 500px) {
                .button {
                width: 100% !important;
                }
                }
                </style>

                <table class="wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; margin: 0; padding: 0; width: 100%;">
                <tr>
                <td align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <table class="content" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 0; padding: 0; width: 100%;">
                <tr>
                <td class="header" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; padding: 25px 0; text-align: center;">
                <a href="${process.env.CLIENT_URL}" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; color: #3d4852; font-size: 19px; font-weight: bold; text-decoration: none; display: inline-block;">
                ConsultarQ
                </a>
                </td>
                </tr>

                <!-- Email Body -->
                <tr>
                <td class="body" width="100%" cellpadding="0" cellspacing="0" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; background-color: #edf2f7; border-bottom: 1px solid #edf2f7; border-top: 1px solid #edf2f7; margin: 0; padding: 0; width: 100%;">
                <table class="inner-body" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; background-color: #ffffff; border-color: #e8e5ef; border-radius: 2px; border-width: 1px; box-shadow: 0 2px 0 rgba(0, 0, 150, 0.025), 2px 4px 0 rgba(0, 0, 150, 0.015); margin: 0 auto; padding: 0; width: 570px;">
                <!-- Body content -->
                <tr>
                <td class="content-cell" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; max-width: 100vw; padding: 32px;">
                <h1 style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; color: #3d4852; font-size: 18px; font-weight: bold; margin-top: 0; text-align: left;">Hola, ${user.Employee.name}!</h1>
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;">Te enviamos este correo electrónico por que recibimos una solicitud de restauración de contraseña para tu cuenta.</p>
                <table class="action" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 100%; margin: 30px auto; padding: 0; text-align: center; width: 100%;">
                <tr>
                <td align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <tr>
                <td align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <tr>
                <td style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <a href="${process.env.CLIENT_URL}/password/reset/${token}" class="button button-primary" target="_blank" rel="noopener" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -webkit-text-size-adjust: none; border-radius: 4px; color: #fff; display: inline-block; overflow: hidden; text-decoration: none; background-color: #2d3748; border-bottom: 8px solid #2d3748; border-left: 18px solid #2d3748; border-right: 18px solid #2d3748; border-top: 8px solid #2d3748;">Restaurar Contraseña</a>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;">Este enlace para restaurar contraseña expirará en 30 minutos.</p>
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;">Si tú no solicitaste la restauración de tu contraseña, ignora este correo.</p>
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; font-size: 16px; line-height: 1.5em; margin-top: 0; text-align: left;">Saludos,<br>
                ConsultarQ</p>


                <table class="subcopy" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; border-top: 1px solid #e8e5ef; margin-top: 25px; padding-top: 25px;">
                <tr>
                <td style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; line-height: 1.5em; margin-top: 0; text-align: left; font-size: 14px;">Si estas teniendo porblemas para dal clic al botón de "Restaurar Contraseña" , copia y pega este enlace URL
                en tu navegador web: <span class="break-all" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; word-break: break-all;"><a href="${process.env.CLIENT_URL}/password/reset/${token}">${process.env.CLIENT_URL}/password/reset/${token}</a></span></p>

                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </td>
                </tr>

                <tr>
                <td style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative;">
                <table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; -premailer-cellpadding: 0; -premailer-cellspacing: 0; -premailer-width: 570px; margin: 0 auto; padding: 0; text-align: center; width: 570px;">
                <tr>
                <td class="content-cell" align="center" style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; max-width: 100vw; padding: 32px;">
                <p style="box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; position: relative; line-height: 1.5em; margin-top: 0; color: #b0adc5; font-size: 12px; text-align: center;">© 2020 TwitterBOT. All rights reserved.</p>

                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </table>
                </body>
            </html>
            `
        };
        transporter.sendMail(mailOptions, async function (error, info) {
            if (error) {
                console.log(error);
            } else {
                await user.update({ resetLink: token });
                req.flash('message', "El correo electrónico con el enlace para restaurar la contraseña ha sido enviado.");
                return res.redirect('/password/reset');
            }
        });
    }
});

router.get('/password/reset/:token', isNotLoggedIn, (req, res, next) => {
    res.render('reset_pssw', { token: req.params.token, title: 'Restaurar contraseña' });
});

router.post('/password/reset/:token', isNotLoggedIn, async (req, res, next) => {
    const { resetLink, password, password_confirm, email } = req.body;
    var backURL = req.header('Referer') || '/';
    if (password != password_confirm) {
        req.flash('message', "Las contraseñas no coinciden.");
        return res.redirect(backURL);
    }
    if (password.lenght < 8) {
        req.flash('message', "La contraseña tiene que ser de mínimo 8 caracteres.");
        return res.redirect(backURL);
    }
    if (resetLink) {
        jwt.verify(resetLink, process.env.RESET_PASSWORD_KEY, async function (error, decodedData) {
            if (error) {
                req.flash('message', "El token es incorrecto o ha expirado.");
                return res.redirect(backURL);
            }
            else {
                const user = await models.User.findOne({ where: { resetLink: resetLink, email: email }, include: models.Employee });
                if (user === null) {
                    req.flash('message', "No existe ningún usuario con ese correo electrónico.");
                    return res.redirect(backURL);
                }
                else {
                    const t = await models.sequelize.transaction()
                    const pass = await helpers.encryptPassword(password)
                    try {
                        await user.update({
                            password: pass,
                            resetLink: ''
                        }, { transaction: t })

                        var dataLog = {
                            UserId: user.id,
                            title: "Recuperación de contraseña",
                            description: "El usuario " + user.Employee.name + " ha restaurado su contraseña."
                        }
                        //guarda el log en la base de datos
                        const log = await models.Log.create(dataLog, { transaction: t })

                        await t.commit()
                        req.flash('message', "Tu contraseña ha sido cambiada con éxito.");
                        return res.redirect('/login');
                    } catch (error) {
                        await t.rollback();
                        req.flash('message', "Ocurrió un error, vuelve a intentarlo más tarde.");
                        return res.redirect(backURL);
                    }
                }
            }
        });
    }
    else {
        req.flash('message', "Ocurrió un error, vuelve a intentarlo más tarde.");
        return res.redirect(backURL);
    }

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