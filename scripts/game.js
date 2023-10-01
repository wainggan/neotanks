function setPause(pause) {
  game.pauseTime = pause
}

class Game extends Entity {
  constructor(_) {
    super(_);
    this.tilemap = null;
    this.createLobbyMap()
    
    //this.tilemap.set_tiles(generateMaze(this.tilemap.width, this.tilemap.height));
    
    
    this.mapWidth = this.tilemap.width;
    this.mapHeight = this.tilemap.height;
    
    this.renderTilemap = null
    this.renderTileAnimX = 0;
    this.renderTileAnimY = 0;
    this.renderTileAnimPhase = 0;
    this.renderTileComplete = true;
    
    this.pause = 0;
    this.pauseTime = 0;
    
    this.score = {};
    
    this.lobby = true;
    this.lobbyFlag = false;
    this.doLobby = false;
    
    this.showControlsAnim = new Sod(1, 1, 0);
    
    this.lastPowerUp = 0;
    this.active = true;
    this.lastActive = this.active;
  }
  createTilemap() {
    this.tilemap = tilemap_create(settings.mapSize, settings.mapSize);
    this.tilemap.set_tileSize(40);
    this.tilemap.wrap(3, 1);
    
    this.tilemap.set_tiles(generateMaze(this.tilemap.width, this.tilemap.height));
    
    this.lobby = false;
  }
  createLobbyMap() {
    this.tilemap = tilemap_create(12, 12);
    this.tilemap.set_tileSize(40);
    this.tilemap.wrap(3, 1);
    
    
    this.lobby = true;
  }
  animateTilemap(_lobby = false) {
    this.renderTilemap = this.tilemap;
    this.renderTileAnimX = 0;
    this.renderTileAnimY = 0;
    this.renderTileAnimPhase = 0;
    this.renderTileComplete = false;
    if (!_lobby) this.createTilemap();
    else this.createLobbyMap()
  }
  animTilemapFrame() {
    if (this.pause) return;
    if (this.renderTilemap == null) return;
    
    if (this.renderTileAnimPhase == 1) {
      this.mapWidth = util_lerp(this.mapWidth, this.tilemap.width, 0.16);
      this.mapHeight = util_lerp(this.mapHeight, this.tilemap.height, 0.16);
      if (Math.abs(this.mapWidth - this.tilemap.width) < 0.1 && Math.abs(this.mapHeight - this.tilemap.height) < 0.1) {
        this.mapWidth = this.tilemap.width;
        this.mapHeight = this.tilemap.height;
        this.renderTileAnimPhase = 2;
      } else {
        return;
      }
    }
    
    let width = this.renderTilemap.width;
    let height = this.renderTilemap.height;
    if (this.renderTileAnimPhase == 2) {
      width = this.tilemap.width;
      height = this.tilemap.height;
    }
    
    for (let i = 0; i < ~~width; i++) {
      let val = 0;
      if (this.renderTileAnimPhase == 2) {
        val = this.tilemap.get(
          this.renderTileAnimX,
          this.renderTileAnimY
        );
      }
      this.renderTilemap.set(
        this.renderTileAnimX,
        this.renderTileAnimY,
        val
      )
      
      this.renderTileAnimX++;
      if (this.renderTileAnimX >= width) {
        this.renderTileAnimX = 0;
        this.renderTileAnimY++;
      }
      if (this.renderTileAnimY >= height) {
        if (this.renderTileAnimPhase == 2) {
          this.renderTilemap = null;
          this.renderTileComplete = true;
        } else {
          this.renderTilemap.resize(this.tilemap.width, this.tilemap.height)
          this.renderTileAnimX = 0;
          this.renderTileAnimY = 0;
          this.renderTileAnimPhase = 1;
        }
        return;
      }
      
    }
    
  }
  step() {
    this.animTilemapFrame();
    this.pause = this.pauseTime > 0;
    this.pauseTime = Math.max(this.pauseTime - 1, 0);
    
    if (controls[0].check_pressed('pause') && entity_amount(UI) == 0) {
      entity_create(0, 0, UI);
    }
    
    if (!this.pause && this.active && entity_amount(PowerUp) < 20 && settings.powerUps > 0 && this.frame - this.lastPowerUp > 120) {
      //entity_create(0, 0, PowerUp);
      if (Math.random() < 0 + settings.powerUps ** 2 * 0.05) {
        entity_create(0, 0, PowerUp);
      }
      this.lastPowerUp = this.frame;
    }
    this.active = entity_amount(Player) > 1;
    
    let checkDeath = entity_amount(PlayerCorpse) > 0 && entity_amount(Player) == 1;
    
    if ((!this.active && this.lastActive && this.lobbyFlag) || (checkDeath && !entity_exists(RoundAnim))) {
      entity_create(0, 0, RoundAnim, { lobby: this.doLobby });
      this.doLobby = false;
    }
    
    if (!this.pause && !entity_exists(RoundAnim) && this.lobby) {
      const width = this.tilemap.width * this.tilemap.tileSize/ 2;
      let i = 0, col;
      for (i = 0; i < controls.length; i++) {
        if (controls[i].check_pressed('shoot'))
          break;
      }
      
      if (i == 0)
        col = '#f7a';
      if (i == 1)
        col = '#7af';
      if (i == 2)
        col = '#7fa';
      if (i == 3)
        col = '#fe8'
      
      if (i < controls.length) {
        let check = true;
        entity_list(Player).concat(entity_list(PlayerCorpse)).forEach(p => {
          check = check && !(p.args.playernum == i);
        })
        
        if (check) {
          entity_create(width, width, Player, {
            color: col,
            input: controls[i],
            playernum: i
          });
          this.score[i] = {
            x: new Sod(1, 0.6, -0.5),
            y: new Sod(1, 0.6, -0.5),
            a: new Sod(1.5, 0.5, 0),
            val: 0
          }
        }
        
        if (entity_amount(Player) + entity_amount(PlayerCorpse) >= 2)
          this.lobbyFlag = true;
      }
    }
    
    {
      const fix = {};
      const players = entity_list(Player).concat(entity_list(PlayerCorpse)).forEach(p => fix[p.args.playernum] = p);
      for (let k in this.score) {
        const score = this.score[k];
        
        score.x.update(1/60, fix[k].x);
        score.y.update(1/60, fix[k].y - 16);
        score.a.update(1/60, entity_exists(RoundAnim));
        
      }
    }
    
    
    
    this.lastActive = this.active;
  }
  prestep() {
    for (let c of controls)
      c.update()
  }
  predraw() {
    draw_push();
    
    draw_set_fill(40 + (settings.contrast * 20));
    draw_clear();
    
    const size = this.tilemap.tileSize * cam_zoom;
    draw_set_fill(20);
    if (settings.flashing) draw_set_stroke(this.frame % 16 <= 2 ?  '#f8d' : '#fff');
    else draw_set_stroke('#fff');
    draw_set_stroke_weight(2);
    draw_rectangle(cam_toScreen_x(0)-1, cam_toScreen_y(0)-1, size * this.mapWidth + 2, size * this.mapHeight + 2);
    
    draw_pop();
  }
  draw() {
    draw_push();
    
    draw_nostroke();
    
    let lastColor = -1;
    
    let tm = this.tilemap;
    if (this.renderTilemap)
      tm = this.renderTilemap;
    
    draw_tilemap(cam_toScreen_x(0), cam_toScreen_y(0), cam_zoom, cam_zoom, tm, (x, y, w, h, v) => {
      if (v <= 0) return;
      if (lastColor != v) {
        // works because walls are greyscale
        const s = ((30 + v * 150 + 30 * settings.contrast) / 16 | 0).toString(16);
        draw_set_fill('#' + s + s + s);
        lastColor = v;
      }
      draw_rectangle(~~x, ~~y, ~~(w+1), ~~(h+1));
    });
    
    draw_pop();
  }
  drawgui() {
    
    { // draw score
      draw_push();
      draw_set_text_halign('center');
      draw_set_text_valign('bottom');
      draw_set_stroke_weight(1);
      const fix = {};
      const players = entity_list(Player).concat(entity_list(PlayerCorpse)).forEach(p => fix[p.args.playernum] = p);
      for (let k in this.score) {
        const score = this.score[k];
        if (1 < 32 * score.a.value) {
          draw_set_text_size(32 * score.a.value);
          draw_text(
            cam_toScreen_x(score.x.value), 
            cam_toScreen_y(score.y.value), 
            score.val
          );
        }
        
      }
      draw_pop()
    }
    
    this.showControlsAnim.update(1/60, this.lobby)
    if (this.showControlsAnim.value > 0.02) { // draw controls
      
      draw_push()
      
      draw_set_text_halign('center');
      draw_text(window_width/2, window_height + 32 - this.showControlsAnim.value * 64, 'Arrows + ? or ctrl, ESDF + Q, OKL: + Y, 8456 + 0')
      draw_text(window_width/2, window_height + 32 - 16 - this.showControlsAnim.value * 64, 'Shift or Escape to open menu, Arrows + ? or ctrl to navigate menu')
      
      
      draw_pop()
      
    }
    
  }
}

