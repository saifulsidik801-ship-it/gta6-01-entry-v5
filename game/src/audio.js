// MARISOL BAY — procedural sound. One job: every sound is synthesized with
// WebAudio (no audio files, no network). Silent until the first user gesture.
var MB = MB || {};
MB.Audio = (function () {
  var ctx = null, master = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null;
  function ensure() {
    if (ctx) return true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
      engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
      engineGain = ctx.createGain(); engineGain.gain.value = 0.0;
      engineOsc.connect(engineGain); engineGain.connect(master); engineOsc.start();
      sirenOsc = ctx.createOscillator(); sirenOsc.type = 'sine'; sirenOsc.frequency.value = 700;
      sirenGain = ctx.createGain(); sirenGain.gain.value = 0.0;
      sirenOsc.connect(sirenGain); sirenGain.connect(master); sirenOsc.start();
      return true;
    } catch (e) { return false; }
  }
  function blip(freq, dur, type, vol) {
    if (!ensure()) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
  }
  return {
    unlock: ensure,
    engine: function (speed01, on) {
      if (!ensure()) return;
      engineOsc.frequency.value = 55 + speed01 * 160;
      engineGain.gain.value = on ? 0.05 + speed01 * 0.05 : 0.0;
    },
    siren: function (on, t) {
      if (!ensure()) return;
      sirenGain.gain.value = on ? 0.045 : 0.0;
      if (on) sirenOsc.frequency.value = 620 + 260 * Math.sin(t * 4.5);
    },
    shot: function () {
      if (!ensure()) return;
      var len = ctx.sampleRate * 0.12, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var g = ctx.createGain(); g.gain.value = 0.5;
      src.connect(g); g.connect(master); src.start();
    },
    click: function () { blip(880, 0.07, 'square', 0.15); },
    coin: function () { blip(1320, 0.12, 'sine', 0.25); setTimeout(function () { blip(1760, 0.18, 'sine', 0.25); }, 90); },
    horn: function () { blip(330, 0.25, 'sawtooth', 0.2); },
    crash: function () { blip(90, 0.25, 'sawtooth', 0.35); },
  };
})();
