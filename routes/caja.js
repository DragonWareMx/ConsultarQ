var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');
const sequelize = require('sequelize');
moment = require('moment');
moment.locale('es-mx');

//generar pdf
var html_to_pdf = require('html-pdf-node');
require('dotenv').config();
const fs = require('fs');
require('dotenv').config();

router.get('/', isLoggedIn, async function (req, res, next) {
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const proj = await models.Project.findAll({
                include: [{
                    model: models.User,
                    where: { id: req.user.id }
                }],
                raw: true,
                attributes: ['id']
            })
            var lista = []
            proj.forEach(viledruid => {
                lista.push(viledruid.id)
            });
            const tipos = await models.Pa_Type.findAll({ where: { status: 'active' } });
            const conceptos = await models.Concept.findAll({ where: { status: 'active' } });
            var proyectos;
            if (cC && cR && cU && cD) {
                proyectos = await models.Project.findAll({
                    include: {
                        model: models.Project_Employee,
                    },
                    where: { status: "activo" }
                });
            }
            else {
                proyectos = await models.Project.findAll({
                    include: {
                        model: models.Project_Employee,
                        where: { UserId: req.user.id }
                    },
                    where: { status: "activo" }
                });
            }
            var egresos
            var ingresos
            var deducibles
            var todos
            var ingreConceptos
            var egreConceptos
            if (req.query.y && req.query.m) {
                var valido = false
                var year = false
                switch (req.query.m) {
                    case '01':
                        valido = true
                        break;
                    case '02':
                        valido = true
                        break;
                    case '03':
                        valido = true
                        break;
                    case '04':
                        valido = true
                        break;
                    case '05':
                        valido = true
                        break;
                    case '06':
                        valido = true
                        break;
                    case '07':
                        valido = true
                        break;
                    case '08':
                        valido = true
                        break;
                    case '09':
                        valido = true
                        break;
                    case '10':
                        valido = true
                        break;
                    case '11':
                        valido = true
                        break;
                    case '12':
                        valido = true
                        break;
                }
                if (req.query.y < 2041 && req.query.y > 1999) {
                    year = true
                }
                if (valido && year)
                    var hoy = moment(req.query.y + "-" + req.query.m + "-01").toDate()
                else {
                    var mes = moment().month() + 1
                    if (mes < 10)
                        mes = "0" + mes
                    return res.redirect('/caja?m=' + mes + '&y=' + moment().year())
                }
            }
            else {
                var mes = moment().month() + 1
                if (mes < 10)
                    mes = "0" + mes
                return res.redirect('/caja?m=' + mes + '&y=' + moment().year())
            }
            if (usuario && usuario.Role && usuario.Role.Permissions && cC && cR && cu && cD) {
                egresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.Project,
                    }, {
                        model: models.User,
                        include: { model: models.Employee }
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'egreso',
                        status: 'active'
                    }
                })
                ingresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.Project,
                    }, {
                        model: models.User,
                        include: { model: models.Employee }
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'ingreso',
                        status: 'active'
                    }
                })
                deducibles = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.Project,
                    }, {
                        model: models.User,
                        include: { model: models.Employee }
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        invoice: 1,
                        status: 'active'
                    }
                })
                todos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.Project,
                    }, {
                        model: models.User,
                        include: { model: models.Employee }
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ],
                    where: {
                        status: 'active'
                    }
                })
                ingreConceptos = await models.Transaction.findAll({
                    group: [
                        ['ConceptId']
                    ],
                    attributes: ['Concept.name', [sequelize.fn('COUNT', 'Transaction.ConceptId'), 'count']],
                    include: [
                        {
                            model: models.Concept,
                            required: true
                        }, {
                            model: models.Project,
                        }],
                    where: {
                        T_type: 'ingreso',
                        status: 'active',
                        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.getFullYear())
                    },
                })
                egreConceptos = await models.Transaction.findAll({
                    group: [
                        ['ConceptId']
                    ],
                    attributes: ['Concept.name', [sequelize.fn('COUNT', 'Transaction.ConceptId'), 'count']],
                    include: [
                        {
                            model: models.Concept,
                            required: true
                        }, {
                            model: models.Project,
                        }],
                    where: {
                        T_type: 'egreso',
                        status: 'active',
                        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.getFullYear())
                    },
                })
            }
            else {
                egresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'egreso',
                        status: 'active',
                        ProjectId: lista
                    }
                })
                ingresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'ingreso',
                        status: 'active',
                        ProjectId: lista
                    }
                })
                deducibles = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        invoice: 1,
                        status: 'active',
                        ProjectId: lista
                    }
                })
                todos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['createdAt', 'DESC']
                    ],
                    where: {
                        status: 'active',
                        ProjectId: lista
                    }
                })
                ingreConceptos = await models.Transaction.findAll({
                    group: [
                        ['ConceptId']
                    ],
                    attributes: ['Concept.name', [sequelize.fn('COUNT', 'Transaction.ConceptId'), 'count']],
                    include: [
                        {
                            model: models.Concept,
                            required: true
                        }, {
                            model: models.Project,
                            required: true
                        }],
                    where: {
                        T_type: 'ingreso',
                        status: 'active',
                        ProjectId: lista,
                        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.getFullYear())
                    },
                })
                egreConceptos = await models.Transaction.findAll({
                    group: [
                        ['ConceptId']
                    ],
                    attributes: ['Concept.name', [sequelize.fn('COUNT', 'Transaction.ConceptId'), 'count']],
                    include: [
                        {
                            model: models.Concept,
                            required: true
                        }, {
                            model: models.Project,
                            required: true
                        }],
                    where: {
                        T_type: 'egreso',
                        status: 'active',
                        ProjectId: lista,
                        where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.getFullYear())
                    },
                })
            }

            res.render('caja', { tipos, conceptos, proyectos, egresos, ingresos, deducibles, todos, hoy, ingreConceptos, egreConceptos, cC, cR, cU, cD })
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
// router.get('/agregar-registro', isLoggedIn, function (req, res, next) {
//     res.render('agregarRegistro')
// });
router.get('/editar-registro/:id', isLoggedIn, async function (req, res, next) {
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cU) {
            //  TIENE PERMISO DE DESPLEGAR VISTA
            const movimiento = await models.Transaction.findOne({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }, {
                    model: models.User,
                    include: { model: models.Employee }
                }, {
                    model: models.Project
                }],
                where: {
                    id: req.params.id
                }
            })
            const tipos = await models.Pa_Type.findAll({ where: { status: 'active' } });
            const conceptos = await models.Concept.findAll({ where: { status: 'active' } });
            if (movimiento) {
                var proyectos
                if (cC && cR && cU && cD) {
                    proyectos = await models.Project.findAll({
                        include: {
                            model: models.Project_Employee,
                        },
                        where: { status: "activo" }
                    });
                } else {
                    proyectos = await models.Project.findAll({
                        include: {
                            model: models.Project_Employee,
                            where: { UserId: movimiento.UserId }
                        },
                        where: { status: "activo" }
                    });
                }
                return res.render('editarRegistro', { movimiento, tipos, conceptos, proyectos, cU, cD })
            }
            else {
                return res.status(404).json(404)                //  mandar a la vista de error
            }
        }
        else {
            //NO TIENE PERMISOS
            return res.status(403).json(403)
        }
    }
    catch (error) {
        console.log(error)
        return res.status(403).json(403)
    }
});

