class Bullet extends Actor {
  constructor(_) {
    super(_);
    
    this.size = -1;
    this.iframes = 2;
    this.hitboxSize = 2;
    
    this.damage = 0.256;
    
    this.x_vel = 0;
    this.y_vel = 0;
    this.dir = 0;
    
    this.canDestroy = true;
    
    this.hp = 8;
    this.timer = -1;
  }
  onHit(){}
  collision(x, y) {
    return this.collisionPoint(x, y);
  }
  step() {
    if (game.pause) return;
    
    if (this.iframes != -1)
      if (this.iframes-- == 0) this.size = this.hitboxSize;
    
    this.moveX(this.x_vel, (x, y) => {
      this.x_vel *= -1;
      
      this.tilemapRef.set_pixel(x, y, this.tilemapRef.get_pixel(x, y) - this.damage);
      
      this.hp--;
      this.onHit();
    });
    this.moveY(this.y_vel, (x, y) => {
      this.y_vel *= -1;
      
      this.tilemapRef.set_pixel(x, y, this.tilemapRef.get_pixel(x, y) - this.damage);
      
      this.hp--;
      this.onHit();
    });
    
    if (this.hp <= 0) entity_destroy(this);
    if (this.timer-- == 0) entity_destroy(this);
  }
  draw() {
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), Math.max(4 * cam_zoom, 1.5));
  }
}

class Bullet_Machine extends Bullet {
  constructor(_) {
    super(_);
    this.hitboxSize = 2;
    this.hp = 6;
  }
  draw() {
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), Math.max(3 * cam_zoom, 1.5))
  }
}

class Bullet_Laser extends Bullet {
  constructor(_) {
    super(_);
    this.hitboxSize = 8;
    this.iframes = 30;
    this.timer = 40;
    this.bounce = false;
    this.canDestroy = false;
    this.x_vel = 0;
    this.y_vel = 0;
  }
  step() {
    if (game.pause) return;
    
    super.step();
    this.x_vel *= 0.8;
    this.y_vel *= 0.8;
    
    if (this.timer == 4) {
      setCameraShake(12, 0.5)
      const arr = collision_line(this.x, this.y, this.x + util_lengthdir_x(100 * 10, this.dir), this.y + util_lengthdir_y(100 * 10, this.dir), Player);
      for (let p of arr)
        entity_destroy(p);
      
      for (let i = 0, x = this.x, y = this.y; i < 100; i++) {
        x += util_lengthdir_x(10, this.dir);
        y += util_lengthdir_y(10, this.dir);
        
        this.tilemapRef.set_pixel(x, y, 0);
      }
      
    }
  }
  draw() {
    draw_push()
    draw_set_stroke_weight((this.iframes > 0 ? 4 : 8) * cam_zoom);
    let c = '#0ce';
    if (this.iframes > 0)
      c = (!settings.flashing || this.iframes % 8 <= 4) ? c : '#f0f';
    else
      c = this.timer < 4 ? '#fee' : '#244';
    draw_set_stroke(c)
    draw_line(cam_toScreen_x(this.x), cam_toScreen_y(this.y), cam_toScreen_x(this.x + util_lengthdir_x(100 * 10, this.dir)), cam_toScreen_y(this.y + util_lengthdir_y(100 * 10, this.dir)))
    draw_pop()
  }
}

