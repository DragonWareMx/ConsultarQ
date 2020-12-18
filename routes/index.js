var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  //res.render('index', { title: 'Express' });
  res.redirect("/inicio");
});

/* prueba */
router.get('/menu', function (req, res, next) {
  res.render('main', { title: 'Express' });
  //res.redirect("/inicio");
});

module.exports = router;
