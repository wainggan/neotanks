/*
0 Machine Gun -
1 Mines -
2 Laser -
3 Turret -
4 Shotgun -
5 Bomb -
6 Mini Storm -
7 Air strike
8 Walk through walls
9 Flamethrower
*/
class PowerUp extends Actor {
  constructor(_) {
    super(_);
    
    this.depth = -1;
    
    const a = [0, 1, 2, 3, 4, 5, 6];
    const o = util_weightedChoose(a, settings.powerUpWeights.concat([]));
    this.type = getPowerup(o);
    if (o == undefined)
      this.type = Bullet;
    
    this.size = 6;
    
    const emptyPos = findEmptyPosition();
    if (emptyPos) {
      this.x = emptyPos.x;
      this.y = emptyPos.y;
    } else {
      entity_destroy(this);
    }
    
    this.iconSmallAnim = new Sod(2, 0.8, 0);
    this.startAnim = new Sod(2, 0.5, 0).setValue(0);
    this.xAnim = new Sod(3, 1, 0).setValue(cam_toScreen_x(this.x));
    this.yAnim = new Sod(3, 1, 0).setValue(cam_toScreen_y(this.y));
    this.canSmallAnim = true;
    this.animReturn = false;
    this.color = 0;
    
    this.frame = 0;
  }
  step() {
    const b = collision_place(this, this.x, this.y, Player)
    if (b != null) {
      entity_destroy(this);
      setCameraShake(4, 0.5);
      b.type = this.type;
      b.typeShot = 0;
    }
  }
  draw() {
    this.startAnim.update(1/60, 1);
    draw_push()
    this.color = util_toCss(...util_hsvToRgb(this.frame/2 % 360, 0.4, 1));
    draw_set_fill(this.color);
    draw_set_rectCenter(true);
    draw_rectangle(cam_toScreen_x(this.x), cam_toScreen_y(this.y), 16 * cam_zoom * this.startAnim.value, 16*cam_zoom * this.startAnim.value, 4 * cam_zoom);
    draw_pop();
  }
  postdraw() {
    let w = getPowerupGraphic(this.type);
    
    let clamped = false;
    let tx = cam_toScreen_x(this.x);
    let ty = cam_toScreen_y(this.y);
    const d = util_distance(tx, ty, surface_default.width/2, surface_default.height/2);
    let clampedDist = 0;
    if (
      this.canSmallAnim && (
      (tx < 5 || surface_default.width - 5 < tx) ||
      (ty < 15 || surface_default.height - 5 < ty))
    ) {
      const lx = tx, ly = ty;
      tx = tx - surface_default.width / 2;
      ty = ty - surface_default.height / 2;
      //tx = Math.min(Math.max(tx, 30), width - 30);
      //ty = Math.min(Math.max(ty, 30), height - 30);
      tx /= d;
      ty /= d;
      tx *= (entity_get(Camera).cameraScale+150)/2;
      ty *= (entity_get(Camera).cameraScale+150)/2;
      tx += surface_default.width / 2;
      ty += surface_default.height / 2;
      clamped = true;
      this.xAnim.setWeights(2, 0.6, 0);
      this.yAnim.setWeights(2, 0.6, 0);
      this.xAnim.update(1/60, tx);
      this.yAnim.update(1/60, ty);
      this.animReturn = true;
      draw_push()
      draw_set_stroke('#ccc');
      draw_set_stroke_weight(1);
      draw_line(this.xAnim.value, this.yAnim.value, lx, ly);
      clampedDist = util_distance(this.xAnim.value, this.yAnim.value, lx, ly);
      draw_pop()
    } else {
      if (this.animReturn) {
        this.xAnim.value = util_lerp(this.xAnim.value, tx, 0.4);
        this.yAnim.value = util_lerp(this.yAnim.value, ty, 0.4);
        if (util_distance(tx, ty, this.xAnim.value, this.yAnim.value) < 1)
          this.animReturn = false;
      } else {
        this.xAnim.setValue(tx);
        this.yAnim.setValue(ty);
      }
    }
    
    let zoomedEnough = !(Math.max(0.7, 0.6 * cam_zoom) <= 0.7);
    let closeToPlayer = collision_nearest_dist(this.x, this.y, Player) < 30 / cam_zoom;
    
    let sma = 1;
    if (clamped)
      // .value ~= 1 when 'big'
      this.iconSmallAnim.update(1/60, 0);
    else if (zoomedEnough || closeToPlayer) {
      this.iconSmallAnim.update(1/60, 0);
    } else {
      this.iconSmallAnim.update(1/60, 1);
    }
    
    let zO = Math.max(0.7*cam_zoom**0.3, 0.6 * cam_zoom) - ((1-this.iconSmallAnim.value)*0.4);
    
    if (clamped)
      zO = Math.min(Math.max(1 - clampedDist / 1000, 0.7), 1) - 0.3;
    
    w(
      this.xAnim.value, 
      this.yAnim.value - (this.iconSmallAnim.value * 20), 
      zO * this.startAnim.value,
      this.color
    );
    
    // push()
    // fill('#000');
    // strokeWeight(2)
    // stroke('#fff')
    // text(clampedDist, this.xAnim.value, this.yAnim.value);
    // text(1 - clampedDist, this.xAnim.value, this.yAnim.value + 16);
    // text(1 - clampedDist / 1800, this.xAnim.value, this.yAnim.value + 32);
    // pop()
  }
}