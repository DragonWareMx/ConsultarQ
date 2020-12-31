var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');
const helpers = require('../lib/helpers');

//sequelize models
const models = require('../models/index');

//subir archivos
const fs = require('fs');
var multer = require('multer');
var path = require('path')
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/avatar')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
var upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
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
        include: [{
            model: models.Employee
        }, {
            model: models.Role
        }],
    }).then(usuarios => {
        //console.log(usuarios);
        models.Role.findAll().then(roles => {
            res.render('usuarios', { usuarios, roles })
        });
    });
});

//AGREGAR USUARIO
// router.get('/nuevo', isLoggedIn, function (req, res, next) {
//     res.render('nuevoUsuario')
// });

//VER USUARIO ID
// router.get('/:id', isLoggedIn, function (req, res, next) {
//     let id = req.params.id
//     models.User
//         .findOne({
//             where: { id: id },
//         })
//         .then(user => {
//             res.send(user)
//         })
// });

// router.get('/editar/:id', isLoggedIn, function (req, res, next) {
//     let id = req.params.id
//     models.User
//         .findOne({
//             where: { id: id },
//             include: ['Employee']
//         })
//         .then(usuario => {
//             if (!usuario) {
//                 return res.send('error')  //AQUI VA LA VISTA DE ERRORES ERROR
//             }
//             res.render('editarUsuario', { usuario })
//         })
// });

//UPDATE USUARIO ID
router.post('/edit/:id', isLoggedIn, upload.single('fileField'),
    [
        check('email')
            .isEmail()
            .normalizeEmail().withMessage('Correo electrónico no válido.'),
    ],
    async function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }
        let id = req.params.id
        var dataUser = {
            email: req.body.email,
            RoleId: req.body.role,
        };
        if (req.file) {
            dataUser.picture = req.file.filename;
        }
        if (req.body.password) {
            dataUser.password = await helpers.encryptPassword(req.body.password);
        }
        var dataEmployee = {
            name: req.body.name,
            phone_number: req.body.phone_number,
            city: req.body.city,
            state: req.body.state,
            suburb: req.body.suburb,
            street: req.body.street,
            int_number: req.body.int_number,
            ext_number: req.body.ext_number,
            hiring_date: req.body.hiring_date,
        }
        models.User
            .findOne({
                where: { id: id }
            })
            .then(user => {
                //esto de abajo es para borrar la imagen vieja en caso de que hayan subido una nueva
                if (req.file) {
                    fs.unlink('public/uploads/avatar/' + user.picture, (err) => {
                        if (err) {
                            console.log("failed to delete local image:" + err);
                        } else {
                            console.log('successfully deleted local image');
                        }
                    });
                }
                user.update(dataUser)
                    .then(User => { })
            })
        models.Employee
            .findOne({
                where: { UserId: id }
            })
            .then(employee => {
                employee.update(dataEmployee)
                    .then(Employee => {
                        if (!Employee) {
                            res.status(500).json([{ msg: 'Ocurrió un error al intentar editar el usuario.' }]);
                        }
                        return res.json(Employee);
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
            return res.status(422).send(errors.array());
        }
        passport.authenticate('local.signup', function (error, user, info) {
            if (error) {
                return res.status(500).json([{ msg: 'Ocurrió un error al intentar registrar el usuario.' }]);
            }
            if (!user) {
                return res.status(401).json(info);
            }
            res.json(user);
        })(req, res, next);
    });

module.exports = router;
