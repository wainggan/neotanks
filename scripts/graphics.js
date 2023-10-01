// all the procedural graphics
const graphics = {
  tank(x, y, zoom, dir, color, fade) {
    draw_push();
    
    draw_set_translate(x, y);
    draw_set_scale(0.5 * (fade + 1) * zoom)
    draw_set_rotate(dir);

    draw_set_fill(color)
    draw_rectangle(-18, -17, 36, 34);
    draw_rectangle(-23, -15, 46, 30);
    
    draw_nostroke();
    draw_set_fill('#000');
    draw_circle(0, 0, 5);
    draw_rectangle(0, -5, 28, 10);
    
    draw_set_fill(color);
    draw_circle(0, 0, 4);
    draw_rectangle(0, -4, 27, 8);

    draw_pop();
  },
  tankDir(x, y, zoom, dir, color) {
    draw_push();
    
    draw_set_translate(x, y);
    draw_set_scale(zoom)
    draw_set_rotate(dir);
    draw_set_stroke_weight(0.5)
    draw_set_fill(color);
    draw_triangle(10, -2, 10, 2, 18, 0)
    //circle(20, 0, 6)

    draw_pop();
  },
  powerUp_machine(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_translate(x, y)
    draw_set_scale(zoom)
    draw_set_rotate(0)
    
    draw_set_fill(color)
    for (let i = 0; i < 5; i++) {
      draw_circle(
        Math.cos(Math.PI * 2 * (i/5))*15, 
        Math.sin(Math.PI * 2 * (i/5))*15,
        6
      );
    }
    
    draw_pop()
  },
  powerUp_laser(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_translate(x, y)
    draw_set_scale(zoom)
    draw_set_rotate(0.2)
    
    draw_set_fill(color)
    draw_triangle(0, -20, -20, 20, 20, 20);
    draw_circle(0, 6, 8)
    
    draw_pop()
  },
  powerUp_shotgun(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_translate(x, y)
    draw_set_scale(zoom)
    draw_set_rotate(Math.PI/4)
    
    const s = 16
    draw_set_fill(color);
    draw_circle(0, -s, 6);
    draw_circle(0, s, 6);
    draw_rectangle(-s, -s, s, s+s);
    draw_rectangle(0, -s, s, s+s);
    //triangle(0, -20, -20, 20, 20, 20);
    
    draw_pop()
  },
  powerUp_turret(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_translate(x, y)
    draw_set_scale(zoom)
    draw_set_rotate(Math.PI/4)
    
    draw_nostroke()
    let s = 20;
    draw_set_fill('#000');
    draw_rectangle(-s, -s/2, s+s, s);
    draw_rectangle(-s/2, -s, s, s+s);
    s = 18;
    draw_set_fill(color);
    draw_rectangle(-s, -s/2, s+s, s);
    draw_rectangle(-s/2, -s, s, s+s);
    
    draw_set_stroke('#000');
    draw_circle(0, 0, 4)
    //triangle(0, -20, -20, 20, 20, 20);
    
    
    draw_pop()
  },
  powerUp_mine(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_translate(x, y)
    draw_set_scale(zoom)
    draw_set_rotate(0)
    
    const s = 15
    draw_set_fill(color);
    draw_rectangle(-s, -s, s, s + s);
    draw_rectangle(0, -s, s, s + s);
    //triangle(0, -20, -20, 20, 20, 20);
    draw_circle(0, 0, 6)
    
    draw_pop()
  },
  powerUp_bomb(x, y, zoom, color) {
    draw_push();
    
    draw_nofill();
    draw_set_stroke_weight(8 * zoom + 2);
    draw_circle(x, y, 14 * zoom);
    
    draw_set_stroke(color);
    draw_set_stroke_weight(8 * zoom);
    draw_circle(x, y, 14 * zoom);
    
    draw_pop();
  },
  powerUp_storm(x, y, zoom, color = '#fff') {
    draw_push()
    
    draw_set_fill(color)
    draw_circle(x, y, 18 * zoom);
    
    draw_set_stroke_weight(2 * zoom)
    
    for (let i = 0; i < 7; i++) {
      draw_line(x, y, x + Math.cos(Math.PI * 2 * (i/7))*12*zoom, y + Math.sin(Math.PI * 2 * (i/7))*12*zoom)
    }
    
    draw_pop()
  },
  powerUp(x, y, zoom, color) {
    draw_push();
    
    draw_set_fill(color);
    draw_circle(x, y, 20 * zoom);
    
    draw_pop();
  },
};

function getPowerup(num) {
  switch (num) { // fml
    case 0: return Bullet_Machine;
    case 1: return Bullet_Mine;
    case 2: return Bullet_Laser;
    case 3: return Bullet_Turret;
    case 4: return Bullet_Shotgun;
    case 5: return Bullet_Bomb;
    case 6: return Bullet_Storm;
    case 7: return Bullet_AirStrike;
  }
  return Bullet;
}

function getPowerupIndex(type) {
  switch (type) { // fml
    case Bullet_Machine: return 0;
    case Bullet_Mine: return 1;
    case Bullet_Laser: return 2;
    case Bullet_Turret: return 3;
    case Bullet_Shotgun: return 4;
    case Bullet_Bomb: return 5;
    case Bullet_Storm: return 6;
    case Bullet_AirStrike: return 7;
  }
  return Bullet;
}

function getPowerupGraphic(type) {
  switch (type) { // fml
    case Bullet_Machine: return graphics.powerUp_machine;
    case Bullet_Mine: return graphics.powerUp_mine;
    case Bullet_Laser: return graphics.powerUp_laser;
    case Bullet_Turret: return graphics.powerUp_turret;
    case Bullet_Shotgun: return graphics.powerUp_shotgun;
    case Bullet_Bomb: return graphics.powerUp_bomb;
    case Bullet_Storm: return graphics.powerUp_storm;
  }
  return graphics.powerUp;
}