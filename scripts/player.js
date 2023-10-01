function findEmptyPosition() {
  const tilemap = entity_get(Game).tilemap;
  let x = ~~(Math.random() * tilemap.width);
  let y = ~~(Math.random() * tilemap.height);
  let fix = 50;
  while (
    tilemap.get(x, y) > 0 || 
    (entity_exists(Player) && collision_nearest_dist(
      x * tilemap.tileSize + tilemap.tileSize / 2, 
      y * tilemap.tileSize + tilemap.tileSize / 2,
      Player ) < 120) || 
    (entity_exists(PowerUp) && collision_nearest_dist(
      x * tilemap.tileSize + tilemap.tileSize / 2, 
      y * tilemap.tileSize + tilemap.tileSize / 2,
      PowerUp ) < 70)
  ) {
    x = ~~(Math.random() * tilemap.width);
    y = ~~(Math.random() * tilemap.height);
    if (fix-- < 0)
      return null;
  }
  return { 
    x: x * tilemap.tileSize + tilemap.tileSize / 2, 
    y: y * tilemap.tileSize + tilemap.tileSize / 2 
  };
}

class Player extends Actor {
  constructor(_, args) {
    super(_);
    this.color = args.color;
    this.input = args.input;
    this.playernum = args.playernum;
    this.args = args;
    
    this.size = 6;
    
    this.x_vel = 0;
    this.y_vel = 0;
    this.dir = Math.PI / 2;
    this.dir_vel = 0;
    this.spd_vel = 0;
    this.spd = 0;
    
    this.ammo_max = 8;
    this.ammo = 8;
    this.ammoTimer = 0;
    this.ammoTimerRefresh = 60;
    this.reload = 0;
    this.reload_max = 8;
    this.lastShot = 0;
    this.shootSafe = this.input.check('shoot');
    
    this.type = null//Bullet_AirStrike;
    this.typeShot = 0;
    
    this.type_as_rX = 0;
    this.type_as_rY = 0;
    
    this.g_scoreX = new Sod(1, 0.6, -2);
    this.g_scoreY = new Sod(1, 0.6, -2);
    this.g_scoreA = new Sod(2, 1, 0).setValue(0);
    this.g_scoreATarget = 1;
    
    this.g_typeX = new Sod(2, 0.5, -1);
    this.g_typeY = new Sod(2, 0.5, -1);
    this.g_typeA = new Sod(2, 0.4, 0);
    
    this.g_camPX = new Sod(2, 1, 0);
    this.g_camPY = new Sod(2, 1, 0);
    this.g_camd = 20;
    
    this.g_dirAnim = new Sod(2, 0.7, 0)

    this.sprite = undefined;
    this.fadeIn = 0;
    
    if (this.x == -1) {
      const emptyPos = findEmptyPosition();
      if (emptyPos) {
        this.x = emptyPos.x;
        this.y = emptyPos.y;
      } else {
        entity_destroy(this);
      }
    }
  }
  destroy() {
    setCameraShake(14, 0.5);
    entity_create(this.x, this.y, PlayerCorpse, this.args);
  }
  step(maze) {
    if (game.pause) return;
    
    this.fadeIn = Math.min(this.fadeIn + 0.1, 1);
    
    let kTurn = this.input.check('right') - this.input.check('left');
    let kMove = this.input.check('up') - this.input.check('down');
    let kShoot = false;
    //this.reload--;
    getout: {
      if (!this.shootSafe) {
        if (this.type == Bullet_Machine) { 
          if (this.input.check_stutter('shoot', 0, 6))
            kShoot = true;
          break getout;
        }
        if (this.type == Bullet_Laser) {
          if (this.input.check_released('shoot'))
            kShoot = true;
          break getout;
        }
        if (this.type == Bullet_AirStrike) {
          if (this.input.check_pressed('shoot')) {
            this.type_as_rX = this.x;
            this.type_as_rY = this.y;
          }
          if (this.input.check_released('shoot'))
            kShoot = true;
          break getout;
        }
        if (this.type == Bullet_Turret) {
          if (this.lastShot > 20 && this.input.check_stutter('shoot', 10, 7))
            kShoot = true;
          break getout;
        }
        if (this.type == Bullet_Shotgun) {
          if (this.lastShot > 30 && this.input.check_stutter('shoot', 10, 7))
            kShoot = true;
          break getout;
        }
        if (this.input.check_stutter('shoot', 10, 7)) {
          kShoot = true;
        }
      }
    }
    if (this.input.check_released('shoot'))
      this.shootSafe = false;
    this.lastShot++;
    if (kShoot) this.lastShot = 0;
    
    let dirTargetTopSpeed = 0.078;
    let dirTargetAccel = 0.022
    if (this.type == Bullet_Laser && this.input.check('shoot')) {
      dirTargetTopSpeed = 0.008;
      dirTargetAccel = 0.003;
    }
    if (this.type == Bullet_AirStrike && this.input.check('shoot')) {
      dirTargetTopSpeed = 0;
      dirTargetAccel = 0.005;
    }
    this.dir_vel = util_approach(this.dir_vel, kTurn == 0 ? 0 : kTurn * dirTargetTopSpeed, dirTargetAccel);
    this.dir += this.dir_vel
    
    let spdTargetTopSpeed = 2;
    let spdTargetAccel = 0.8
    if (this.type == Bullet_AirStrike && this.input.check('shoot')) {
      spdTargetTopSpeed = 0;
      spdTargetAccel = 0.01;
    }
    this.spd_vel = util_approach(this.spd_vel, kMove == 0 ? 0 : kMove * spdTargetTopSpeed, spdTargetAccel);
    
    this.x_vel = util_lerp(this.x_vel, Math.cos(this.dir) * this.spd_vel, 0.8);
    this.y_vel = util_lerp(this.y_vel, Math.sin(this.dir) * this.spd_vel, 0.8);
    
    if (this.type == Bullet_AirStrike && this.input.check('shoot')) {
      this.type_as_rX += kTurn * 10;
      this.type_as_rY += -kMove * 10;
    }
    
    this.moveX(this.x_vel, () => {
      this.x_vel = 0;
    });
    this.moveY(this.y_vel, () => {
      this.y_vel = 0;
    });
    
    this.g_scoreX.update(1/60, this.x, this.x_vel);
    this.g_scoreY.update(1/60, this.y - 16, this.y_vel);
    this.g_scoreA.update(1/60, this.g_scoreATarget);
    
    let BulletType = this.type ? this.type : Bullet;
    let ammoRefresh = this.ammoTimerRefresh;
    let bsDist = 12;
    let bulletSpeed = 2.75;
    let tX = this.x;
    let tY = this.y;
    let bcollide = true;
    
    switch (BulletType) { // fml
      case Bullet_Machine: {
        ammoRefresh = 0;
        break;
      }
      case Bullet_Mine: {
        bsDist = -16;
        ammoRefresh = 60;
        bulletSpeed = -4;
        break;
      }
      case Bullet_Laser: {
        bsDist = 22;
        ammoRefresh = 60;
        bulletSpeed = 0.5;
        break;
      }
      case Bullet_Turret: {
        break;
      }
      case Bullet_Shotgun: {
        ammoRefresh = 60;
        break;
      }
      case Bullet_Bomb: {
        bulletSpeed = 7;
        break;
      }
      case Bullet_Storm: {
        bulletSpeed = 1;
        break;
      }
      case Bullet_AirStrike: {
        tX =  this.type_as_rX;
        tY =  this.type_as_rY;
        bulletSpeed = 0;
        bsDist = 0;
        bcollide = false;
        break;
      }
    }
    
    this.ammoTimer++
    if (this.ammoTimer > ammoRefresh) {
      this.ammoTimer = 0;
      this.ammo = Math.min(this.ammo_max, this.ammo + 1);
    }
    
    if (kShoot && this.ammo >= 1) {
      this.typeShot++;
      this.ammoTimer = 0;
      this.ammo--;
      const b = entity_create(
        this.x, 
        this.y, 
        BulletType
      );
      b.x = tX + Math.cos(this.dir) * bsDist;
      b.y = tY + Math.sin(this.dir) * bsDist;
      if (bcollide) while (b.collision(b.x, b.y)) {
        bsDist *= 0.8;
        b.x = tX + Math.cos(this.dir) * bsDist;
        b.y = tY + Math.sin(this.dir) * bsDist;
      }
      b.x_vel = Math.cos(this.dir) * bulletSpeed;
      b.y_vel = Math.sin(this.dir) * bulletSpeed;
      b.dir = this.dir;
    }
    
    const b = collision_place(this, this.x, this.y, Bullet)
    if (b != null) {
      if (b.canDestroy) entity_destroy(b);
      if (b.onHit) b.onHit();
      entity_destroy(this)
    }
    
    switch (BulletType) { // fml
      case Bullet_Machine: {
        if (this.typeShot >= 12) {
          this.type = null;
          this.ammo = 0;
        }
        break;
      }
      case Bullet_Mine: {
        if (this.typeShot >= 2) this.type = null;
        break;
      }
      case Bullet_Laser: {
        if (this.typeShot >= 2) this.type = null;
        break;
      }
      case Bullet_Turret: {
        if (this.typeShot >= 2) {
          this.type = null;
          this.ammo = 0;
        }
        break;
      }
      case Bullet_Shotgun: {
        if (this.typeShot >= 2) {
          this.type = null;
          this.ammo = 0;
        }
        break;
      }
      case Bullet_Bomb: {
        if (this.typeShot >= 3) this.type = null;
        break;
      }
      case Bullet_Storm: {
        if (this.typeShot >= 1) this.type = null;
        break;
      }
    }
    
    if (this.frame == 0) {
      this.g_scoreX.setValue(this.x);
      this.g_scoreY.setValue(this.y);
    }
    if (this.frame == 120) {
      this.g_scoreATarget = 0;
    }
    
    this.g_camPX.update(1/60, Math.cos(this.dir) * this.g_camd);
    this.g_camPY.update(1/60, Math.sin(this.dir) * this.g_camd);
    
  }
  draw() {
    
    if (this.type == Bullet_Laser && this.input.check('shoot')) {
      draw_push();
      
      draw_set_stroke('#999');
      draw_set_stroke_weight(Math.max(2 * cam_zoom / 2, 1))
      draw_line(cam_toScreen_x(this.x), cam_toScreen_y(this.y), cam_toScreen_x(this.x + Math.cos(this.dir) * 10000), cam_toScreen_y(this.y + Math.sin(this.dir) * 10000));
      
      draw_pop();
    }
    if (this.type == Bullet_AirStrike && this.input.check('shoot')) {
      draw_push();
      
      const x = this.type_as_rX;
      const y = this.type_as_rY;
      
      draw_set_stroke('#999');
      draw_set_stroke_weight(Math.max(2 * cam_zoom / 2, 1))
      draw_line(cam_toScreen_x(this.x), cam_toScreen_y(this.y), cam_toScreen_x(x), cam_toScreen_y(y));
      
      draw_pop();
    }
    graphics.tank(cam_toScreen_x(this.x), cam_toScreen_y(this.y), cam_zoom * this.fadeIn, this.dir, this.color, 0);
    this.g_dirAnim.update(1/60, cam_zoom < 0.6 && settings.showTankDir);
    if (this.g_dirAnim.value > 0.01) {
      graphics.tankDir(cam_toScreen_x(this.x), cam_toScreen_y(this.y), this.g_dirAnim.value, this.dir, this.color);
    }
    
    
    this.g_typeX.update(1/60, this.x - Math.cos(this.dir) * 32);
    this.g_typeY.update(1/60, this.y - Math.sin(this.dir) * 32);
    this.g_typeA.update(1/60, this.type != null);
    if (this.type != null) {
      let w = getPowerupGraphic(this.type);

      w(
        cam_toScreen_x(this.g_typeX.value), 
        cam_toScreen_y(this.g_typeY.value), 
        cam_zoom * 0.7 * this.g_typeA.value,
        this.color
      );
    }
    //const c = color(this.color);
    //c.setAlpha(255-this.fadeIn*255)
    //tint(c);
    
    
  }
}
class PlayerCorpse extends Entity {
  constructor(_, args) {
    super(_);
    this.args = args;
    this.color = args.color;
    this.depth = -2;
    
    this.big = false;
    this.bigAnim = new Sod(2, 0.8, 0.5).setValue(1);
    
    this.newPosX = this.x;
    this.newPosY = this.y;
    this.complete = false;
    
    this.die = false;
  }
  destroy() {
    if (this.die)
      return false;
    this.die = true;
    return true;
  }
  step() {
    if (game.pause) return;
    
    this.x = util_lerp(this.x, this.newPosX, 0.1);
    this.y = util_lerp(this.y, this.newPosY, 0.1);
    if (Math.abs(this.newPosX - this.x) < 0.2 && Math.abs(this.newPosY - this.y) < 0.2) {
      this.complete = true;
      this.x = this.newPosX;
      this.y = this.newPosY;
    }
    else this.complete = false;
    
    if (this.die) {
      this.bigAnim.setWeights(3, 1, 0)
      this.bigAnim.update(1/60, 0)
      if (this.bigAnim.value < 0.05) 
        entity_destroy(this);
    } else {
      this.bigAnim.update(1/60, this.big)
    }
  }
  draw() {
    draw_push();
    
    const fillC = util_lerpColor(this.color, '#222', 0.8 - this.bigAnim.value * 0.7);
    const strokeC = '#000'//util_lerpColor('#000', '#666', this.bigAnim.value);
    
    draw_set_fill(fillC);
    draw_set_stroke(strokeC);
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), (4 + 3 * this.bigAnim.value) * cam_zoom ** 0.3);
    
    draw_pop()
  }
}