var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//operadores
const { Op, where } = require("sequelize");

//VER TODOS LOS ROLES
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
            //obtiene todos los roles y se manda a la vista
            models.Role.findAll({
                where: { name: { [Op.ne]: "DragonWare" } },
                include: [{
                    model: models.User,
                    include: {
                        model: models.Employee,
                        attributes: ['name']
                    }
                }, {
                    model: models.Permission,
                    attributes: ['name']
                }],
            }).then(roles => {
                res.render('roles', { roles, pC, pU, pD })
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

//AGREGAR ROL
router.post('/create',
    [
        check('role_name')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
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
                        where: { name: 'uc' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para registrar roles.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para registrar roles.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL ROL
            //guarda el ROL
            var permsID = []
            for (var key in req.body) {
                if (key != "role_name") {
                    const permission = await models.Permission.findOne({ where: { name: key }, raw: true, transaction: t });
                    permsID.push(permission['id'])
                }
            }
            //se crea el rol
            const newRol = await models.Role.create({
                name: req.body.role_name,
            }, { transaction: t })

            await newRol.setPermissions(permsID, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha registrado un rol nuevo con los siguientes datos:\nnombre: " + newRol.name + "\nCon los permisos:\n"

            var contador = 0
            for (var key in req.body) {
                if (key != "role_name") {
                    desc = desc + key + "\n"
                    contador++
                }
            }

            if (contador == 0) {
                desc = desc + "Ningún permiso"
            }

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Registro de rol",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el rol
            if (!log)
                throw new Error()
            if (!newRol)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el rol, vuelva a intentarlo más tarde.' }])
        }
});

//ACTUALIZAR ROL
router.post('/update/:id',
    [
        check('role_name')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
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
                        where: { name: 'uu' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para actualizar roles.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para actualizar roles.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
            //ACTUALIZA EL ROL
            //verificamos que no exista un rol con el mismo nombre
            const rolV = await models.Role.findOne({ where: { name: req.body.role_name, id: { $not: req.params.id } }, transaction: t })
            if (rolV) {
                await t.rollback();
                return res.status(500).json([{ msg: 'Ya existe un rol con el mismo nombre.' }])
            }
            else {
                var permsID = []
                for (var key in req.body) {
                    if (key != "role_name") {
                        const permission = await models.Permission.findOne({ where: { name: key }, raw: true, transaction: t });
                        permsID.push(permission['id'])
                    }
                }
                //se actualiza el rol
                const rolU = await models.Role.findOne({
                    where: { id: req.params.id }, transaction: t
                })

                await rolU.update({
                    name: req.body.role_name
                }, { transaction: t })

                await rolU.setPermissions(permsID, { transaction: t })

                //SE REGISTRA EL LOG
                //obtenemos el usuario que realiza la transaccion
                const usuario = await models.User.findOne({
                    where: {
                        id: req.user.id
                    },
                    transaction: t
                })

                //descripcion del log
                var desc = "El usuario " + usuario.email + " ha actualizado el rol con el id " + rolU.id + " con los siguientes datos:\nnombre: " + rolU.name + "\nCon los permisos:\n"

                var contador = 0
                for (var key in req.body) {
                    if (key != "role_name") {
                        desc = desc + key + "\n"
                        contador++
                    }
                }

                if (contador == 0) {
                    desc = desc + "Ningún permiso"
                }

                //guardamos los datos del log
                var dataLog = {
                    UserId: usuario.id,
                    title: "Actualización de rol",
                    description: desc
                }

                //guarda el log en la base de datos
                const log = await models.Log.create(dataLog, { transaction: t })

                //verifica que se hayan registrado el log y el rol
                if (!log)
                    throw new Error()
                if (!rolU)
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
            return res.status(500).json([{ msg: 'No fue posible actualizar el rol, vuelva a intentarlo más tarde.' }])
        }
    });

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
                    where: { name: 'ud' }
                }
            }
        })

        if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
            //NO TIENE PERMISOS
            return res.status(403).json([{ msg: 'No tienes permiso de eliminar roles.' }])
        }
    }
    catch (error) {
        return res.status(403).json([{ msg: 'No tienes permiso de eliminar roles.' }])
    }

    //TIENE PERMISO

    //Transaccion
    const t = await models.sequelize.transaction()
    try {
        //se elimina el rol
        const roleD = await models.Role.findOne({ where: { id: req.params.id }, transaction: t })

        await roleD.destroy({ transaction: t });

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
            title: "Eliminación de rol",
            description: "El usuario " + usuario.email + " ha eliminado el rol con el id " + roleD.id + " de nombre " + roleD.name
        }

        //guarda el log en la base de datos
        const log = await models.Log.create(dataLog, { transaction: t })

        //verifica si se elimina el rol
        const verRol = await models.User.findOne({ where: { id: roleD.id }, transaction: t })

        if (verRol)
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
        return res.status(500).json([{ msg: 'No fue posible eliminar el rol, vuelva a intentarlo más tarde.' }])
    }
});

module.exports = router;