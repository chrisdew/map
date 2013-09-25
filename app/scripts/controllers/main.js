'use strict';

angular.module('mapApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.lng = 0;
    $scope.lat = 0;
    $scope.zm = 1;
  });
