'use strict';

// const metodos = require('./funciones')
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

    const jwt = require('jsonwebtoken');
    // Necesario para leer del archivo .env
    require('dotenv').config();

    // Obtener la referencia al módulo 'body-parser'
    const bodyParser = require('body-parser');
const { header } = require('express/lib/request');
    // Configuring express to use body-parser as middle-ware.
    server.use(bodyParser.urlencoded({ extended: false }));
    server.use(bodyParser.json());


    // Obtener el configurador de rutas
    const router = express.Router();


/*
------------------------------------------------------------------
                SECCIÓN DE LOGIN
------------------------------------------------------------------
*/

// Configurar la accion asociada al login
router.post('/login', function (req, res) {
    // Comprobar si la petición contiene los campos ('email' y 'passwd')
    if (!req.body.email || !req.body.passwd) {
        res.json({ errormsg: 'Peticion mal formada' });
        return;
    }

    // La petición está bien formada -> procesarla
    let email = req.body.email;
    let passwd = String(req.body.passwd);

    console.log('Loggeando: ' + email);

    db.get('SELECT * FROM users WHERE email=?', email, function (err, row) {
        if (row == undefined) {
            res.json({ errormsg: 'El usuario no existe' });
        } else if (row.password === passwd) {
            // La contraseña es correcta

            // Creo el token
            const token = jwt.sign(
                { nombre: row.name, email: row.email, role: row.role },
                process.env.SECRET_KEY
            )

            // Lo que devuelve el servidor
            const output = { "usuario": { "nombre": row.name, "correo": row.email, "rol": row.role }, "token": token };

            // enviar en la respuesta serializado en formato JSON
            return res.json(output);
        } else {
            // La contraseña no es correcta -> enviar este otro mensaje
            res.json({ errormsg: 'Fallo de autenticación' });
        }
    }
    );
});


// Verifica el token
function verifyToken(token) {
    // Se realiza una petición sin token
    if (token == undefined) return;

    let TokenArray = token.split(" ");

    // Verificamos la firma y guardamos los datos en decoded
    let decoded = jwt.verify(TokenArray[1], process.env.SECRET_KEY);

    // Devuelve false si hay un error al verificar la firma
    // Devulve el rol si se verifica la firma del token
    if (decoded == undefined) {
        return false;
    } else if (decoded) {
        let role = decoded.role;
        return role;
    }
}

// Petición para cerrar sesión
// router.put('/logout', function (req, res) {
//     sessionStorage.removeItem('admin_Token');
//     res.redirect('/');

// });
/*
------------------------------------------------------------------
                CRUD USUARIOS
------------------------------------------------------------------
*/


function getUserByItsId(db, res, id){
    db.get('SELECT * FROM users WHERE role = "USER" AND id=?', id,
    function (err, row){
        if(err) res.json({errormsg: 'Se ha producido un error'});
        else if(row == undefined) res.json({res: 'No se encontró al usuario'});
        else res.json(row);
    }

    )
}

// Obtener los usuarios con el rol "USER".
// Si la petición no tienen query param, se asume que se recogerán los 10 primeros usuarios
router.get('/usuarios', function (req, res) {

    if(verifyToken(req.headers.authorization) == 'USER' || verifyToken(req.headers.authorization) == 'ADMIN'){
        if(!req.query.desde || !req.query.limite){
            req.query.desde = 0;
            req.query.limite = 10;
        }
    
        db.all(
            'SELECT * FROM users WHERE role = "USER" ORDER BY id ASC LIMIT ?,?', [req.query.desde, req.query.limite],
            function (err, data){
                if(err) res.json({errormsg: 'Se ha producido un error'});
                else res.json({total: data.length, usuarios:data});
            }
        )

    }else{
        res.json({errormsg: 'No tiene suficientes permisos'});
    }
});


router.get('/usuarios/:id', function(req, res){

    if(verifyToken(req.headers.authorization) == 'ADMIN'){
        if(!req.params.id) res.json({errormsg: 'No ha introducido todos los datos'})
        else getUserByItsId(db, res, req.params.id);

    }else res.json({errormsg: 'No tiene suficientes permisos'});
        
    
});


router.post('/usuarios', function(req, res){

    if(verifyToken(req.headers.authorization) == 'ADMIN'){
        let checkEmail = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if(!req.body.name || !req.body.email || !req.body.password) res.json({errormsg: 'No ha introducido todos los datos'})
        else if(!checkEmail.test(req.body.email)) res.json({errormsg: 'No se ha introducido ningún email'})
        else db.run('INSERT INTO users(name, email, password) VALUES (?, ?, ?)', [req.body.name, req.body.email, req.body.password],
        function(err){
            if (err) res.json({errormsg: 'Se ha producido un error'});
            else getUserByItsId(db, res, this.lastID)
        })

    }else  res.json({errormsg: 'No tiene suficientes permisos'});
});


router.put('/usuarios/:id', function(req, res){
    if(verifyToken(req.headers.authorization) == 'ADMIN'){

        if(!req.params.id) res.json({errormsg: 'No ha introducido todos los datos'})
            else db.run('UPDATE users SET name= ? WHERE id=?', [req.body.name, req.params.id],
            function(err){
                if (err) res.json({errormsg: 'Se ha producido un error'});
                else getUserByItsId(db, res, req.params.id);
            })

    }else  res.json({errormsg: 'No tiene suficientes permisos'});
});


