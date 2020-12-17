var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

/* GET users listing. */
//TODOS LOS USUARIOS
/*router.get('/', isLoggedIn, function (req, res, next) {
    models.User.findAll({
        include: ["employee"],
    }).then(usuarios => {
        res.send(usuarios)
    });
});*/

router.get('/', isLoggedIn, function (req, res, next) {
    models.User.findAll({
      include: ["Employee"]
    }).then(usuarios => {
        res.render('usuarios', { usuarios })
    });
});

//AGREGAR USUARIO
router.get('/nuevo', isLoggedIn, function (req, res, next) {
    res.render('nuevoUsuario')
});

router.post(
    '/nuevo',
    //validacion backend
    [
        check('email')
            .isEmail()
            .normalizeEmail(),
        check('password')
            .isLength({ min: 8, max: 24 })
    ],
    isLoggedIn,
    function (req, res, next) {
        //maneja los errores de la validacion
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(422).json({ errors: errors.array() });
        }

        //validar contrasenas iguales

        //autenticacion e insercion en la bd
        passport.authenticate('local.signup', {
            successRedirect: '/usuarios',
            failureRedirect: '/inicio',
            failureFlash: true,
            session: false
        })(req, res, next);
    }
);

//VER USUARIO ID
router.get('/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id
    models.User
        .findOne({
            where: { id: id },
        })
        .then(user => {
            res.send(user)
        })
});

router.get('/editar/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id
    models.User
        .findOne({
            where: { id: id },
        })
        .then(user => {
            if(!user){
               return res.send('error')  //AQUI VA LA VISTA DE ERRORES ERROR 
            }
            res.render('editarUsuario',{user})
        })
});

//UPDATE USUARIO ID
router.put('/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id
    let nuevosDatos = req.body
    models.User
        .findOne({
            where: { id: id }
        })
        .then(user => {
            user.update(nuevosDatos)
                .then(newUser => {
                    res.send(newUser)
                })
        })
});

//ELIMINAR USUARIO ID
router.delete('/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id

    models.User.destroy({
        where: { id: id }
    }).then(() => {
        res.send('Persona eliminada')
    })
});

module.exports = router;
