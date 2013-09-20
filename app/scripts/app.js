'use strict';

var app = angular.module('mapApp', [])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });

app.directive("ngMap", function(){
  return {
    restrict: "A",
    link: function(scope, element){
      var ctx = element[0].getContext('2d');
      element.bind('mousedown', function(event){
        console.log('mousedown');
      });
      element.bind('mousemove', function(event){
        console.log('mousemove');
      });
      element.bind('mouseup', function(event){
        console.log('mouseup');
      });
      // canvas reset
      function reset(){
        element[0].width = element[0].width;
      }
    }
  };
});