//aqui se editan los registros xdd
router.post('/editar-registro/:id', isLoggedIn,
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
    ],
    async function (req, res, next) {
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
                        where: { name: 'cu' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para editar transacciones.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para editar transacciones.' }])
        }
        //aqui va la transaccion pero no se como hacerla xdd
        const t = await models.sequelize.transaction()
        try {
            //GUARDA LA TRANSACCION\
            //se busca la transaccion que se va a actualizar
            const oldTransaccion = await models.Transaction.findOne({ where: { id: req.params.id }, include: { model: models.Project_Employee } }, { transaction: t })
            if (!oldTransaccion)
                throw new Error()
            //se busca a que proyecto del usuario se le va a asignar ahora la transaccion
            const project_employ = await models.Project_Employee.findOne({ where: { ProjectId: req.body.proyecto, UserId: oldTransaccion.Project_Employee.UserId } }, { transaction: t })
            if (!project_employ)
                throw new Error()
            //se actualiza la transaccion
            if (cC && cR && cU && cD) {
                //se crea la transaccion
                await oldTransaccion.update({
                    T_type: req.body.type,
                    date: req.body.date,
                    amount: req.body.monto,
                    description: req.body.descripcion,
                    invoice: req.body.invoice,
                    ProjectId: req.body.proyecto.id,
                    UserId: req.user.id,
                    PaTypeId: req.body.pago,
                    ConceptId: req.body.concepto,
                }, { transaction: t })
            }
            else {
                //se crea la transaccion
                await oldTransaccion.update({
                    T_type: req.body.type,
                    date: req.body.date,
                    amount: req.body.monto,
                    description: req.body.descripcion,
                    invoice: req.body.invoice,
                    ProjectId: project_employ.ProjectId,
                    UserId: project_employ.UserId,
                    PaTypeId: req.body.pago,
                    ConceptId: req.body.concepto,
                }, { transaction: t })
            }

            //SE REGISTRA EL LOG
            //obtenemos el usuario que realiza la transaccion
            const usuario = await models.User.findOne({
                where: {
                    id: req.user.id
                },
                transaction: t
            })

            //descripcion del log
            var desc = "El usuario " + usuario.email + " ha actualizado una transaccion con los siguientes datos: \nId: " + oldTransaccion.id + "\nTipo: " + oldTransaccion.T_type + "\nFecha: " + oldTransaccion.date + "\nMonto: " + oldTransaccion.amount + "\nDescripcion: " + oldTransaccion.description + "\nDeducible: " + oldTransaccion.invoice

            //guardamos los datos del log
            var dataLog = {
                UserId: usuario.id,
                title: "Actualización de transacción",
                description: desc
            }

            //guarda el log en la base de datos
            const log = await models.Log.create(dataLog, { transaction: t })

            //verifica que se hayan registrado el log y el prestador
            if (!log)
                throw new Error()
            if (!oldTransaccion)
                throw new Error()

            res.status(200).json([{ status: 200 }]);
            // If the execution reaches this line, no errors were thrown.
            // We commit the transaction.
            await t.commit()
        } catch (error) {
            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el cambio en la transacción, vuelva a intentarlo más tarde.' }])
        }
    })

