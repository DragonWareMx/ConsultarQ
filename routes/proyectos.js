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
var path = require('path');
const { deserializeUser } = require('passport');
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
        },
        {
          model: models.Quotation
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
router.post('/create', upload.fields([{name: 'cotizaciones', maxCount: 10}, {name: 'contrato', maxCount: 1}]),
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
        .not().isEmpty()
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

                //busca los tipos de proyecto
                let ids = await models.Pro_Type.findAll({
                    attributes: ['id'],
                    raw: true
                })

                //verifica si el id ingresado por el usuario esta en la bd
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

          //si existe un numero en el input significa que ingresaron un proveedor
          if (/\d/.test(tipo)) {
              //se crea el validador, es true porque si no hay rol tambien es valido
              tipo = tipo.split(",")
              
              //encuentra todos los proveedores
              let ids = await models.Provider.findAll({
                  attributes: ['id'],
                  raw: true
              })

              validador2 = false

              //si el validador2 no se hace true, el proveedor no existe, no es valido
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

              //si se ingreso un 0 significa que no eligieron ninguno
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

            //busca los clientes
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
          if(req.files.contrato && req.files.contrato[0]){
            fs.unlink('public/uploads/docs/' + req.files.contrato[0].filename, (err) => {
              if (err) {
                  console.log("failed to delete local image:" + err);
              } else {
                  console.log('successfully deleted local image');
              }
            });
          }
          if(req.files.cotizaciones && req.files.cotizaciones[0]){
            req.files.cotizaciones.forEach(cotizacion => {
              fs.unlink('public/uploads/docs/' + cotizacion.filename, (err) => {
                if (err) {
                    console.log("failed to delete local image:" + err);
                } else {
                    console.log('successfully deleted local image');
                }
              });
            });
          }
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
          var proveedores = req.body.input_proveedores.split(",")
          var proveedoresID = []

          console.log(proveedores)

          //Guarda los ids de los usuarios empleados en un arreglo
          for(var i in miembros){
            const employee = await models.User.findOne({ attributes: ['id'], where: { id: miembros[i] }, raw: true, transaction: t });
            employeeID.push(employee.id)
          }

          //verificamos los roles y porcentajes
          for(var i in employeeID){
            await check("rol"+employeeID[i]).optional({ checkFalsy: true }).isLength({ max: 100 }).withMessage('El rol de los miembtos de proyecto puede tener un máximo de 100 caracteres.')
                  .trim()
                  .escape().run(req);
            await check("rolP"+employeeID[i]).optional({ checkFalsy: true }).isLength({ max: 3 }).withMessage('El rol de los miembtos de proyecto puede tener un máximo de 3 dígitos.')
                  .isNumeric().withMessage('Sólo se aceptan números en el porcentaje.')
                  .trim()
                  .escape().run(req);
          }

          const result = validationResult(req);
          if (!result.isEmpty()) {
            await t.rollback();
            return res.status(400).json({ errors: result.array() });
          }

          if (/\d/.test(proveedores)) {
            //Guarda los ids de los proveedores en un arreglo
            for(var i in proveedores){
              const provider = await models.Provider.findOne({ attributes: ['id'], where: { id: proveedores[i] }, raw: true, transaction: t });
              proveedoresID.push(provider.id)
            }
          }

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

          //guarda el cliente
          if(req.body.cliente){
            datos.ClientId = req.body.cliente
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

          //guarda el contrato
          if(req.files.contrato && req.files.contrato[0])
            datos.contract = req.files.contrato[0].filename

          //GUARDA EL PROYECTO
          const newProject = await models.Project.create(datos, { transaction: t })

          //GUARDA LOS PROYECTOS
          await newProject.setUsers(employeeID, {transaction: t})

          //GUARDA LOS PROVEEDORES
          await newProject.setProviders(proveedoresID, {transaction: t})

          //GUARDA LAS COTIZACIONES
          if(req.files.cotizaciones && req.files.cotizaciones[0]){
            for(var i in req.files.cotizaciones){
              await models.Quotation.create({
                ProjectId: newProject.id,
                quotation: req.files.cotizaciones[i].filename
              },{transaction: t})
            }
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
          var desc = "El usuario " + usuario.email + " ha registrado un proyecto nuevo con los siguientes datos:\nnombre: " + newProject.name + "\nFecha de inicio:" + newProject.start_date + "\nFecha límite: " + newProject.deadline + "\nStatus: " + newProject.getDataValue('status')+
          "\nFecha de término: " + newProject.end_date + "\nColor: " + newProject.color + "\nObservaciones: " + newProject.observaciones + "\nContrato: " + newProject.contract

          //cliente
          if(newProject.ClientId){
            const cliente = models.Client.findOne({where: {id: newProject.ClientId}, transaction: t})
            desc = desc + "\nCliente:\n\tid: " + cliente.id + "\n\temail: " + cliente.email
          }
          else
            desc = desc + "\nCliente: Sin cliente"

          //cotizaciones
          const cotizaciones = models.Quotation.findAll({where: {ProjectId: newProject.id}, transaction: t})

          contadorCot = 0
          desc = desc + "\nCotizaciones: "
          for(var cot in cotizaciones){
            desc = desc + "\n\t" + (contadorCot+1) + ": " + cotizaciones[cot].quotation
            contadorCot++
          }

          if(contadorCot == 0)
            desc = desc + "Sin cotizaciones"

          //miebros
          const miembrosLog = await models.User.findAll({where: {id: employeeID}, transaction: t})

          desc = desc+"\nMiembros: "
          for(var miem in miembrosLog){
            desc = desc + "\n\t email: " + miembrosLog[miem].email
          }

          //proveedores
          const proLog = models.Provider.findAll({where: {id: proveedoresID}, transaction: t})

          contadorPro = 0
          desc = desc + "\nProveedores: "
          for(var pro in proLog){
            desc = desc + "\n\t" + (contadorPro+1) + ": " + proLog[pro].name
            contadorPro++
          }

          if(contadorPro == 0)
            desc = desc + "Sin proveedores"

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

          if(req.files.contrato && req.files.contrato[0]){
            fs.unlink('public/uploads/docs/' + req.files.contrato[0].filename, (err) => {
              if (err) {
                  console.log("failed to delete local image:" + err);
              } else {
                  console.log('successfully deleted local image');
              }
            });
          }
          if(req.files.cotizaciones && req.files.cotizaciones[0]){
            req.files.cotizaciones.forEach(cotizacion => {
              fs.unlink('public/uploads/docs/' + cotizacion.filename, (err) => {
                if (err) {
                    console.log("failed to delete local image:" + err);
                } else {
                    console.log('successfully deleted local image');
                }
              });
            });
          }
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

  const Clients = await models.Client.findAll()

  return res.render('agregarProyecto', { prestadores,miembros, proTypes, Clients})
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
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('unidad')
        .optional({ checkFalsy: true })
        .isLength({ max: 10 }).withMessage('La Unidad puede tener un máximo de 10 caracteres.')
        .trim()
        .escape(),
  check('costo')
        .optional({ checkFalsy: true })
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
    const layout = await models.Pro_Type.findOne({
      where: {
          id: req.params.layoutId
      },
      transaction: t
    })
    if(!layout){
      await t.rollback();
      return res.status(404).json([{ msg: 'No existe el layout al que se desea asignar la tarea.' }])
    }
    var datos = {
      ProTypeId: req.params.layoutId,
      concept: req.body.concepto,
    }
    if(req.body.descripcion)
      datos.description=req.body.descripcion
    if(req.body.unidad)
      datos.unit= req.body.unidad
    if(req.body.costo)
      datos.price= req.body.costo
    //GUARDA LA TAREA
    const task = await models.Tasks_Layout.create(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha registrado una tarea nueva en el layout de "+layout.name+" con los siguientes datos:\nConcepto: "+task.concept+"\nDescripción: " + task.description+"\nUnidad: "+task.unit+"\nCosto: "+task.price 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Registro de tarea de layout",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!task)
      throw new Error()
      // If the execution reaches this line, no errors were thrown.
      // We commit the transaction.
    res.status(200).json(task);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible registrar la tarea, vuelva a intentarlo más tarde.' }])
  }
});

router.post('/layout/:layoutId/tarea/editar/:taskId',[
  check('concepto')
        .not().isEmpty().withMessage('Concepto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El concepto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('descripcion')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('unidad')
        .optional({ checkFalsy: true })
        .isLength({ max: 10 }).withMessage('La Unidad puede tener un máximo de 10 caracteres.')
        .trim()
        .escape(),
  check('costo')
        .optional({ checkFalsy: true })
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
        return res.status(403).json([{ msg: 'No estás autorizado para editar tareas en layouts de proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para editar tareas en layouts de proyectos.' }])
  }
  //VAMOS A GUARDAR LOS DATOS
  const t = await models.sequelize.transaction()
  try{
    const layout = await models.Pro_Type.findOne({
      where: {
          id: req.params.layoutId
      },
      transaction: t
    })
    if(!layout){
      await t.rollback();
      return res.status(404).json([{ msg: 'No existe el layout al que se desea editar la tarea.' }])
    }
    const task = await models.Tasks_Layout.findOne({
      where: {
          id: req.params.taskId
      },
      transaction: t
    })
    if(!task){
      await t.rollback();
      return res.status(404).json([{ msg: 'No existe la tarea que se desea editar.' }])
    }
    var datos = {
      concept: req.body.concepto,
    }
    if(req.body.descripcion)
      datos.description=req.body.descripcion
    else
      datos.description=null
    if(req.body.unidad)
      datos.unit= req.body.unidad
    else
      datos.unit=null
    if(req.body.costo)
      datos.price= req.body.costo
    else
      datos.price=null
    //EDITA LA TAREA
    await task.update(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha editado una tarea nueva para el layout de "+layout.name+" con los siguientes datos:\nConcepto: "+task.concept+"\nDescripción: "+ task.description+"\nUnidad: "+task.unit+"\nCosto: "+task.price 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Edición de tarea de layout",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!task)
      throw new Error()
      // If the execution reaches this line, no errors were thrown.
      // We commit the transaction.
    res.status(200).json(task);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible editar la tarea, vuelva a intentarlo más tarde.' }])
  }
});
  
router.post('/layout/:layoutId/tarea/eliminar/:taskId', isLoggedIn, async (req, res, next) => {
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
                  where: { name: 'pd' }
              }
          }
      })

      if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
          //NO TIENE PERMISOS
          return res.status(403).json([{ msg: 'No tienes permiso de eliminar tareas de layouts.' }])
      }
  }
  catch (error) {
      return res.status(403).json([{ msg: 'No tienes permiso de eliminar tareas de layouts.' }])
  }

  //TIENE PERMISO

  //Transaccion
  const t = await models.sequelize.transaction()
  try {
      const task = await models.Tasks_Layout.findOne({where: { id: req.params.taskId },transaction: t})
      if(!task){
        await t.rollback();
        return res.status(404).json([{ msg: 'No existe la tarea que se desea eliminar.' }])
      }
      const layout = await models.Pro_Type.findOne({where: { id: req.params.layoutId },transaction: t})
      if(!layout){
        await t.rollback();
        return res.status(404).json([{ msg: 'No existe el layout al que se desea elminar la tarea.' }])
      }

      //SE ELIMINA LA TAREA
      await task.destroy({ transaction: t })

      //SE REGISTRA EL LOG
      //obtenemos el usuario que realiza la transaccion
      const usuario = await models.User.findOne({where: {id: req.user.id},transaction: t})

      //guardamos los datos del log
      var dataLog = {
          UserId: usuario.id,
          title: "Eliminación de usuario",
          description: "El usuario " + usuario.email + " ha eliminado la tarea " + task.concept+" del layout de "+layout.name
      }

      //guarda el log en la base de datos
      const log = await models.Log.create(dataLog, { transaction: t })

      //verifica si se elimina el usuario
      const verTask = await models.Tasks_Layout.findOne({ where: { id: task.id }, transaction: t })

      if (verTask)
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
      return res.status(500).json([{ msg: 'No fue posible eliminar la tarea, vuelva a intentarlo más tarde.' }])
  }
});


