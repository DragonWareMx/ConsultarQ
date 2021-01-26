var express = require('express');
var router = express.Router();
const { check, validationResult, body } = require('express-validator');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
var html_to_pdf = require('html-pdf-node');
require('dotenv').config();
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//subir archivos
const fs = require('fs');
var multer = require('multer');
var path = require('path');
const { deserializeUser } = require('passport');
const { render } = require('pug');
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
router.get('/proyecto/:id', isLoggedIn, async function(req, res, next) {
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
    if (usuario && usuario.Role && usuario.Role.Permissions && pR) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
      const proyecto = await models.Project.findOne({
        where: {
          id: req.params.id
        },
        include: 
        [
          {
            model: models.User,
            include: models.Employee,
          },
          {
            model: models.Pro_Type
          },
          {
            model: models.Project_Employee
          },
          {
            model: models.Task,
            order: ['check','ASC']
          },
          {
            model: models.Quotation
          },
          {
            model: models.Client,
            include: models.Client_Area
          },
          {
            model: models.Task
          },
          {
            model: models.Provider,
            include: models.Provider_Area
          }
        ],
      })


      const comentarios = await models.Comment.findAll({
        where: {ProjectId: proyecto.id},
        order: [['createdAt','DESC']],
        include: {
          model: models.User,
          include: models.Employee
        }
      })

      const movimientos = await models.Transaction.findAll({
        include: [
          {
            model: models.Project,
          },
          {
            model: models.User,
            include: models.Employee
          },
          {
            model: models.Concept
          },
          {
            model: models.Pa_Type
          }
        ],
        where: {ProjectId: proyecto.id},
        order: [['date','DESC']]
      })

      console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',comentarios)
      res.render('proyecto', {proyecto, comentarios, movimientos});
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//VER PDF--------------------
router.get('/proyecto/:id/pdf', isLoggedIn, async function(req, res, next) {
  let options = { format: 'A4' };
  // Example of options with args //
  // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

  const proyecto = await models.Project.findOne({
    where: {
      id: req.params.id
    },
    include: 
    [
      {
        model: models.User,
        include: models.Employee,
      },
      {
        model: models.Pro_Type
      },
      {
        model: models.Project_Employee
      },
      {
        model: models.Task,
        order: ['check','ASC']
      },
      {
        model: models.Quotation
      },
      {
        model: models.Client,
        include: models.Client_Area
      },
      {
        model: models.Task
      },
      {
        model: models.Provider,
        include: models.Provider_Area
      }
    ],
  })

  const fechaII = new Date(proyecto.start_date+"T11:22:33+0000")
  const fechaI = fechaII.getTime()
  const fechaTI = new Date(proyecto.deadline+"T11:22:33+0000")
  const fechaT = fechaTI.getTime()
  var hoyI
  if(proyecto.end_date)
      hoyI = new Date(proyecto.end_date+"T11:22:33+0000")
  else
      hoyI = new Date()
  const hoy = hoyI.getTime()

  var diasF
  diasF = ((hoy-fechaI)/(fechaT-fechaI))*100

  if(diasF > 91)
      diasF = 91
  else if(diasF < 5)
      diasF = 5

  const MESES = [
  "ENE",
  "FEB",
  "MAR",
  "ABR",
  "MAY",
  "JUN",
  "JUL",
  "AGO",
  "SEP",
  "OCT",
  "NOV",
  "DIC",
  ];
  const f = new Date();

  mesI = MESES[fechaII.getMonth()];
  mesF = MESES[fechaTI.getMonth()];

  var tareasListas = 0
      var tareasFaltantes = 0
      var tareasTotales = 0
      var porcentaje = 100
  if (proyecto.Tasks)
    for (const i in proyecto.Tasks) {
      if (Object.hasOwnProperty.call(proyecto.Tasks, i)) {
        const element = proyecto.Tasks[i];
        tareasTotales++
        if(element.check)
            tareasListas++
        else
            tareasFaltantes++
      }
  }
  if (tareasTotales > 0){
    porcentaje = parseInt((tareasListas/tareasTotales)*100)
  }

  const url = process.env.CLIENT_URL
  console.log(url)
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
                        font-size: 13px;
                      }
                      table.blueTable thead {
                        background: #407EC9;
                        border-bottom: 2px solid #444444;
                      }
                      table.blueTable thead th {
                        font-size: 15px;
                        font-weight: bold;
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
                <h3 style="font-family: Montserrat,Tahoma;text-transform: uppercase;">PROYECTO</h3>
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
        /*const ingresos = await models.Transaction.findAll({
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
        });*/

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

        /*const egresos = await models.Transaction.findAll({
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
        */

        ht += `
                </tbody>
                </table>
            </body>
        </html>
        `;

  let file = { content: ht };

  html_to_pdf.generatePdf(file, options).then(output => {
    console.log(output);

    fs.writeFileSync('public/uploads/pdfs/proyecto'+req.params.id+'.pdf', output)

    fs.readFile('./public/uploads/pdfs/proyecto'+req.params.id+'.pdf', {root: __dirname} , function (err,data){
      res.contentType("application/pdf");
      res.send(data);
    });
  });
});

//AGREGAR COMENTARIO
router.post('/proyecto/:id/comment',
    [
      check('descripcion')
        .not().isEmpty().withMessage('El comentario es requerido.')
        .isLength({ max: 150 }).withMessage('El comentario puede tener un máximo de 150 caracteres.')
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

            if (!(usuario && pU)) {
                //NO TIENE PERMISO DE AGREGAR COMENTARIOS
                return res.status(403).json([{ msg: 'No estás autorizado para comentar.' }])
            }
        }
        catch (error) {
          console.log(error)
            return res.status(403).json([{ msg: 'No estás autorizado para registrar proyectos.' }])
        }

        //TIENE PERMISO
        //Transaccion
        const t = await models.sequelize.transaction()
        try {
          //SI TIENE EL PERMISO MAESTRO PUEDE COMENTAR
          //SI NO SE TIENE QUE VERIFICAR SI FORMA PARTE DEL PROYECTO
          if (!(pR && pU && pC && pD)) {
            const proEm = await models.Project_Employee.findOne({
              where:{
                ProjectId:  req.params.id,
                UserId: req.user.id
              }
            })

            if(!proEm){
              await t.rollback();
              return res.status(500).json([{ msg: 'No puedes enviar comentarios con tu rol asignado si no formas parte del proyecto.' }])
            }
          }

          //se guardan los datos principales
          var datos = {
            comment: req.body.descripcion,
            ProjectId:  req.params.id,
            UserId: req.user.id
          }

          //GUARDA EL COMENTARIO
          const newComment = await models.Comment.create(datos, { transaction: t })

          res.status(200).json([{ status: 200 }]);
          // If the execution reaches this line, no errors were thrown.
          // We commit the transaction.
          await t.commit()
        } catch (error) {
          console.log(error)

          // If the execution reaches this line, an error was thrown.
          // We rollback the transaction.
          await t.rollback();
          return res.status(500).json([{ msg: 'No fue posible enviar el comentario, vuelva a intentarlo más tarde.' }])
        }
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
          model: models.Project_Employee
        },
        {
          model: models.Task
        },
        {
          model: models.Quotation
        },
        {
          model: models.Comment
        }
      ],
      where: {status : 'activo'},
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
          model: models.Project_Employee
        },
        {
          model: models.Task
        },
        {
          model: models.Comment
        }
        ],
        order: [['createdAt','DESC']]
      })
      res.render('proyectos', {proyectos});
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});