//aqui va para eliminar registros
router.post('/borrar-registro/delete/:id', isLoggedIn, async (req, res, next) => {
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
                    where: { name: 'cd' }
                }
            }
        })

        if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
            //NO TIENE PERMISO DE AGREGAR rol
            return res.status(403).json([{ msg: 'No estás autorizado para eliminar transacciones.' }])
        }
    }
    catch (error) {
        return res.status(403).json([{ msg: 'No estás autorizado para eliminar transacciones.' }])
    }
    const t = await models.sequelize.transaction()
    try {
        if (req.body.id != req.params.id)
            throw new Error()
        const viledruid = await models.Transaction.findOne({ where: { id: req.body.id } }, { transaction: t })

        viledruid.update({ status: 'inactive' }, { transaction: t })

        //SE REGISTRA EL LOG
        //obtenemos el usuario que realiza la transaccion
        const usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            transaction: t
        })

        //descripcion del log
        var desc = "El usuario " + usuario.email + " ha eliminado una transaccion con los siguientes datos: \nId: " + viledruid.id + "\nTipo: " + viledruid.T_type + "\nFecha: " + viledruid.date + "\nMonto: " + viledruid.amount + "\nDescripcion: " + viledruid.description + "\nDeducible: " + viledruid.invoice

        //guardamos los datos del log
        var dataLog = {
            UserId: usuario.id,
            title: "Eliminación de transacción",
            description: desc
        }

        //guarda el log en la base de datos
        const log = await models.Log.create(dataLog, { transaction: t })

        //verifica que se hayan registrado el log y el prestador
        if (!log)
            throw new Error()
        if (!viledruid)
            throw new Error()

        res.status(200).json([{ status: 200 }]);
        // If the execution reaches this line, no errors were thrown.
        // We commit the transaction.
        await t.commit()
    } catch (error) {
        await t.rollback();
        return res.status(500).json([{ msg: 'No fue posible eliminar la transacción, vuelva a intentarlo más tarde.' }])
    }
})

