'use strict';

const metodos = require('./funciones')
    // cargar el módulo para bases de datos SQLite
    var sqlite3 = require('sqlite3').verbose();

    // Abrir nuestra base de datos
    var db = new sqlite3.Database(
        'prueba.db', // nombre del fichero de base de datos
        function(err) { // funcion que será invocada con el resultado
            if (err) // Si ha ocurrido un error
                console.log(err); // Mostrarlo por la consola del servidor
            }
        );



    const express = require('express');
    const server = express();
    const port = 8080;
    const crypto = require('crypto');

    // Cargamos el modulo
    const session = require('express-session');

    // Obtener la referencia al módulo 'body-parser'
    const bodyParser = require('body-parser');
    // Configuring express to use body-parser as middle-ware.
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());





    // Obtener el configurador de rutas
    const router = express.Router();

    // Configurar la accion asociada al login
    router.post('/login', function(req, res) {
    // Comprobar si la petición contiene los campos ('email' y 'passwd')
        if (!req.body.email || !req.body.passwd) {
            res.json({ errormsg: 'Peticion mal formada'});
            return;
        }
    // La petición está bien formada -> procesarla
    // TODO: procesar la peticón
    metodos.processLogin(req, res, db);
    });

    router.post('/auth', function(req, res) {
        if(req.body.token) {
            metodos.verifyToken(req, res, db);
        } else {
            res.json({ errormsg: 'No se ha añadido un Token'})
        }
    });

    // Añadir las rutas al servidor
    server.use('/', router);


    // Añadir las rutas estáticas al servidor.
    server.use(express.static('.'));


    //SQL 




    server.listen(port, () => {
    console.log('Servidor corriendo en el puerto:'+ port);
    });