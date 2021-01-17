var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
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
        cb(null, 'public/uploads/clients')
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

//  CLIENTES
//  consulta todos los clientes
router.get('/', isLoggedIn, async (req, res, next) => {

    try {
        //obtenemos el usuario, su rol y su permiso
        let usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            order: [
                ['status', 'ASC']
            ],
            include: {
                model: models.Role,
                include: {
                    model: models.Permission,
                    where: { name: 'er' }       
                }
            }
        })

        if (usuario && usuario.Role && usuario.Role.Permissions) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            models.Client.findAll({
                include: [{
                    model: models.Client_Area
                }],
                order: [
                    ['status', 'ASC']
                ]
            }).then(clientes => {
                models.Client_Area.findAll().then(areas => {
                    return res.render('clientes', { clientes, areas })
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

//  agregar cliente
router.post('/nuevo', upload.single('fileField_add'),
    [
        check('name')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('phone_number')
            .not().isEmpty().withMessage('Número telefónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({ max: 50, min: 10 }).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
        check('email')
            .not().isEmpty().withMessage('Correo electrónico es un campo requerido.')
            .isEmail().withMessage('Correo electrónico no válido.')
            .normalizeEmail(),
        check('rfc')
            .not().isEmpty().withMessage('RFC es un campo requerido.')
            .isLength({ max: 255 }).withMessage('RFC puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('area')
            .optional({ checkFalsy: false })
            .custom(async (area) => {
                var validador = false
                //si no es nulo
                if (area) {
                    validador = false

                    let ids = await models.Client_Area.findAll({
                        attributes: ['id'],
                        raw: true
                    })

                    ids.forEach(id => {
                        if (area == id.id) {
                            validador = true
                        }
                    });
                }
                if (validador) {
                    return true
                }
                else
                    throw new Error('El área no existe.');
            }).withMessage('El área no es válido.'),
        check('status_new').isIn(['active', 'inactive']).withMessage('El estatus ingresado no es válido.')
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
                //NO TIENE PERMISO DE AGREGAR EL CLEINTE
                return res.status(403).json([{ msg: 'No estás autorizado para registrar clientes.' }])

                //console.log(req.addNombre);
                //res.status(200).json([{ status: 200 }]);
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No fue posible registrar el cliente, inténtelo más tarde.' }])
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
            var data;

            if ( req.file ){
                data =
                    {
                        name: req.body.name,
                        email: req.body.email,
                        phone_number: req.body.phone_number,
                        rfc: req.body.rfc,
                        picture: req.file.filename,
                        status: req.body.status_new,
                        ClientAreaId: req.body.area,
                    }
            }
            else {
                data =
                    {
                        name: req.body.name,
                        email: req.body.email,
                        phone_number: req.body.phone_number,
                        rfc: req.body.rfc,
                        status: req.body.status_new,
                        ClientAreaId: req.body.area,
                    }
            }

            //se crea el cliente
            const newClient = await models.Client.create( data, { transaction: t })

            

            //await newClient.setPermissions(permsID, { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha registrado un cliente nuevo con los siguientes datos:\nNombre: " + newClient.name + "\nEmail: " + newClient.email + "\nNúmero de telefono: " + newClient.phone_number + "\nRFC: " + newClient.rfc + "\nEstatus: " + newClient.status + "\nÁrea: " + newClient.ClientAreaId + "\nCon los permisos:\n"

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
            if (!newClient)
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

// editar cliente
router.post('/edit/:id', isLoggedIn, upload.single('fileField_edit'),
    [
        check('name_edit')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('phone_edit')
            .not().isEmpty().withMessage('Número telefónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({ max: 50, min: 10 }).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
        check('email_edit')
            .not().isEmpty().withMessage('Correo electrónico es un campo requerido.')
            .isEmail().withMessage('Correo electrónico no válido.')
            .normalizeEmail(),
        check('rfc_edit')
            .not().isEmpty().withMessage('RFC es un campo requerido.')
            .isLength({ max: 255 }).withMessage('RFC puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('area_edit')
            .optional({ checkFalsy: false })
            .custom(async (area) => {
                var validador = false
                //si no es nulo
                if (area) {
                    validador = false

                    let ids = await models.Client_Area.findAll({
                        attributes: ['id'],
                        raw: true
                    })

                    ids.forEach(id => {
                        if (area == id.id) {
                            validador = true
                        }
                    });
                }
                if (validador) {
                    return true
                }
                else
                    throw new Error('El área no existe.');
            }).withMessage('El área no es válido.'),
        check('status_edit').isIn(['active', 'inactive']).withMessage('El estatus ingresado no es válido.')
    ],
    async (req, res, next) => {
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
                        where: { name: 'eu' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para actualizar clientes.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para actualizar clientes.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL CLIENTE
            //se busca el cliente
            const clienteU = await models.Client.findOne({
                where: { id: req.params.id }, transaction: t
            })

            var data;

            if ( req.file ){
                fs.unlink('public/uploads/clients/' + clienteU.picture, (err) => {
                    if (err) {
                        console.log("failed to delete local image:" + err);
                    } else {
                        console.log('successfully deleted local image');
                    }
                });

                data =
                    {
                        name: req.body.name_edit,
                        email: req.body.email_edit,
                        phone_number: req.body.phone_edit,
                        rfc: req.body.rfc_edit,
                        picture: req.file.filename,
                        status: req.body.status_edit,
                        ClientAreaId: req.body.area_edit,
                    }
            }
            else {
                data =
                    {
                        name: req.body.name_edit,
                        email: req.body.email_edit,
                        phone_number: req.body.phone_edit,
                        rfc: req.body.rfc_edit,
                        status: req.body.status_edit,
                        ClientAreaId: req.body.area_edit,
                    }
            }

            await clienteU.update(data , { transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha actualizado un cliente con los siguientes datos:\nNombre: " + clienteU.name + "\nRFC: " + clienteU.rfc + "\nNúmero telefónico: " + clienteU.phone_number + "\nEmail: " + clienteU.email + "\nArea: " + clienteU.ClientAreaId + "\nEstatus: " + clienteU.status

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Actualizacion de cliente",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!clienteU)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible actualizar el cliente, vuelva a intentarlo más tarde.' }])
        }
    });

//  eliminar cliente
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
                        where: { name: 'ed' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para eliminar clientes.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para eliminar clientes.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL CLIENTE
            //se busca el cliente
            const clienteD = await models.Client.findOne({
                where: { id: req.params.id }, transaction: t
            })

            if (clienteD.picture != null) {
                fs.unlink('public/uploads/clients/' + clienteD.picture, (err) => {
                    if (err) {
                        console.log("failed to delete local image:" + err);
                    } else {
                        console.log('successfully deleted local image');
                    }
                });
            }

            await clienteD.destroy({ transaction: t })

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha eliminado el cliente con el id " + clienteD.id + " de nombre " + clienteD.name

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Eliminacion de cliente",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica si se elimina el prestador
            const verPres = await models.Client.findOne({ where: { id: req.params.id }, transaction: t })

            if (verPres)
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
            return res.status(500).json([{ msg: 'No fue posible eliminar el cliente, vuelva a intentarlo más tarde.' }])
        }
    });

router.get('/cliente', isLoggedIn,function(req, res, next) {

    res.render('cliente')
});

router.get('/generar-cotizacion', isLoggedIn,function(req, res, next) {

    res.render('generarCotizacion')
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  AREAS DE LOS PRESTADORES EXTERNOS
//  consulta todas las areas de los prestadores externos
router.get('/areas', isLoggedIn, async (req, res, next) => {

    try{
        //VERIFICACION DEL PERMISO

        //obtenemos el usuario, su rol y su permiso
        let usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            order: [
                ['status', 'ASC']
            ],
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
            models.Client_Area.findAll({
                order: [
                    ['id', 'ASC']
                ]
            }).then(areas => {
                    return res.render('clientes/areas', { areas })
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

//AGREAGAR AREA
router.post('/areas/nuevo',
    [
        check('add_nombre')
            .not().isEmpty().withMessage('Nombre es un campo requerido.')
            .isLength({ max: 255 }).withMessage('El nombre puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('add_correo')
            .not().isEmpty().withMessage('Correo electrónico es un campo requerido.')
            .isEmail().withMessage('Correo electrónico no válido.')
            .normalizeEmail(),
        check('add_area')
            .optional({ checkFalsy: false })
            .custom(async (area) => {
                var validador = false
                //si no es nulo
                if (area) {
                    validador = false

                    let ids = await models.Client_Area.findAll({
                        attributes: ['id'],
                        raw: true
                    })

                    ids.forEach(id => {
                        if (area == id.id) {
                            validador = true
                        }
                    });
                }
                if (validador) {
                    return true
                }
                else
                    throw new Error('El área no existe.');
            }).withMessage('El área no es válido.'),
        check('add_telefono')
            .not().isEmpty().withMessage('Número telefónico es un campo requerido.')
            .trim()
            .isNumeric().withMessage('Sólo se aceptan números en el número telefónico.')
            .isLength({ max: 50, min: 10 }).withMessage('El número telefónico debe tener al menos 10 dígitos.'),
        check('add_dro')
            .not().isEmpty().withMessage('DRO es un campo requerido.')
            .isLength({ max: 255 }).withMessage('Ciudad puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
        check('add_estatus').isIn(['active', 'inactive']).withMessage('El estatus ingresado no es válido.')
    ],
    async (req, res, next) => {
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
                        where: { name: 'ec' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para registrar prestadores.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para registrar prestadores.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL PRESTADOR
            //se crea el prestador
            const newPrestador = await models.Provider.create({
                name: req.body.add_nombre,
                dro: req.body.add_dro,
                email: req.body.add_correo,
                phone_number: req.body.add_telefono,
                ProviderAreaId: req.body.add_area,
                status: req.body.add_estatus,
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
            var desc = "El usuario " + usuario.email + " ha registrado un prestador nuevo con los siguientes datos:\nNombre: " + newPrestador.name + "\nDRO: " + newPrestador.dro + "\nNúmero telefónico: " + newPrestador.phone_number + "\nEmail: " + newPrestador.email + "\nArea: " + newPrestador.ProviderAreaId + "\nStatus: " + newPrestador.status

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Registro de prestador",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!newPrestador)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el prestador, vuelva a intentarlo más tarde.' }])
        }
    });




module.exports = router;