// MARISOL BAY — seeded RNG. One job: deterministic randomness so a staged
// screenshot renders the same city every time for the same seed.
var MB = MB || {};
MB.mulberry32 = function (seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
MB.rng = MB.mulberry32(1);
MB.reseed = function (seed) { MB.rng = MB.mulberry32(seed); };
MB.pick = function (arr) { return arr[Math.floor(MB.rng() * arr.length)]; };
MB.range = function (lo, hi) { return lo + MB.rng() * (hi - lo); };
MB.clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };
MB.lerp = function (a, b, t) { return a + (b - a) * t; };
