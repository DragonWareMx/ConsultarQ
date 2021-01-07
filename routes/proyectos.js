var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/activos', isLoggedIn,async function (req, res, next) {
  const proyectos = await models.Project.findAll()
  res.render('proyectos', {proyectos});
});

router.get('/documentacion', isLoggedIn,function (req, res, next) {
  res.render('documentacion'); 
});

router.get('/documentacion/editar/1', isLoggedIn,function (req, res, next) {
  res.render('editarDocumentacion'); 
});

router.get('/layouts', isLoggedIn,function (req, res, next) {
  res.render('layouts');
});

router.get('/layout/editar/1', isLoggedIn,function (req, res, next) {
  res.render('editarLayout');
});

router.post('/layout/nuevo', isLoggedIn,function (req, res, next) {
  
});
  

module.exports = router;