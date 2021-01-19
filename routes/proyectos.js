var express = require('express');
var router = express.Router();
const { check, validationResult, body } = require('express-validator/check');
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
        cb(null, 'public/uploads/docs')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
})
var upload = multer({
    storage: storage, fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg" || file.mimetype == "application/pdf" || file.mimetype == "application/msword" || file.mimetype == "application/vnd.ms-excel") {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
        }
    }
});

//VER PROYECTO--------------------
router.get('/proyecto', isLoggedIn,function(req, res, next) {

  res.render('proyecto')
});

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
          model: models.Task
        }
      ],
      order: [['createdAt','DESC']]
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
          model: models.Task
        }
        ],
        order: [['createdAt','DESC']]
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

router.get('/documentacion', isLoggedIn,async function (req, res, next) {
  const projects =await models.Project.findAll({
    include: models.Task
  })
  res.render('documentacion',{projects}); 
});

//AGREGAR PROYECTO
router.post('/create', upload.any(),
    [
      check('nombreP')
        .not().isEmpty().withMessage('Nombre del proyecto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El nombre del proyecto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
      check('color')
        .not().isEmpty().withMessage('El color es un campo requerido.')
        .isHexColor().withMessage('El color no es válido.'),
      check('estatus')
        .isIn(['activo', 'terminado', 'cancelado']).withMessage('El estatus ingresado no es válido.'),
      check('start_date')
        .not().isEmpty()
        .custom(date => {
            return !isNaN(Date.parse(date));
        }).withMessage('La fecha de inicio no es válida.'),
      check('end_date')
        .optional({ checkFalsy: true })
        .custom(date => {
          return !isNaN(Date.parse(date));
        }).withMessage('La fecha de término no es válida.'),
      check('deadline')
        .not().isEmpty()
        .custom(date => {
          return !isNaN(Date.parse(date));
        }).withMessage('La fecha límite no es válida.'),
      check('tipo')
        .optional({ checkFalsy: true })
        .custom(async (tipo) => {
            //se crea el validador, es true porque si no hay rol tambien es valido
            var validador = true

            //si no es nulo
            if (tipo) {
                validador = false

                let ids = await models.Pro_Type.findAll({
                    attributes: ['id'],
                    raw: true
                })

                ids.forEach(id => {
                    if (tipo == id.id) {
                        validador = true
                    }
                });

                if (tipo == 0)
                    validador = true
            }
            if (validador) {
                return true
            }
            else
                throw new Error('El tipo de proyecto seleccionado existe.');
        }).withMessage('El tipo de proyecto seleccionado no es válido.'),
      check('input_proveedores')
        .custom(async (tipo) => {

          var validador = true

          if (/\d/.test(tipo)) {
              //se crea el validador, es true porque si no hay rol tambien es valido
              tipo = tipo[0].split(",")

              //si no es nulo
          
              let ids = await models.Provider.findAll({
                  attributes: ['id'],
                  raw: true
              })

              validador2 = false

              tipo.forEach(idB => {
                ids.forEach(id => {
                  if (idB == id.id) {
                    validador2 = true
                  }
                })

                if(validador2 == false)
                  validador = false
                validador2 = false
              })

              if (tipo == 0)
                  validador = true
          }
          if (validador) {
              return true
          }
          else
              throw new Error('Uno de los proveedores seleccionados no existe.');
        }).withMessage('Hubo un error con alguno de los proveedores seleccionados, reinténtelo más tarde.'),
      check('cliente')
        .custom(async (tipo) => {
          if(tipo){
            //se crea el validador, es true porque si no hay rol tambien es valido
            validador = false

            let ids = await models.Client.findAll({
                attributes: ['id'],
                raw: true
            })

            ids.forEach(id => {
                if (tipo == id.id) {
                  validador = true
                }
            })

            if (validador) {
                return true
            }
          }
          else return true
        }).withMessage('El Cliente seleccionado no es válido.'),
        check('input_miembros')
          .custom(async (tipo) => {
            if (!(/\d/.test(tipo))) {
              throw new Error()
            }
            //se crea el validador, es true porque si no hay rol tambien es valido
            tipo = tipo.split(",")

            var validador = true

            //si no es nulo
            if (tipo && tipo[0] != '') {
                let ids = await models.Employee.findAll({
                    attributes: ['id'],
                    raw: true
                })

                validador2 = false

                tipo.forEach(idB => {
                  ids.forEach(id => {
                    if (idB == id.id) {
                      validador2 = true
                    }
                  })

                  if(validador2 == false)
                    validador = false
                  validador2 = false
                })

                if (tipo == 0)
                    validador = true
            }
            if (validador) {
                return true
            }
            else
                throw new Error('Algún miembro seleccionado no es válido.');
        }).withMessage('Algún miembro seleccionado no es válido.'),
        check('observaciones')
          .optional({ checkFalsy: true })
          .withMessage('Observaciones es un campo requerido.')
          .isLength({ max: 255 }).withMessage('Observaciones puede tener un máximo de 255 caracteres.')
          .trim()
          .escape()
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
                        where: { name: 'pc' }
                    }
                }
            })

            if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
                //NO TIENE PERMISO DE AGREGAR rol
                return res.status(403).json([{ msg: 'No estás autorizado para registrar proyectos.' }])
            }
        }
        catch (error) {
            return res.status(403).json([{ msg: 'No estás autorizado para registrar proyectos.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
          //se guardan los datos principales
          var miembros = req.body.input_miembros.split(",")
          var employeeID = []

          console.log(miembros)

          for(var i in miembros){
            console.log(miembros[i])
            const employee = await models.User.findOne({ attributes: ['id'], where: { id: miembros[i] }, raw: true, transaction: t });
            console.log(employee)
            employeeID.push(employee.id)
          }

          console.log(employeeID)

          var datos = {
            name: req.body.nombreP,
            start_date: req.body.start_date,
            deadline: req.body.deadline,
            color: req.body.color,
            status: req.body.estatus
          }

          //SE GUARDAN LOS NULLABLES
          //tipo de proyecto
          if(req.body.tipo && req.body.tipo != 0){
            datos.ProTypeId = req.body.tipo
          }

          //si hay observaciones
          if(req.body.observaciones){
            datos.observations = req.body.observaciones
          }

          switch(req.body.estatus){
            case 'terminado':
              if(req.body.end_date)
                datos.end_date = req.body.end_date
              else
                throw new Error()
              break
            case 'cancelado':
            case 'activo':
              break
            default:
              throw new Error()
          }

          //GUARDA EL PROYECTO
          const newProject = await models.Project.create(datos, { transaction: t })

          await newProject.setUsers(employeeID, {transaction: t})

          //guarda los empleados relacionados con el proyecto

          //SE REGISTRA EL LOG
          //obtenemos el usuario que realiza la transaccion
          const usuario = await models.User.findOne({
              where: {
                  id: req.user.id
              },
              transaction: t
          })

          //descripcion del log
          var desc = "El usuario " + usuario.email + " ha registrado un proyecto nuevo con los siguientes datos:\nnombre: " + newProject.name + "\nFecha de inicio:" + newProject.start_date + "\nFecha límite: " + newProject.deadline + "\nStatus: " + newProject.getDataValue('status') 

          //guardamos los datos del log
          var dataLog = {
              UserId: usuario.id,
              title: "Registro de proyecto",
              description: desc
          }

          //guarda el log en la base de datos
          const log = await models.Log.create(dataLog, { transaction: t })

          //verifica que se hayan registrado el log y el rol
          if (!log)
              throw new Error()
          if (!newProject)
              throw new Error()

          console.log(req.body)

          res.status(200).json([{ status: 200 }]);
          // If the execution reaches this line, no errors were thrown.
          // We commit the transaction.
          await t.commit()
        } catch (error) {
          console.log(error)
            // If the execution reaches this line, an error was thrown.
            // We rollback the transaction.
            await t.rollback();
            return res.status(500).json([{ msg: 'No fue posible registrar el proyecto, vuelva a intentarlo más tarde.' }])
        }
});

router.get('/agregar', isLoggedIn,async function (req, res, next) {
  const prestadores = await models.Provider.findAll({
    include: [{
        model: models.Provider_Area
    }],
    order: [
        ['status', 'ASC']
    ]
  })
      
  const miembros = await models.Employee.findAll({
    include: [{
      model: models.User
    }],
    order: [
      ['name','ASC']
    ]
  })

  const proTypes = await models.Pro_Type.findAll()

  return res.render('agregarProyecto', { prestadores,miembros, proTypes})
});

router.get('/documentacion/editar/:id', isLoggedIn,function (req, res, next) {
  models.Project.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: models.Task
    }
  ]
  }).then(project =>{
    res.render('editarDocumentacion',{project});
  }); 
});