router.post('/layout/:layoutId/eliminar', isLoggedIn, async (req, res, next) => {
  try {
      let usuario = await models.User.findOne({
          where: {
              id: req.user.id
          },
          include: {
              model: models.Role,
              include: {
                  model: models.Permission,
                  where: { name: 'pd' }
              }
          }
      })
      if (!(usuario && usuario.Role && usuario.Role.Permissions)) {
          return res.status(403).json([{ msg: 'No tienes permiso de eliminar layouts.' }])
      }
  }
  catch (error) {
      return res.status(403).json([{ msg: 'No tienes permiso de eliminar layouts.' }])
  }
  const t = await models.sequelize.transaction()
  try {
      const layout = await models.Pro_Type.findOne({where: { id: req.params.layoutId },transaction: t})
      if(!layout){
        await t.rollback();
        return res.status(404).json([{ msg: 'No existe el layout que deseas eliminar' }])
      }
      await layout.destroy({ transaction: t })
      const usuario = await models.User.findOne({where: {id: req.user.id},transaction: t})
      var dataLog = {
          UserId: usuario.id,
          title: "Eliminación de usuario",
          description: "El usuario " + usuario.email + " ha eliminado el layout de "+layout.name
      }
      const log = await models.Log.create(dataLog, { transaction: t })
      const verLayout = await models.Pro_Type.findOne({ where: { id: layout.id }, transaction: t })
      if (verLayout)
          throw new Error()
      if (!log)
          throw new Error()
      res.status(200).json([{ status: 200 }]);
      await t.commit()
  } catch (error) {
      console.log(error)
      await t.rollback();
      return res.status(500).json([{ msg: 'No fue posible eliminar el layout, vuelva a intentarlo más tarde.' }])
  }
});
module.exports = router;