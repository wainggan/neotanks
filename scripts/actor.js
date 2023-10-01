class Actor extends Entity {
  constructor(_) {
    super(_);
    this.x_rem = 0;
    this.y_rem = 0;
    this.tilemapRef = entity_get(Game).tilemap;
  }
  collisionPoint(x, y) {
    if (x < 0) return true;
    if (x >= this.tilemapRef.width * this.tilemapRef.tileSize) return true;
    if (y < 0) return true;
    if (y >= this.tilemapRef.width * this.tilemapRef.tileSize) return true;
    if (this.tilemapRef.get_pixel(x, y) > 0) return true;
    return false;
  }
  collision(x, y) {
    return (
      this.collisionPoint(x - this.size, y - this.size) ||
      this.collisionPoint(x + this.size, y - this.size) ||
      this.collisionPoint(x + this.size, y + this.size) ||
      this.collisionPoint(x - this.size, y + this.size)
    )
  }
  moveX(amount, onCollide = null) {
    // this makes sure that any movement by any fraction
    // keeps the entity in an integer position, simplifying
    // collision response
    this.x_rem += amount; 
    let move = Math.round(this.x_rem); 
    if (move != 0) { 
      this.x_rem -= move; 
      const sign = Math.sign(move); 
      while (move != 0) { 
        if (!this.collision(this.x + sign, this.y)) { 
          this.x += sign; 
          move -= sign; 
        } else { 
          if (onCollide != null) 
            onCollide(this.x + sign, this.y); 
          break; 
        }
      }
    }
  }
  moveY(amount, onCollide = null) {
    this.y_rem += amount; 
    let move = Math.round(this.y_rem); 
    if (move != 0) { 
      this.y_rem -= move; 
      const sign = Math.sign(move); 
      while (move != 0) { 
        if (!this.collision(this.x, this.y + sign)) { 
          this.y += sign; 
          move -= sign; 
        } else { 
          if (onCollide != null) 
            onCollide(this.x, this.y + sign); 
          break; 
        }
      }
    }
  }
}