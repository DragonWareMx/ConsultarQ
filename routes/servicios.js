var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
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
        cb(null, 'public/uploads/doc_services')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
var upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
        if (file.mimetype == "application/pdf") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .pdf format allowed!'));
        }
    }
});




router.get('/', isLoggedIn, async function(req, res, next) {
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
                    model: models.Permission
                }
            }
        })

        var cC = false;
        var cR = false;
        var cU = false;
        var cD = false;

        usuario.Role.Permissions.forEach(permiso => {
            if (permiso.name == 'sc')
                cC = true
            else if (permiso.name == 'sr')
                cR = true
            else if (permiso.name == 'su')
                cU = true
            else if (permiso.name == 'sd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const servicios = await models.Service.findAll({ });
            const docu = await models.Service_Portfolio.findAll({ });
            res.render('carteraServicios', {servicios, docu})
        }
        else {
            //NO TIENE PERMISOS
            return res.render('error',{error: 403}) 
        }
    }
    catch (error) {
        return res.render('error',{error: 500}) 
    }
});

router.get('/ver-servicio/:id', isLoggedIn, async function(req, res, next) {
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
                    model: models.Permission
                }
            }
        })

        var cC = false;
        var cR = false;
        var cU = false;
        var cD = false;

        usuario.Role.Permissions.forEach(permiso => {
            if (permiso.name == 'sc')
                cC = true
            else if (permiso.name == 'sr')
                cR = true
            else if (permiso.name == 'su')
                cU = true
            else if (permiso.name == 'sd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const servicio = await models.Service.findAll({ where: { id: req.params.id } }); 
            res.render('verServicio', {servicio})
        }
        else {
            //NO TIENE PERMISOS
            return res.render('error',{error: 403}) 
        }
    }
    catch (error) {
        return res.render('error',{error: 500}) 
    } 
});

router.get('/agregar-servicio', isLoggedIn, async function(req, res, next) {
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
                    model: models.Permission
                }
            }
        })

        var cC = false;
        var cR = false;
        var cU = false;
        var cD = false;

        usuario.Role.Permissions.forEach(permiso => {
            if (permiso.name == 'sc')
                cC = true
            else if (permiso.name == 'sr')
                cR = true
            else if (permiso.name == 'su')
                cU = true
            else if (permiso.name == 'sd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cC) {
            //TIENE PERMISO DE DESPLEGAR VISTA
          res.render('agregarServicio')
        }
        else {
            //NO TIENE PERMISOS
            return res.render('error',{error: 403}) 
        }
    }
    catch (error) {
        return res.render('error',{error: 500}) 
    }
});

// GUARDAR NUEVO SERVICIO
router.post('/agregar-servicio/nuevo',
    [
        check('nameService')
            .not().isEmpty().withMessage('Nombre del servicio es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre del servicio puede tener un máximo de 255 caracteres.')
            .trim(),
        check('descripcion')
            .not().isEmpty().withMessage('Descripción es un campo requerido.')
            .isLength({ max: 2000 }).withMessage('La descripción puede tener un máximo de 2000 caracteres.')
            .trim()
    ], 
    isLoggedIn, async (req, res, next) => {
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
                        where: { name: 'sc' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para registrar servicios.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para registrar servicios.' }])
        }
        //TRANSACCION
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL SERVICIO
            //se crea el servicio
            const newService = await models.Service.create({
                name: req.body.nameService,
                description: req.body.descripcion,
            }, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha registrado un servicio nuevo con los siguientes datos:\nNombre: " + newService.name + "\nDescription: " + newService.description

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Registro de servicio",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!newService)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el servicio, vuelva a intentarlo más tarde.' }])
        }
});

router.get('/editar-servicio/:id', isLoggedIn, async function(req, res, next) {
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
                    model: models.Permission
                }
            }
        })

        var cC = false;
        var cR = false;
        var cU = false;
        var cD = false;

        usuario.Role.Permissions.forEach(permiso => {
            if (permiso.name == 'sc')
                cC = true
            else if (permiso.name == 'sr')
                cR = true
            else if (permiso.name == 'su')
                cU = true
            else if (permiso.name == 'sd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cU) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const servicio = await models.Service.findAll({ where: { id: req.params.id } }); 
            res.render('editarServicio', {servicio})
        }
        else {
            //NO TIENE PERMISOS
            return res.render('error',{error: 403}) 
        }
    }
    catch (error) {
        return res.render('error',{error: 500}) 
    }  
}); 

// EDITAR SERVICIO--------------
router.post('/editar-servicio/update/:id',
    [
        check('nameServiceE')
            .not().isEmpty().withMessage('Nombre del servicio es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre del servicio puede tener un máximo de 255 caracteres.')
            .trim(),
        check('descripcionE')
            .not().isEmpty().withMessage('Descripción es un campo requerido.')
            .isLength({ max: 2000 }).withMessage('La descripción puede tener un máximo de 2000 caracteres.')
            .trim()
    ], 
    isLoggedIn, async (req, res, next) => {
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
                        where: { name: 'su' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para editar servicios.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para editar servicios.' }])
        }
        //TRANSACCION
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL SERVICIO
            //se busca el servicio
            const serviceU = await models.Service.findOne({
                where: { id: req.params.id }, transaction: t
            })

            await serviceU.update({
                name: req.body.nameServiceE,
                description: req.body.descripcionE,
            }, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha editado un servicio nuevo con los siguientes datos:\nNombre: " + serviceU.name + "\nDescription: " + serviceU.description

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Actualización de servicio",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!serviceU)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible editar el servicio, vuelva a intentarlo más tarde.'}])
        }
});

// EDITAR PDF--------------
router.post('/editarPDF', upload.single('filePDF'),
    [
        check('filePDF')
            .not().isEmpty().withMessage('PDF requerido.')
    ], 
    isLoggedIn, async (req, res, next) => {
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
                        where: { name: 'su' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para editar servicios.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para editar servicios.' }])
        }

        //TRANSACCION
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL SERVICIO
            //se busca el servicio
            const pdfVar = await models.Service_Portfolio.findAll({ transaction: t
            })
            // BORRAR EL VIEJO PDF-----
            fs.unlink('public/uploads/doc_services/' + pdfVar.pdf, (err) => {
                if (err) {
                    console.log("failed to delete local pdf:" + err);
                } else {
                    console.log('successfully deleted local pdf');
                }
            });

            await pdfVar.update(req.file.filename , { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha editado el PDF de servicios con los siguientes datos:\npdf: " + pdfVar.pdf

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Actualización de PDF de servicios",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!serviceU)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible editar el PDF de servicios, vuelva a intentarlo más tarde.' + error}])
        }
});

// ELIMINAR SERVICIO
router.post('/delete/:id', isLoggedIn,
    async (req, res, next) => {
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
                        where: { name: 'sd' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para eliminar servicios.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para eliminar servicios.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL CLIENTE
            //se busca el cliente
            const serviceD = await models.Service.findOne({
                where: { id: req.params.id }, transaction: t
            })

            await serviceD.destroy({ transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha eliminado el servicio con el id " + serviceD.id + " de nombre " + serviceD.name

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Eliminacion de servicio",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica si se elimina el prestador
            const verSer = await models.Service.findOne({ where: { id: req.params.id }, transaction: t })

            if (verSer)
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
            return res.status(500).json([{ msg: 'No fue posible eliminar el servicio, vuelva a intentarlo más tarde.' }])
        }
    });

module.exports = router;