router.get('/inactivos', isLoggedIn,async function (req, res, next) {
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
          model: models.Project_Employee
        },
        {
          model: models.Task
        },
        {
          model: models.Quotation
        },
        {
          model: models.Comment
        }
      ],
      where: {status : ['terminado','cancelado']},
      order: [['createdAt','DESC']]
      })
      res.render('proyectosInactivos', {proyectos});
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
          model: models.Project_Employee
        },
        {
          model: models.Task
        },
        {
          model: models.Comment
        }
        ],
        order: [['createdAt','DESC']]
      })
      res.render('proyectos', {proyectos});
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//VER DOCUMENTACION
router.get('/documentacion', isLoggedIn,async function (req, res, next) {
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
    if (usuario && usuario.Role && usuario.Role.Permissions && pR) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      const projects =await models.Project.findAll({
        include: models.Task,
        order: [['createdAt','DESC']]
      })
      res.render('documentacion',{projects});     
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
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
        .not().isEmpty().withMessage('El cliente es un campo requerido.')
        .custom(async (tipo) => {
            //se crea el validador
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
            else
              return false
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

        //comprueba las fechas
        var fechaI = new Date(req.body.start_date)
        var fechaD = new Date(req.body.deadline)

        fechaI.getTime()
        fechaD.getTime()

        if(fechaI >= fechaD)
          return res.status(422).json([{ msg: 'La fecha de inicio no puede ser mayor o igual a la fecha límite.' }])

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
            return res.status(422).send(result.array());
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

          //estatus
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

          if(req.body.tipo && req.body.tipo != 0)
            datos.ProTypeId = req.body.tipo

          //GUARDA EL PROYECTO
          const newProject = await models.Project.create(datos, { transaction: t })

          //GUARDA LOS USUARIOS
          await newProject.setUsers(employeeID, {transaction: t})

          for(var j in employeeID){
            if(req.body["rol"+employeeID[j]])
              await models.Project_Employee.update({role: req.body["rol"+employeeID[j]]},{where: {Userid: employeeID[j], ProjectId: newProject.id}, transaction: t})
            if(req.body["rolP"+employeeID[j]])
              await models.Project_Employee.update({profit: req.body["rolP"+employeeID[j]]},{where: {Userid: employeeID[j], ProjectId: newProject.id}, transaction: t})
          }

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

          var layout

          //GUARDA LAS TAREAS
          if(newProject.ProTypeId){
            layout = await models.Pro_Type.findOne({where: {id: newProject.ProTypeId}, include: models.Tasks_Layout})

            for (const i in layout.Tasks_Layouts) {
              if (Object.hasOwnProperty.call(layout.Tasks_Layouts, i)) {
                const element = layout.Tasks_Layouts[i];
                const datosTask = {
                  ProjectId: newProject.id,
                  concept: element.concept
                }
                if(element.unit)
                  datosTask.unit = element.unit
                if(element.price)
                  datosTask.price = element.price
                if(element.description)
                  datosTask.description = element.description

                await models.Task.create(datosTask, {transaction: t})
              }
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
          var desc = "El usuario " + usuario.email + " ha registrado un proyecto nuevo con los siguientes datos:\nnombre: " + newProject.name + "\nFecha de inicio: " + newProject.start_date + "\nFecha límite: " + newProject.deadline + "\nStatus: " + newProject.getDataValue('status')+
          "\nFecha de término: " + newProject.end_date + "\nColor: " + newProject.color + "\nObservaciones: " + newProject.observations + "\nContrato: " + newProject.contract

          //cotizaciones
          const cotizaciones = await models.Quotation.findAll({where: {ProjectId: newProject.id}, transaction: t})

          contadorCot = 0
          desc = desc + "\nCotizaciones: "
          for(var cot in cotizaciones){
            desc = desc + "\n\t" + cotizaciones[cot].id + ": " + cotizaciones[cot].quotation
            contadorCot++
          }

          //cliente
          if(newProject.ClientId){
            const cliente = await models.Client.findOne({where: {id: newProject.ClientId}, transaction: t})
            desc = desc + "\nCliente:\n\tid: " + cliente.id + "\n\temail: " + cliente.email
          }
          else
            desc = desc + "\nCliente: Sin cliente"

          if(contadorCot == 0)
            desc = desc + "Sin cotizaciones"

          //miebros
          const miembrosLog = await models.User.findAll({where: {id: employeeID}, transaction: t})

          desc = desc+"\nMiembros: "
          for(var miem in miembrosLog){
            desc = desc + "\n\t"+miembrosLog[miem].id+":\n\t\temail: " + miembrosLog[miem].email +
            "\n\t\tRol: "
            if(req.body["rol"+miembrosLog[miem].id])
              desc = desc + req.body["rol"+miembrosLog[miem].id]
            else
              desc = desc + "Sin rol"
            desc = desc + "\n\t\tPorcentaje: "
            if(req.body["rolP"+miembrosLog[miem].id])
              desc = desc + req.body["rolP"+miembrosLog[miem].id]
            else
              desc = desc + "Sin porcentaje"
          }

          //proveedores
          const proLog = await models.Provider.findAll({where: {id: proveedoresID}, transaction: t})

          contadorPro = 0
          desc = desc + "\nProveedores: "
          for(var pro in proLog){
            desc = desc + "\n\t" +  proLog[pro].id + ": " + proLog[pro].name
            contadorPro++
          }

          if(contadorPro == 0)
            desc = desc + "Sin proveedores"

          //tipo de proyecto
          if(layout){
            desc = desc + "\nLayout"+layout.id+": " + layout.name

            if(layout.Tasks_Layouts){
              for(var i in layout.Tasks_Layouts){
                desc = desc + "\n\tTarea " + layout.Tasks_Layouts[i].id + ":"
                + "\n\t\tConcepto: " + layout.Tasks_Layouts[i].concept
                + "\n\t\tDescripcion: " + layout.Tasks_Layouts[i].description
                + "\n\t\tUnidad: " + layout.Tasks_Layouts[i].unit
                + "\n\t\tPrecio: " + layout.Tasks_Layouts[i].price
              }
            }
            else{
              desc = desc + "\n\tSin tareas"
            }
          }
          else{
            desc = desc + "\nSin Layout"
          }

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


//EDITAR PROYECTO
router.post('/update/:projectId', upload.fields([{name: 'cotizaciones', maxCount: 10}, {name: 'contrato', maxCount: 1}]),
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
      check('agregarCotizacion')
        .not().isEmpty()
        .isIn(['agregar', 'reemplazar']).withMessage('Selecciona agregar o reemplazar.'),
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
                throw new Error('El servicio existe.');
        }).withMessage('El servicio seleccionado no es válido.'),
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
        .not().isEmpty().withMessage('El cliente es un campo requerido.')
        .custom(async (tipo) => {
            //se crea el validador
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
            else
              return false
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

        //comprueba las fechas
        var fechaI = new Date(req.body.start_date)
        var fechaD = new Date(req.body.deadline)

        fechaI.getTime()
        fechaD.getTime()

        if(fechaI >= fechaD)
          return res.status(422).json([{ msg: 'La fecha de inicio no puede ser mayor o igual a la fecha límite.' }])

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
          const project = await models.Project.findOne({
            where: {
                id: req.params.projectId
              },
            include: {
                model: models.Quotation
              },
            transaction: t
          })
          const layoutAntiguo = project.ProTypeId
          //se guardan los datos principales
          var miembros = req.body.input_miembros.split(",")
          var employeeID = []
          var proveedores = req.body.input_proveedores.split(",")
          var proveedoresID = []

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
            return res.status(422).send(result.array());
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
          else{
            datos.ProTypeId = null
          }

          //si hay observaciones
          if(req.body.observaciones){
            datos.observations = req.body.observaciones
          }
          else{
            datos.observations=null
          }

          //guarda el cliente
          if(req.body.cliente){
            datos.ClientId = req.body.cliente
          }
          else{
            datos.ClientId = null
          }

          //estatus
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
          if(req.files.contrato && req.files.contrato[0]){
            datos.contract = req.files.contrato[0].filename
            fs.unlink('public/uploads/docs/' + project.contract, (err) => {
              if (err) {
                  console.log("failed to delete local image:" + err);
              } else {
                  console.log('successfully deleted local image');
              }
            });
          }
          

          //GUARDA EL PROYECTO
          await project.update(datos, { transaction: t })

          //GUARDA LOS USUARIOS
          await project.setUsers(employeeID, {transaction: t})

          for(var j in employeeID){
            if(req.body["rol"+employeeID[j]])
              await models.Project_Employee.update({role: req.body["rol"+employeeID[j]]},{where: {Userid: employeeID[j], ProjectId: project.id}, transaction: t})
            if(req.body["rolP"+employeeID[j]])
              await models.Project_Employee.update({profit: req.body["rolP"+employeeID[j]]},{where: {Userid: employeeID[j], ProjectId: project.id}, transaction: t})
          }

          //GUARDA LOS PROVEEDORES
          await project.setProviders(proveedoresID, {transaction: t})

          //GUARDA LAS COTIZACIONES
          if(req.files.cotizaciones && req.files.cotizaciones[0]){
            if(req.body.agregarCotizacion != 'agregar'){
              const quotationsD = await models.Quotation.findAll({
                where:{
                  ProjectId:project.id
                },
                transaction:t
              })
              for( var j in quotationsD){
                fs.unlink('public/uploads/docs/' + quotationsD[j].quotation, (err) => {
                  if (err) {
                      console.log("failed to delete local image:" + err);
                  } else {
                      console.log('successfully deleted local image');
                  }
                });
                await quotationsD[j].destroy({transaction:t})
              }
            }
            for(var i in req.files.cotizaciones){
              await models.Quotation.create({
                ProjectId: project.id,
                quotation: req.files.cotizaciones[i].filename
              },{transaction: t})
            }
          }

          var layout

          //GUARDA LAS TAREAS
          if(project.ProTypeId && project.ProTypeId != layoutAntiguo){
            layout = await models.Pro_Type.findOne({where: {id: project.ProTypeId}, include: models.Tasks_Layout})

            for (const i in layout.Tasks_Layouts) {
              if (Object.hasOwnProperty.call(layout.Tasks_Layouts, i)) {
                const element = layout.Tasks_Layouts[i];
                const datosTask = {
                  ProjectId: project.id,
                  concept: element.concept
                }
                if(element.unit)
                  datosTask.unit = element.unit
                if(element.price)
                  datosTask.price = element.price
                if(element.description)
                  datosTask.description = element.description

                await models.Task.create(datosTask, {transaction: t})
              }
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
          var desc = "El usuario " + usuario.email + " ha editado un proyecto con los siguientes datos:\nnombre: " + project.name + "\nFecha de inicio: " + project.start_date + "\nFecha límite: " + project.deadline + "\nStatus: " + project.getDataValue('status')+
          "\nFecha de término: " + project.end_date + "\nColor: " + project.color + "\nObservaciones: " + project.observations + "\nContrato: " + project.contract

          //cotizaciones
          const cotizaciones = await models.Quotation.findAll({where: {ProjectId: project.id}, transaction: t})

          contadorCot = 0
          desc = desc + "\nCotizaciones: "
          for(var cot in cotizaciones){
            desc = desc + "\n\t" + cotizaciones[cot].id + ": " + cotizaciones[cot].quotation
            contadorCot++
          }

          //cliente
          if(project.ClientId){
            const cliente = await models.Client.findOne({where: {id: project.ClientId}, transaction: t})
            desc = desc + "\nCliente:\n\tid: " + cliente.id + "\n\temail: " + cliente.email
          }
          else
            desc = desc + "\nCliente: Sin cliente"

          if(contadorCot == 0)
            desc = desc + "Sin cotizaciones"

          //miembros
          const miembrosLog = await models.User.findAll({where: {id: employeeID}, transaction: t})

          desc = desc+"\nMiembros: "
          for(var miem in miembrosLog){
            desc = desc + "\n\t"+miembrosLog[miem].id+":\n\t\temail: " + miembrosLog[miem].email +
            "\n\t\tRol: "
            if(req.body["rol"+miembrosLog[miem].id])
              desc = desc + req.body["rol"+miembrosLog[miem].id]
            else
              desc = desc + "Sin rol"
            desc = desc + "\n\t\tPorcentaje: "
            if(req.body["rolP"+miembrosLog[miem].id])
              desc = desc + req.body["rolP"+miembrosLog[miem].id]
            else
              desc = desc + "Sin porcentaje"
          }

          //proveedores
          const proLog = await models.Provider.findAll({where: {id: proveedoresID}, transaction: t})

          contadorPro = 0
          desc = desc + "\nProveedores: "
          for(var pro in proLog){
            desc = desc + "\n\t" +  proLog[pro].id + ": " + proLog[pro].name
            contadorPro++
          }

          if(contadorPro == 0)
            desc = desc + "Sin proveedores"

          //tipo de proyecto
          if(layout){
            desc = desc + "\nLayout"+layout.id+": " + layout.name

            if(layout.Tasks_Layouts){
              for(var i in layout.Tasks_Layouts){
                desc = desc + "\n\tTarea " + layout.Tasks_Layouts[i].id + ":"
                + "\n\t\tConcepto: " + layout.Tasks_Layouts[i].concept
                + "\n\t\tDescripcion: " + layout.Tasks_Layouts[i].description
                + "\n\t\tUnidad: " + layout.Tasks_Layouts[i].unit
                + "\n\t\tPrecio: " + layout.Tasks_Layouts[i].price
              }
            }
            else{
              desc = desc + "\n\tSin tareas"
            }
          }
          else{
            desc = desc + "\nSin Layout"
          }

          //guardamos los datos del log
          var dataLog = {
              UserId: usuario.id,
              title: "Actualización de proyecto",
              description: desc
          }

          //guarda el log en la base de datos
          const log = await models.Log.create(dataLog, { transaction: t })

          //verifica que se hayan registrado el log y el rol
          if (!log)
              throw new Error()
          if (!project)
              throw new Error()

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

//AGREGAR PROYECTO
router.get('/agregar', isLoggedIn,async function (req, res, next) {

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
    if (usuario && usuario.Role && usuario.Role.Permissions && pC) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
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
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//VER EDITAR DOCUMENTACION
router.get('/documentacion/editar/:id', isLoggedIn,async function (req, res, next) {
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
    if (usuario && usuario.Role && usuario.Role.Permissions && pU) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
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
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//VER EDITAR PROYECTO
router.get('/editar/:id', isLoggedIn, async function (req, res, next) {

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
    if (usuario && usuario.Role && usuario.Role.Permissions && pU) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
      const project=await models.Project.findOne({
        where:{
          id: req.params.id
        },
        include:[{
          model: models.Project_Employee,
          include:{ model: models.User, include: models.Employee}
        },
        {
          model: models.Provider
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
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//VER LAYOUTS
router.get('/layouts', isLoggedIn,async function (req, res, next) {
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
    if (usuario && usuario.Role && usuario.Role.Permissions && pR) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
      const layouts=await models.Pro_Type.findAll({
        include: models.Tasks_Layout
      })
      res.render('layouts',{layouts});
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});

//CREAR LAYOUT
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

//VER EDITAR LAYOUT
router.get('/layout/editar/:id', isLoggedIn,async function (req, res, next) {
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
    if (usuario && usuario.Role && usuario.Role.Permissions && pU) {
      //TIENE PERMISO DE DESPLEGAR VISTA
      //obtiene todos los proyectos y se manda a la vista
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
    }
    else {
        //NO TIENE PERMISOS
        return res.render('error',{error: 403})
    }
  }
  catch (error) {
    console.log(error)
    return res.render('error',{error: 500})
  }
});


//EDITAR LAYOUT
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
      name: req.body.titulo
    }
    //EDITA EL LAYOUT
    const layout = await models.Pro_Type.findOne({
      where: { id: req.params.idLayout }, transaction: t
    })

    await layout.update(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha editado un layout con los siguientes datos:\nnombre: " + layout.name 

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
    return res.status(500).json([{ msg: 'No fue posible editar el layout, vuelva a intentarlo más tarde.' }])
  }
});

//Agregar tarea de layout
router.post('/layout/:layoutId/tarea/agregar',[
  check('concepto')
        .not().isEmpty().withMessage('Concepto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El concepto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('descripcion')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 500 caracteres.')
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
                where: { name: 'pc' }
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

//Editar tarea de layout
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
    var desc = "El usuario " + usuario.email + " ha editado una tarea para el layout de "+layout.name+" con los siguientes datos:\nConcepto: "+task.concept+"\nDescripción: "+ task.description+"\nUnidad: "+task.unit+"\nCosto: "+task.price 

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

//Eliminar tarea de layout
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
          title: "Eliminación de tarea de layout",
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

//Eliminar layout
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
      await t.rollback();
      return res.status(500).json([{ msg: 'No fue posible eliminar el layout, vuelva a intentarlo más tarde.' }])
  }
});

//Editar documentación de proyecto nombre y observaciones
router.post('/documentacion/:idProject/editar',[
  check('titulo')
        .not().isEmpty().withMessage('Nombre del proyecto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El nombre del proyecto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('observaciones')
        .not().isEmpty().withMessage('Observaciones es un campo requerido.')
        .isLength({ max: 255 }).withMessage('Observaciones puede tener un máximo de 255 caracteres.')
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
        return res.status(403).json([{ msg: 'No estás autorizado para editar proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para editar proyectos.' }])
  }
  //VAMOS A GUARDAR LOS DATOS
  const t = await models.sequelize.transaction()
  try{
    var datos = {
      name: req.body.titulo
    }
    if(req.body.observaciones)
      datos.observations = req.body.observaciones
    else
      datos.observations=null
    //EDITA EL LAYOUT
    const project = await models.Project.findOne({
      where: { id: req.params.idProject }, transaction: t
    })

    await project.update(datos, { transaction: t })

    //obtenemos el usuario que realiza la transaccion
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    //descripcion del log
    var desc = "El usuario " + usuario.email + " ha editado un proyecto con los siguientes datos:\nnombre: " + project.name+"\nObservaciones: "+project.observations 

    //guardamos los datos del log
    var dataLog = {
      UserId: usuario.id,
      title: "Actualización de proyecto",
      description: desc
    }

    //guarda el log en la base de datos
    const log = await models.Log.create(dataLog, { transaction: t })
    //verifica que se hayan registrado el log y el rol
    if (!log)
      throw new Error()
    if (!project)
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

//Agregar tarea de proyecto
router.post('/documentacion/:projectId/tarea/agregar',[
  check('concepto')
        .not().isEmpty().withMessage('Concepto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El concepto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('descripcion')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 500 caracteres.')
        .trim()
        .escape(),
  check('cantidad')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Sólo se aceptan números en el campo Cantidad')
        .isLength({ max: 10 }).withMessage('La Unidad puede tener un máximo de 16 dígitos.')
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
        .isLength({ max: 10 }).withMessage('La Unidad puede tener un máximo de 10 dígitos.')
        .trim()
        .escape(),
  check('realizado')
        .optional({ checkFalsy: true })
        .isNumeric()
        .trim()
        .escape()
  ], isLoggedIn, async function (req, res, next) {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).send(errors.array());
    }
  try {
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
        return res.status(403).json([{ msg: 'No estás autorizado para registrar tareas en proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para registrar tareas en proyectos.' }])
  }
  const t = await models.sequelize.transaction()
  try{
    const project = await models.Project.findOne({
      where: {
          id: req.params.projectId
      },
      transaction: t
    })
    if(!project){
      await t.rollback();
      return res.status(404).json([{ msg: 'No existe el proyecto al que se desea asignar la tarea.' }])
    }
    var datos = {
      ProjectId: req.params.projectId,
      concept: req.body.concepto,
    }
    if(req.body.descripcion)
      datos.description=req.body.descripcion
    if(req.body.unidad)
      datos.unit= req.body.unidad
    if(req.body.costo)
      datos.price= req.body.costo
    if(req.body.cantidad)
      datos.units=req.body.cantidad
    if(req.body.realizado)
      datos.check=req.body.realizado
    else
      datos.check=0
    //GUARDA LA TAREA
    const task = await models.Task.create(datos, { transaction: t })
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })
    var desc = "El usuario " + usuario.email + " ha registrado una tarea nueva en el proyecto de "+project.name+" con los siguientes datos:\nConcepto: "+task.concept+"\nDescripción: " + task.description+"\nUnidad: "+task.unit+"\nCosto: "+task.price+"\nCantidad: "+task.units+"\nRealizado: "+task.check 

    var dataLog = {
      UserId: usuario.id,
      title: "Registro de tarea de proyecto",
      description: desc
    }
    const log = await models.Log.create(dataLog, { transaction: t })
    if (!log)
      throw new Error()
    if (!task)
      throw new Error()
    res.status(200).json(task);
    await t.commit()
  }
  catch(error){
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible registrar la tarea, vuelva a intentarlo más tarde.' }])
  }
});

//Editar tarea de proyecto
router.post('/documentacion/:projectId/tarea/editar/:taskId',[
  check('concepto')
        .not().isEmpty().withMessage('Concepto es un campo requerido.')
        .isLength({ max: 255 }).withMessage('El concepto puede tener un máximo de 255 caracteres.')
        .trim()
        .escape(),
  check('descripcion')
        .optional({ checkFalsy: true })
        .isLength({ max: 500 }).withMessage('La descripción puede tener un máximo de 500 caracteres.')
        .trim()
        .escape(),
  check('cantidad')
        .optional({ checkFalsy: true })
        .isNumeric().withMessage('Sólo se aceptan números en el campo Cantidad')
        .isLength({ max: 10 }).withMessage('La Unidad puede tener un máximo de 16 dígitos.')
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
  check('realizado')
        .optional({ checkFalsy: true })
        .isNumeric()
        .trim()
        .escape()
  ], isLoggedIn, async function (req, res, next) {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).send(errors.array());
    }
  try {
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
        return res.status(403).json([{ msg: 'No estás autorizado para editar tareas de proyectos.' }])
    }
  }
  catch (error) {
    return res.status(403).json([{ msg: 'No estás autorizado para editar tareas de proyectos.' }])
  }
  const t = await models.sequelize.transaction()
  try{
    const project = await models.Project.findOne({
      where: {
          id: req.params.projectId
      },
      transaction: t
    })
    if(!project){
      await t.rollback();
      return res.status(404).json([{ msg: 'No existe el proyecto al que se desea editar la tarea.' }])
    }
    const task = await models.Task.findOne({
      where: {
          id: req.params.taskId,
          ProjectId:req.params.projectId
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
    if(req.body.cantidad)
      datos.units=req.body.cantidad
    else
      datos.units=null
    if(req.body.realizado)
      datos.check=req.body.realizado
    else
      datos.check=0
    await task.update(datos, { transaction: t })
    const usuario = await models.User.findOne({
      where: {
          id: req.user.id
      },
      transaction: t
    })

    var desc = "El usuario " + usuario.email + " ha editado una tarea del proyecto "+project.name+" con los siguientes datos:\nConcepto: "+task.concept+"\nDescripción: "+ task.description+"\nUnidad: "+task.unit+"\nCosto: "+task.price+"\nCantidad: "+task.units+"\nRealizado: "+task.check

    var dataLog = {
      UserId: usuario.id,
      title: "Edición de tarea de layout",
      description: desc
    }
    const log = await models.Log.create(dataLog, { transaction: t })
    if (!log)
      throw new Error()
    if (!task)
      throw new Error()
    res.status(200).json(task);
    await t.commit()
  }
  catch(error){
    console.log(error)
    await t.rollback();
    return res.status(500).json([{ msg: 'No fue posible editar la tarea, vuelva a intentarlo más tarde.' }])
  }
});

//Eliminar tarea de proyecto
router.post('/documentacion/:projectId/tarea/eliminar/:taskId', isLoggedIn, async (req, res, next) => {
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
          //NO TIENE PERMISOS
          return res.status(403).json([{ msg: 'No tienes permiso de eliminar tareas de proyectos.' }])
      }
  }
  catch (error) {
      return res.status(403).json([{ msg: 'No tienes permiso de eliminar tareas de proyectos.' }])
  }
  const t = await models.sequelize.transaction()
  try {
      const task = await models.Task.findOne({where: { id: req.params.taskId,ProjectId: req.params.projectId },transaction: t})
      if(!task){
        await t.rollback();
        return res.status(404).json([{ msg: 'No existe la tarea que se desea eliminar.' }])
      }
      const project = await models.Project.findOne({where: { id: req.params.projectId },transaction: t})
      await task.destroy({ transaction: t })
      const usuario = await models.User.findOne({where: {id: req.user.id},transaction: t})
      var dataLog = {
          UserId: usuario.id,
          title: "Eliminación de tarea de proyecto",
          description: "El usuario " + usuario.email + " ha eliminado la tarea " + task.concept+" del proyecto "+project.name
      }
      const log = await models.Log.create(dataLog, { transaction: t })
      const verTask = await models.Task.findOne({ where: { id: task.id }, transaction: t })
      if (verTask)
          throw new Error()
      if (!log)
          throw new Error()
      res.status(200).json([{ status: 200 }]);
      await t.commit()
  } catch (error) {
      await t.rollback();
      return res.status(500).json([{ msg: 'No fue posible eliminar la tarea, vuelva a intentarlo más tarde.' }])
  }
});

//////////////////////Página de ERROR hay que borrarla :v
router.get('/error', isLoggedIn, async function(req, res, next) {
  var error = 404;
  res.render('error', {error});
});

module.exports = router;