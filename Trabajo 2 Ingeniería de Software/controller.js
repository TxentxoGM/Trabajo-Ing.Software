'use strict';

angular.module('trabajo', ['ngRoute'])

    // Controller que controla el header
    .controller('headerController', function ($scope, $location) {

        $scope.urlInicio = '/#/';
        $scope.role = '';
        $scope.logout = function () {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");
            $scope.urlInicio = '/#/';
            $scope.role = '';
            $location.url('/#/');
        };

        // Función utilizada para desencriptar el rol guardado en el payload del token
        function parseJWT(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).role;
        };

        // Al cambiar de ruta, se comprueba el rol guardado y se redirecciona consecuentemente
        $scope.$on('$routeChangeStart', function ($event, next, current) {
            let token = sessionStorage.getItem('token');

            // Por defecto, el CSS del panel de administración indica que ningun CRUD está seleccionado
            $scope.page = 0;

            if (token === null) {
                $location.url('/');
            } else if (parseJWT(token) == 'ADMIN') {
                $scope.urlInicio = '/#/admin/';
                $scope.role = 'ADMIN';

                // Switch que ,según en que CRUD nos encontramos, modifica la variable page para iluminar el selector correspondiente.
                switch ($location.path()) {
                    case '/admin/userManagement/':
                        $scope.page = 1;
                        break;
                    case '/admin/categoryManagement/':
                        $scope.page = 2;
                        break;
                    case '/admin/videoManagement/':
                        $scope.page = 3;
                        break;
                }
            } else {
                $scope.urlInicio = '/#/user/';
                $scope.role = 'USER';
            }
        });
    })

    /*
    --------------------------------------------
            DIV CONTENT
    --------------------------------------------
    */
    // Configuración del controlador y vista asignados a cada ruta 
    .config(function ($routeProvider) {
        $routeProvider.
            when('/', {
                controller: 'LoginController',
                templateUrl: 'login.html'
            }).
            when('/admin/', {
                controller: 'headerController'
            }).
            when('/admin/userManagement/', {
                controller: 'userManagementController',
                templateUrl: 'html/gestion_usuarios.html'
            }).
            when('/admin/categoryManagement/', {
                controller: 'categoryManagementController',
                templateUrl: 'html/gestion_categorias.html'
            }).
            when('/admin/videoManagement/', {
                controller: 'videoManagementController',
                templateUrl: 'html/gestion_videos.html'
            }).
            when('/user/', {
                controller: 'UserOptController',
                templateUrl: 'html/panel_usuario.html'
            }).
            otherwise({
                redirectTo: '/'
            });
    })

    // Controlador asociado a la autenticación del usuario
    .controller('LoginController', function ($scope, $http, $location) {

        // Hace una petición de autenticación, asigna el token en el sessionStorage y redirecciona según el rol
        $scope.authenticate = function () {
            $http.post('/login',
                {
                    "email": $scope.email,
                    "passwd": $scope.password
                })
                .success(function (data) {
                    $scope.error = "";
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        sessionStorage.setItem("token", data.token);
                        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
                        
                        if (data.usuario.rol === 'ADMIN') { 
                            $location.url('/admin/') 
                        }
                        else if (data.usuario.rol === 'USER') {
                            $location.url('/user/');
                        }
                    }
                }
            );
        };
    })

    // Controlador asociado a la vista del usuario sin privilegios
    .controller('UserOptController', function ($scope, $http, $location) {

        // Ordenar vídeos según su nombre
        $scope.condicion = true;  
        $scope.ordenar = function(propiedad) {
            $scope.orden = propiedad;
            
            $scope.condicion =  $scope.condicion === true ? false : true;
           
        };





        // Al cargar la vista, se muestran las primeras 99 categorias de la base de datos
        $scope.$on('$routeChangeSuccess', function () {
            $http.get("/categories", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data1) {
                    if (Object.keys(data1).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        $http.get("/videos", {
                            'params': {
                                "desde": 0,
                                "limite": 999
                            },
                            headers: {
                                'Authorization': "Bearer " + sessionStorage.token
                            }
                        })
                        .success(function (data2) {

                            if (Object.keys(data2).includes('errormsg') === true) {
                                console.log('Se ha producido un error');
                            } else {
                                $scope.error = "";
                                let listaCategorias = data1.categorias;
                                let listaVideos = data2.videos;
                                let listaProvisional = new Array();

                                listaCategorias.forEach(categoria => {
                                    let isEmpty = listaVideos.findIndex((element) => element.id_category == categoria.id);
                                    if(isEmpty >= 0){
                                        listaProvisional.push(categoria);
                                    }
                                });
                                $scope.userCategories = listaProvisional;
                                $scope.userOption = 1;
                                $location.url('#/user/');
                            }
                        });
                    }
                });
        });

        // Función utilizada para mostrar las portadas de los videos a partir de su URL
        $scope.thumbnail = function (url) {
            url = String(url);
            var id = url.split("?v=")[1];
            var id = id.split("&t=")[0];
            var imageURL = "http://img.youtube.com/vi/" + id + "/mqdefault.jpg";
            
            return imageURL;
        }

        // Hace una petición a la base de datos para mostrar los videos de la categoria seleccionada.
        $scope.getVideosForUser = function (id_categoria, nombre_categoria) {

            $http.get("/videos/" + id_categoria, {
                'params': {
                    "desde": 0,
                    "limite": 999
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            })
            .success(function (data) {

                if (Object.keys(data).includes('errormsg') === true) {
                    console.log('Se ha producido un error');
                } else {
                    let videos = data.videos;
                    // Como el campo categoria en los videos es el índice de esta, se sustituye por el nombre de la categoría
                    videos.forEach(element => {
                        element.id_category = nombre_categoria;
                    });
                    $scope.userVideos = videos
                    $scope.userOption = 2;
                }
            });
        }
        
        // Función utilizada para volver a la selección de categorías
        $scope.comeBack = function () {
            $scope.userOption = 1;
        }
    })

    // Controlador asociado a la vista de gestión de usuarios
    .controller('userManagementController', function ($scope, $http) {

        // Ordenar usuarios según nombre, id y correo
        $scope.condicion = true;  
        $scope.ordenar = function(propiedad) {
            
            if($scope.orden === propiedad)  $scope.condicion =  $scope.condicion === true ? false : true;
            else{
                $scope.orden = propiedad;
                $scope.condicion = true;
            } 

        };

        // Función que, al iniciar el controlador, obtenga los primeros 99 usuarios de la base de datos
        $scope.getUsers = function () {
            $http.get("/usuarios", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            })
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');
                    } else {
                        $scope.users = data.usuarios;
                        $scope.tipoOperacion = 0;
                    }
                });
        }
        $scope.getUsers();
        
        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de creación de usuario
        $scope.jumpToCreateUser = function () {
            $scope.tipoOperacion = 1;
            $scope.nombreUsuario = "";
            $scope.mailUsuario = "";
            $scope.passwordUsuario = "";
        }

        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de modificación de usuario, pasándole los valores actuales
        $scope.jumpToModifyUser = function (id, nombre, password) {
            $scope.tipoOperacion = 2;
            $scope.idUsuario = id;
            $scope.nombreUsuario = nombre;
            $scope.passwordUsuario = password;
        }

        // Al pulsar en el botón, se modifica la vista para mostrar la pantalla de confirmación de eliminación de usuario
        $scope.jumpToDeleteUser = function (id, nombre) {
            $scope.tipoOperacion = 3;
            $scope.idUsuario = id;
            $scope.nombreUsuario = nombre;
        }

        // Petición al servidor para crear el usuario con los valores introducidos
        $scope.createUser = function (nombre, mail, password) {
            $http.post('/usuarios',
                {
                    "name": nombre,
                    "email": mail,
                    "password": password
                },
                {
                    'headers':
                    {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.comeBack();
                    }
                });
        }

        // Petición al servidor para modificar el usuario seleccionado
        $scope.modifyUser = function (id) {
            if ($scope.nombreUsuario != "" && $scope.passwordUsuario != "") {
                $http.put('/usuarios/' + id,
                    {
                        name: $scope.nombreUsuario,
                        password: $scope.passwordUsuario
                    },
                    {
                        'headers':
                        {
                            'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        }
                    }
                )
                    .success(function (data) {
                        if (Object.keys(data).includes('errormsg') === true) {
                            $scope.error = data.errormsg;
                        } else {
                            $scope.error = "";
                            $scope.comeBack()
                        }
                    });
            } else {
                $scope.error = "Debe introducir unos valores válidos."
            }
        }

        // Petición al servidor para eliminar el usuario seleccionado
        $scope.deleteUser = function (id) {
            $http.delete('/usuarios/' + id,
                {
                    'headers':
                    {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                    }
                }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.comeBack();
                    }
                });
        }

        // Función utilizada para volver a pedir la lista de usuarios para que al volver a mostrar esta, esté actualizada.
        $scope.comeBack = function () {
            $scope.getUsers();
            $scope.tipoOperacion = 0;
        }
    })

    // Controlador asociado a la vista de gestión de categorías
    .controller('categoryManagementController', function ($scope, $http, $window) {

        // Ordenar usuarios según nombre, id y correo
        $scope.condicion = true;  
        $scope.ordenar = function(propiedad) {
                    
            if($scope.orden === propiedad)  $scope.condicion =  $scope.condicion === true ? false : true;
            else{
                $scope.orden = propiedad;
                $scope.condicion = true;
            } 
        
        };

        // Al cargar la vista, se hace una petición al servidor para obtener las primeras 99 categorías de la base de datos
        $scope.getCategories = function () {
            $http.get("/categories", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        $scope.categories = data.categorias;
                        $scope.tipoOperacion = 0;
                    }
                });
        }
        $scope.getCategories();

        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de creación de categoría
        $scope.jumpToCreateCategory = function () {
            $scope.tipoOperacion = 1;
            $scope.nombreCategoria = "";
        }

        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de modificación de categoría, pasándole el nombre actual. 
        $scope.jumpToModifyCategory = function (id, nombre) {
            $scope.tipoOperacion = 2;
            $scope.idCategoria = id;
            $scope.nombreCategoria = nombre;
        }

        // Al pulsar en el botón, se modifica la vista para mostrar la pantalla de confirmación de eliminación de categoría
        $scope.jumpToDeleteCategory = function (id, nombre) {
            $scope.tipoOperacion = 3;
            $scope.idCategoria = id;
            $scope.nombreCategoria = nombre;
        }

        // Petición al servidor para crear la categoría con el nombre introducido.
        $scope.createCategory = function (nombre) {
            $http.post('/categories',
                {
                    "name": nombre
                },
                {
                    'headers':
                    {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.comeBack();
                    }
                });
        }

        // Petición al servidor para modificar la categoría seleccionada
        $scope.modifyCategory = function (id, nombre) {
            if (nombre != "") {
                $http.put('/categories/' + id,
                    {
                        name: nombre
                    },
                    {
                        'headers':
                        {
                            'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        }
                    }
                )
                    .success(function (data) {
                        if (Object.keys(data).includes('errormsg') === true) {
                            $scope.error = data.errormsg;
                        } else {
                            $scope.error = "";
                            $scope.comeBack()
                        }
                    });
            } else {
                $scope.error = "Debe introducir unos valores válidos"
            }
        }

        // Petición al servidor para eliminar la categoría seleccionada. No se elimina si la cateogoría tiene videos asociados
        $scope.deleteCategory = function (id) {
            $http.get("/videos/" + id, {
                'params': {
                    "desde": 0,
                    "limite": 999
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');
                    } else {
                        if (!(data.total > 0)) {
                            $http.delete('/categories/' + id,
                                {
                                    'headers':
                                    {
                                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                                    }
                                }
                            )
                                .success(function (data) {
                                    if (Object.keys(data).includes('errormsg') === true) {
                                        $scope.error = data.errormsg;
                                    } else {
                                        $scope.error = "";
                                        $scope.comeBack();
                                    }
                                });
                        } else {
                            $scope.error = "No puedes eliminar una categoría que tiene videos.";
                        }
                    }
                });
        }

        // Función utilizada para volver a pedir la lista de categorías para que al volver a mostrar esta, esté actualizada.
        $scope.comeBack = function () {
            $scope.getCategories();
            $scope.tipoOperacion = 0;
        }
    })

    // Controlador asociado a la vista de gestión de videos
    .controller('videoManagementController', function ($scope, $http) {

        // Ordenar usuarios según nombre, id y correo
        $scope.condicion = true;  
        $scope.ordenar = function(propiedad) {
                    
            if($scope.orden === propiedad)  $scope.condicion =  $scope.condicion === true ? false : true;
            else{
                $scope.orden = propiedad;
                $scope.condicion = true;
            } 
        
        };

        // Al cargar la vista, se hace una petición al servidor para obtener los primeros 99 videos de la base de datos
        $scope.getVideos = function () {
            $http.get("/categories", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            })
                .success(function (data1) {
                    if (Object.keys(data1).includes('errormsg') === true) {
                        console.log('Se ha producido un error');
                    } else {
                        let lista_categorias = data1.categorias;
                        $http.get("/videos", {
                            'params': {
                                "desde": 0,
                                "limite": 999
                            },
                            headers: {
                                'Authorization': "Bearer " + sessionStorage.token
                            }
                        })
                            .success(function (data2) {

                                if (Object.keys(data2).includes('errormsg') === true) {
                                    console.log('Se ha producido un error');
                                } else {
                                    $scope.error = "";
                                    let lista_provisional = data2.videos;

                                    // Como la categoría asociada al video va por id, se sustituye este por el nombre de categoría correspondiente
                                    lista_provisional.forEach(video => {
                                        lista_categorias.forEach(categoria => {
                                            if (video.id_category === categoria.id) {
                                                video.name_category = categoria.name;
                                            }
                                        });
                                    });
                                    $scope.videos = lista_provisional;
                                    $scope.tipoOperacion = 0;
                                }
                            });
                    }
                });
        }
        $scope.getVideos();


        // Función utilizada para mostrar las portadas de los videos a partir de su URL
        $scope.thumbnail = function (url) {
            url = String(url);
            var id = url.split("?v=")[1];
            var id = id.split("&t=")[0];
            var imageURL = "http://img.youtube.com/vi/" + id + "/mqdefault.jpg";
            return imageURL;
        }

        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de creación de video
        $scope.jumpToCreateVideo = function () {
            $scope.nombreVideo = "";
            $scope.urlVideo = "";
            $scope.categoriaVideo = "";

            $http.get("/categories", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        $scope.categoriasCreacionVideos = data.categorias;
                        $scope.tipoOperacion = 1;

                    }
                });
        }

        // Al pulsar en el botón, se modifica la vista para mostrar el formulario de modificación de video, con sus valores actuales
        $scope.jumpToModifyVideo = function (id, nombre, url, name_category) {
            $http.get("/categories", {
                'params': {
                    "desde": 0,
                    "limite": 99
                },
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.categoriasModificacionVideos = data.categorias;
                        $scope.idVideo = id;
                        $scope.nombreVideo = nombre;
                        $scope.urlVideo = url;
                        $scope.categoriaVideo = name_category;
                        $scope.tipoOperacion = 2;
                    }
                });
        }

        // Al pulsar en el botón, se modifica la vista para mostrar la pantalla de confirmación de eliminación de video
        $scope.jumpToDeleteVideo = function (id, nombre) {
            $scope.tipoOperacion = 3;
            $scope.idVideo = id;
            $scope.nombreVideo = nombre;

        }

        // Petición al servidor para crear el video con los valores introducidos.
        $scope.createVideo = function () {
            $http.post('/videos',
                {
                    "name": $scope.nombreVideo,
                    "url": $scope.urlVideo,
                    "id_category": $scope.categoriaVideo
                },
                {
                    'headers':
                    {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                        'Content-Type': 'application/json'
                    }
                }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.comeBack();
                    }
                });
        }

        // Petición al servidor para modificar el video con los valores introducidos
        $scope.modifyVideo = function () {
            

            if ($scope.categoriaVideo != "" && $scope.nombreVideo != "" && $scope.urlVideo != "") {
                $http.put('/videos/' + $scope.idVideo,
                    {
                        id_category: $scope.categoriaVideo,
                        name: $scope.nombreVideo,
                        url: $scope.urlVideo
                    },
                    {
                        'headers':
                        {
                            'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                            'Content-Type': 'application/json'
                        }
                    }
                )
                    .success(function (data) {
                        if (Object.keys(data).includes('errormsg') === true) {
                            $scope.error = data.errormsg;
                        } else {
                            $scope.error = "";
                            $scope.comeBack()
                        }

                    });
            } else {
                $scope.error = "Debe introducir unos valores válidos"
            }
        }

        // Petición al servidor para eliminar el video seleccionado 
        $scope.deleteVideo = function (idVideo) {
            $http.delete('/videos/' + idVideo,
                {
                    'headers':
                    {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                    }
                }
            )
                .success(function (data) {
                    if (Object.keys(data).includes('errormsg') === true) {
                        $scope.error = data.errormsg;
                    } else {
                        $scope.error = "";
                        $scope.comeBack();
                    }
                });
        }

        // Función utilizada para volver a pedir la lista de videos para que al volver a mostrar esta, esté actualizada.
        $scope.comeBack = function () {
            $scope.getVideos();
            $scope.tipoOperacion = 0;
        }
    })