'use strict';

// cargar el módulo para bases de datos SQLite
var sqlite3 = require('sqlite3').verbose();

// Abrir nuestra base de datos
var db = new sqlite3.Database(
    'prueba.db', // nombre del fichero de base de datos
    function (err) { // funcion que será invocada con el resultado
        if (err) // Si ha ocurrido un error
            console.log(err); // Mostrarlo por la consola del servidor
    }
);



const express = require('express');
const server = express();
const port = 8080;
const jwt = require('jsonwebtoken');

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
                row.email
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

router.post('/auth', function (req, res) {
    if (req.body.token) {
        const result = verifyToken(req, res, db);
        res.json({result});
    } else {
        res.json({ errormsg: 'No se ha añadido un Token' })
    }
});

// Verifica el token
function verifyToken(token) {
    // Palabra secreta para verificar la firma
    var email = jwt.decode(token).email;

    // Verificamos la firma y guardamos los datos en decoded
    const decoded = jwt.verify(token, email);

    // Devuelve false si hay un error al verificar la firma
    // Devulve el rol si se verifica la firma del token
    if (decoded == undefined) {
        return false;
    } else if (decoded) {
        const role = decoded.role;
        return role;
    }
}

// Añadir las rutas al servidor
server.use('/', router);


// Añadir las rutas estáticas al servidor.
server.use(express.static('.'));


//SQL 




server.listen(port, () => {
    console.log('Servidor corriendo en el puerto:' + port);
});