//  se consultan solo los egresos
router.get('/egresos', isLoggedIn, async (req, res, next) => {

    try {
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const proj = await models.Project.findAll({
                include: [{
                    model: models.User,
                    where: { id: req.user.id }
                }],
                raw: true,
                attributes: ['id']
            })
            var lista = []
            proj.forEach(viledruid => {
                lista.push(viledruid.id)
            });
            var egresos
            if (usuario && usuario.Role && usuario.Role.Permissions && cC && cR && cU && cD) {
                egresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: [{
                            model: models.Employee
                        }]
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'egreso',
                        status: 'active'
                    }
                })
            }
            else {
                egresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    },
                    {
                        model: models.Project,
                        required: true
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'egreso',
                        status: 'active',
                        ProjectId: lista
                    }
                })
            }

            return res.render('caja/egresos', { egresos, cU })
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const proj = await models.Project.findAll({
                include: [{
                    model: models.User,
                    where: { id: req.user.id }
                }],
                raw: true,
                attributes: ['id']
            })
            var lista = []
            proj.forEach(viledruid => {
                lista.push(viledruid.id)
            });
            var ingresos
            if (usuario && usuario.Role && usuario.Role.Permissions && cC && cR && cU && cD) {
                ingresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: [{
                            model: models.Employee
                        }]
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'ingreso',
                        status: 'active'
                    }
                })
            }
            else {
                ingresos = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    },
                    {
                        model: models.Project,
                        required: true
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        T_type: 'ingreso',
                        status: 'active',
                        ProjectId: lista
                    }
                })
            }

            return res.render('caja/ingresos', { ingresos, cU })
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const proj = await models.Project.findAll({
                include: [{
                    model: models.User,
                    where: { id: req.user.id }
                }],
                raw: true,
                attributes: ['id']
            })
            var lista = []
            proj.forEach(viledruid => {
                lista.push(viledruid.id)
            });
            var deducibles
            if (usuario && usuario.Role && usuario.Role.Permissions && cC && cR && cU && cD) {
                deducibles = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: [{
                            model: models.Employee
                        }]
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        invoice: 1,
                        status: 'active'
                    }
                })
            }
            else {
                deducibles = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    },
                    {
                        model: models.Project,
                        required: true
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        invoice: 1,
                        status: 'active',
                        ProjectId: lista
                    }
                })
            }

            return res.render('caja/deducibles', { deducibles, cU })
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
            if (permiso.name == 'cc')
                cC = true
            else if (permiso.name == 'cr')
                cR = true
            else if (permiso.name == 'cu')
                cU = true
            else if (permiso.name == 'cd')
                cD = true
        });

        if (usuario && usuario.Role && usuario.Role.Permissions && cR) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            const proj = await models.Project.findAll({
                include: [{
                    model: models.User,
                    where: { id: req.user.id }
                }],
                raw: true,
                attributes: ['id']
            })
            var lista = []
            proj.forEach(viledruid => {
                lista.push(viledruid.id)
            });
            var transacciones
            if (usuario && usuario.Role && usuario.Role.Permissions && cC && cR && cU && cD) {
                transacciones = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: [{
                            model: models.Employee
                        }]
                    }, {
                        model: models.Project
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        status: 'active'
                    }
                })
            }
            else {
                transacciones = await models.Transaction.findAll({
                    include: [{
                        model: models.Pa_Type
                    },
                    {
                        model: models.Concept
                    }, {
                        model: models.User,
                        include: {
                            model: models.Employee,
                        },
                        required: true
                    },
                    {
                        model: models.Project,
                        required: true
                    }],
                    order: [
                        ['date', 'DESC']
                    ],
                    where: {
                        status: 'active',
                        ProjectId: lista
                    }
                })
            }

            return res.render('caja/historial', { transacciones, cU })
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

