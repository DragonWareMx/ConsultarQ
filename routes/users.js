var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');
const helpers = require('../lib/helpers');

//operadores
const { Op } = require("sequelize");

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

    try {
        //VERIFICACION DEL PERMISO

        //obtenemos el usuario, su rol y su permiso
        let usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            include: {
                model: models.Role,
                include: {
                    model: models.Permission
                }
            }
        })

        var pC = false;
        var pR = false;
        var pU = false;
        var pD = false;

        usuario.Role.Permissions.forEach(permiso => {
            if (permiso.name == 'uc')
                pC = true
            else if (permiso.name == 'ur')
                pR = true
            else if (permiso.name == 'uu')
                pU = true
            else if (permiso.name == 'ud')
                pD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && pR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            //obtiene todos los usuarios y roles y se manda a la vista
            models.User.findAll({
                include: [{
                    model: models.Employee
                }, {
                    model: models.Role
                }],
                where: { email: { [Op.ne]: "DragonWareOficial@hotmail.com" } },
                order: [
                    ['status', 'ASC']
                ]
            }).then(usuarios => {
                models.Role.findAll({ where: { name: { [Op.ne]: "DragonWare" } } }).then(roles => {
                    return res.render('usuarios', { usuarios, roles, pC, pU, pD })
                });
            });
        }
        else {
            //NO TIENE PERMISOS
            return res.status(403).json(403)
        }
    }
    catch (error) {
        return res.status(403).json(403)
    }
});

//UPDATE USUARIO ID
router.post('/edit/:id', isLoggedIn, upload.single('fileField'),
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
            .optional({ checkFalsy: true })
            .trim()
            .not().isEmpty().withMessage('Contraseña es un campo requerido.')
            .isLength({ min: 8, max: 24 }).withMessage('La contraseña debe tener minimo 8 caracteres y máximo 24 caracteres.')
            .matches(/(?=.*?[A-Z])/).withMessage('La contraseña debe tener al menos una mayúscula.')
            .matches(/(?=.*?[a-z])/).withMessage('La contraseña debe tener al menos una minúscula.')
            .matches(/(?=.*?[0-9])/).withMessage('La contraseña debe tener al menos un número.')
            .not().matches(/^$|\s+/).withMessage('No se aceptan espacios en la contraseña.'),
        check('role')
            .optional({ checkFalsy: true })
            .custom(async (role) => {
                //se crea el validador, es true porque si no hay rol tambien es valido
                var validador = true

                //si no es nulo
                if (role) {
                    validador = false

                    let ids = await models.Role.findAll({
                        attributes: ['id'],
                        where: { id: { [Op.ne]: 1 } },
                        raw: true
                    })

                    ids.forEach(id => {
                        if (role == id.id) {
                            validador = true
                        }
                    });

                    if (role == 0)
                        validador = true
                }
                if (validador) {
                    return true
                }
                else
                    throw new Error('El rol existe.');
            }).withMessage('El rol no es válido.'),
        check('hiring_date')
            .optional({ checkFalsy: true })
            .custom(date => {
                return !isNaN(Date.parse(date));
            }
            ).withMessage('La fecha no es válida.'),
        check('phone_number')
            .not().isEmpty().withMessage('Número telefónico electrónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({ max: 50, min: 10 }).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
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
            .optional({ checkFalsy: true })
            .isAlphanumeric().withMessage('El número interior sólo acepta caracteres alfanuméricos.')
            .isLength({ max: 10 }).withMessage('El número interior puede tener un máximo de 10 caracteres.'),
        check('status').isIn(['active', 'inactive']).withMessage('El estatus ingresado no es válido.')
    ],
    async function (req, res, next) {
        //si hay errores entonces se muestran
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }

        try {
            //VERIFICACION DEL PERMISO
            //obtenemos el usuario, su rol y su permiso
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                include: {
                    model: models.Role,
                    include: {
                        model: models.Permission,
                        where: { name: 'uu' }
                    }
                }
            })
            //NO TIENE PERMISO
            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                return res.status(403).json([{ msg: 'No estás autorizado para actualizar usuarios.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para actualizar usuarios.' }])
        }

        //TIENE PERMISO

        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //ACTUALIZACION DE USUARIO
            //obtenemos el id del usuario que vamos a actualizar
            let id = req.params.id

            //verificamos que exista el rol
            var rolName

            if (req.body.role) {
                if (req.body.role == 0) {
                    req.body.role = null
                    rolName = "Sin rol"
                }
                else {
                    const rol = await models.Role.findOne({
                        where: {
                            id: req.body.role
                        },
                        transaction: t
                    })

                    //si el roll no existe ROLLBACK
                    if (!rol)
                        throw new Error()
                    else
                        rolName = rol.name
                }
            }
            else
                rolName = "Sin rol"

            //guardamos los datos del usuario
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

            //ACTUALIZACION DE EMPLEADO
            //guardamos los datos del empleado
            var dataEmployee = {
                name: req.body.name,
                phone_number: req.body.phone_number,
                city: req.body.city,
                state: req.body.state,
                suburb: req.body.suburb,
                street: req.body.street,
                int_number: req.body.int_number,
                ext_number: req.body.ext_number
            }

            if (!isNaN(Date.parse(req.body.hiring_date))) {
                dataEmployee.hiring_date = req.body.hiring_date
            }

            //verifica que exista el usuario
            const usuarioU = await models.User
                .findOne({
                    where: { id: id },
                    transaction: t
                })

            //esto de abajo es para borrar la imagen vieja en caso de que hayan subido una nueva
            if (req.file) {
                fs.unlink('public/uploads/avatar/' + usuarioU.picture, (err) => {
                    if (err) {
                        console.log("failed to delete local image:" + err);
                    } else {
                        console.log('successfully deleted local image');
                    }
                });
            }

            //se actualiza el usuario
            await usuarioU.update(dataUser, { transaction: t })

            const empleadoU = await models.Employee
                .findOne({
                    where: { UserId: id }
                })

            await empleadoU.update(dataEmployee, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Actualización de usuario",
                description: "El usuario " + usuario.email + " ha actualizado el usuario " + usuarioU.email + " con los siguientes datos:\nRol: " + rolName + "\nNombre: " + empleadoU.name + "\nNúmero telefónico: " + empleadoU.phone_number + "\nCiudad: " + empleadoU.city + "\nEstado: " + empleadoU.state + "\nColonia: " + empleadoU.suburb + "\nCalle: " + empleadoU.street + "\nNúmero interior: " + empleadoU.int_number + "\nNúmero exterior: " + empleadoU.ext_number + "\nFecha de contratación: " + empleadoU.hiring_date
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //nos aseguramos que se hayan guardado correctamente el log, el usuario y el empleado
            if (!log)
                throw new Error()
            if (!empleadoU)
                throw new Error()
            if (!usuarioU)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible actualizar el usuario, vuelva a intentarlo más tarde.' }])
        }
    });

