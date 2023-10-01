function setCameraShake(amount, damp) {
  const cam = entity_get(Camera);
  cam.shake = amount;
  cam.damp = damp;
}

class Camera extends Entity {
  constructor(_) {
    super(_);
    this.persistent = true;
    
    this.cameraScale = Math.max(Math.min(window_width, window_height) - 200, 200);
    this.depth = -100;
    
    this.shake = 0;
    this.damp = 0.4;
    
    this.eLastX = 0;
    this.eLastY = 0;
    
    const tmR = entity_get(Game).tilemap;
    const width = tmR.width * tmR.tileSize;// + tmR.tileSize / 2;
    this.x = width/2;
    this.y = width/2;
    
    cam_zoom = 10;
  }
  step() {
    this.cameraScale = Math.max(Math.min(surface_default.width, surface_default.height) - 200, 200)
    const players = entity_list(Player);
    let tx = 0;
    let ty = 0;
    let tspd = 0.05
    
    if ((entity_exists(RoundAnim) && entity_get(RoundAnim).stealCamera) || entity_get(Game).lobby) {
      const tmR = entity_get(Game).tilemap;
      const width = game.mapWidth * game.tilemap.tileSize
      const height = game.mapHeight * game.tilemap.tileSize;
      tx = width/2;
      ty = height/2;
      tspd = 0.12
      
      cam_zoom = util_lerp(
        cam_zoom,
        Math.min(1 / width * this.cameraScale, 1.5),
        0.07
      );
    } else if (players.length > 1) { // If there are 2 or more players
      let maxD = 0, lastMaxD = 0;
      let p1, p2;

      // Find the 2 players that are the furthest from each other
      for(let i = 0; i < players.length; i++) {
        for(let j = i + 1; j < players.length; j++) {
          const d = util_distance(players[i].x, players[i].y, players[j].x, players[j].y);
          if (d >= maxD) {
            lastMaxD = d;
            maxD = d;
            p1 = players[i];
            p2 = players[j];
          }
        }
      }
      
      const posDist = [ 
        util_distance(p1.x, p1.y, p2.x, p2.y),
        util_distance(p1.x + p1.g_camPX.value, p1.y + p1.g_camPY.value, p2.x, p2.y),
        util_distance(p1.x, p1.y, p2.x + p2.g_camPX.value, p2.y + p2.g_camPY.value),
        util_distance(p1.x + p1.g_camPX.value, p1.y + p1.g_camPY.value, p2.x + p2.g_camPX.value, p2.y + p2.g_camPY.value),
      ];
      
      // Set zoom to make sure the 2 are visible
      cam_zoom = util_lerp(
        cam_zoom,
        Math.min(1 / Math.max(...posDist) * this.cameraScale, 1.5),
        0.05
      );
      
      // get the middle point between the 2 players
      tx = (p1.x + p1.g_camPX.value + p2.x + p2.g_camPX.value) / 2;
      ty = (p1.y + p1.g_camPY.value + p2.y + p2.g_camPY.value) / 2;
      // average
      for (let p of players) {
        tx += p.x;
        ty += p.y;
      }
      tx /= players.length + 1;
      ty /= players.length + 1;
      
      this.eLastX = tx;
      this.eLastY = ty;
    } else if (players.length == 1) { // if there is one player
      tx = players[0].x; // just set the camera to it's position
      ty = players[0].y;
      cam_zoom = util_lerp(cam_zoom, 1, 0.02);
      
      // if that player dies, we want the camera to remember where it was
      this.eLastX = tx;
      this.eLastY = ty;
    } else { // if no players left
      tx = this.eLastX;
      ty = this.eLastY;
      cam_zoom = util_lerp(cam_zoom, 0.5, 0.02)
    }
    
    this.shake = Math.max(0, this.shake - this.damp);
    
    // set camera positions
    this.x = util_lerp(this.x, tx, tspd);
    this.y = util_lerp(this.y, ty, tspd);
    cam_x = ~~this.x - surface_default.width / cam_zoom / 2;
    cam_y = ~~this.y - surface_default.height / cam_zoom / 2;
    cam_x += Math.round(Math.random() * this.shake * (settings.screenShake / 2));
    cam_y += Math.round(Math.random() * this.shake * (settings.screenShake / 2));
  }
}