router.post('/create', isLoggedIn,
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
    ], async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }
        try {
            //VERIFICACION DEL PERMISO
            //obtenemos el usuario, su rol y su permiso
            var usuario = await models.User.findOne({
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
                if (permiso.name == 'cc')
                    cC = true
                else if (permiso.name == 'cr')
                    cR = true
                else if (permiso.name == 'cu')
                    cU = true
                else if (permiso.name == 'cd')
                    cD = true
            });

            if (!(usuario && usuario.Role && usuario.Role.Permissions && cC)) {
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
            var newTransaccion;
            var project_employ;
            //se busca en donde el registro del usuario y proyecto
            if (cC && cR && cU && cD) {
                //se crea la transaccion
                newTransaccion = await models.Transaction.create({
                    T_type: req.body.type,
                    date: req.body.date,
                    amount: req.body.monto,
                    description: req.body.descripcion,
                    invoice: req.body.invoice,
                    ProjectId: req.body.proyecto.id,
                    UserId: req.user.id,
                    PaTypeId: req.body.pago,
                    ConceptId: req.body.concepto,
                }, { transaction: t })
            }
            else {
                project_employ = await models.Project_Employee.findOne({ where: { UserId: req.user.id, ProjectId: req.body.proyecto } });
                if (!project_employ) {
                    return res.status(403).json([{ msg: 'No formas parte del proyecto al cual deseas egistrar transaccion.' }])
                }
                //se crea la transaccion
                newTransaccion = await models.Transaction.create({
                    T_type: req.body.type,
                    date: req.body.date,
                    amount: req.body.monto,
                    description: req.body.descripcion,
                    invoice: req.body.invoice,
                    ProjectId: project_employ.ProjectId,
                    UserId: project_employ.UserId,
                    PaTypeId: req.body.pago,
                    ConceptId: req.body.concepto,
                }, { transaction: t })
            }

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
            console.log(error)
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar la transacción, vuelva a intentarlo más tarde.' }])
        }
    });

