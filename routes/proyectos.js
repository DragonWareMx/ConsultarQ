var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

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

router.get('/agregar', isLoggedIn,function (req, res, next) {
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
  res.render('editarDocumentacion'); 
});

router.get('/layouts', isLoggedIn,function (req, res, next) {
  res.render('layouts');
});

router.get('/layout/editar/1', isLoggedIn,function (req, res, next) {
  models.Pro_Type.findOne({
    where: {
      id: 1
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