//DELETE USUARIO ID
router.post('/delete/:id', isLoggedIn, async (req, res, next) => {
    try {
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
                    where: { name: 'ud' }
                }
            }
        })

        if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
            //NO TIENE PERMISOS
            return res.status(403).json([{ msg: 'No tienes permiso de eliminar usuarios.' }])
        }
    }
    catch (error) {
        return res.status(403).json([{ msg: 'No tienes permiso de eliminar usuarios.' }])
    }

    //TIENE PERMISO

    //Transaccion
    const t = await models.sequelize.transaction()
    try {
        let id = req.params.id

        const usuarioD = await models.User
            .findOne({
                where: { id: id },
                transaction: t
            })

        //esto de abajo es para borrar la imagen vieja en caso de que hayan subido una nueva
        if (usuarioD.picture != null) {
            fs.unlink('public/uploads/avatar/' + usuarioD.picture, (err) => {
                if (err) {
                    console.log("failed to delete local image:" + err);
                } else {
                    console.log('successfully deleted local image');
                }
            });
        }

        await usuarioD.destroy({ transaction: t })

        //SE REGISTRA EL LOG
        //obtenemos el usuario que realiza la transaccion
        const usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            transaction: t
        })

        //guardamos los datos del log
        var dataLog = {
            UserId: usuario.id,
            title: "Eliminación de usuario",
            description: "El usuario " + usuario.email + " ha eliminado el usuario " + usuarioD.email
        }

        //guarda el log en la base de datos
        const log = await models.Log.create(dataLog, { transaction: t })

        //verifica si se elimina el usuario
        const verUser = await models.User.findOne({ where: { id: usuarioD.id }, transaction: t })

        if (verUser)
            throw new Error()
        if (!log)
            throw new Error()

        res.status(200).json([{ status: 200 }]);
        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit()
    } catch (error) {

        // If the execution reaches this line, an error was thrown.
        // We rollback the transaction.
        await t.rollback();
        return res.status(500).json([{ msg: 'No fue posible eliminar el usuario, vuelva a intentarlo más tarde.' }])
    }
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
            .custom(async (role) => {
                //se crea el validador, es true porque si no hay rol tambien es valido
                var validador = true

                //si no es nulo
                if (role) {
                    validador = false

                    let ids = await models.Role.findAll({
                        attributes: ['id'],
                        raw: true
                    })

                    ids.forEach(id => {
                        if (role == id.id) {
                            validador = true
                        }
                    });

                    if (role == 0)
                        validador = true
                }
                if (validador)
                    return true
                else
                    throw new Error('El rol existe.');
            }).withMessage('El rol no es válido.'),
        check('hiring_date')
            .optional({ checkFalsy: true })
            .custom(date => {
                return !isNaN(Date.parse(date));
            }
            ).withMessage('La fecha no es válida'),
        check('phone_number')
            .not().isEmpty().withMessage('Número telefónico electrónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({ max: 50, min: 10 }).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
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
            .optional({ checkFalsy: true })
            .isAlphanumeric().withMessage('El número interior sólo acepta caracteres alfanuméricos.')
            .isLength({ max: 10 }).withMessage('El número interior puede tener un máximo de 10 caracteres.')
    ]
    , async (req, res, next) => {
        //si hay errores entonces se muestran
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }
        else {
            try {
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
                            where: { name: 'uc' }
                        }
                    }
                })

                if (usuario && usuario.Role && usuario.Role.Permissions) {
                    //TIENE PERMISO DE AGREGAR USUARIO
                    //guarda el usuario
                    passport.authenticate('local.signup', function (error, user, info) {
                        if (error) {
                            return res.status(500).json([{ msg: 'Ocurrió un error al intentar registrar el usuario.' }]);
                        }
                        if (!user) {
                            return res.status(401).json(info);
                        }
                        res.status(200).json([{ status: 200 }]);
                    })(req, res, next);
                }
                else {
                    //NO TIENE PERMISOS
                    return res.status(403).json([{ msg: 'No estás autorizado para registrar usuarios.' }])
                }
            }
            catch (error) {
                return res.status(403).json([{ msg: 'No fue posible registrar el usuario, inténtelo más tarde.' }])
            }
        }
});

module.exports = router;