router.get('/editar/:id', isLoggedIn, async function (req, res, next) {
  const project=await models.Project.findOne({
    where:{
      id: req.params.id
    },
    include:[{
      model: models.Project_Employee,
      include:{ model: models.User, include: models.Employee}
    }]
  })
  const proTypes=await models.Pro_Type.findAll()
  const prestadores=await models.Provider.findAll()
  const clientes=await models.Client.findAll()
  const miembros = await models.Employee.findAll({
    include: [{
      model: models.User
    }],
    order: [
      ['name','ASC']
    ]
  })
  res.render('editarProyecto',{project,proTypes,prestadores,miembros,clientes});
});

router.get('/layouts', isLoggedIn,async function (req, res, next) {
  const layouts=await models.Pro_Type.findAll({
      include: models.Tasks_Layout
  })
  res.render('layouts',{layouts});
});

router.post('/layout/create',[
  check('tipo')
        .not().isEmpty().withMessage('Nombre del layout es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El nombre del layout puede tener un máximo de 255 caracteres.')
        .trim()
        .escape()
  ], isLoggedIn, async function (req, res, next) {
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
                where: { name: 'pc' }
            }
        }
    })

    if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
        //NO TIENE PERMISO DE AGREGAR 
        return res.status(403).json([{ msg: 'No estás autorizado para registrar layouts de proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para registrar layouts de proyectos.' }])
  }
  //VAMOS A GUARDAR LOS DATOS
  const t = await models.sequelize.transaction()
  try{
    var datos = {
      name: req.body.tipo
    }
    //GUARDA EL LAYOUT
    const newLayout = await models.Pro_Type.create(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha registrado un layout nuevo con los siguientes datos:\nnombre: " + newLayout.name 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Registro de layout",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!newLayout)
      throw new Error()
      // If the execution reaches this line, no errors were thrown.
      // We commit the transaction.
    res.status(200).json(newLayout);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible registrar el proyecto, vuelva a intentarlo más tarde.' }])
  }
});

