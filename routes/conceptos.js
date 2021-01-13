var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

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

//  se consultan todos los conceptos
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
                    model: models.Permission,
                    where: { name: 'ur' }
                }
            }
        })

        if (usuario && usuario.Role && usuario.Role.Permissions) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            models.Concept.findAll({
                order: [
                    ['id','ASC']
                ]
            }).then(conceptos => {
                return res.render('conceptos/conceptos', { conceptos })
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

//AGREAGAR CONCEPTO
router.post('/nuevo',
    [
        check('addNombre')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('addDescripcion')
            .not().isEmpty().withMessage('Descripción es un campo requerido.')
            .isLength({ max: 255 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
    ],
    isLoggedIn, async function (req, res, next) {
        //si hay errores entonces se muestran
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }

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
                        where: { name: 'uc' }           //////////////////  cambiar nombre del permiso 
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR EL CONCEPTO
                return res.status(403).json([{ msg: 'No estás autorizado para registrar conceptos.' }])

                //console.log(req.addNombre);
                //res.status(200).json([{ status: 200 }]);
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No fue posible registrar el concepto, inténtelo más tarde.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL CONCEPTO
            //guarda el CONCEPTO
            //var permsID = []
            //permsID.push(permission['id'])
            //console.log(permsID);
            // for (var key in req.body) {
            //     if (key != "role_name") {
            //         const permission = await models.Permission.findOne({ where: { name: key }, raw: true, transaction: t });
            //         permsID.push(permission['id'])
            //     }
            // }
            //se crea el concepto
            const newConcept = await models.Concept.create({
                name: req.body.addNombre,
                description: req.body.addDescripcion,
            }, { transaction: t })

            //await newConcept.setPermissions(permsID, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha registrado un concepto nuevo con los siguientes datos:\nnombre: " + newConcept.name + "\ndescripcion: " + newConcept.description +"\nCon los permisos:\n"

            // var contador = 0
            // for (var key in req.body) {
            //     if (key != "role_name") {
            //         desc = desc + key + "\n"
            //         contador++
            //     }
            // }

            // if (contador == 0) {
            //     desc = desc + "Ningún permiso"
            // }

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Registro de concepto",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el rol
            if (!log)
                throw new Error()
            if (!newConcept)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el concepto, vuelva a intentarlo más tarde.' }])
        }
        
    }
);

//ACTUALIZAR CONCEPTO
router.post('/update/:id',
    [
        check('editNombre')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('editDescripcion')
            .not().isEmpty().withMessage('Descripción es un campo requerido.')
            .isLength({ max: 255 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
    ]
    , isLoggedIn, async function (req, res, next) {
        //si hay errores entonces se muestran
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }

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
                        where: { name: 'uu' }           ////////////////////////REVISAR PERMISO
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para actualizar conceptos.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para actualizar conceptos.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //ACTUALIZA EL CONCEPTO
            //verificamos que no exista un concepto con el mismo nombre
            const conceptV = await models.Concept.findOne({ where: { name: req.body.editNombre, id: { $not: req.params.id } }, transaction: t })
            if (conceptV) {
                await t.rollback();
                return res.status(500).json([{ msg: 'Ya existe un concepto con el mismo nombre.' }])
            }
            else {
                // var permsID = []
                // for (var key in req.body) {
                //     if (key != "role_name") {
                //         const permission = await models.Permission.findOne({ where: { name: key }, raw: true, transaction: t });
                //         permsID.push(permission['id'])
                //     }
                // }
                //se actualiza el concepto
                const conceptU = await models.Concept.findOne({
                    where: { id: req.params.id }, transaction: t
                })

                await conceptU.update({
                    name: req.body.editNombre,
                    description: req.body.editDescripcion
                }, { transaction: t })

                //await conceptU.setPermissions(permsID, { transaction: t })

                //SE REGISTRA EL LOG
                //obtenemos el usuario que realiza la transaccion
                const usuario = await models.User.findOne({
                    where: {
                        id: req.user.id
                    },
                    transaction: t
                })

                //descripcion del log
                var desc = "El usuario " + usuario.email + " ha actualizado el concepto con el id " + conceptU.id + " con los siguientes datos:\nnombre: " + conceptU.name + "\ndescripcion: " + conceptU.editDescripcion + "\nCon los permisos:\n"

                // var contador = 0
                // for (var key in req.body) {
                //     if (key != "role_name") {
                //         desc = desc + key + "\n"
                //         contador++
                //     }
                // }

                // if (contador == 0) {
                //     desc = desc + "Ningún permiso"
                // }

                //guardamos los datos del log
                var dataLog = {
                    UserId: usuario.id,
                    title: "Actualización de concepto",
                    description: desc
                }

                //guarda el log en la base de datos
                const log = await models.Log.create(dataLog, { transaction: t })

                //verifica que se hayan registrado el log y el rol
                if (!log)
                    throw new Error()
                if (!conceptU)
                    throw new Error()

                res.status(200).json([{ status: 200 }]);
                // If the execution reaches this line, no errors were thrown.
                // We commit the transaction.
                await t.commit()
            }
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible actualizar el concepto, vuelva a intentarlo más tarde.' }])
        }
});

//ELIMINAR CONCEPTO
router.post('/delete/:id', isLoggedIn, async function (req, res, next) {
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
                    where: { name: 'ud' }               ///////////////////////////VERIFICAR QUE SEA EL PERMISO CORRECTO
                }
            }
        })

        if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
            //NO TIENE PERMISOS
            return res.status(403).json([{ msg: 'No tienes permiso de eliminar conceptos.' }])
        }
    }
    catch (error) {
        return res.status(403).json([{ msg: 'No tienes permiso de eliminar conceptos.' }])
    }

    //TIENE PERMISO

    //Transaccion
    const t = await models.sequelize.transaction()
    try {
        //se elimina el rol
        const conceptD = await models.Concept.findOne({ where: { id: req.params.id }, transaction: t })

        await conceptD.destroy({ transaction: t });

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
            title: "Eliminación de concepto",
            description: "El usuario " + usuario.email + " ha eliminado el concepto con el id " + conceptD.id + " de nombre " + conceptD.name + " con descripcion " + conceptD.description
        }

        //guarda el log en la base de datos
        const log = await models.Log.create(dataLog, { transaction: t })

        //verifica si se elimina el concepto
        const verConcept = await models.Concept.findOne({ where: { id: conceptD.id }, transaction: t })

        if (verConcept)
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
        return res.status(500).json([{ msg: 'No fue posible eliminar el concepto, vuelva a intentarlo más tarde.' }])
    }
});

module.exports = router;