router.delete('/usuarios/:id', function (req, res) {

    if(verifyToken(req.headers.authorization) == 'ADMIN'){

        if(!req.params.id) res.json({errormsg: 'No ha introducido todos los datos'})
        else db.run('DELETE FROM users WHERE role = "USER" AND id=?', req.params.id,
            function (err){
                if(err) res.json({errormsg: 'Se ha producido un error'});
                else res.json({res: 'Success'});
            }
        )

    }else  res.json({errormsg: 'No tiene suficientes permisos'});
});




/*
------------------------------------------------------------------
                CRUD CATEGORÍAS
------------------------------------------------------------------
*/


        router.get('/categories',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN' || verifyToken(req.headers.authorization) == 'USER'){

            db.all('SELECT * FROM categories', function(err, content) 
            {
                if(content.length == 0){
                    res.json({ errormsg: 'No hay categorías actualmente en la base de datos.'});
                }else{
                    res.json(content);
                }
            }
            );
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });


        router.post('/categories',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let name = req.body.name;
            console.log(name);
                db.run('INSERT INTO categories (name) VALUES (?)', name, function(err, content) 
                {
                    if(err){
                        res.json({ errormsg: 'La categoría ya existe en la base de datos.'});
                    }else{
                        let mensaje = 'La categoría ['+ name + '] ha sido añadida correctamente.';
                        res.json({ res: mensaje});
                    }
                });
            }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });

        router.put('/categories',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let id = req.body.id;
            let name = req.body.name;
            db.get('SELECT * FROM categories WHERE id=?',id, function(err, row) 
            {
                if(row == undefined){
                    res.json({ errormsg: 'La categoría seleccionada no existe en la base de datos.'});
                }
                else{
                    db.run("UPDATE categories SET name=? WHERE id=?",[name,id],function(err,rows){
                        if(err){
                            res.json({ errormsg: 'Ya existe una categoría con el nombre introducido.'});
                        }else{
                            let mensaje = 'La categoría se ha renombrado a [' + name + '].';
                            res.json({ res: mensaje});
                        }
                    }
                    );
                }
                });
            }else  res.json({errormsg: 'No tiene suficientes permisos'});
            });


    
        router.delete('/categories/:id',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let id = req.params.id;

            db.get('SELECT * FROM categories WHERE id=?',id, function(err, row) 
            {
                if(row == undefined){
                    res.json({ errormsg: 'La categoría seleccionada no existe.'});
                }else{
                    db.run("DELETE FROM categories WHERE id=?",id,function(err,rows){
                        let mensaje = 'La categoría con identificador ' + id + ' ha sido eliminada correctamente.';
                        res.json({ res: mensaje});
                    });
                }
            });
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });





/*
------------------------------------------------------------------
                CRUD VIDEOS
------------------------------------------------------------------
*/

        router.get('/videos',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            db.all('SELECT * FROM videos', function(err, content) 
            {
                if(content.length == 0){
                    res.json({ errormsg: 'No hay videos actualmente en la base de datos.'});
                }else{
                    res.json(content);
                }
            });
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });



        router.get('/videos/:category_id',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN' || verifyToken(req.headers.authorization) == 'USER'){
            let category_id = req.params.category_id;
            db.all('SELECT * FROM videos WHERE id_category=?', category_id, function(err, content) 
            {
                if(content.length == 0){
                    res.json({ errormsg: 'No hay videos actualmente para la categoría seleccionada.'});
                }else{
                    res.json(content);
                }
            });
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });


        router.post('/videos',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let id_category = req.body.id_category;
            let name = req.body.name;
            let url = req.body.url;
            db.run('INSERT INTO videos (id_category,name,url) VALUES (?,?,?)', [id_category,name,url], function(err, content) 
            {
                if(err){
                    res.json({ errormsg: 'El video ya existe en la base de datos.'});
                }else{
                    let mensaje = 'El video ['+ name + '] ha sido añadido correctamente.';
                    res.json({ res: mensaje});
                }
            });   
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });


        router.put('/videos',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let id = req.body.id;
            let id_category = req.body.id_category;
            let name = req.body.name;
            let url = req.body.url;
            let inputData = [id_category,name,url, id];

            db.get('SELECT * FROM videos WHERE id=?',id, function(err, row) 
            {
                if(row == undefined){
                    res.json({ errormsg: 'El video seleccionado no existe en la base de datos.'});
                } else{
                    db.run("UPDATE videos SET id_category=?, name=?, url=? WHERE id=?",inputData,function(err,rows){
                        console.log(err);
                        console.log(rows);
                        if(err){
                            res.json({ errormsg: 'El video ya existe para la categoría introducida.'});
                        }else{
                            let mensaje = 'El video con identificador '+ id + ' ha sido modificado correctamente.';
                            res.json({ res: mensaje});
                        }
                    });
                }
            });
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });



        router.delete('/videos/:id',function (req, res) {
            if(verifyToken(req.headers.authorization) == 'ADMIN'){
            let id = req.params.id;
            db.get('SELECT * FROM videos WHERE id=?',id, function(err, row) 
            {
                if(row == undefined){
                    res.json({ errormsg: 'El video seleccionado no existe.'});
                }else{
                    db.run("DELETE FROM videos WHERE id=?",id,function(err,rows){
                        let mensaje = 'El video con identificador ' + id + ' ha sido eliminado correctamente.';
                        res.json({ res: mensaje});
                    });
                }
            });
        }else  res.json({errormsg: 'No tiene suficientes permisos'});
        });



    // Añadir las rutas al servidor
    server.use('/', router);


    // Añadir las rutas estáticas al servidor.
    server.use(express.static('.'));


    //SQL 




    server.listen(port, () => {
    console.log('Servidor corriendo en el puerto:'+ port);
    });