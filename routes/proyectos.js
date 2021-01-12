var express = require('express');
var router = express.Router();
const { check, validationResult, body } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//VER PROYECYOS ACTIVOS
router.get('/activos', isLoggedIn,async function (req, res, next) {
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

    var pC = false;
    var pR = false;
    var pU = false;
    var pD = false;

    usuario.Role.Permissions.forEach(permiso => {
        if (permiso.name == 'pc')
            pC = true
        else if (permiso.name == 'pr')
            pR = true
        else if (permiso.name == 'pu')
            pU = true
        else if (permiso.name == 'pd')
            pD = true
    });

    //si el usuario puede ver y registrar
    if (usuario && usuario.Role && usuario.Role.Permissions && pR && pC) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
      const proyectos = await models.Project.findAll({
        include: [{
          model: models.User,
          include: models.Employee
        },{
          model: models.Pro_Type
        },
        {
          model: models.Project_Employee,
          include: models.Comment
        },
        {
          model: models.Project_Requirement,
          include: models.Task
        }
      ]
      })
      res.render('proyectos', {proyectos});
    }
    else if(usuario && usuario.Role && usuario.Role.Permissions && pR){
      const proyectos = await models.Project.findAll({
        include: [{
          model: models.User,
          include: models.Employee,
          where: {id: usuario.id}
        },{
          model: models.Pro_Type
        },
        {
          model: models.Project_Employee,
          include: models.Comment
        },
        {
          model: models.Project_Requirement,
          include: models.Task
        }
      ]
      })
      res.render('proyectos', {proyectos});
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

router.get('/documentacion', isLoggedIn,function (req, res, next) {
  res.render('documentacion'); 
});

//AGREGAR PROYECTO
router.post('/create',
    [
      check('nombreP')
        .not().isEmpty().withMessage('Nombre del proyecto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El nombre del proyecto puede tener un máximo de 255 caracteres.')
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

router.get('/agregar', isLoggedIn,function (req, res, next) {
  //si hay errores entonces se muestran
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(422).send(errors.array());
  }

  models.Provider.findAll({
    include: [{
        model: models.Provider_Area
    }],
    order: [
        ['status', 'ASC']
    ]
    }).then(prestadores => {
      models.Employee.findAll({
        include: [{
          model: models.User
        }],
        order: [
          ['name','ASC']
        ]
      }).then(miembros =>{

        return res.render('agregarProyecto', { prestadores,miembros})
      });
  });
});

router.get('/documentacion/editar/1', isLoggedIn,function (req, res, next) {
  models.Project.findOne({
    where: {
      id: 1
    },
    include: [{
      model: models.Project_Requirement,
      include: models.Task
    }
  ]
  }).then(project =>{
    res.render('editarDocumentacion',{project});
  }); 
});

router.get('/layouts', isLoggedIn,async function (req, res, next) {
  const layouts=await models.Pro_Type.findAll({
    include: {model: models.Project_Requirements_Layout,
      include: models.Tasks_Layout}
  })
  res.render('layouts',{layouts});
});

router.get('/layout/editar/:id', isLoggedIn,function (req, res, next) {
  models.Pro_Type.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: models.Project_Requirements_Layout,
      include: models.Tasks_Layout
    }
  ]
  }).then(layout =>{
    res.render('editarLayout',{layout});
  });
});

router.post('/layout/nuevo', isLoggedIn,function (req, res, next) {
  
});
  

module.exports = router;