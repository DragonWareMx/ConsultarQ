var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//subir archivos
var multer = require('multer');
var path = require('path')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
var upload = multer({ storage: storage, fileFilter:  (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "image/gif") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});


/* GET users listing. */
//TODOS LOS USUARIOS
router.get('/', isLoggedIn, function (req, res, next) {
    models.User.findAll({
        include: ["Employee"]
    }).then(usuarios => {
        console.log(usuarios);
        res.render('usuarios', { usuarios })
    });
});

//AGREGAR USUARIO
router.get('/nuevo', isLoggedIn, function (req, res, next) {
    res.render('nuevoUsuario')
});

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
            include: ['Employee']
        })
        .then(usuario => {
            if (!usuario) {
                return res.send('error')  //AQUI VA LA VISTA DE ERRORES ERROR
            }
            res.render('editarUsuario', { usuario })
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


router.post('/nuevo', isLoggedIn, upload.single('fileField'),
    [
        check('email')
            .isEmail()
            .normalizeEmail().withMessage('Correo electrónico no válido.'),
        check('password')
            .isLength({ min: 8, max: 24 }).withMessage('La contraseña debe tener minimo 8 caracteres y máximo 24 caracteres.')
    ]
    , (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send( errors.array() );
        }
        passport.authenticate('local.signup', function(error, user, info) {
            if(error) {
                return res.status(500).json([{msg: 'Ocurrió un error al intentar registrar el usuario.'}]);
            }
            if(!user) {
                return res.status(401).json(info);
            }
            res.json(user);
        })(req, res, next);
    });

module.exports = router;
