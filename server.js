'use strict';

// cargar el módulo para bases de datos SQLite
var sqlite3 = require('sqlite3').verbose();

// Abrir nuestra base de datos
var db = new sqlite3.Database(
    'BBDD.db', // nombre del fichero de base de datos
    function (err) { // funcion que será invocada con el resultado
        if (err) // Si ha ocurrido un error
            console.log(err); // Mostrarlo por la consola del servidor
    }
);

const express = require('express');
const server = express();
const port = 8080;
const jwt = require('jsonwebtoken');
// Necesario para leer del archivo .env
require('dotenv').config();

// Obtener la referencia al módulo 'body-parser'
const bodyParser = require('body-parser');
// Configuring express to use body-parser as middle-ware.
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());


// Obtener el configurador de rutas
const router = express.Router();

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
    const decoded = jwt.verify(TokenArray[1], process.env.SECRET_KEY);

    // Devuelve false si hay un error al verificar la firma
    // Devulve el rol si se verifica la firma del token
    if (decoded == undefined) {
        return false;
    } else if (decoded) {
        const role = decoded.role;
        return role;
    }
}

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




// Añadir las rutas al servidor
server.use('/', router);


// Añadir las rutas estáticas al servidor.
server.use(express.static('.'));


//SQL 




server.listen(port, () => {
    console.log('Servidor corriendo en el puerto:' + port);
});