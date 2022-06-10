'use strict';

angular.module('trabajo', ['ngRoute'])

    // Controller que controla el header
    .controller('headerController', function ($scope, $location, $rootScope) {

        $scope.urlInicio = '/#/';
        $scope.role = '';

        $scope.logout = function () {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");
            $scope.urlInicio = '/#/';
            $scope.role = '';
            $location.url('/#/');
            $rootScope.adminOption = 0;
            $rootScope.userOption = 1;
        };

        $scope.inicio = function(){
            $rootScope.page = 0;
        };


        function parseJWT(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            return JSON.parse(jsonPayload).role;
        };

        $scope.$on('$routeChangeStart', function ($event, next, current) {
            let token = sessionStorage.getItem('token');

            if (token === null) {
                $location.url('/');
            } else if (parseJWT(token) == 'ADMIN') {
                $scope.urlInicio = '/#/admin/';
                $scope.role = 'ADMIN';
            } else {
                $scope.urlInicio = '/#/user/';
                $scope.role = 'USER';
            }


        });



    })

    /*
    --------------------------------------------
            DIV CONTENT
    ------------------------------------------
    */

    .config(function ($routeProvider) {
        $routeProvider.
            when('/', {
                controller: 'LoginController',
                templateUrl: 'login.html'
            }).
            when('/admin/', {
                controller: 'Select_Management',
                templateUrl: 'html/panel_admin.html'
            }).
            when('/user/', {
                controller: 'UserOptController',
                templateUrl: 'html/panel_usuario.html'
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

            otherwise({
                redirectTo: '/'
            });
    })

    .controller('LoginController', function ($scope, $http, $location) {

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


                        if (data.usuario.rol === 'ADMIN') { $location.url('/admin/') }
                        else if (data.usuario.rol === 'USER') {

                            $location.url('/user/');
                        }

                    }
                });
        };
    })


    .controller('Select_Management', function ($scope, $http, $location, $rootScope) {


        $scope.getUsers = function () {
            $http({
                method: "GET",
                url: "/usuarios",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {

                        $rootScope.users = data.usuarios;
                        $rootScope.page = 1;
                        $rootScope.tipoOperacion = 0;
                        window.location = '#/admin/userManagement/';
                        // $location.url('/admin/users')
                    }
                });
        }


        $scope.getCategories = function () {
            $http({
                method: "GET",
                url: "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {

                        $rootScope.categories = data.categorias;
                        $rootScope.page = 2;
                        $rootScope.tipoOperacion = 0;
                        window.location = '#/admin/categoryManagement/';
                    }
                });
        }


        $scope.getVideos = function () {
            $http({
                method : "GET",
                url : "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                 }
              }
            )
        .success(function(data1){
            if(Object.keys(data1).includes('errormsg') === true){
                console.log('Se ha producido un error');
                
            }else{

                let lista_categorias = data1.categorias;
                


                $http({
                    method : "GET",
                    url : "/videos",
                    headers: {
                        'Authorization': "Bearer " + sessionStorage.token
                     }
                  }
                )
                .success(function(data2){

                    if(Object.keys(data2).includes('errormsg') === true){
                        console.log('Se ha producido un error');
                        
                    }else{
                        $scope.error = "";

    
                        let lista_provisional = data2.videos;

                        lista_provisional.forEach(video => {
                            lista_categorias.forEach(categoria => {
                                if(video.id_category === categoria.id){
                                    video.id_category = categoria.name;
                                }
                            });
                        });
                       


                        $rootScope.videos = lista_provisional;


                        $rootScope.page = 3;
                        $rootScope.tipoOperacion = 0;
                        window.location ='#/admin/videoManagement/';
                    }    
                });


            }    
        });
        }

        $scope.jumpToCRUD = function (tipoCRUD, tipoOperacion) {
            $scope.tipoOperacion = tipoOperacion;
            switch (tipoCRUD) {
                case 1:
                    window.location = '#/admin/userManagement/';
                    break
                case 2:
                    window.location = '#/admin/categoryManagement/';
                    break
                case 3:
                    window.location = '#/admin/videoManagement/';
                    break
            }
        }



    })

    .controller('UserOptController', function ($scope, $http, $window) {

        $scope.$on('$routeChangeSuccess', function () {
            $http({
                method: "GET",
                url: "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    
                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {

                        $scope.userCategories = data.categorias;
                        $scope.userOption = 1;
                        window.location = '#/user/';
                    }
                });
        });

        $scope.thumbnail = function(url) {
            url = String(url);
            var id = url.split("?v=")[1];
            // Eliminamos la parte de la url del final, con el tiempo del video
            var id = id.split("&t=")[0];

            var imageURL = "http://img.youtube.com/vi/" + id + "/mqdefault.jpg";

            return imageURL;
        }

        $scope.getVideosForUser = function (id_categoria, nombre_categoria) {

            $http({
                method: "GET",
                url: "/videos/" + String(id_categoria),
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        let videos = data.videos;
                        videos.forEach(element => {
                            element.id_category = nombre_categoria;
                        });

                        $scope.userVideos = videos
                        $scope.userOption = 2;
                    }
                });
        }

        $scope.comeBack = function () {
            $scope.userOption = 1;
        }




    })



    .controller('userManagementController', function ($scope, $http, $location, $rootScope) {

        $scope.jumpToCreateUser = function () {
            $scope.tipoOperacion = 1;
            $scope.nombreUsuario = "";
            $scope.mailUsuario = "";
            $scope.passwordUsuario ="";
        }

        $scope.jumpToModifyUser = function (id, nombre, password) {
            $scope.tipoOperacion = 2;
            $scope.idUsuario = id;
            $scope.nombreUsuario = nombre;
            $scope.passwordUsuario = password;
        }

        $scope.jumpToDeleteUser = function (id, nombre) {
            $scope.tipoOperacion = 3;
            $scope.idUsuario = id;
            $scope.nombreUsuario = nombre;
        }

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

        $scope.modifyUser = function (id) {
            if($scope.nombreUsuario != "" && $scope.passwordUsuario != ""){
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
                $scope.error = "Debe introducir unos valores válidos"
            }


        }

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

        $scope.comeBack = function () {
            $http({
                method: "GET",
                url: "/usuarios",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        $scope.error = "";
                        $scope.users = data.usuarios;
                        $rootScope.page = 1;
                        $scope.tipoOperacion = 0;
                        window.location = '#/admin/userManagement/';
                    }
                });
        }
    })

    .controller('categoryManagementController', function ($scope, $http, $location, $rootScope) {

        $scope.jumpToCreateCategory = function () {
            $scope.tipoOperacion = 1;
            $scope.nombreCategoria = "";
        }

        $scope.jumpToModifyCategory = function (id, nombre) {
            $scope.tipoOperacion = 2;
            $scope.idCategoria = id;
            $scope.nombreCategoria = nombre;
        }

        $scope.jumpToDeleteCategory = function (id, nombre) {
            $scope.tipoOperacion = 3;
            $scope.idCategoria = id;
            $scope.nombreCategoria = nombre;
        }

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

        $scope.modifyCategory = function (id, nombre) {
            if(nombre != "") {
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

        $scope.deleteCategory = function (id) {

            $http({
                method: "GET",
                url: "/videos/" + String(id),
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        if(!(data.total > 0)){

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
                        }else{
                            $scope.error = "No puedes eliminar una categoría que tiene videos.";
                        }
                        




                    }
                });




        }

        $scope.comeBack = function () {
            $http({
                method: "GET",
                url: "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                }
            }
            )
                .success(function (data) {

                    if (Object.keys(data).includes('errormsg') === true) {
                        console.log('Se ha producido un error');

                    } else {
                        $scope.error = "";

                        $scope.categories = data.categorias;
                        $rootScope.page = 2;
                        $scope.tipoOperacion = 0;
                        window.location = '#/admin/categoryManagement/';
                    }
                });
        }
    })

    .controller('videoManagementController', function ($scope, $http, $rootScope) {


        $scope.thumbnail = function(url) {
            url = String(url);
            var id = url.split("?v=")[1];
            // Eliminamos la parte de la url del final, con el tiempo del video
            var id = id.split("&t=")[0];

            var imageURL = "http://img.youtube.com/vi/" + id + "/mqdefault.jpg";

            return imageURL;
        }



        $scope.jumpToCreateVideo = function(){
    
            $scope.nombreVideo = "";
            $scope.urlVideo = "";
            $scope.categoriaVideo = "";
    
            $http({
                method : "GET",
                url : "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                 }
              }
            )
        .success(function(data){

            if(Object.keys(data).includes('errormsg') === true){
                console.log('Se ha producido un error');
                
            }else{
                $scope.categoriasCreacionVideos = data.categorias;
                $scope.tipoOperacion = 1;

            }    
        });
        }
        $scope.jumpToModifyVideo = function(id, nombre,url, categoria) {

            $http({
                method : "GET",
                url : "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                 }
              }
            )
        .success(function(data){

            if(Object.keys(data).includes('errormsg') === true){
                console.log('Se ha producido un error');
                $scope.error = data.errormsg;
            }else{
                $scope.error = "";

                $scope.categoriasModificacionVideos = data.categorias;
                $scope.idVideo = id;
                $scope.nombreVideo = nombre;
                $scope.urlVideo = url;
                $scope.categoriaVideo = categoria;
    
                $scope.tipoOperacion = 2;
    
            }    
        });
        }
        $scope.jumpToDeleteVideo = function(id, nombre){
            $scope.tipoOperacion = 3;
    
            $scope.idVideo = id;
            $scope.nombreVideo = nombre;

        }
    


    
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
    
        $scope.modifyVideo = function(){
    
            if($scope.categoriaVideo != "" && $scope.nombreVideo != "" && $scope.urlVideo != "") {
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
            .success(function(data){

                if(Object.keys(data).includes('errormsg') === true){
                    $scope.error = data.errormsg;
                }else{
                    $scope.error = "";
                    $scope.comeBack()
                }
            
            }); 
            } else {
            $scope.error = "Debe introducir unos valores válidos"
        }
        }
    
        $scope.deleteVideo = function(idVideo){
    
            $http.delete('/videos/' + idVideo,
          
            {  
                'headers': 
                    { 
                        'Authorization': 'Bearer ' + sessionStorage.getItem('token'),
                    }
            }
            )
            .success(function(data){

                if(Object.keys(data).includes('errormsg') === true){
                    $scope.error = data.errormsg;
                }else{
                    $scope.error = "";
                    $scope.comeBack();
                }
            
            }); 
        }
    
        $scope.comeBack = function(){
            $http({
                method : "GET",
                url : "/categories",
                headers: {
                    'Authorization': "Bearer " + sessionStorage.token
                 }
              }
            )
        .success(function(data1){

            if(Object.keys(data1).includes('errormsg') === true){
                $scope.error = data.errormsg;
                
            }else{
                $scope.error = "";
                let lista_categorias = data1.categorias;
                
                $http({
                    method : "GET",
                    url : "/videos",
                    headers: {
                        'Authorization': "Bearer " + sessionStorage.token
                     }
                  }
                )
                .success(function(data2){

                    if(Object.keys(data2).includes('errormsg') === true){
                        console.log('Se ha producido un error');
                        $scope.error = data.errormsg;
                    }else{
                        $scope.error = "";
                        let lista_provisional = data2.videos;
    

    
                        lista_provisional.forEach(video => {
                            lista_categorias.forEach(categoria => {
                                if(video.id_category === categoria.id){
                                    video.id_category = categoria.name;
                                }
                            });
                        });
                       
                        $scope.videos = lista_provisional;
                        $scope.tipoOperacion = 0;
                        $rootScope.page = 3;
                        window.location ='#/admin/videoManagement/';
                    }    
                });
            }    
        });
            }
    })