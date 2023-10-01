

class Menu {
  constructor() {
    this.position = 0;
    this.elements = [];
    
    this.test = surface_create(100, 100);
  }
  
  scroll(_direction, _wrap = true) {
    this.position += _direction;
    let fix = 0;
    while (fix++ < 20 && this.elements[this.position] instanceof MenuLabel) {
      this.position += _direction;
    }
    if (_wrap) {
      this.position = this.position - Math.floor(this.position / this.elements.length) * this.elements.length;
    }
    else {
      this.position = Math.min(Math.max(this.position, 0), this.elements.length - 1);
    }
    while (fix++ < 20 && this.elements[this.position] instanceof MenuLabel) {
      this.position += _direction;
    }
  }
  change(_amount) {
    if (_amount != 0) {
      this.elements[this.position].change(_amount);
      this.elements[this.position].onChange(this.elements[this.position].value);
    }
  }
  click() {
    this.elements[this.position].onClick();
  }
  
  add_label(_text) {
    this.elements.push(new MenuLabel(_text));
    return this;
  }
  add_button(_text, _onClick) {
    this.elements.push(new MenuButton(_text, _onClick))
    return this;
  }
  add_slider(_text = "", _minimum = 0, _maximum = 10, _interval = 1, _start = _minimum, _width = undefined, _onChange = undefined) {
    this.elements.push(new MenuSlider(_text, _minimum, _maximum, _interval, _start, _width, _onChange))
    return this;
  }
  add_radio(_text = "", _options = [], _start = 0, _onChange = undefined) {
    this.elements.push(new MenuRadio(_text, _options, _start, _onChange))
    return this;
  }
  
  draw(_x, _y, _padding) {
    draw_push();
    this.test.resize(window_width, window_height)
    draw_set_target(this.test)
    draw_wipe()
    draw_set_text_valign('center');
    for (let i = 0; i < this.elements.length; i++) {
      draw_push()
      this.elements[i].draw(_x, _y + _padding * i, i == this.position);
      draw_pop()
    }
    draw_reset_target()
    draw_pop()
    draw_surface(0, 0, 1, 1, this.test)
  }
}


class MenuElement {
  constructor(_onClick = function(){}, _onChange = function(){}) {
    this.onClick = _onClick;
    
    this.value = 0;
    this.onChange = _onChange;
  }
  change() {}
  draw() {}
}

class MenuLabel extends MenuElement {
  constructor(_text = "") {
    super()
    
    this.text = _text;
  }
  draw(_x, _y, _selected) {
    draw_nostroke()
    draw_set_fill('#ccc');
    draw_set_text_size(20);
    draw_text(_x - 32, _y, this.text);
  }
}
class MenuButton extends MenuElement {
  constructor(_text = "", _onClick = undefined) {
    super(_onClick)
    
    this.text = _text;
    this.anim = new Sod(2, 0.5, 0.5);
  }
  draw(_x, _y, _selected) {
    this.anim.update(1/60, _selected)
    draw_nostroke()
    draw_set_fill(_selected ? '#f5a' : '#fff');
    draw_set_text_size(24);
    draw_text(_x + this.anim.value * 16, _y, this.text)
  }
}
class MenuSlider extends MenuElement {
  constructor(_text = "", _minimum = 0, _maximum = 10, _interval = 1, _start = _minimum, _width = 150, _onChange = function(){}) {
    super(undefined, _onChange)
    
    this.text = _text + ' : ';
    
    this.minimum = _minimum;
    this.maximum = _maximum;
    this.interval = _interval;
    
    this.value = _start;
    
    this.moveAnim = new Sod(3, 0.8, 2);
    this.activeAnim = new Sod(2, 0.8, 1);
    this.width = _width;
    
    this.onChange = _onChange;
  }
  
  change(_amount) {
    this.value = Math.min(Math.max(this.value + _amount * this.interval, this.minimum), this.maximum);
  }
  
  draw(_x, _y, _selected) {
    const spacing = 16;
    this.activeAnim.update(1/60, _selected)
    
    draw_set_text_size(24);

    draw_set_fill(_selected ? '#f5a' : '#fff');
    draw_text(_x, _y, this.text);

    _x += draw_get_text_width(this.text) + spacing;
    
    draw_set_stroke(_selected ? '#f5a' : '#fff');
    draw_set_stroke_weight(4 + this.activeAnim.value * 2)
    draw_line(_x, _y - 2 - this.activeAnim.value * 3, _x + this.width, _y - 2 - this.activeAnim.value * 3);

    let pos = util_lerp(_x, _x + this.width, (this.value - this.minimum) / (this.maximum - this.minimum));
    this.moveAnim.update(1/60, pos);
    draw_set_stroke('#fff');
    draw_set_stroke_weight(6 + this.activeAnim.value * 2);
    draw_line(this.moveAnim.value, _y - 10 - this.activeAnim.value * 4,this.moveAnim.value, _y + 6);
    
    draw_nostroke()
    draw_set_fill(_selected ? '#f5a' : '#fff');
    draw_set_text_size(20);
    draw_text(_x + this.width + spacing + -2 + this.activeAnim.value * 12, _y, this.value);
  }
}

class MenuRadio extends MenuElement {
  constructor(_text = "", _options = [], _start = 0, _onChange = function(){}) {
    super(undefined, _onChange);
    
    this.text = _text + ' : ';
    this.options = _options;
    this.onChange = _onChange;
    
    this.value = _start;
    
    this.anim = new Sod(3, 0.5, 1)
  }
  
  change(_amount) {
    this.value = Math.min(Math.max(this.value + _amount, 0), this.options.length - 1);
  }
  draw(_x, _y, _selected) {
    const spacing = 38;

    draw_set_fill(_selected ? '#f5a' : '#fff');
    draw_set_text_size(24)
    draw_text(_x, _y, this.text);

    _x += draw_get_text_width(this.text) + spacing;

    for (var i = 0; i < this.options.length; i++) {
      let str = this.options[i];
      draw_set_fill(_selected ? '#f5a' : '#fff');
      draw_text(_x, _y, str);

      if (i == this.value) {
        this.anim.update(1/60, _x - 32 + (_selected ? 8 : 0))
        draw_set_fill('#fff')
        draw_text(this.anim.value, _y, '>');
      }
      _x += draw_get_text_width(str) + spacing;
    }
  }
}