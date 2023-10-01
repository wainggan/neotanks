const settings = {
  showFPS: 0,
  roundPos: 1,
  showTankDir: 1,
  flashing: 1,
  screenShake: 2,
  contrast: 0,
  mapSize: 32,
  mapAlgorithm: 1,
  mapRandomChance: 5,
  mapCellularIterations: 80,
  mapCellularStraight: 2,
  stormSpeed: 2,
  powerUps: 2,
  powerUpWeights: [
    4, // Machine Gun
    5, // Mines
    5, // Laser
    4, // Turret
    5, // Shotgun
    5, // Bomb
    4, // Mini Storm
    //0, // Air strike
    //0, // Ghost
    //0, // Flamethrower
  ]
};

const controls = [
  new InputManager(),
  new InputManager(),
  new InputManager(),
  new InputManager(),
];
controls[0].create_input('left').add_key('ArrowLeft');
controls[0].create_input('right').add_key('ArrowRight');
controls[0].create_input('up').add_key('ArrowUp');
controls[0].create_input('down').add_key('ArrowDown');
controls[0].create_input('shoot').add_key('Control').add_key('/');
controls[0].create_input('pause').add_key('Escape').add_key('Shift');
//controls[0].create_input('pause');

controls[1].create_input('left').add_key('s');
controls[1].create_input('right').add_key('f');
controls[1].create_input('up').add_key('e');
controls[1].create_input('down').add_key('d');
controls[1].create_input('shoot').add_key('q');

controls[2].create_input('left').add_key('j');
controls[2].create_input('right').add_key('l');
controls[2].create_input('up').add_key('i');
controls[2].create_input('down').add_key('k');
controls[2].create_input('shoot').add_key('y');

controls[3].create_input('left').add_key('4');
controls[3].create_input('right').add_key('6');
controls[3].create_input('up').add_key('8');
controls[3].create_input('down').add_key('5');
controls[3].create_input('shoot').add_key('0');

const game = entity_create(0, 0, Game);
entity_create(0, 0, Camera);

// entity_create(-1, -1, Player, {
//   color: '#f0f',
//   input: controls[0],
//   playernum: 0
// })
// entity_create(-1, -1, Player, {
//   color: '#0ff',
//   input: controls[1],
//   playernum: 1
// });

//entity_create(0, 0, Storm);

document.onkeydown = function (e) {
  return false;
}

let _lastfps = 0;
function frame() {
  surface_default.resize(window_width, window_height)
  draw_push();
  
  engine_update();
  
  draw_pop();
  
  if (settings.showFPS) {
    if (time_frame % 10 == 0) {
      _lastfps = Math.round(time_fps);
    }
    
    draw_push();
    
    draw_set_stroke_weight(0.5);
    draw_set_text_size(16);
    draw_text(10, window_height - 24, _lastfps)
    
    draw_pop();
  }
  
  window.requestAnimationFrame(frame);
}

window.requestAnimationFrame(frame);
