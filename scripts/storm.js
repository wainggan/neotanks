class Storm extends Actor {
  constructor(_) {
    super(_);
    
    this.depth = 10;
    
    const w = this.tilemapRef.width * this.tilemapRef.tileSize;
    const h = this.tilemapRef.height * this.tilemapRef.tileSize;
    
    this.x = w / 2;
    this.y = h / 2;
    
    this.active = true;
    
    this.rad = Math.sqrt((w / 2) ** 2 + (h / 2) ** 2) + 64;
    
    this.fadeAnim = 0;
    this.fadeAnimActive = false;
    
    this.sizeAnim = new Sod(1, 1, 0).setValue(1);
  }
  destroy() {
    if (this.fadeAnimActive)
      return false;
    this.fadeAnimActive = true;
    return true;
  }
  step() {
    if (game.pause) return;
    
    const players = entity_list(Player);
    if (entity_get(Game).active) this.rad -= settings.stormSpeed / 10;
    for (let p of players) {
      if (util_distance(this.x, this.y, p.x, p.y) > this.rad) {
        entity_destroy(p);
      }
    }
    const powerups = entity_list(PowerUp);
    for (let p of powerups) {
      if (util_distance(this.x, this.y, p.x, p.y) > this.rad) {
        p.canSmallAnim = false;
      }
    }
    
    if (this.rad <= 0) entity_destroy(this);
    
    this.frame++;
    
    if (this.fadeAnimActive) {
      this.fadeAnim = util_lerp(this.fadeAnim, 0, 0.2);
      if (this.fadeAnim < 0.05)
        entity_destroy(this)
    } else {
      this.fadeAnim = util_lerp(this.fadeAnim, 1, 0.2);
    }
    
    this.sizeAnim.update(1/60, 0);
      
  }
  draw() {
    draw_push();
    draw_nofill();
    if (settings.contrast > 0) {
      let c = util_fromCss('#802');
      c = util_lerpArray(c, [0,0,0,255], settings.contrast / 4);
      draw_set_stroke(util_toCss(...c));
      draw_set_stroke_weight((Math.max(4, 6 * cam_zoom) + settings.contrast) * this.fadeAnim);
      draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), (this.rad + this.sizeAnim.value * 1000) * cam_zoom);
    }
    let c = '#f0d';
    if (
      settings.flashing && 
      (this.frame % 60 <= 4 || 
      (this.frame % 60 >= 12 && this.frame % 60 <= 16))
    ) c = '#f7f';
    if (!entity_get(Game).active)
      c = '#346'
    //c = util_lerpArray(c, [255,255,255,255], settings.contrast / 4);
    //c = util_toCss(...c);
    //console.log(c)
    draw_set_stroke(c);
    draw_set_stroke_weight(Math.max(4, 6 * cam_zoom) * this.fadeAnim);
    draw_circle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), (this.rad + this.sizeAnim.value * 1000) * cam_zoom);
    draw_pop()
  }
}

class MiniStorm extends Storm {
  constructor(_) {
    super(_);
    this.frame = entity_exists(Storm) ? entity_get(Storm).frame : time_frame;
    this.radSpd = 2;
    this.rad = 1;
    
    this.fadeAnim = 1;
    this.sizeAnim = new Sod(1, 1, 0).setValue(0);
  }
  step() {
    if (game.pause) return;
    
    const players = entity_list(Player);
    if (entity_get(Game).active) this.rad += settings.stormSpeed / 10;
    this.radSpd = Math.max(this.radSpd - 0.1, 0);
    this.rad += this.radSpd;
    for (let p of players) {
      if (util_distance(this.x, this.y, p.x, p.y) < this.rad) {
        entity_destroy(p);
      }
    }
    const powerups = entity_list(PowerUp);
    for (let p of powerups) {
      if (util_distance(this.x, this.y, p.x, p.y) < this.rad) {
        p.canSmallAnim = false;
      }
    }
    
    if (this.rad <= 0) entity_destroy(this);
    
    this.frame++;
    
    if (this.fadeAnimActive) {
      this.fadeAnim = util_lerp(this.fadeAnim, 0, 0.2);
      if (this.fadeAnim < 0.05)
        entity_destroy(this)
    }
  }
}