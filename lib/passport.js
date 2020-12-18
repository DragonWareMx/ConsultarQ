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

passport.use('local.signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, email, password, done) => {

    models.User.findOne({
        where: {
            email: email
        }
    }).then(async (user) => {

        if (user) {
            return done(null, false, req.flash('message', 'Ya existe un usuario con el mismo email.'));
        } else {
            //encriptacion de la password
            const userPassword = await helpers.encryptPassword(password)

            //Transaccion
            const t = await models.sequelize.transaction()
            try {

                //Guarda el usuario en la bd
                var data =
                {
                    email: email,
                    password: userPassword,
                }

                if (req.file) {
                    data =
                    {
                        email: email,
                        password: userPassword,
                        picture: req.file.filename
                    }
                }

                const newUser = await models.User.create(data, { transaction: t })

                //si no existe el id del usuario nuevo entonces ocurrio un problema, ROLLBACK
                if (!newUser.id || newUser.id == '')
                    throw new Error();

                //Guarda el empleado
                var dataEmployee = {
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

                const employee = await models.Employee.create(dataEmployee, { transaction: t });

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
                return done(null, false, req.flash('message', 'Algo ocurrió al intentar ingresar.'));
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