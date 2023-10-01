// TODO: draw_text() doesn't work with new lines, causing confusion with draw_get_text_[width/height](), which does

function wEngine(global = true) {
  const $ = global ? globalThis : this;
  
  let _id = 0;
  
  // todo: make a map for containing an array for each object type
  const _entities = [];
  const _entityTypes = new Map();
  
  // canvas context ~~
  
  const _defaultCanvas = document.createElement('canvas');
  _defaultCanvas.id = "canvas"
  _defaultCanvas.width = 400;
  _defaultCanvas.height = 400;
  _defaultCanvas.oncontextmenu = "return false;"
  document.body.appendChild(_defaultCanvas);
  let _targetSurface = null;
  
  // input events
  
  class InputManager {
    constructor(key) {
      this.key = key;
      this.time = 0;
    }
    update() {
      if (this.key())
        this.time++;
      else if (this.time > 0)
        this.time = -1;
      else
        this.time = Math.min(this.time + 1, 0);
    }
    check() {
      return this.time > 0;
    }
    pressed() {
      return this.time == 1;
    }
    released() {
      return this.time == -1;
    }
    stutter(delay_initial, delay_interval) {
      if (this.time == 1)
        return true;
      return this.time - delay_initial > 0 && 
        (this.time - delay_initial) % delay_interval == 0;
    }
  }
  
  // todo: gamepad (gamepad api)
  const _inputKeys = new Map();
  const _inputMouse = new Map();
  let _inputWheel = 0;
  
  // defining these here because I hate organization
  $.mouse_x = -1;
  $.mouse_y = -1; // todo: Pointer events
  
  addEventListener('mousemove', e => {
    const box = _defaultCanvas.getBoundingClientRect();
    $.mouse_x = (e.x - box.left) * (_defaultCanvas.width / box.width);
    $.mouse_y = (e.y - box.top) * (_defaultCanvas.height / box.height);
  })
  
  const inputKeyCheckerFunction = (key) => () => {
    return _inputKeys.get(key)[0];
  }
  const inputMouseCheckerFunction = (key) => () => {
    return _inputMouse.get(key)[0];
  }
  
  addEventListener('keydown', e => {
    if (!_inputKeys.has(e.key))
      _inputKeys.set(e.key, [false, new InputManager(inputKeyCheckerFunction(e.key))])
    _inputKeys.get(e.key)[0] = true;
  })
  addEventListener('keyup', e => {
    if (!_inputKeys.has(e.key))
      _inputKeys.set(e.key, [false, new InputManager(inputKeyCheckerFunction(e.key))])
    _inputKeys.get(e.key)[0] = false;
  })
  
  addEventListener('mousedown', e => { // todo: disable context menu
    if (!_inputMouse.has(e.button))
      _inputMouse.set(e.button, [false, new InputManager(inputMouseCheckerFunction(e.button))])
    _inputMouse.get(e.button)[0] = true;
    return false;
  })
  addEventListener('mouseup', e => {
    if (!_inputMouse.has(e.button))
      _inputMouse.set(e.button, [false, new InputManager(inputMouseCheckerFunction(e.button))])
    _inputMouse.get(e.button)[0] = false;
    return false;
  });
  
  addEventListener('wheel', e => {
    _inputWheel = e.deltaY;
  })
  
  // camera
  
  let _cameraTransform = false;
  $.cam_x = 0;
  $.cam_y = 0;
  $.cam_zoom = 1;
  const toScreen_x = (x) => {
      return (x - $.cam_x) * $.cam_zoom;
    },
    toScreen_y = (y) => {
      return (y - $.cam_y) * $.cam_zoom;
    },
    toWorld_x = (x) => {
      return (x / $.cam_zoom) + $.cam_x;
    },
    toWorld_y = (y) => {
      return (y / $.cam_zoom) + $.cam_y;
    };
  $.cam_toScreen_x = toScreen_x;
  $.cam_toScreen_y = toScreen_y;
  $.cam_toWorld_x = toWorld_x;
  $.cam_toWorld_y = toWorld_y;
  const _camTransformStack = [];
  $.cam_enable_push = (enable) => {
    _camTransformStack.push(_cameraTransform);
    _cameraTransform = enable;
  }
  $.cam_enable_pop = () => {
    _cameraTransform = _camTransformStack.pop();
  }
  
  // time is here for some reason
  
  const _startTime = 0;
  let _lastTime = _startTime;
  let _deltaMin = 0.1;
  $.time_current = 0;
  $.time_fps = 0;
  $.time_frame = 0;
  $.time_delta = 0;
  $.time_set_deltaMinimum = (val) => {
    _deltaMin = val;
  }
  
  // events ~~
  
  const _scheduledEvents = { // TODO: use linked lists
    'prestep': new Set(),
    'step': new Set(),
    'poststep': new Set(),
    'predraw': new Set(),
    'draw': new Set(),
    'postdraw': new Set(),
    'predrawgui': new Set(),
    'drawgui': new Set(),
    'postdrawgui': new Set(),
  };
  const runEvent = (name, checker) => {
    const set = _scheduledEvents[name];
    const arr = []; // TODO: SLOW!!
    for (const inst of set)
      arr.push(inst);
    arr.sort((a, b) => a.depth - b.depth);
    for (const inst of arr) {
      if (inst._destroy) {
        set.delete(inst);
        continue;
      }
      if (!checker || checker(inst)) inst[name]();
      if (inst._destroy) {
        set.delete(inst);
      }
    }
  }
  const runEventInst = (inst, name) => {
    if (inst[name] != undefined)
      return inst[name]();
  }
  const update = () => {
    // process environment
    $.window_width = ~~window.innerWidth;
    $.window_height = ~~window.innerHeight;
    
    // process input
    for (let [k, v] of _inputKeys) {
      _inputKeys.get(k)[1].update();
    }
    for (let [k, v] of _inputMouse) {
      _inputMouse.get(k)[1].update();
    }
    
    for (let e of _entities) {
      e.frame++;
    }
    
    // process step events
    runEvent('prestep');
    runEvent('step');
    runEvent('poststep');
    
    // process draw events
    _cameraTransform = true;
    const drawChecker = inst => inst.visible;
    runEvent('predraw', drawChecker);
    runEvent('draw', drawChecker);
    runEvent('postdraw', drawChecker);
    _cameraTransform = false;
    
    runEvent('predrawgui', drawChecker);
    runEvent('drawgui', drawChecker);
    runEvent('postdrawgui', drawChecker);
    
    // clean up
    _inputWheel = 0;
    
    $.time_frame += 1;
    
    const currentTime = window.performance.now();
    $.time_current = currentTime - _startTime;
    $.time_delta = (currentTime - _lastTime) / 1000;
    $.time_fps = 1000 / (currentTime - _lastTime);
    if ($.time_delta > _deltaMin)
      $.time_delta = _deltaMin;
    
    _lastTime = currentTime;
    
    // purge
    if (_purgeEnable) {
      _purgeTimer--;
      if (_purgeTimer <= 0) {
        _purgeTimer = _purgeTimerLength;
        purge();
      }
    }
  }
  
  
  // purging ~~
  
  let _purgeEnable = true;
  let _purgeTimer = 0, _purgeTimerLength = 400;
  // todo: improve purge - don't clean everything at once, spread it out
  const purge = () => {
    for (let i = 0; i < _entities.length; i++) {
      if (_entities[i]._destroy)
        _entities.splice(i--, 1);
    }
    for (let [k, v] of _entityTypes) {
      for (let i = 0; i < v.length; i++) {
        if (v[i]._destroy)
          v.splice(i--, 1);
      }
    }
  }
  
  
  // util ~~
  
  const getInstancePool = (type) => {
    if (type === null) { // get all
      const arr = [];
      for (let inst of _entities) {
        if (!inst._destroy)
          arr.push(inst);
      }
      return arr;
    }
    if (typeof type == 'object') // get instance
      return [type];
    if (typeof type == 'function') { // get class
      if (_entityTypes.has(type)) {
        const arr = [];
        const ch = _entityTypes.get(type);
        for (let inst of ch) {
          if (!inst._destroy)
            arr.push(inst);
        }
        return arr;
      }
      // hasn't cached class types
      const arr = [];
      for (let inst of _entities) {
        if (!inst._destroy && inst instanceof type)
          arr.push(inst);
      }
      return arr;
    }
    throw new Error("Invalid instance pool type: ${type}")
  }
  const getAllMethods = (toCheck) => {
    const props = [];
    let obj = toCheck;
    do {
      props.push(...Object.getOwnPropertyNames(obj));
    } while (obj = Object.getPrototypeOf(obj));
    return props.sort().filter((e, i, arr) => { 
      if (e!=arr[i+1] && typeof toCheck[e] == 'function') return true;
    });
  }
  
  // public properties/methods ~~  
  
  $.engine_update = () => {
    update();
  }
  
  $.engine_purge_setTimer = (time) => {
    _purgeTimer = time;
  }
  $.engine_purge_enable = (enable) => {
    _purgeEnable = enable;
  }
  $.engine_purge = () => {
    purge();
  }
  
  $.window_width = ~~window.innerWidth;
  $.window_height = ~~window.innerHeight;
  
  // entities
  
  $.Entity = class Entity {
    constructor(args) {
      this.id = args.id;
      this.visible = true;
      this.persistent = false;
      this.depth = 0;
      this.object = args.object;
      this.frame = 0;
      
      this.x = args.x;
      this.y = args.y;
      
      this.size = -1;
      this._destroy = false;
    }
  }
  function getConstructors(inst) {
    let s = inst.constructor;
    let arr = []
    while (s) {
      arr.push(s)
      s = Object.getPrototypeOf(s);
    }
    arr.pop();
    arr.pop();
    if (arr.length == 0)
      arr.push(null);
    return arr;
  }

  $.entity_create = (x, y, obj, args = {}) => {
    const inst = new obj({
      x, y, id: _id++, object: obj
    }, args);
    const instMethods = getAllMethods(inst);
    for (let method of instMethods) {
      for (let event in _scheduledEvents) {
        if (method == event) {
          _scheduledEvents[event].add(inst);
        }
      }
    }
    const cons = getConstructors(inst);
    for (let c of cons) {
      if (!_entityTypes.has(c))
        _entityTypes.set(c, []);
      _entityTypes.get(c).push(inst);
    }
    _entities.push(inst);
    return inst;
  }
  $.entity_refresh = (inst) => {
    const instMethods = getAllMethods(inst);
    for (let method of instMethods) {
      for (let event in _scheduledEvents) {
        if (method == event) {
          _scheduledEvents[event].delete(inst);
          _scheduledEvents[event].add(inst);
        }
      }
    }
  }
  $.entity_destroy = (type, callDestroyer = true, forceDestroy = false, destroyPersistant = false) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return false;
    for (let inst of insts) {
      if (!destroyPersistant && inst.persistant) continue;
      let o;
      if (callDestroyer) o = runEventInst(inst, 'destroy');
      if (!o || forceDestroy)
        inst._destroy = true;
    }
    return true;
  }
  $.entity_exists = (type) => { // TODO: optimize
    return getInstancePool(type).length != 0;
  }
  $.entity_amount = (type) => {
    return getInstancePool(type).length;
  }
  $.entity_get = (type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    return insts[0];
  }
  $.entity_list = (type) => {
    return getInstancePool(type);
  }
  
  // tiles
  
  class TileMap {
    constructor() {
      this.grid = null;
      this.width = 0;
      this.height = 0;
      this.tileSize = 1;
      this._wrap = 0;
      this._wrapVal = 0;
    }
    set_tiles(tiles) {
      this.grid = tiles;
      this.width = tiles.length;
      this.height = tiles[0].length;
    }
    resize(width, height) {
      width = Math.max(1, width);
      height = Math.max(1, height);
      const grid = this.grid;
      while (grid.length < width)
        grid.push([]);
      while (grid.length > width)
        grid.pop();
      for (let x = 0; x < width; x++) {
        while (grid[x].length < height)
          grid[x].push(0);
        while (grid[x].length > height)
          grid[x].pop();
      }
      this.width = width;
      this.height = height;
    }
    iterate(func, startX = 0, startY = 0, endX = undefined, endY = undefined) {
      if (endX === undefined) endX = this.width;
      if (endY === undefined) endY = this.height;
      startX = Math.min(Math.max(startX, 0), this.width - 1);
      startY = Math.min(Math.max(startY, 0), this.height - 1);
      endX = Math.min(Math.max(endX, 0), this.width);
      endY = Math.min(Math.max(endY, 0), this.height);
      for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
          const v = func(this.grid[x][y], x, y);
          if (v !== undefined) this.grid[x][y] = v;
        }
      }
    }
    set_tileSize(size) {
      this.tileSize = size;
    }
    index_x(x) {
      x = ~~x;
      if (this._wrap == 1) {
        x = Math.min(Math.max(x, 0), this.width - 1);
      } else if (this._wrap == 2) {
        if (x < 0)
          x = this.width + x;
        if (x >= this.width)
          x = x - this.width;
      }
      return x;
    }
    index_y(y) {
      y = ~~y;
      if (this._wrap == 1) {
        y = Math.min(Math.max(y, 0), this.height - 1);
      } else if (this._wrap == 2) {
        if (y < 0)
          y = this.height + y;
        if (y >= this.height)
          y = y - this.height;
      }
      return y;
    }
    index_pixel_x(x) {
      return this.index_x(x / this.tileSize);
    }
    index_pixel_y(y) {
      return this.index_y(y / this.tileSize);
    }
    wrap(wrap, val = null) {
      this._wrap = wrap;
      if (wrap == 3) {
        this._wrapVal = val;
      }
    }
    get(x, y) {
      x = this.index_x(x);
      y = this.index_y(y);
      if (this._wrap == 3 && (x < 0 || x >= this.width || y < 0 || y >= this.height))
        return this._wrapVal;
      return this.grid[x][y];
    }
    set(x, y, val) {
      x = this.index_x(x);
      y = this.index_y(y);
      if (this._wrap == 3 && (x < 0 || x >= this.width || y < 0 || y >= this.height))
        return;
      this.grid[x][y] = val;
    }
    get_pixel(x, y) {
      if (this._wrap == 3 && (x < 0 || x >= this.width * this.tileSize || y < 0 || y >= this.height * this.tileSize))
        return this._wrapVal;
      return this.get(x / this.tileSize, y / this.tileSize);
    }
    set_pixel(x, y, val) {
      if (this._wrap == 3 && (x < 0 || x >= this.width * this.tileSize || y < 0 || y >= this.height * this.tileSize))
        return;
      this.set(x / this.tileSize, y / this.tileSize, val);
    }
  }
  
  $.tilemap_create = (width = 1, height = 1) => {
    width = Math.max(1, width);
    height = Math.max(1, height);
    const tilemap = new TileMap();
    const grid = [];
    for (let x = 0; x < width; x++) {
      grid.push([]);
      for (let y = 0; y < height; y++) {
        grid[x].push(0);
      }
    }
    tilemap.grid = grid;
    tilemap.width = width;
    tilemap.height = height;
    return tilemap;
  }

  // collision
  
  $.collision_place = (inst, x, y, type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    if (inst.size < 0)
      return null;
    for (let other of insts) {
      if (inst == other)
        continue;
      if (other.size < 0)
        continue;
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance <= (inst.size + other.size) ** 2)
        return other;
    }
    return null;
  }
  $.collision_list = (inst, x, y, type) => {
    const insts = getInstancePool(type);
    const arr = [];
    if (inst.size < 0)
      return arr;
    for (let other of insts) {
      if (inst == other)
        continue;
      if (other.size < 0)
        continue;
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance < (inst.size + other.size) ** 2)
        arr.push(other);
    }
    return arr;
  }
  $.collision_area = (x, y, rad, type) => {
    const insts = getInstancePool(type);
    const arr = [];
    for (let inst of insts) {
      if (inst.size < 0)
        continue;
      const distance = (inst.x - x) ** 2 + (inst.y - y) ** 2;
      if (distance < (rad + inst.size) ** 2)
        arr.push(other);
    }
    return arr;
  }
  const collisionCircleLine = (x1, y1, x2, y2, cx, cy, r) => {
    const ac_x = cx - x1;
    const ac_y = cy - y1;
    
    const ab_x = x2 - x1;
    const ab_y = y2 - y1;
    
    const abDot = ab_x * ab_x + ab_y * ab_y;
    const acab = ac_x * ab_x + ac_y * ab_y;
    
    let t = acab / abDot;
    t = (t < 0) ? 0 : t
    t = (t > 1) ? 1 : t
    const h_x = (ab_x * t + x1) - cx;
    const h_y = (ab_y * t + y1) - cy;
    return (h_x * h_x + h_y * h_y) <= r * r
  }
  $.collision_line = (x1, y1, x2, y2, type) => {
    const insts = getInstancePool(type);
    const arr = [];
    for (let inst of insts) {
      if (inst.size >= 0 && collisionCircleLine(x1, y1, x2, y2, inst.x, inst.y, inst.size))
        arr.push(inst);
    }
    return arr;
  }
  $.collision_nearest = (x, y, type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    let smallest = Infinity, winner = null;
    for (let other of insts) {
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance < smallest) {
        winner = other;
        smallest = distance;
      }
    }
    return winner;
  }
  $.collision_nearest_dist = (x, y, type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    let smallest = Infinity;
    for (let other of insts) {
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance < smallest) {
        smallest = distance;
      }
    }
    return Math.sqrt(smallest);
  }
  $.collision_furthest = (x, y, type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    let largest = -Infinity, winner = null;
    for (let other of insts) {
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance > largest) {
        winner = other;
        largest = distance;
      }
    }
    return winner;
  }
  $.collision_furthest_dist = (x, y, type) => {
    const insts = getInstancePool(type);
    if (insts.length == 0)
      return null;
    let largest = Infinity;
    for (let other of insts) {
      const distance = (other.x - x) ** 2 + (other.y - y) ** 2;
      if (distance > largest) {
        largest = distance;
      }
    }
    return Math.sqrt(largest);
  }
  
  // drawing
  
  let _ctxStack = [];
  const _ctx = {
    fill: '#fff',
    fillEnable: true,
    stroke: '#000',
    strokeEnable: true,
    rectCenter: false,
    smoothing: false,
    strokeWeight: 1,
    strokeCap: 'round',
    strokeJoin: 'round',
    textFont: 'sans-serif',
    textSize: 12,
    textHAlign: 'left',
    textVAlign: 'top',
    textKerning: 'normal',
    textOptimize: 'optimizeLegibility'
  };
  const _ctxCheck = {
    fill: true,
    stroke: true,
    smoothing: true,
    strokeWeight: true,
    strokeCap: true,
    strokeJoin: true,
    textFont: true,
    textSize: true,
    textHAlign: true,
    textVAlign: true,
    textKerning: true,
    textOptimize: true,
  }
  const _ctxMatrixStack = [];
  
  const _divSniffer = document.createElement('div');
  _divSniffer.style.position = 'absolute';
  _divSniffer.right = '-10px';
  _divSniffer.top = '0px';
  _divSniffer.padding = '0px';
  _divSniffer.margin = '0px';
  
  const pushCache = () => {
    _ctxStack.push(Object.assign({}, _ctx));
    _ctxMatrixStack.push(_targetSurface.ctx.getTransform());
  }
  const popCache = () => {
    const c = _ctxStack.pop();
    for (let k in _ctxCheck)
      _ctxCheck[k] = true // todo: c[k] != _ctx[k];
    Object.assign(_ctx, c);
    _targetSurface.ctx.setTransform(_ctxMatrixStack.pop());
  }
  const resetContext = (ctx, all = false) => {
    if (_ctxCheck.smoothing || all) {
      _ctxCheck.smoothing = false;
      ctx.imageSmoothingEnabled = _ctx.smoothing;
    }
    
    if (_ctxCheck.fill || all) {
      _ctxCheck.fill = false;
      ctx.fillStyle = _ctx.fill;
    }
    
    if (_ctxCheck.stroke || all) {
      _ctxCheck.stroke = false;
      ctx.strokeStyle = _ctx.stroke;
    }
    if (_ctxCheck.strokeWeight || all) {
      _ctxCheck.strokeWeight = false;
      ctx.lineWidth = _ctx.strokeWeight;
    }
    if (_ctxCheck.strokeCap || all) {
      _ctxCheck.strokeCap = false;
      ctx.lineCap = _ctx.strokeCap;
    }
    if (_ctxCheck.strokeJoin || all) {
      _ctxCheck.strokeJoin = false;
      ctx.lineJoin = _ctx.strokeJoin;
    }
    
    if (_ctxCheck.textFont || _ctxCheck.textSize || all) {
      _ctxCheck.textFont = false;
      _ctxCheck.textSize = false;
      ctx.font = _ctx.textSize + 'px ' + _ctx.textFont;
    }
    
    if (_ctxCheck.textHAlign || all) {
      _ctxCheck.textHAlign = false;
      ctx.textAlign = _ctx.textHAlign;
    }
    if (_ctxCheck.textVAlign || all) {
      _ctxCheck.textVAlign = false;
      ctx.textBaseline = _ctx.textVAlign;
    }
    if (_ctxCheck.kerning || all) {
      _ctxCheck.kerning = false;
      ctx.textKerning = _ctx.kerning;
    }
    if (_ctxCheck.optimize || all) {
      _ctxCheck.optimize = false;
      ctx.textRendering = _ctx.optimize;
    }
    
    if (all && _ctxMatrixStack.length) {
      ctx.setTransform(_ctxMatrixStack[_ctxMatrixStack.length-1]);
    }
  }
  
  class Surface {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = canvas.width;
      this.height = canvas.height;
    }
    resize(width, height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.width = width;
      this.height = height;
      //this.ctx = canvas.getContext('2d');
      resetContext(this.ctx, true);
    }
  }
  
  $.surface_create = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return new Surface(canvas);
  }
  $.surface_default = new Surface(_defaultCanvas);
  
  $.draw_set_target = (surface) => {
    resetContext(surface.ctx, true);
    _targetSurface = surface;
  }
  $.draw_reset_target = () => {
    $.draw_set_target($.surface_default);
  }
  $.draw_reset_target();
  $.draw_get_target = () => {
    return _targetSurface;
  }
  
  class Sprite {
    constructor() {
      this.domImage = null;
      this.fetchImage = null;
      this.isFetch = false;
      this.loaded = false;
      this.width = 0;
      this.height = 0;
    }
  }
  
  const setupSpriteObject = (sprite, src) => {
    for (let i of document.images) {
      if (i.src == src) {
        sprite.domImage = i;
        sprite.isFetch = false;
        sprite.loaded = true;
        sprite.width = i.width;
        sprite.height = i.height;
        return;
      }
    }
    sprite.fetchImage = new Image();
    sprite.fetchImage.src = src;
    sprite.fetchImage.onload = () => {
      sprite.loaded = true;
      sprite.width = sprite.fetchImage.width;
      sprite.height = sprite.fetchImage.height;
    }
    sprite.isFetch = true;
    
  }
  
  $.sprite_create = (src) => {
    const sprite = new Sprite();
    if (document.readyState != 'complete') {
      window.addEventListener('load', () => setupSpriteObject(sprite, src));
      return sprite;
    }
    setupSpriteObject(sprite, src);
    return sprite;
  }
  
  $.draw_push = () => {
    pushCache()
  }
  $.draw_pop = () => {
    popCache()
  }
  
  $.draw_set_smoothing = (smooth) => {
    _ctx.smoothing = smooth;
    _ctxCheck.smoothing = true;
  }
  
  $.draw_set_rectCenter = (bool) => {
    _ctx.rectCenter = bool;
  }
  
  $.draw_set_fill = (color) => {
    if (typeof color == 'number') {
      const s = (~~(color / 16)).toString(16);
      color = '#' + s + s + s;
    }
    _ctx.fillEnable = true;
    _ctx.fill = color;
    _ctxCheck.fill = true;
    //resetContext(_targetSurface.ctx);
  }
  $.draw_nofill = () => {
    _ctx.fillEnable = false;
  }

  $.draw_set_stroke = (color) => {
    if (typeof color == 'number') {
      const s = (~~(color / 16)).toString(16);
      color = '#' + s + s + s;
    }
    _ctx.strokeEnable = true;
    _ctx.stroke = color;
    _ctxCheck.stroke = true;
  }
  $.draw_set_stroke_weight = (weight) => {
    _ctx.strokeWeight = weight;
    _ctxCheck.strokeWeight = true;
  }
  $.draw_set_stroke_cap = (style) => {
    _ctx.strokeCap = style;
    _ctxCheck.strokeCap = true;
  }
  $.draw_set_stroke_join = (style) => {
    _ctx.strokeJoin = style;
    _ctxCheck.strokeJoin = true;
  }
  $.draw_nostroke = () => {
    _ctx.strokeEnable = false;
  }
  
  $.draw_set_text_font = (font) => {
    _ctx.textFont = font;
    _ctxCheck.textFont = true;
  }
  $.draw_set_text_size = (size) => {
    _ctx.textSize = size;
    _ctxCheck.textSize = true;
  }
  $.draw_set_text_halign = (align) => {
    _ctx.textHAlign = align;
    _ctxCheck.textHAlign = true;
  }
  $.draw_set_text_valign = (align) => {
    if (align == 'center') align = 'middle'
    _ctx.textVAlign = align;
    _ctxCheck.textVAlign = true;
  }
  $.draw_set_text_kerning = (kerning) => {
    _ctx.textKerning = kerning ? 'normal' : 'none';
    _ctxCheck.textKerning = true;
  }
  $.draw_set_text_optimize = (optimize) => {
    _ctx.textOptimize = optimize ? 'optimizeSpeed' : 'optimizeLegibility';
    _ctxCheck.textOptimize = true;
  }
  
  $.draw_get_text_width = (text) => {
    document.body.appendChild(_divSniffer);
    _divSniffer.style.fontFamily = _ctx.textFont;
    _divSniffer.style.fontSize = _ctx.textSize + 'px';
    _divSniffer.style.fontWeight = 'normal'; // 'bold'
    _divSniffer.innerText = text;
    const width = _divSniffer.clientWidth;
    document.body.removeChild(_divSniffer);
    return width;
  }
  $.draw_get_text_height = (text) => {
    document.body.appendChild(_divSniffer);
    _divSniffer.style.fontFamily = _ctx.textFont;
    _divSniffer.style.fontSize = _ctx.textSize + 'px';
    _divSniffer.style.fontWeight = 'normal'; // 'bold'
    _divSniffer.innerText = text;
    const height = _divSniffer.clientHeight;
    document.body.removeChild(_divSniffer);
    return height;
  }
  
  $.draw_set_translate = (x, y) => {
    _targetSurface.ctx.translate(x, y);
  }
  $.draw_set_scale = (scaleX, scaleY = scaleX) => {
    _targetSurface.ctx.scale(scaleX, scaleY);
  }
  $.draw_set_rotate = (angle) => {
    _targetSurface.ctx.rotate(angle);
  }
  $.draw_reset_transform = () => {
    _targetSurface.ctx.resetTransform();
  }
  
  $.draw_clear = () => {
    resetContext(_targetSurface.ctx);
    _targetSurface.ctx.fillRect(0, 0, _targetSurface.canvas.width, _targetSurface.canvas.height);
  }
  $.draw_wipe = () => {
    _targetSurface.ctx.clearRect(0, 0, _targetSurface.canvas.width, _targetSurface.canvas.height);
  }

  // todo: camera transform
  $.draw_surface = (x, y, scaleX, scaleY, surface) => {
    resetContext(_targetSurface.ctx);
    if (scaleX == 1 && scaleY == 1)
      _targetSurface.ctx.drawImage(surface.canvas, x, y);
    else
      _targetSurface.ctx.drawImage(surface.canvas, x, y, surface.canvas.width * scaleX, surface.canvas.height * scaleY);
  }
  $.draw_sprite = (x, y, scaleX, scaleY, sprite) => {
    if (!sprite.loaded) return;
    
    if (sprite.isFetch) {
      if (scaleX == 1 && scaleY == 1)
      _targetSurface.ctx.drawImage(sprite.fetchImage, x, y);
    else
      _targetSurface.ctx.drawImage(sprite.fetchImage, x, y, sprite.fetchImage.width * scaleX, sprite.fetchImage.height * scaleY);
    } else {
      if (scaleX == 1 && scaleY == 1)
      _targetSurface.ctx.drawImage(sprite.domImage, x, y);
    else
      _targetSurface.ctx.drawImage(sprite.domImage, x, y, sprite.domImage.width * scaleX, sprite.domImage.height * scaleY);
    }
  }
  $.draw_tilemap = (x, y, scaleX, scaleY, tilemap, func, culling = true) => {
    // todo: optimize
    const sizeW = tilemap.tileSize * scaleX;
    const sizeH = tilemap.tileSize * scaleY;
    for (let xi = 0; xi < tilemap.width; xi++) {
      for (let yi = 0; yi < tilemap.height; yi++) {
        const posX = x + xi * sizeW;
        const posY = y + yi * sizeH;
        if (
          culling &&
          posX + sizeW < 0 || 
          posY + sizeH < 0 || 
          x + tilemap.width * sizeW < posX || 
          y + tilemap.height * sizeH < posY ) continue;
        func(posX, posY, sizeW, sizeH, tilemap.grid[xi][yi]);
      }
    }
  }
  $.draw_rectangle = (x, y, width, height, rad = 0) => {
    if (_ctx.rectCenter) {
      x -= width / 2;
      y -= height / 2;
    }
    resetContext(_targetSurface.ctx);
    if (_ctx.fillEnable) {
      if (rad == 0)
        _targetSurface.ctx.fillRect(x, y, width, height);
      else {
        _targetSurface.ctx.beginPath();
        _targetSurface.ctx.roundRect(x, y, width, height, rad);
        _targetSurface.ctx.fill();
      }
    }
    if (_ctx.strokeEnable) {
      if (rad == 0)
        _targetSurface.ctx.strokeRect(x + 0.5, y + 0.5, width, height);
      else {
        _targetSurface.ctx.beginPath();
        _targetSurface.ctx.roundRect(x + 0.5, y + 0.5, width, height, rad);
        _targetSurface.ctx.stroke();
      }
    }
  }
  $.draw_circle = (x, y, rad) => {
    rad = Math.max(rad, 0);
    resetContext(_targetSurface.ctx);
    if (_ctx.fillEnable) {
      _targetSurface.ctx.beginPath();
      _targetSurface.ctx.ellipse(x, y, rad, rad, 0, 0, Math.PI * 2);
      _targetSurface.ctx.fill();
    }
    if (_ctx.strokeEnable) {
      _targetSurface.ctx.beginPath();
      _targetSurface.ctx.ellipse(x + 0.5, y + 0.5, rad, rad, 0, 0, Math.PI * 2);
      _targetSurface.ctx.stroke();
    }
  }
  $.draw_triangle = (x1, y1, x2, y2, x3, y3) => {
    resetContext(_targetSurface.ctx);
    if (_ctx.fillEnable) {
      _targetSurface.ctx.beginPath();
      _targetSurface.ctx.moveTo(x1, y1);
      _targetSurface.ctx.lineTo(x2, y2);
      _targetSurface.ctx.lineTo(x3, y3);
      _targetSurface.ctx.closePath();
      _targetSurface.ctx.fill();
    }
    if (_ctx.strokeEnable) {
      _targetSurface.ctx.beginPath();
      _targetSurface.ctx.moveTo(x1 + 0.5, y1 + 0.5);
      _targetSurface.ctx.lineTo(x2 + 0.5, y2 + 0.5);
      _targetSurface.ctx.lineTo(x3 + 0.5, y3 + 0.5);
      _targetSurface.ctx.closePath();
      _targetSurface.ctx.stroke();
    }
  }
  $.draw_line = (x1, y1, x2, y2) => {
    if (!_ctx.strokeEnable)
      return;
    resetContext(_targetSurface.ctx);
    _targetSurface.ctx.beginPath();
    _targetSurface.ctx.moveTo(x1 + 0.5, y1 + 0.5);
    _targetSurface.ctx.lineTo(x2 + 0.5, y2 + 0.5);
    _targetSurface.ctx.stroke();
  }
  $.draw_text = (x, y, text) => {
    resetContext(_targetSurface.ctx);
    if (_ctx.strokeEnable) {
      _targetSurface.ctx.strokeText(text, x, y);
    }
    if (_ctx.fillEnable) {
      _targetSurface.ctx.fillText(text, x, y);
    }
    
  }
  
  
  // input
  
  $.input_key_check = (name) => {
    if (!_inputKeys.has(name))
      return false;
    return _inputKeys.get(name)[1].check();
  }
  $.input_key_pressed = (name) => {
    if (!_inputKeys.has(name))
      return false;
    return _inputKeys.get(name)[1].pressed();
  }
  $.input_key_released = (name) => {
    if (!_inputKeys.has(name))
      return false;
    return _inputKeys.get(name)[1].released();
  }
  $.input_key_stutter = (name, delay, stutter) => {
    if (!_inputKeys.has(name))
      return false;
    return _inputKeys.get(name)[1].stutter(delay, stutter);
  }
  
  $.input_mouse_check = (button) => {
    if (!_inputMouse.has(button))
      return false;
    return _inputMouse.get(button)[1].check();
  }
  $.input_mouse_pressed = (button) => {
    if (!_inputMouse.has(button))
      return false;
    return _inputMouse.get(button)[1].pressed();
  }
  $.input_mouse_released = (button) => {
    if (!_inputMouse.has(button))
      return false;
    return _inputMouse.get(button)[1].released();
  }
  $.input_mouse_stutter = (button, delay, stutter) => {
    if (!_inputMouse.has(button))
      return false;
    return _inputMouse.get(button)[1].stutter(delay, stutter);
  }
  $.input_mouse_wheel = () => {
    return _inputWheel;
  }
  
  
  // utility functions
  
  $.util_distance = (x1, y1, x2, y2) => 
    Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  $.util_cristDistance = (x1, y1, x2, y2) => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    return 0.394 * (dx + dy) + 0.554 * Math.max(dx, dy);
  }
  $.util_direction = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
  $.util_directionDifference = (start, target) => 
    Math.atan2(Math.sin(target-start), Math.cos(target-start));
  $.util_lengthdir_x = (len, dir) => Math.cos(dir) * len;
  $.util_lengthdir_y = (len, dir) => Math.sin(dir) * len;
  $.util_map = (val, startMin, startMax, targetMin, targetMax) => 
    targetMin + (targetMax - targetMin) * ((val - startMin) * 1.0 / (startMax - startMin));
  $.util_lerp = (a, b, t) => a * (1 - t) + b * t;
  $.util_lerpArray = (a, b, t) => {
    const arr = [];
    for (let i = 0; i < a.length; i++)
      arr.push($.util_lerp(a[i], b[i], t));
    return arr;
  };
  $.util_lerpColor = (rgb1, rgb2, t) => {
    const c1 = $.util_fromCss(rgb1);
    const c2 = $.util_fromCss(rgb2);
    const o = $.util_lerpArray(c1, c2, t);
    return $.util_toCss(...o);
  }
  
  $.util_clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  $.util_approach = (start, target, shift) => {
    if (start < target) return Math.min(start + shift, target); 
    else return Math.max(start - shift, target);
  }
  $.util_choose = (vals) => vals[~~(Math.random() * vals.length)];
  $.util_weightedChoose = (items, weights) => {
    let i;
    for (i = 0; i < weights.length; i++)
      weights[i] += weights[i - 1] || 0;

    const random = Math.random() * weights[weights.length - 1];

    for (i = 0; i < weights.length; i++)
      if (weights[i] > random) break;

    return items[i];
  }
  $.util_hsvToRgb = (h, s, v) => {
    if (s == 0)
      return [v * 255, v * 255, v * 255];
    
    let r, g, b, 
        hh, i, ff, p, q, t;
    
    hh = h % 360;
    hh /= 60;
    
    i = ~~hh;
    
    ff = hh - i;
    p = v * (1 - s);
    q = v * (1 - (s * ff));
    t = v * (1 - (s * (1 - ff)));
    
    switch (i){
      case 0:
        r = v; g = t; b = p;
        break;
      case 1:
        r = q; g = v; b = p;
        break;
      case 2:
        r = p; g = v; b = t;
        break;
      case 3:
        r = p; g = q; b = v;
        break;
      case 4:
        r = t; g = p; b = v;
        break;
      default:
        r = v; g = p; b = q;
        break;
    }
    return [r * 255, g * 255, b * 255];
  }
  $.util_rgbToHsv = (r, g, b) => {
    let rgbMin, rgbMax, 
        h, s, v;
    
    rgbMin = r < g ? (r < b ? r : b) : (g < b ? g : b);
    rgbMax = r > g ? (r > b ? r : b) : (g > b ? g : b);
    
    v = rgbMax * 100 / 255;
    if (v == 0)
      return [0, 0, v];
    
    s = 100 * (rgbMax - rgbMin) / rgbMax;
    if (s == 0)
      return [0, s, v];
    
    if (rgbMax == r)
      h = 0 + 60 * (g - b) / (rgbMax - rgbMin);
    else if (rgbMax == g)
      h = 120 + 60 * (b - r) / (rgbMax - rgbMin);
    else
      h = 240 + 60 * (r - g) / (rgbMax - rgbMin);
    
    return [h,s,v];
  }
  $.util_toCss = (r, g, b, a = 255) => {
    r = (~~r).toString(16);
    if (r.length < 2)
      r = '0' + r;
    g = (~~g).toString(16);
    if (g.length < 2)
      g = '0' + g;
    b = (~~b).toString(16);
    if (b.length < 2)
      b = '0' + b;
    a = (~~a).toString(16);
    if (a.length < 2)
      a = '0' + a;
    return '#' + r + g + b + a
  }
  $.util_toCssGrey = (g, a = 255) => {
    return $.util_toCss(g, g, g, a);
  }
  $.util_fromCss = (string) => {
    string = string.toLowerCase().slice(1, string.length);
    let r, g, b, a;
    if (string.length == 3) {
      r = Number.parseInt(string[0] + string[0], 16);
      g = Number.parseInt(string[1] + string[1], 16);
      b = Number.parseInt(string[2] + string[2], 16);
      a = 255;
    }
    if (string.length == 6) {
      r = Number.parseInt(string[0] + string[1], 16);
      g = Number.parseInt(string[2] + string[3], 16);
      b = Number.parseInt(string[4] + string[5], 16);
      a = 255;
    }
    if (string.length == 8) {
      r = Number.parseInt(string[0] + string[1], 16);
      g = Number.parseInt(string[2] + string[3], 16);
      b = Number.parseInt(string[4] + string[5], 16);
      a = Number.parseInt(string[6] + string[7], 16);
    }
    return [r, g, b, a];
  }
  
  return $;
}  