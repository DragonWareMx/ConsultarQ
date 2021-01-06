var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');

//sequelize models
const models = require('../models/index');

//  consulta todos los prestadores externos
router.get('/', isLoggedIn, async (req, res, next) => {

    try{
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
            models.Provider.findAll({
                include: [{
                    model: models.Provider_Area
                }],
                order: [
                    ['status', 'ASC']
                ]
            }).then(prestadores => {
                models.Provider.findAll().then(areas => {
                    return res.render('prestadores_externos/prestadores', { prestadores , areas})
                });
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

// agregar nuevo prestador
router.post('/nuevo', isLoggedIn,
    [
        check('add-correo')
            .isEmail()
            .normalizeEmail().withMessage('Correo electrónico no válido.'),
    ]
    , (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).send(errors.array());
        }
        passport.authenticate('local.signup', function (error, user, info) {
            if (error) {
                return res.status(500).json([{ msg: 'Ocurrió un error al intentar registrar el prestador.' }]);
            }
            if (!user) {
                return res.status(401).json(info);
            }
            res.json(user);
        })(req, res, next);
});


module.exports = router;