var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/', isLoggedIn, async function (req, res, next) {
    const tipos = await models.Pa_Type.findAll();
    const conceptos = await models.Concept.findAll();
    const proyectos = await models.Project.findAll({
        include: {
            model: models.Project_Employee,
            where: { UserId: req.user.id }
        },
        where: { status: "activo" }
    });
    res.render('caja', { tipos, conceptos, proyectos })
});
// router.get('/agregar-registro', isLoggedIn, function (req, res, next) {
//     res.render('agregarRegistro')
// });
router.get('/editar-registro', isLoggedIn, function (req, res, next) {
    res.render('editarRegistro')
});


//  se consultan solo los egresos
router.get('/egresos', isLoggedIn, async (req, res, next) => {

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
            models.Transaction.findAll({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }],
                order: [
                    ['date', 'DESC']
                ],
                where: {
                    T_type: 'egreso'
                }
            }).then(egresos => {
                return res.render('caja/egresos', { egresos })
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

//  se consultan solo los ingresos
router.get('/ingresos', isLoggedIn, async (req, res, next) => {

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
            models.Transaction.findAll({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }],
                order: [
                    ['date', 'DESC']
                ],
                where: {
                    T_type: 'ingreso'
                }
            }).then(ingresos => {
                return res.render('caja/ingresos', { ingresos })
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

//  se consultan solo las transacciones que son deducibles
router.get('/deducibles', isLoggedIn, async (req, res, next) => {

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
            models.Transaction.findAll({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }],
                order: [
                    ['date', 'DESC']
                ],
                where: {
                    invoice: 1
                }
            }).then(deducibles => {
                return res.render('caja/deducibles', { deducibles })
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

//  se consultan todas las transacciones
router.get('/historial', isLoggedIn, async (req, res, next) => {

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
            models.Transaction.findAll({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }],
                order: [
                    ['date', 'DESC']
                ]
            }).then(transacciones => {
                return res.render('caja/historial', { transacciones })
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

router.post('/create',
    [
        check('type').isIn(['ingreso', 'egreso']).withMessage('El tipo de movimiento ingresado no es válido.'),
        check('concepto')
            .not().isEmpty().withMessage('Concepto es un campo requerido.'),
        check('pago')
            .not().isEmpty().withMessage('Tipo de pago es un campo requerido.'),
        check('proyecto')
            .not().isEmpty().withMessage('Proyecto es un campo requerido.'),
        check('date')
            .not().isEmpty().custom(date => {
                return !isNaN(Date.parse(date));
            }
            ).withMessage('La fecha no es válida.'),
        check('invoice').isIn(['1', '0']).withMessage('Deducible o no deducible ingresado no es válido.'),
        check('monto')
            .not().isEmpty().isNumeric().custom(monto => {
                if (monto < 0)
                    throw new Error('El monto ingresado no puede ser un número negativo.');
                else
                    return true
            }).withMessage('El monto ingresado no es válido.'),
        check('descripcion')
            .not().isEmpty().withMessage('Descripción es un campo requerido.')
            .isLength({ max: 255 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
            .trim()
            .escape(),
    ], isLoggedIn, async (req, res, next) => {
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
                        where: { name: 'cc' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para registrar transacciones.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para registrar transacciones.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA EL PRESTADOR\
            //se busca en donde el registro del usuario y proyecto
            const project_employ = await models.Project_Employee.findOne({ where: { UserId: req.user.id, ProjectId: req.body.proyecto } });
            //se crea la transaccion
            const newTransaccion = await models.Transaction.create({
                T_type: req.body.type,
                date: req.body.date,
                amount: req.body.monto,
                description: req.body.descripcion,
                invoice: req.body.invoice,
                ProjectEmployeeId: project_employ.id,
                PaTypeId: req.body.pago,
                ConceptId: req.body.concepto,
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
            var desc = "El usuario " + usuario.email + " ha registrado una transaccion nuevo con los siguientes datos:\nTipo: " + newTransaccion.T_type + "\nFecha: " + newTransaccion.date + "\nMonto: " + newTransaccion.amount + "\nDescripcion: " + newTransaccion.description + "\nDeducible: " + newTransaccion.invoice

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Registro de transacción",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!newTransaccion)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {

            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar la transacción, vuelva a intentarlo más tarde.' }])
        }
    });

module.exports = router;
