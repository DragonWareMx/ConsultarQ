var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');

//sequelize models
const models = require('../models/index');

//  consulta todos los prestadores externos
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
            models.Provider.findAll({
                include: [{
                    model: models.Provider_Area
                }],
                order: [
                    ['status', 'ASC']
                ]
            }).then(prestadores => {
                models.Provider_Area.findAll().then(areas => {
                    return res.render('prestadores_externos/prestadores', { prestadores, areas })
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

// agregar nuevo prestador
router.post('/nuevo', isLoggedIn,
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

                    let ids = await models.Provider_Area.findAll({
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
                title: "Registro de rol",
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