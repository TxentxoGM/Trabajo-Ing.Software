function processLogin(req, res, db){
    let email = req.body.email;
    let passwd = String(req.body.passwd);

    console.log(email);

    db.get('SELECT * FROM users WHERE email=?', email, function(err, row) 
        {
            if (row == undefined) {
                res.json({ errormsg: 'El usuario no existe'});
            } else if (row.password === passwd) {
                // La contraseña es correcta
                
                var jwt = require('jsonwebtoken');
                const crypto = require('crypto');

                const token = jwt.sign(
                    {email: row.email, role: row.role},
                    'secreto'
                )
                const output = {"usuario": {"nombre": row.name, "correo": row.email, "rol": row.role}, "token": token};
                
                // Comprobación del token
                const rol = verifyToken(token);
                if(rol == 'ADMIN'){
                    console.log("El usuario es Admin");
                } else if(rol == 'USER'){
                    console.log("El usuario no es admin");
                } else if(rol = false){
                    console.log('Token no válido');
                }

            // enviar en la respuesta serializado en formato JSON
            return res.json(output);
            } else {
                // La contraseña no es correcta -> enviar este otro mensaje
                res.json({ errormsg: 'Fallo de autenticación'});
            }
        }
    );
}


// Verifica el token
function verifyToken(token){
    const crypto = require('crypto');
    var jwt = require('jsonwebtoken');
    
    var email = jwt.decode(token).email;

    const decoded = jwt.verify(token, email);
    if(decoded == undefined) {
        return false;
    } else if(decoded) {
        const role = decoded.role;
        return role;
    }
}

module.exports = {processLogin, verifyToken}
