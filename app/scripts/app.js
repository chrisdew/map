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

// TODO:
// 1. move directive to separate .js file and link properly - how?
// 2. map is loading, but is not draggable - why? - done
// 3. sort out scoping issue of directive - {}?
// 4. add lat, lng and zm displays/sliders to page (NOT to map)
// 5. test and fix on Android
// 6. workout a proper naming convention - lat and Y are confusing.
// 7. make map on page fullscreen and make directive still work when window/canvas is resized
// 8. map scrollwheel zoom on cursor position

app.directive("ngMap", function($window) {
  var TILE_SZ = 256; // pixels
  var MAX_ZM = 18; // min 0
  var DEFAULT_LAT = 30100100.0;
  var DEFAULT_LNG = 30100100.0;
  var DEFAULT_ZM = 2;

  // array of tiles, key: "LAT/LNG/ZM"
  var tiles = {};

  return {
    restrict: "A",
    link: function(scope, element) {
      var canvas = element[0];
      var ctx = canvas.getContext('2d');

      scope.lat = DEFAULT_LAT;
      scope.lng = DEFAULT_LNG;
      scope.zm = DEFAULT_ZM;

      // directive state
      var lastMouseX = 0;
      var lastMouseY = 0;
      var dragging = false;

      resize(); // calls draw

      angular.element($window).bind('resize', function(event) {
        resize();
      });
      element.bind('mousedown', function(event) {
        console.log('mousedown', event);
        var x = event.clientX - canvas.offsetLeft;
        var y = event.clientY - canvas.offsetTop;
        if (event.button === 0) {
          dragging = true;
        }
        lastMouseX = x;
        lastMouseY = y;
      });
      element.bind('mousemove', function(event) {
        console.log('mousemove');
        var x = event.clientX - canvas.offsetLeft;
        var y = event.clientY - canvas.offsetTop;
        if (dragging === true) {
          var dX = x - lastMouseX;
          var dY = y - lastMouseY;
          console.log("before scope.lng", scope.lng);
          console.log("x:", x, "dX:", dX);
          scope.lng -= dX * Math.pow(2, MAX_ZM - scope.zm);
          scope.lat -= dY * Math.pow(2, MAX_ZM - scope.zm);
          console.log("after scope.lng", scope.lng);
          draw();
        }
        lastMouseX = x;
        lastMouseY = y;
      });
      element.bind('mouseup', function(event) {
        console.log('mouseup', event);
        dragging = false;
      });
      element.bind('mouseout', function(event) {
        console.log('mouseout', event);
        dragging = false;
      });
      element.bind('mousewheel', function(event) {
        console.log('mousewheel', event);

        var delta = 0;
        if (event.originalEvent.wheelDelta) {
          delta = event.originalEvent.wheelDelta / 120;
        }

        var x = event.clientX - canvas.offsetLeft;
        var y = event.clientY - canvas.offsetTop;
        if (delta > 0) {
          zoomIn(x, y);
        } else if (delta < 0) {
          zoomOut(x, y);
        }
      });

      function zoomIn(x, y) {
        if (scope.zm < MAX_ZM) {
          console.log('zoomFocus', x, y)

          var z = scope.zm;
          var w = canvas.width * Math.pow(2, MAX_ZM - z);
          var h = canvas.height * Math.pow(2, MAX_ZM - z);
          var x1 = x * Math.pow(2, MAX_ZM - z) - w/2;
          var y1 = y * Math.pow(2, MAX_ZM - z) - h/2;

          console.log('zoomFocus x1 y1', x1, y1)

          scope.lng += x1/2;
          scope.lat += y1/2;
          scope.zm++;
          draw();
        }
      }

      function zoomOut(x, y) {
        if (scope.zm > 0) {
          console.log('zoomFocus', x, y)

          scope.zm--;
          var z = scope.zm;
          var w = canvas.width * Math.pow(2, MAX_ZM - z);
          var h = canvas.height * Math.pow(2, MAX_ZM - z);
          var x1 = x * Math.pow(2, MAX_ZM - z) - w/2;
          var y1 = y * Math.pow(2, MAX_ZM - z) - h/2;

          console.log('zoomFocus x1 y1', x1, y1)

          scope.lng -= x1/2;
          scope.lat -= y1/2;
          draw();
        }
      }


      // canvas reset
      function reset() {
        element[0].width = element[0].width;
      }

      function resize() {
        console.log("resize");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
      }

      function draw() {
        //console.log("draw()");

        var z = scope.zm;
        var w = canvas.width * Math.pow(2, MAX_ZM - z);
        var h = canvas.height * Math.pow(2, MAX_ZM - z);
        var sz = TILE_SZ * Math.pow(2, MAX_ZM - z);

        var xMin = scope.lng - w/2;
        var yMin = scope.lat - h/2;
        var xMax = scope.lng + w/2;
        var yMax = scope.lat + h/2;

        for (var x = Math.floor(xMin / sz); x < Math.ceil(xMax / sz); ++x) {
          for (var y = Math.floor(yMin / sz); y < Math.ceil(yMax / sz); ++y) {
            var xoff = (x * sz - xMin) / Math.pow(2, MAX_ZM - z);
            var yoff = (y * sz - yMin) / Math.pow(2, MAX_ZM - z);
            var tileKey = encodeKey(x, y, z);
            //console.log("draw() 1");
            if (tiles[tileKey] && tiles[tileKey].complete) {
              //console.log("draw() 2");
              ctx.drawImage(tiles[tileKey], Math.round(xoff), Math.round(yoff));
            } else {
              //console.log("draw() 3");
              if (!tiles[tileKey]) {
                //console.log("draw() 4");
                tiles[tileKey] = new Image();
                tiles[tileKey].src = tileUrl(x, y, scope.zm);
                tiles[tileKey].onload = function() {
                  // TODO: could we just do a partial draw of the single tile
                  draw();
                }
              }
              //console.log("draw() 5");
              ctx.fillStyle = "#ffcccc";
              ctx.fillRect(Math.round(xoff), Math.round(yoff), TILE_SZ, TILE_SZ);
            }
          }
        }
      }
    }
  };
});

// pure functions

// return a % b.
function mod(a, b) {
  return ((a % b) + b) % b;
}

function normaliseIndices(lng, lat, zm) {
  return [mod(lng, Math.pow(2, zm)), mod(lat, Math.pow(2, zm)), zm];
}

function encodeKey(lng, lat, zm) {
  var n = normaliseIndices(lng, lat, zm);
  lng = n[0]; lat = n[1]; zm = n[2];
  return lng + "," + lat + "," + zm;
}

function decodeKey(t) {
  return t.split(",", 3);
}

function tileUrl(lng, lat, zm) {
  var n = normaliseIndices(lng, lat, zm);
  var lng = n[0]; lat = n[1]; zm = n[2];
  var url = "http://a.tile.openstreetmap.org/" + zm + "/" + lng + "/" + lat + ".png";
  return url;
}

// true if the tile is outside the view.
function isOutsideWindow(t) {
  var pos = decodeKey(t);
  var lng = pos[0];
  var lat = pos[1];
  var zm = pos[2];

  var w = canvas.width * Math.pow(2, MAX_ZM - zm);
  var h = canvas.height * Math.pow(2, MAX_ZM - zm);

  var x = lng * Math.pow(2, MAX_ZM - zm);
  var y = lat * Math.pow(2, MAX_ZM - zm);

  var sz = TILE_SZ * Math.pow(2, MAX_ZM - zm);
  if (x > posX + w/2 || y > posY + h/2 || x + sz < posX - w/2 || y - sz < posY - h/2)
    return true;
  return false;
}