class Bullet_Bomb extends Bullet {
  constructor(_) {
    super(_);
    
    this.hitboxSize = -1;
    this.damage = 0;
    this.hp = 20;
    
    this.timeLeft = 100;
    this.damagehitboxSize = 60;
    this.hitBoxWallSize = 84;
    
    this.indicatorAnim = new Sod(1, 0.9, 0);
  }
  step() {
    if (game.pause) return;
    
    super.step()
    this.x_vel *= 0.96;
    this.y_vel *= 0.96;
    if (Math.abs(this.x_vel) < 0.01 && Math.abs(this.y_vel) < 0.01) {
      this.x_vel = 0;
      this.y_vel = 0;
    }
    this.timeLeft--
    if (this.timeLeft<=0) {
      setCameraShake(10, 0.5)
      {
        const b = entity_create(this.x, this.y, Bullet);
        b.damage = 1;
        b.timer = 2;
        b.size = this.damagehitboxSize;
        b.iframes = -1;
        b.draw = () =>{
          draw_circle(cam_toScreen_x(b.x), cam_toScreen_y(b.y), this.damagehitboxSize * cam_zoom)
        };
        entity_refresh(b);
      }
      this.tilemapRef.iterate(
        (v, x, y) => {
          const px = x * this.tilemapRef.tileSize + this.tilemapRef.tileSize / 2;
          const py = y * this.tilemapRef.tileSize + this.tilemapRef.tileSize / 2;
          const d = util_distance(this.x, this.y, px, py)
          if (d < this.hitBoxWallSize)
            return 0;
          if (d < this.hitBoxWallSize + 40)
            return v - 0.256 * 2;
        },
        this.tilemapRef.index_pixel_x(this.x - this.hitBoxWallSize*2),
        this.tilemapRef.index_pixel_y(this.y - this.hitBoxWallSize*2),
        this.tilemapRef.index_pixel_x(this.x + this.hitBoxWallSize*2),
        this.tilemapRef.index_pixel_y(this.y + this.hitBoxWallSize*2)
      );
      entity_destroy(this)
    }
  }
  draw() {
    draw_push()
    draw_set_fill('#f05')
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), 4 * cam_zoom);
    this.indicatorAnim.update(1/60, 1);
    
    draw_nofill();
    if (this.timeLeft > 20)
      draw_set_stroke('#fff');
    else if (settings.flashing)
      draw_set_stroke(this.frame % 8 <= 4 ? '#fff' : '#000');
    else 
      draw_set_stroke('#888')
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), (this.damagehitboxSize + 2) * this.indicatorAnim.value * cam_zoom);
    
    draw_pop()
  }
}

class Bullet_Mine extends Bullet {
  constructor(_) {
    super(_);
    
    this.hitboxSize = -1;
    this.damage = 0;
    this.hp = 20;
    
    this.startC = 60;
    this.hideAnim = new Sod(2, 1, 0).setValue(0);
  }
  step() {
    if (game.pause) return;
    
    super.step();
    this.x_vel *= 0.9;
    this.y_vel *= 0.9;
    if (Math.abs(this.x_vel) < 0.01 && Math.abs(this.y_vel) < 0.01) {
      this.x_vel = 0;
      this.y_vel = 0;
    }
    
    if (this.startC > 0) {
      this.hideAnim.setWeights(2, 0.5, 0);
      this.hideAnim.update(1/60, 1);
    } else {
      this.hideAnim.setWeights(2, 1, -0.5);
      this.hideAnim.update(1/60, 0);
      
    }
    
    if (this.startC-- < 0 && collision_nearest_dist(this.x, this.y, Player) < 40) {
      const b = entity_create(this.x, this.y, Bullet_Bomb);
      
      b.timeLeft = 80;
      b.hitBoxSize -= 25;
      b.hitBoxWallSize -= 20;
      
      entity_destroy(this);
    }
  }
  draw() {
    draw_push();
    
    if (this.hideAnim.value > 0.02) {
      draw_set_fill('#50f')
      draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), 4 * this.hideAnim.value * cam_zoom);

      draw_nofill()
      draw_set_stroke('#888')

      draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), 42 * this.hideAnim.value * cam_zoom);
    }
    
    draw_pop()
  }
}

class Bullet_Shotgun extends Bullet {
  constructor(_) {
    super(_);
  }
  poststep() {
    if (game.pause) return;
    
    setCameraShake(6, 0.5)
    for (let i = 0; i < 8; i++) {
      const b = entity_create(this.x, this.y, Bullet_Machine);
      const dir = this.dir + Math.random() * 0.5 - 0.25;
      const spd = Math.random() * 0.5 + 3
      b.x_vel = Math.cos(dir) * spd;
      b.y_vel = Math.sin(dir) * spd;
      b.hp = 3;
    }
    entity_destroy(this);
  }
}