router.get('/pdf/:month/:year', isLoggedIn, async function (req, res, next) {
    try {
        if (req.params.year && req.params.month) {
            var valido = false
            var year = false
            switch (req.params.month) {
                case '01':
                    valido = true
                    break;
                case '02':
                    valido = true
                    break;
                case '03':
                    valido = true
                    break;
                case '04':
                    valido = true
                    break;
                case '05':
                    valido = true
                    break;
                case '06':
                    valido = true
                    break;
                case '07':
                    valido = true
                    break;
                case '08':
                    valido = true
                    break;
                case '09':
                    valido = true
                    break;
                case '10':
                    valido = true
                    break;
                case '11':
                    valido = true
                    break;
                case '12':
                    valido = true
                    break;
            }
            if (req.params.year < 2041 && req.params.year > 1999) {
                year = true
            }
            if (valido && year)
                var hoy = moment(req.params.year + "-" + req.params.month + "-01")
            else {
                throw new Error()
            }
        }
        else {
            throw new Error()
        }
        const url = process.env.CLIENT_URL
        var ht = `
        <!doctype html>
        <html>
           <head>
                <meta charset="utf-8">
                <title>Informe caja chica</title>
                <link rel="preconnect" href="https://fonts.gstatic.com">
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet">
                <style>
                    h2,h4 {
                        color: #407ec9;
                    }
                    body{
                        padding: 1.5rem 2rem;
                        text-align: center;
                    }
                    @font-face{
                        font-family:Montserrat;
                        src:url(${url}+/fonts/Montserrat/Montserrat-Black.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-BlackItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Bold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-BoldItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraLight.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraLightItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Italic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Light.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Medium.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Thin.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-SemiBold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraBold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Regular.ttf);
                       }
                       table.blueTable {
                        font-family: Tahoma, Geneva, sans-serif;
                        border: 1px solid #1C6EA4;
                        background-color: #FFFFFF;
                        width: 100%;
                        text-align: left;
                        border-collapse: collapse;
                      }
                      table.blueTable td, table.blueTable th {
                        border: 1px solid #AAAAAA;
                        padding: 3px 2px;
                        text-align: center
                      }
                      table.blueTable tbody td {
                        font-size: 12px;
                      }
                      table.blueTable thead {
                        background: #407EC9;
                        border-bottom: 2px solid #444444;
                      }
                      table.blueTable thead th {
                        font-size: 14px;
                        font-weight: 400;
                        color: #407EC9;
                        border-left: 2px solid #D0E4F5;
                      }
                      table.blueTable thead th:first-child {
                        border-left: none;
                      }
                </style>
            </head>
            <body>
                <h2 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">CONSULTARQ</h2>
                <h3 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">Caja chica ${hoy.format('MMMM')} - ${hoy.format('YYYY')}</h3>
                <img src="`+ url + `/img/logos/faviconB.png"  width="481" height="299" style="position: absolute; top: 325px; left: 150px ; opacity: 0.2;" >
                <div style="height: 20px"> </div>
                <h5 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">INGRESOS</h5>
                <table class="blueTable" style="margin-top: 20px">
                <thead>
                <tr>
                <th>ID</th>
                <th>PROYECTO</th>
                <th>NOMBRE</th>
                <th>CONCEPTO</th>
                <th>DESCRIPCION</th>
                <th>TIPO</th>
                <th>DEDUCIBLE</th>
                <th>PAGO</th>
                <th>FECHA</th>
                <th>MONTO</th>
                </tr>
                </thead>
                <tbody>
                `;
        const ingresos = await models.Transaction.findAll({
            include: [{
                model: models.Pa_Type
            },
            {
                model: models.Concept
            }, {
                model: models.Project,
            }, {
                model: models.User,
                include: { model: models.Employee }
            }],
            order: [
                ['date', 'DESC']
            ],
            where: {
                T_type: 'ingreso',
                where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.format('YYYY')),
                $and: sequelize.where(sequelize.fn('MONTH', sequelize.col('date')), hoy.month() + 1)
            },
        })

        ingresos.forEach(ingreso => {
            ht += `
                <tr>
                <td>${ingreso.id}</td>
                <td>${ingreso.Project.name}</td>
                <td>${ingreso.User.Employee.name}</td>
                <td>${ingreso.Concept.name}</td>
                <td>${ingreso.description}</td>
                <td>${ingreso.T_type.replace(/\b\w/g, function (l) { return l.toUpperCase() })}</td>
                <td>${ingreso.invoice == true ? 'Si' : 'No'}</td>
                <td>${ingreso.Pa_Type.name}</td>
                <td>${ingreso.date}</td>
                <td>${ingreso.amount}</td>
                </tr>
            `;
        });

        ht += `
                </tbody>
                </table>

                <div style="height: 20px"> </div>
                <h5 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">EGRESOS</h5>
                <table class="blueTable" style="margin-top: 20px">
                <thead>
                <tr>
                <th>ID</th>
                <th>PROYECTO</th>
                <th>NOMBRE</th>
                <th>CONCEPTO</th>
                <th>DESCRIPCION</th>
                <th>TIPO</th>
                <th>DEDUCIBLE</th>
                <th>PAGO</th>
                <th>FECHA</th>
                <th>MONTO</th>
                </tr>
                </thead>
                <tbody>
        `;

        const egresos = await models.Transaction.findAll({
            include: [{
                model: models.Pa_Type
            },
            {
                model: models.Concept
            }, {
                model: models.Project,
            }, {
                model: models.User,
                include: { model: models.Employee }
            }],
            order: [
                ['date', 'DESC']
            ],
            where: {
                T_type: 'egreso',
                where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.format('YYYY')),
                $and: sequelize.where(sequelize.fn('MONTH', sequelize.col('date')), hoy.month() + 1)
            },
        })

        egresos.forEach(egreso => {
            ht += `
                <tr>
                <td>${egreso.id}</td>
                <td>${egreso.Project.name}</td>
                <td>${egreso.User.Employee.name}</td>
                <td>${egreso.Concept.name}</td>
                <td>${egreso.description}</td>
                <td>${egreso.T_type.replace(/\b\w/g, function (l) { return l.toUpperCase() })}</td>
                <td>${egreso.invoice == true ? 'Si' : 'No'}</td>
                <td>${egreso.Pa_Type.name}</td>
                <td>${egreso.date}</td>
                <td>${egreso.amount}</td>
                </tr>
            `;
        });

        ht += `
                </tbody>
                </table>
            </body>
        </html>
        `;
        //aqui ya imprime el pdf generado en pantalla
        let file = { content: ht };
        let options = { format: 'letter' };
        // Example of options with args //
        // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
        html_to_pdf.generatePdf(file, options).then(output => {
            console.log(output);

            fs.writeFileSync('public/uploads/pdfs/caja' + req.params.month + req.params.year + '.pdf', output)

            fs.readFile('./public/uploads/pdfs/caja' + req.params.month + req.params.year + '.pdf', { root: __dirname }, function (err, data) {
                res.contentType("application/pdf");
                console.log(err)
                res.send(data);
            });
        });
    } catch (error) {
        console.log(error)
        return res.render('error', { error: 404 })
    }
});

