var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

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
    // const clientes = await models.Client.findAll({ include: models.Client_Area });
    // const areas= await models.Client_Area.findAll({order: [['id', 'ASC']]});
    // res.render('clientes', { clientes, areas})  
});


router.get('/cliente', isLoggedIn,function(req, res, next) {

    res.render('cliente')
});

router.get('/generar-cotizacion', isLoggedIn,function(req, res, next) {

    res.render('generarCotizacion')
});

module.exports = router;