class Bullet_Turret extends Bullet {
  constructor(_) {
    super(_);
    
    this.hitboxSize = 5;
    this.canDestroy = false;
    this.damage = 0;
    
    this.health = 1
    this.hp = 200;
    
    this.t = null;
    
    this.reload = 60;
  }
  step() {
    if (this.pause) return;
    
    super.step()
    
    this.x_vel *= 0.94;
    this.y_vel *= 0.94;
    if (Math.abs(this.x_vel) < 0.01 && Math.abs(this.y_vel) < 0.01) {
      this.x_vel = 0;
      this.y_vel = 0;
    }
    
    const lastSize = this.size;
    this.size = 10;
    const b = collision_place(this, this.x, this.y, Bullet)
    if (b != null) {
      if (b.canDestroy) entity_destroy(b);
      if (b.onHit) b.onHit();
      this.health--
    }
    this.size = lastSize;
    
    if (this.hp <= 0) {
      setCameraShake(6, 0.5)
      entity_destroy(this);
    }
    
    const p = collision_nearest(this.x, this.y, Player);
    if (p == null)
      return;
      
      this.t = p;
      
    const targetDir = util_direction(0, 0, p.x - this.x, p.y - this.y);
    const angleDiff = util_directionDifference(this.dir, targetDir);
    this.dir += angleDiff * 0.08;
    
    this.reload--;
    if (this.reload <= 0) {
      
      let hasSight = true;
      const d = util_distance(this.x, this.y, p.x, p.y);
      if (d < 240) {
        for (let i = 0; i < d; i = Math.min(i + 20, d)) {
          if (this.collision(this.x + Math.cos(this.dir) * i, this.y + Math.sin(this.dir) * i)) {
            hasSight = false;
            break;
          }
        }
      } else {
        hasSight = false;
      }
      
      if (hasSight) {
        this.reload = 50;
        const b = entity_create(0, 0, Bullet);
        let bsDist = 10;
        b.x = this.x + Math.cos(this.dir) * bsDist;
        b.y = this.y + Math.sin(this.dir) * bsDist;
        while (b.collision(b.x, b.y)) {
          bsDist *= 0.8;
          b.iframes -= 2;
          b.x = this.x + Math.cos(this.dir) * bsDist;
          b.y = this.y + Math.sin(this.dir) * bsDist;
        }
        b.x_vel = Math.cos(this.dir) * 1.8;
        b.y_vel = Math.sin(this.dir) * 1.8;
        b.life = 2;
        b.dir = this.dir;
      }
    }
    
    
    
  }
  draw() {
    draw_push()
    draw_set_rectCenter(true);
    draw_rectangle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), 15 * cam_zoom, 15 * cam_zoom, 3 * cam_zoom);
    draw_set_rectCenter(false);
    
    // stroke('#fff')
    // if (this.t) {
    //   const d = dist(this.x, this.y, this.t.x, this.t.y);
    //   if (d < 240) {
    //     for (let i = 0; i < d; i = Math.min(i + 20, d)) {
    //       circle(cam.toScreen_x(this.x + Math.cos(this.dir) * i), cam.toScreen_y(this.y + Math.sin(this.dir) * i), 10);
    //     }
    //   }
    // }
    
    draw_set_translate(cam_toScreen_x(this.x), cam_toScreen_y(this.y));
    draw_set_scale(0.5 * cam_zoom)
    draw_set_rotate(this.dir);
    draw_nostroke()
    draw_set_fill('#000');
    draw_circle(0, 0, 9);
    draw_rectangle(0, -5, 28, 10);
    draw_set_fill('#fff');
    draw_circle(0, 0, 8);
    draw_rectangle(0, -4, 27, 8);
    
    
    
    draw_pop()
  }
}

class Bullet_Storm extends Bullet {
  constructor(_) {
    super(_);
    
    this.hitboxSize = 7;
    this.iframes = 6;
    this.hp = 1;
  }
  onHit() {
    const s = entity_create(this.x, this.y, MiniStorm);
    s.x = this.x;
    s.y = this.y;
    setCameraShake(6, 0.5)
    entity_destroy(this);
  }
  draw() {
    draw_push()
    draw_set_fill(util_lerpColor('#f7f', '#fff', Math.sin(this.frame * 0.1) / 2 + 0.5))
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), Math.sin(this.frame * 0.2) * 0.5 + 7 * cam_zoom)
    draw_pop()
  }
}

class Bullet_AirStrike extends Bullet {
  constructor(_) {
    super(_);
    
    this.timer = 40;
    
  }
  draw() {
    
  }
}