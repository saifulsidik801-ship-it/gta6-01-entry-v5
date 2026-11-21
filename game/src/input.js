// MARISOL BAY — keyboard + mouse input. One job: a single place that owns
// keys, clicks and look-drag, so gameplay files never touch DOM events.
var MB = MB || {};
MB.Input = (function () {
  var keys = {}, pressed = {}, lookDX = 0, lookDY = 0, mouseDown = false, mouseClicked = false;
  var canvas = null;
  function key(e) { return (e.key || '').toLowerCase(); }
  window.addEventListener('keydown', function (e) {
    var k = key(e);
    if (!keys[k]) pressed[k] = true;
    keys[k] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
    if (MB.onKey) MB.onKey(k);
  });
  window.addEventListener('keyup', function (e) { keys[key(e)] = false; });
  window.addEventListener('blur', function () { keys = {}; });
  return {
    attach: function (el) {
      canvas = el;
      el.addEventListener('mousedown', function (e) { mouseDown = true; mouseClicked = true; if (MB.onMouseDown) MB.onMouseDown(e); });
      window.addEventListener('mouseup', function () { mouseDown = false; });
      el.addEventListener('mousemove', function (e) {
        if (e.movementX !== undefined) { lookDX += e.movementX; lookDY += e.movementY; }
      });
    },
    down: function (k) { return !!keys[k]; },
    hit: function (k) { var v = !!pressed[k]; pressed[k] = false; return v; },
    consumeClick: function () { var v = mouseClicked; mouseClicked = false; return v; },
    mouseIsDown: function () { return mouseDown; },
    look: function () { var r = { dx: lookDX, dy: lookDY }; lookDX = 0; lookDY = 0; return r; },
    clear: function () { pressed = {}; mouseClicked = false; lookDX = 0; lookDY = 0; },
  };
})();
