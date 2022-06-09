'use strict';

angular.module('trabajo', ['ngRoute'])

    // Controller que controla el header
    .controller('headerController', function($scope, $location){

        $scope.urlInicio = '/#/';
        $scope.role = '';

        $scope.logout = function(){
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("usuario");
            $scope.urlInicio = '/#/';
            $scope.role = '';
            $location.url('/#/');
        };

        function parseJWT(token) {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
         
            return JSON.parse(jsonPayload).role;
        };

        $scope.$on('$routeChangeStart', function($event, next, current) { 
            let token = sessionStorage.getItem('token');

            if(token === null){
                $location.url('/#/');
            }else if (parseJWT(token) == 'ADMIN'){
                $scope.urlInicio = '/#/admin/';
                $scope.role = 'ADMIN';
            }else{
                $scope.urlInicio = '/#/users/';
                $scope.role = 'USER';
            }


            console.log($location.path());
        });


        
    })

    /*
    --------------------------------------------
            DIV CONTENT
    ------------------------------------------
    */
  .config(function($routeProvider) { 
     $routeProvider. 
     when('/', {
        controller: 'LoginController',
        templateUrl: 'login.html' 
     }).
     when('/admin/', {
        controller: 'LoginController',
        templateUrl: 'admin.html' 
     }).
     when('/users/', {
        controller: 'LoginController',
        templateUrl: 'admin.html' 
     }).

     otherwise({
        redirectTo: '/'
     });
  })

  .controller('LoginController', function ($scope, $http, $location) {

        $scope.authenticate = function(){

            $http.post('/login',
            {
                "email": $scope.email,
                "passwd": $scope.password
            })
            .success(function(data){
                console.log(data)
                if(Object.keys(data).includes('errormsg') === true){
                    
                    
                }else{
                    
                    sessionStorage.setItem("token", data.token);
                    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
                    
                    if (data.usuario.rol === 'ADMIN') $location.url('/admin/')
                }    
            });
        };
 
    
  });
  
