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
router.get('/', isLoggedIn, async (req, res, next) => {
    
    try{
    //VERIFICACION DEL PERMISO
        
        //obtenemos el usuario, su rol y su permiso
        let usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            include: {
                model: models.Role,
                include: {
                    model: models.Permission,
                    where: {name: 'ur'}
                }
            }
        })

        if(usuario && usuario.Role && usuario.Role.Permissions){
    //TIENE PERMISO DE DESPLEGAR VISTA
            //obtiene todos los usuarios y roles y se manda a la vista
            models.User.findAll({
                include: [{
                    model: models.Employee
                }, {
                    model: models.Role
                }],
                order: [
                    ['status', 'ASC']
                ]
            }).then(usuarios => {
                models.Role.findAll().then(roles => {
                    return res.render('usuarios', { usuarios, roles })
                });
            });
        }
        else{
    //NO TIENE PERMISOS
            return res.status(403).json(403)
        }
    }
    catch(error){
        return res.status(403).json(403)
    }
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
            status: req.body.status,
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


//DELETE USUARIO ID
router.post('/delete/:id', isLoggedIn, function (req, res, next) {
    let id = req.params.id

    models.User
        .findOne({
            where: { id: id }
        })
        .then(user => {
            //esto de abajo es para borrar la imagen vieja en caso de que hayan subido una nueva
            if (user.picture != null) {
                fs.unlink('public/uploads/avatar/' + user.picture, (err) => {
                    if (err) {
                        console.log("failed to delete local image:" + err);
                    } else {
                        console.log('successfully deleted local image');
                    }
                });
            }
            user.destroy()
                .then(() => {
                    res.json("Persona eliminada");
                })
        }).catch(err => {
            return res.status(500).json([{ msg: 'Ocurrió un error al intentar eliminar el usuario.' }]);
        });
});

//CREATE USUARIO
router.post('/nuevo', isLoggedIn, upload.single('fileField'),
    [
        check('name')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('email')
            .not().isEmpty().withMessage('Correo electrónico es un campo requerido.')
            .isEmail().withMessage('Correo electrónico no válido.')
            .normalizeEmail(),
        check('password')
            .trim()
            .not().isEmpty().withMessage('Contraseña es un campo requerido.')
            .isLength({ min: 8, max: 24 }).withMessage('La contraseña debe tener minimo 8 caracteres y máximo 24 caracteres.')
            .matches(/(?=.*?[A-Z])/).withMessage('La contraseña debe tener al menos una mayúscula.')
            .matches(/(?=.*?[a-z])/).withMessage('La contraseña debe tener al menos una minúscula.')
            .matches(/(?=.*?[0-9])/).withMessage('La contraseña debe tener al menos un número.')
            .not().matches(/^$|\s+/).withMessage('No se aceptan espacios en la contraseña.'),
        check('role')
            .custom(async (role) => 
            {
                //se crea el validador, es true porque si no hay rol tambien es valido
                var validador = true

                //si no es nulo
                if(role){
                    validador = false

                    let ids = await models.Role.findAll({
                        attributes: ['id'],
                        raw: true
                    })
                    
                    ids.forEach(id => {
                        if(role == id.id){
                            validador = true
                        }
                    });
                }
                if(validador)
                    return true
                else
                    throw new Error('El rol existe.');
            }).withMessage('El rol no es válido.'),
        check('hiring_date')
            .optional({checkFalsy: true})
            .custom(date =>
                {
                    console.log(date)
                    return !isNaN(Date.parse(date));
                }
            ).withMessage('La fecha no es válida'),
        check('phone_number')
            .not().isEmpty().withMessage('Número telefónico electrónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({max: 50, min: 10}).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
        check('city')
            .not().isEmpty().withMessage('Ciudad es un campo requerido.')
            .isLength({ max: 255 }).withMessage('Ciudad puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('state')
            .not().isEmpty().withMessage('Estado es un campo requerido.')
            .isLength({ max: 255 }).withMessage('Estado puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('suburb')
            .not().isEmpty().withMessage('Colonia es un campo requerido.')
            .isLength({ max: 255 }).withMessage('Colonia puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('street')
            .not().isEmpty().withMessage('Calle es un campo requerido.')
            .isLength({ max: 255 }).withMessage('Calle puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('ext_number')
            .not().isEmpty().withMessage('El número exterior es un campo requerido.')
            .isAlphanumeric().withMessage('El número interior sólo acepta caracteres alfanuméricos.')
            .isLength({ max: 10 }).withMessage('El número exterior puede tener un máximo de 10 caracteres.'),
        check('int_number')
            .optional({checkFalsy: true})
            .isAlphanumeric().withMessage('El número interior sólo acepta caracteres alfanuméricos.')
            .isLength({ max: 10 }).withMessage('El número interior puede tener un máximo de 10 caracteres.')
    ]
    , async (req, res, next) => {
        //si hay errores entonces se muestran
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }
        else{
            try{
            //VERIFICACION DEL PERMISO
                
                //obtenemos el usuario, su rol y su permiso
                let usuario = await models.User.findOne({
                    where: {
                        id: req.user.id
                    },
                    include: {
                        model: models.Role,
                        include: {
                            model: models.Permission,
                            where: {name: 'uc'}
                        }
                    }
                })
        
                if(usuario && usuario.Role && usuario.Role.Permissions){
            //TIENE PERMISO DE AGREGAR USUARIO
                    //guarda el usuario
                    passport.authenticate('local.signup', function (error, user, info) {
                        if (error) {
                            return res.status(500).json([{ msg: 'Ocurrió un error al intentar registrar el usuario.' }]);
                        }
                        if (!user) {
                            return res.status(401).json(info);
                        }
                        res.status(200).json([{status: 200}]);
                    })(req, res, next);
                }
                else{
            //NO TIENE PERMISOS
                    return res.status(403).json([{ msg: 'No estás autorizado para registrar usuarios.' }])
                }
            }
            catch(error){
                return res.status(403).json([{ msg: 'No estás autorizado para registrar usuarios.' }])
            }
        }
});

module.exports = router;
