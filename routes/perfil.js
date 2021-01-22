var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');
const helpers = require('../lib/helpers');
//sequelize models
const models = require('../models/index');

//subir archivos
const fs = require('fs');
var multer = require('multer');
var path = require('path');
const { Console } = require('console');
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

router.get('/', isLoggedIn, async function(req, res, next) {
    const proyectos = await models.User
        .findOne({
            where: { id: req.user.id }, 
            include: { model: models.Project}
        })
    // console.log(usuario)
    res.render('perfil', {proyectos})
});

router.post('/edit/:id', upload.single('fileField'),
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
        check('passActual')
            .trim()
            .optional({ checkFalsy: true }),
        check('password')
            .optional({ checkFalsy: true })
            .trim()
            .not().isEmpty().withMessage('Contraseña es un campo requerido.')
            .isLength({ min: 8, max: 24 }).withMessage('La contraseña debe tener minimo 8 caracteres y máximo 24 caracteres.')
            .matches(/(?=.*?[A-Z])/).withMessage('La contraseña debe tener al menos una mayúscula.')
            .matches(/(?=.*?[a-z])/).withMessage('La contraseña debe tener al menos una minúscula.')
            .matches(/(?=.*?[0-9])/).withMessage('La contraseña debe tener al menos un número.')
            .not().matches(/^$|\s+/).withMessage('No se aceptan espacios en la contraseña.'),
            
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
    ], isLoggedIn, async (req, res, next) => {

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
                return res.status(403).json([{ msg: 'No estás autorizado para editar los datos.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para editar los datos.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //ACTUALIZACION DE USUARIO
            //obtenemos el id del usuario que vamos a actualizar
            let id = req.params.id

            //guardamos los datos del usuario
            var dataUser = {
                email: req.body.email
            };

            if (req.file) {
                dataUser.picture = req.file.filename;
            }

            //verifica que exista el usuario
            const usuarioU = await models.User
                .findOne({
                    where: { id: id },
                    transaction: t
                })


            // No se ingreso la contraseña actual
            if(req.body.password && !req.body.passActual){
                return res.status(500).json([{ msg: 'Contraseña actual incorrecta, no fue posible actualizar los datos.' }])
            }

            // Si si se va a cambiar la contraseña
            if(req.body.password && req.body.passActual){

                const isValidPassword = await helpers.matchPassword(req.body.passActual, usuarioU.password)  

                if (!isValidPassword) {
                    return res.status(500).json([{ msg: 'Contraseña actual incorrecta, no fue posible actualizar los datos.' }])
                }

                else{
                    dataUser.password = await helpers.encryptPassword(req.body.password);
                }
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
                title: "Actualización de perfil",
                description: "El usuario " + usuario.email + " ha actualizado el perfil " + usuarioU.email + " con los siguientes datos:\nNombre: " + empleadoU.name + "\nNúmero telefónico: " + empleadoU.phone_number + "\nCiudad: " + empleadoU.city + "\nEstado: " + empleadoU.state + "\nColonia: " + empleadoU.suburb + "\nCalle: " + empleadoU.street + "\nNúmero interior: " + empleadoU.int_number + "\nNúmero exterior: " + empleadoU.ext_number
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
            return res.status(500).json([{ msg: 'No fue posible actualizar el perfil, vuelva a intentarlo más tarde.' }])
        }
});

module.exports = router;