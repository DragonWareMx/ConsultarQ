const express = require('express');
const router = express.Router();

router.get('/login',(req,res,next) => {
    res.render('login', { title: 'Iniciar sesión' });
});

router.post('/login',(req,res) =>{
    
});

module.exports = router;