router.get('/layout/editar/:id', isLoggedIn,function (req, res, next) {
  models.Pro_Type.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: models.Tasks_Layout
    }
  ]
  }).then(layout =>{
    res.render('editarLayout',{layout});
  });
});


router.post('/layout/:idLayout/editar',[
  check('titulo')
        .not().isEmpty().withMessage('Nombre del layout es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El nombre del layout puede tener un máximo de 255 caracteres.')
        .trim()
        .escape()
  ], isLoggedIn, async function (req, res, next) {
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
                where: { name: 'pu' }
            }
        }
    })

    if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
        //NO TIENE PERMISO DE AGREGAR 
        return res.status(403).json([{ msg: 'No estás autorizado para editar layouts de proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para editar layouts de proyectos.' }])
  }
  //VAMOS A GUARDAR LOS DATOS
  const t = await models.sequelize.transaction()
  try{
    var datos = {
      name: req.body.tipo
    }
    //EDITA EL LAYOUT
    const layout = await models.Pro_Type.findOne({
      where: { id: req.params.idLayout }, transaction: t
    })

    await layout.update({
      name: req.body.titulo
    }, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha ediato un layout nuevo con los siguientes datos:\nnombre: " + layout.name 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Actualización de layout",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!layout)
      throw new Error()
      // If the execution reaches this line, no errors were thrown.
      // We commit the transaction.
    res.status(200).json([{ status: 200 }]);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible editar el proyecto, vuelva a intentarlo más tarde.' }])
  }
});

router.get('/layout/editar/:id', isLoggedIn,function (req, res, next) {
  models.Pro_Type.findOne({
    where: {
      id: req.params.id
    },
    include: [{
      model: models.Tasks_Layout
    }
  ]
  }).then(layout =>{
    res.render('editarLayout',{layout});
  });
});

router.post('/layout/:layoutId/tarea/agregar',[
  check('concepto')
        .not().isEmpty().withMessage('Concepto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El concepto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('descripcion')
        .not().isEmpty().withMessage('Descripción es un campo requerido.')
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('unidad')
        .not().isEmpty().withMessage('Unidad es un campo requerido.')
        .isLength({ max: 500 }).withMessage('La Unidad puede tener un máximo de 10 caracteres.')
        .trim()
        .escape(),
  check('costo')
        .not().isEmpty().withMessage('Costo es un campo requerido.')
        .isNumeric().withMessage('Sólo se aceptan números en el campo Costo')
        .trim()
        .escape(),
  ], isLoggedIn, async function (req, res, next) {
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
                where: { name: 'pu' }
            }
        }
    })

    if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
        //NO TIENE PERMISO DE AGREGAR 
        return res.status(403).json([{ msg: 'No estás autorizado para registrar tareas en layouts de proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para registrar tareas en layouts de proyectos.' }])
  }
  //VAMOS A GUARDAR LOS DATOS
  const t = await models.sequelize.transaction()
  try{
    var datos = {
      concept: req.body.concepto,
      description: req.body.descripcion,
      unit: req.body.unidad,
      price: req.body.costo
    }

    var datos = {
      ProTypeId: req.params.layoutId
    }
    //GUARDA EL LAYOUT
    const newLayout = await models.Pro_Type.create(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha registrado un layout nuevo con los siguientes datos:\nnombre: " + newLayout.name 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Registro de layout",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!newLayout)
      throw new Error()
      // If the execution reaches this line, no errors were thrown.
      // We commit the transaction.
    res.status(200).json(newLayout);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible registrar el proyecto, vuelva a intentarlo más tarde.' }])
  }
});

  

module.exports = router;