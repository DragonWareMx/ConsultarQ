module.exports = {
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            if(req.user.status === 'active')
                return next();
            else
                res.redirect('/logout')
        }
        //res.status(500).json([{msg: 'Ocurrió un error al intentar registrar el usuario.'}])
        return res.redirect('/login');
    },
    isNotLoggedIn (req, res, next) {
        if (!req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/inicio');
    }
};