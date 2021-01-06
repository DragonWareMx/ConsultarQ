const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//sequelize models
const models = require('../models/index');

//AQUI SE DEFINE LA AUTENTICACIÓN DE USUARIO DEL PROGRAMA

//encriptacion
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {

    models.User.findOne({
        where: {
            email: email, status: 'active'
        }
    }).then(async (user) => {
        if (!user) {
            return done(null, false, req.flash('message', 'El usuario no existe.'))
        }

        const isValidPassword = await helpers.matchPassword(password, user.password)

        if (!isValidPassword) {
            return done(null, false, req.flash('message', 'Contraseña incorrecta.'))
        }

        var userinfo = user.get();
        return done(null, userinfo, req.flash('success', 'Bienvenido ' + user.name))

    }).catch(function (err) {
        console.log("Error:", err);

        return done(null, false, req.flash('message', 'Algo ocurrió al intentar ingresar.'));

    });
    /*const rows = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0 ){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);
        if (validPassword){
            console.log('si esta bien la contra');
            done(null, user, req.flash('success','Bienvenido' + user.name));
        }else{
            console.log('No esta bien la contra');
            done(null, false, req.flash('message','Contraseña incorrecta'));
        }
    } else{
        console.log('Ni si quiera existe ese usuario perro');
        done(null, false, req.flash('message','El correo no existe'));
    }*/
}));

//REGISTRO DE USUARIO
passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {

//VERIFICACION DE CORREO NO REPETIDO
    //busca un usuario con el correo ingresado
    models.User.findOne({
        where: {
            email: email
        }
    }).then(async (user) => {
        //si existe entonces no se puede registrar el nuevo usuario, pues se repiten los correos
        if (user) {
            return done(null, false, [{ msg: 'Ya existe un usuario con el mismo correo.' }]);
        } else {
//REGISTRO DE NUEVO USUARIO
            //encriptacion de la password
            const userPassword = await helpers.encryptPassword(password)

            //Transaccion
            const t = await models.sequelize.transaction()
            try {
                //verificamos que exista el rol
                var rolName

                if(req.body.role){
                    if(req.body.role == 0){
                        req.body.role = null
                        rolName = "Sin rol"
                    }
                    else{
                        const rol = await models.Role.findOne({
                            where: {
                                id: req.body.role
                            },
                            transaction: t
                        })

                        //si el roll no existe ROLLBACK
                        if(!rol)
                            throw new Error()
                        else
                            rolName = rol.name
                    }
                }
                else
                    rolName = "Sin rol"

                //Guarda los datos del usuario en data
                var data;

                if (req.file) {
                    data =
                    {
                        email: email,
                        password: userPassword,
                        picture: req.file.filename,
                        RoleId: req.body.role
                    }
                }
                else{
                    data =
                    {
                        email: email,
                        password: userPassword,
                        RoleId: req.body.role
                    }
                }

                //guarda el usuario en la base de datos
                const newUser = await models.User.create(data, { transaction: t })

                //si no existe el id del usuario nuevo entonces ocurrio un problema, ROLLBACK
                if (!newUser.id || newUser.id == '')
                    throw new Error();

                //Guarda los datos del empleado
                var dataEmployee;

                if(!isNaN(Date.parse(req.body.hiring_date))){
                    dataEmployee = {
                        name: req.body.name,
                        phone_number: req.body.phone_number,
                        city: req.body.city,
                        state: req.body.state,
                        suburb: req.body.suburb,
                        street: req.body.street,
                        int_number: req.body.int_number,
                        ext_number: req.body.ext_number,
                        hiring_date: req.body.hiring_date,
                        UserId: newUser.id
                    }
                }
                else{
                    dataEmployee = {
                        name: req.body.name,
                        phone_number: req.body.phone_number,
                        city: req.body.city,
                        state: req.body.state,
                        suburb: req.body.suburb,
                        street: req.body.street,
                        int_number: req.body.int_number,
                        ext_number: req.body.ext_number,
                        UserId: newUser.id
                    }
                }

                //guarda el empleado en la base de datos
                const employee = await models.Employee.create(dataEmployee, { transaction: t });

//SE REGISTRA EL LOG
                //obtenemos el usuario que realiza la transaccion
                const usuario = await models.User.findOne({
                    where: {
                        id: req.user.id
                    },
                    transaction: t
                })

                //guardamos los datos del log
                var dataLog = {
                    UserId: usuario.id,
                    title: "Registro de usuario",
                    description: "El usuario "+usuario.email+" ha registrado un usuario nuevo con los siguientes datos:\nEmail: "+newUser.email+"\nRol: "+rolName+"\nNombre: "+employee.name+"\nNúmero telefónico: "+employee.phone_number+"\nCiudad: "+employee.city+"\nEstado: "+employee.state+"\nColonia: "+employee.suburb+"\nCalle: "+employee.street+"\nNúmero interior: "+employee.int_number+"\nNúmero exterior: "+employee.ext_number+"\nFecha de contratación: "+employee.hiring_date
                }

                //guarda el log en la base de datos
                const log = await models.Log.create(dataLog, { transaction: t });

                //nos aseguramos que se hayan guardado correctamente el log, el usuario y el empleado
                if(!log)
                    throw new Error()
                if (!employee)
                    throw new Error()
                if (!newUser) {
                    throw new Error()
                }
                else {
                    // If the execution reaches this line, no errors were thrown.
                    // We commit the transaction.
                    await t.commit()

                    return done(null, newUser)
                }
            } catch (error) {

                // If the execution reaches this line, an error was thrown.
                // We rollback the transaction.
                await t.rollback();
                return done(new Error, false);
            }
        }
    });

    /*let newUser = null;

    // Saving in the Database
    models.User.create({
        email: req.body.email,
        password: password,
        name: req.body.name
    }).then( user => {
      console.log(user);
      newUser = user;
      console.log(newUser)
    });

    return done(null, newUser);*/
}
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    /*const rows = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);*/
    models.User.findOne({
        where: { id: id }
    }).then(function (user) {
        if (user) {
            done(null, user.get());
        } else {
            done(user.errors, null);
        }
    });
});