class RoundAnim extends Entity {
  constructor(_, iargs) {
    super(_);
    const args = { lobby: false };
    Object.assign(args, iargs);
    
    this.depth = 20;
    this.stealCamera = false;
    this.doLobby = args.lobby;
  }
  step() {
    if (this.frame == 140) {
      if (entity_exists(Player)) {
        game.score[entity_get(Player).args.playernum].val++;
      } 
    }
    if (this.frame == 200) {
      this.stealCamera = true;
      entity_destroy(Player);
      
    }
    if (this.frame == 260) {
       entity_destroy(Actor);
      
    }
    
    const players = entity_list(PlayerCorpse);
    if (this.frame == 270) {
      entity_get(Game).animateTilemap(this.doLobby);
      for (let p of players) {
        const emptyPos = findEmptyPosition();
        if (emptyPos) {
          p.newPosX = emptyPos.x;
          p.newPosY = emptyPos.y;
          p.big = true;
        } else {
          entity_destroy(p);
        }
      }
    }
    
    if (this.frame == 300) {
     
    }
    
    let complete = true;
    players.forEach(p => complete = complete && p.complete);
    
    if (complete && this.frame >= 300 && entity_get(Game).renderTileComplete) {
      if (this.doLobby) {
        for (let p of players) {
          entity_destroy(p);
        }
        game.score = {};
      } else {
        for (let p of players) {
          entity_create(p.x, p.y, Player, p.args);
          entity_destroy(p);
        }
        entity_create(0, 0, Storm);
      }
      
      
      entity_destroy(this)
    }
  }
}

