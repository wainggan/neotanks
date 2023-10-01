class InputManager {
  constructor() {
    this.inputs = new Map();
  }
  update() {
    for (let [k, v] of this.inputs) {
      v.update();
    }
  }
  create_input(name) {
    const input = new Input(this);
    this.inputs.set(name, input);
    return input;
  }
  
  check(name) {
    return this.inputs.get(name).check();
  }
  check_pressed(name, buffer = undefined) {
    return this.inputs.get(name).check_pressed(buffer);
  }
  check_released(name, buffer = undefined) {
    return this.inputs.get(name).check_released(buffer);
  }
  check_stutter(name, delay_initial = undefined, delay_interval = undefined) {
    return this.inputs.get(name).check_stutter(delay_initial, delay_interval);
  }
}

class Input {
  constructor(manager) {
    this.manager = manager;
    this.keys = [];
    this.time = 0;
    this.buffer = 1;
  }
  update() {
    let active = false;
    for (let k of this.keys) {
      if (k.check()) {
        active = true;
        break;
      }
    }
    if (active)
      this.time++;
    else if (this.time > 0)
      this.time = -this.buffer;
    else
      this.time = Math.min(this.time + 1, 0);
  }
  buffer_set(buffer) {
    this.buffer = buffer;
    return this;
  }
  add_key(key) {
    this.keys.push({
      button: key,
      check() {
        return input_key_check(this.button); // change if not using p5js
      }
    });
    return this;
  }
  
  check() {
    return this.time > 0;
  }
  check_pressed(buffered = false) {
    if (buffered)
      return this.time > 0 && this.time <= this.buffer;
    return this.time == 1;
  }
  check_released(buffered = false) {
    if (buffered)
      return this.time < 0;
    return this.time == -this.buffer;
  }
  check_stutter(delay_initial, delay_interval) {
    if (this.time == 1)
      return true;
    return this.time - delay_initial > 0 && 
      (this.time - delay_initial) % delay_interval == 0;
  }
}