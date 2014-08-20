// See http://freespace.virgin.net/hugo.elias/models/m_perlin.htm
var whiteNoise = [];
for (var i=0; i < 200; i++) {
  whiteNoise.push([]);
  for (var j=0; j < 200; j++) {
     whiteNoise[i].push( Math.random());
  }
}


function noise_1D(x) {
  var r = (x<<7)^x;
  return ( 1.0 - ( (r * (r * r * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0); 
}

function noise_2D(x, y) {
  x = (200+x) % 200;
  y = (200+y) % 200;
  return whiteNoise[x][y];
  //return Math.random();
  /*
  var t = x + y * 57;
  var r = (t<<13)^t;
  return ( 1.0 - ( (r * (r * r * 15731 + 789221) + 1376312589) & 0x7fffffff) / 1073741824.0); 
  */
}


function linear_interpolate(v1, v2, x) {
  return (1.0 - x)*v1 + x*v2;
}

function cosine_interpolate(v1, v2, x) {
  var r = x * Math.PI;
  r = (1 - Math.cos(r)) * 0.5;

  return (1.0 - r)*v1 + v2*r;
}


function smooth_noise_1D(x) {
  return 0.25 * noise_1D(x-1) + 0.5 * noise_1D(x) + 0.25 * noise_1D(x+1);
}

function smooth_noise_2D(x, y) {
  return noise_2D(x-1, y-1)/16.0 + noise_2D(x, y-1)/8.0 + noise_2D(x+1, y-1)/16.0 + 
         noise_2D(x-1, y)  /8.0  + noise_2D(x, y)  /4.0 + noise_2D(x+1, y)  /8.0 + 
         noise_2D(x-1, y+1)/16.0 + noise_2D(x, y+1)/8.0 + noise_2D(x+1, y+1)/16.0; 
}


function interpolate_2D(x, y) {
   var xInt = Math.floor(x);
   var xFra = x - xInt;
   var yInt = Math.floor(y);
   var yFra = y - yInt;

   var p1 = smooth_noise_2D(xInt, yInt);
   var p2 = smooth_noise_2D(xInt + 1, yInt);
   var p3 = smooth_noise_2D(xInt, yInt + 1);
   var p4 = smooth_noise_2D(xInt + 1, yInt + 1);

   return cosine_interpolate(
      cosine_interpolate(p1, p2, xFra),
      cosine_interpolate(p3, p4, xFra),
      yFra
   );
}


function perlin_2D(x, y) {
   var result = 0.0;
   var persistence = 0.4;
   var octives = 4;

   x /= 8;
   y /= 8;

   for (var i=0; i < octives; i++) {
      var frequency = Math.pow(2, i);
      var amplitude = Math.pow(persistence, i);
      result += interpolate_2D( x * frequency, y * frequency) * amplitude;
   }
   return result;
}

