'use strict';

const metodos = require('./funciones')
    // cargar el módulo para bases de datos SQLite
    var sqlite3 = require('sqlite3').verbose();

    // Abrir nuestra base de datos
    var db = new sqlite3.Database(
        'BBDD.db', // nombre del fichero de base de datos
        function(err) { // funcion que será invocada con el resultado
            if (err) // Si ha ocurrido un error
                console.log(err); // Mostrarlo por la consola del servidor
            }
        );



    const express = require('express');
    const server = express();
    const port = 8080;

    // Cargamos el modulo
    const session = require('express-session');
    // Creamos el objeto con la configuración
    var sess = {
        secret: 'keyboard cat',
        cookie: {}
      };
    // Se le dice al servidor que use el modulo de sesiones con esa configuracion
    server.use(session(sess));


    // Obtener la referencia al módulo 'body-parser'
    const bodyParser = require('body-parser');
    // Configuring express to use body-parser as middle-ware.
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());





    // Obtener el configurador de rutas
    const router = express.Router();


    //   Sección gestionada por Francisco Sarabia
    
        // // Configurar la accion asociada al login
        // router.post('/login', function(req, res) {
        // // Comprobar si la petición contiene los campos ('email' y 'passwd')
        //     if (!req.body.email || !req.body.passwd) {
        //         res.json({ errormsg: 'Peticion mal formada'});
        //         return;
        //     }
        // // La petición está bien formada -> procesarla
        // // TODO: procesar la peticón
        // metodos.processLogin(req, res, db);

        // });




        // Funciones utilizadas por el administrador

        // Configurar la accion asociada a la petición del contenido de la tabla de videos
        router.get('/admin/videos/:category_id',function (req, res) {
            metodos.getVideosFromCategory(req, res, db); 
        });

        router.get('/admin/videos',function (req, res) {
            metodos.getVidsCategories(req, res, db); 
        });

        router.post('/admin/videos/addVideo',function (req, res) {
            metodos.addVideo_Admin(req, res, db);    
        });

        router.post('/admin/videos/modifyVideo',function (req, res) {
            metodos.modifyVideo_Admin(req, res, db);   
        });

        router.get('/admin/videos/delete/:id',function (req, res) {
            metodos.deleteVideo_Admin(req, res, db);  
        });

        // Funciones utilizadas por un usuario genérico

        router.get('/videos/:category_id',function (req, res) {
            metodos.getVideosFromCategory(req, res, db); 
        });

        router.get('/videos',function (req, res) {
            metodos.getVidsCategories(req, res, db); 
        });







    // Añadir las rutas al servidor
    server.use('/', router);


    // Añadir las rutas estáticas al servidor.
    server.use(express.static('.'));


    //SQL 




    server.listen(port, () => {
    console.log('Servidor corriendo en el puerto:'+ port);
    });