router.get('/anual/pdf/:yeari', isLoggedIn, async function (req, res, next) {
    try {
        if (req.params.yeari) {
            var year = false
            if (req.params.yeari < 2041 && req.params.yeari > 1999) {
                year = true
            }
            if (year)
                var hoy = moment(req.params.yeari + "-" + "01-01")
            else {
                throw new Error()
            }
        }
        else {
            throw new Error()
        }
        const url = process.env.CLIENT_URL
        var ht = `
        <!doctype html>
        <html>
           <head>
                <meta charset="utf-8">
                <title>Informe caja chica</title>
                <link rel="preconnect" href="https://fonts.gstatic.com">
                <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet">
                <style>
                    h2,h4 {
                        color: #407ec9;
                    }
                    body{
                        padding: 1.5rem 2rem;
                        text-align: center;
                    }
                    @font-face{
                        font-family:Montserrat;
                        src:url(${url}+/fonts/Montserrat/Montserrat-Black.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-BlackItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Bold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-BoldItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraLight.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraLightItalic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Italic.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Light.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Medium.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Thin.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-SemiBold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-ExtraBold.ttf);
                        src:url(${url}+/fonts/Montserrat/Montserrat-Regular.ttf);
                       }
                       table.blueTable {
                        font-family: Tahoma, Geneva, sans-serif;
                        border: 1px solid #1C6EA4;
                        background-color: #FFFFFF;
                        width: 100%;
                        text-align: left;
                        border-collapse: collapse;
                      }
                      table.blueTable td, table.blueTable th {
                        border: 1px solid #AAAAAA;
                        padding: 3px 2px;
                        text-align: center
                      }
                      table.blueTable tbody td {
                        font-size: 12px;
                      }
                      table.blueTable thead {
                        background: #407EC9;
                        border-bottom: 2px solid #444444;
                      }
                      table.blueTable thead th {
                        font-size: 14px;
                        font-weight: 400;
                        color: #407EC9;
                        border-left: 2px solid #D0E4F5;
                      }
                      table.blueTable thead th:first-child {
                        border-left: none;
                      }
                </style>
            </head>
            <body>
                <h2 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">CONSULTARQ</h2>
                <h3 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">Caja chica ${hoy.format('YYYY')}</h3>
                <img src="`+ url + `/img/logos/faviconB.png"  width="481" height="299" style="position: absolute; top: 325px; left: 150px ; opacity: 0.2;" >
                <div style="height: 20px"> </div>
                <h5 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">INGRESOS</h5>
                <table class="blueTable" style="margin-top: 20px">
                <thead>
                <tr>
                <th>ID</th>
                <th>PROYECTO</th>
                <th>NOMBRE</th>
                <th>CONCEPTO</th>
                <th>DESCRIPCION</th>
                <th>TIPO</th>
                <th>DEDUCIBLE</th>
                <th>PAGO</th>
                <th>FECHA</th>
                <th>MONTO</th>
                </tr>
                </thead>
                <tbody>
                `;
        const ingresos = await models.Transaction.findAll({
            include: [{
                model: models.Pa_Type
            },
            {
                model: models.Concept
            }, {
                model: models.Project,
            }, {
                model: models.User,
                include: { model: models.Employee }
            }],
            order: [
                ['date', 'DESC']
            ],
            where: {
                T_type: 'ingreso',
                where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.format('YYYY')),
            },
        })

        ingresos.forEach(ingreso => {
            ht += `
                <tr>
                <td>${ingreso.id}</td>
                <td>${ingreso.Project.name}</td>
                <td>${ingreso.User.Employee.name}</td>
                <td>${ingreso.Concept.name}</td>
                <td>${ingreso.description}</td>
                <td>${ingreso.T_type.replace(/\b\w/g, function (l) { return l.toUpperCase() })}</td>
                <td>${ingreso.invoice == true ? 'Si' : 'No'}</td>
                <td>${ingreso.Pa_Type.name}</td>
                <td>${ingreso.date}</td>
                <td>${ingreso.amount}</td>
                </tr>
            `;
        });

        ht += `
                </tbody>
                </table>

                <div style="height: 20px"> </div>
                <h5 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">EGRESOS</h5>
                <table class="blueTable" style="margin-top: 20px">
                <thead>
                <tr>
                <th>ID</th>
                <th>PROYECTO</th>
                <th>NOMBRE</th>
                <th>CONCEPTO</th>
                <th>DESCRIPCION</th>
                <th>TIPO</th>
                <th>DEDUCIBLE</th>
                <th>PAGO</th>
                <th>FECHA</th>
                <th>MONTO</th>
                </tr>
                </thead>
                <tbody>
        `;

        const egresos = await models.Transaction.findAll({
            include: [{
                model: models.Pa_Type
            },
            {
                model: models.Concept
            }, {
                model: models.Project,
            }, {
                model: models.User,
                include: { model: models.Employee }
            }],
            order: [
                ['date', 'DESC']
            ],
            where: {
                T_type: 'egreso',
                where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), hoy.format('YYYY')),
            },
        })

        egresos.forEach(egreso => {
            ht += `
                <tr>
                <td>${egreso.id}</td>
                <td>${egreso.Project.name}</td>
                <td>${egreso.User.Employee.name}</td>
                <td>${egreso.Concept.name}</td>
                <td>${egreso.description}</td>
                <td>${egreso.T_type.replace(/\b\w/g, function (l) { return l.toUpperCase() })}</td>
                <td>${egreso.invoice == true ? 'Si' : 'No'}</td>
                <td>${egreso.Pa_Type.name}</td>
                <td>${egreso.date}</td>
                <td>${egreso.amount}</td>
                </tr>
            `;
        });

        ht += `
                </tbody>
                </table>
            </body>
        </html>
        `;
        //aqui ya imprime el pdf generado en pantalla
        let file = { content: ht };
        let options = { format: 'letter' };
        // Example of options with args //
        // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
        html_to_pdf.generatePdf(file, options).then(output => {
            console.log(output);

            fs.writeFileSync('public/uploads/pdfs/caja' + req.params.month + req.params.year + '.pdf', output)

            fs.readFile('./public/uploads/pdfs/caja' + req.params.month + req.params.year + '.pdf', { root: __dirname }, function (err, data) {
                res.contentType("application/pdf");
                console.log(err)
                res.send(data);
            });
        });
    } catch (error) {
        console.log(error)
        return res.render('error', { error: 404 })
    }
});

module.exports = router;
