

// FUNCIÓN GESTIONADA POR FRANCISCO SARABIA

// function processLogin(req, res, db){
//     let email = req.body.email;
//     let passwd = String(req.body.passwd);

//     db.get('SELECT * FROM users WHERE email=?', email, function(err, row) 
//         {

//             if (row == undefined) {
//                 res.json({ errormsg: 'El usuario no existe'});
//             } else if (row.password === passwd) {
//                 // La contraseña es correcta
//                 // Asociar el userID a los datos de la sesión
//                 req.session.userID = row.id; // solo el id del usuario registrado
//                 // Preparar los datos a enviar al navegador (AngularJS)
//                 var data = {
//                     id: row.id,
//                     name: row.name,
//                     email: row.email,
//                     role: row.role
                    
//                 };
//             // enviar en la respuesta serializado en formato JSON
//             res.json(data);
//             } else {
//                 // La contraseña no es correcta -> enviar este otro mensaje
//                 res.json({ errormsg: 'Fallo de autenticación'});
//             }
//         }
//     );
// }

function getVideosFromCategory(req,res,db){
    let category_id = req.params.category_id;
    db.all('SELECT * FROM videos WHERE id_category=?', category_id, function(err, content) 
    {
            res.json(content);
    }
    );
}

function getVidsCategories(req,res,db){
    db.all('SELECT * FROM categories', function(err, content) 
    {
            res.json(content);
    }
    );
}

function addVideo_Admin(req,res,db){
    let id_category = req.body.id_category;
    let name = req.body.name;
    let url = req.body.url;

    db.run('INSERT INTO videos (id_category,name,url) VALUES (?,?,?)', [id_category,name,url], function(err, content) 
    {
            res.json(content);
    }
    );
}

function modifyVideo_Admin(req,res,db){
    let id = req.body.id;
    let id_category = req.body.id_category;
    let name = req.body.name;
    let url = req.body.url;

    var inputData = [id_category,name,url, id];

db.run("UPDATE videos SET id_category=?, name=?, url=? WHERE id=?",inputData,function(err,rows){
    console.log(rows)
    res.json(rows);
});
}

function deleteVideo_Admin(req,res,db){
    let id = req.params.id;
db.run("DELETE FROM videos WHERE id=?",id,function(err,rows){
    console.log(rows)
    res.json(rows);
});
}



module.exports = {processLogin, getVideosFromCategory, addVideo_Admin, modifyVideo_Admin, deleteVideo_Admin, getVidsCategories}
