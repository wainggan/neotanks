class Sod { // Second order dynamics
  constructor(f = 1, z = 1, r = 0) {
    this.k1 = 0;
    this.k2 = 0;
    this.k3 = 0;
    this.setWeights(f, z, r);
    
    this.value = 0;
    this.value_vel = 0;
    this._lastX = 0;
    
    this.accurate = false;
    this._crit = 0;
  }
  setK(k1 = this.k1, k2 = this.k2, k3 = this.k3) {
    this.k1 = k1;
    this.k2 = k2;
    this.k3 = k3;
    this._crit = 
      this.accurate && 0.8 * (Math.sqrt(4 * this.k2 + this.k1 ** 2) - this.k1);
    return this;
  }
  setWeights(f, z, r) {
    this.k1 = z / (Math.PI * f);
    this.k2 = 1 / (2 * Math.PI * f) ** 2;
    this.k3 = (r * z) / (2 * Math.PI * f);
    this._crit = 
      this.accurate && 0.8 * (Math.sqrt(4 * this.k2 + this.k1 ** 2) - this.k1);
    return this;
  }
  setAccuracy(v) {
    this.accurate = v;
    this._crit = 
      this.accurate && 0.8 * (Math.sqrt(4 * this.k2 + this.k1 ** 2) - this.k1);
    return this;
  }
  setValue(value) {
    this.value = value;
    return this;
  }
  getValue() {
    return this.value;
  }
  update(time, x, x_vel = null) {
    if (x_vel == null) {
      x_vel = (x - this._lastX) / time;
      this._lastX = x;
    }
    if (this.accurate) {
      const iterations = Math.ceil(time / this._crit);
      time = time / iterations;
      for (let i = 0; i < iterations; i++) {
        this.value += this.value_vel * time;
        const value_accel = 
          (x + this.k3 * x_vel - this.value - this.k1 * this.value_vel) / this.k2 ;
        this.value_vel += time * value_accel;
      }
    } else {
      this.value += this.value_vel * time;
      const newk2 = 
        Math.max(this.k2, 1.1 * (time ** 2 / 4 + time * this.k1 / 2)) ;
      const value_accel = 
        (x + this.k3 * x_vel - this.value - this.k1 * this.value_vel) / newk2 ;
      this.value_vel += time * value_accel;
    }
    return this.value;
  }
}