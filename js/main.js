/* Drakehaven Island — boot. */
(function () {
  'use strict';

  function boot() {
    const canvas = document.getElementById('screen');
    DH.gfx.init(canvas);
    DH.input.init(canvas);

    /* saved volume preferences */
    const cfg = DH.save.loadConfig();
    ['master', 'music', 'sfx'].forEach(k => {
      if (cfg['vol_' + k] != null) DH.audio.setVolume(k, cfg['vol_' + k]);
    });

    /* the browser will not let us make a sound until the player touches something */
    const unlock = () => { DH.audio.unlock(); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    DH.game.replace(DH.scenes.title);
    DH.game.start();

    /* a soft warning rather than a silent failure if something is missing */
    window.addEventListener('error', (e) => {
      console.error(e.error || e.message);
      if (DH.ui) DH.ui.toast('Something went wrong: ' + (e.message || 'see the console'), 'bad', 5000);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
