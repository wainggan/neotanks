class UI extends Entity {
  constructor(_) {
    super(_);
    
    this.menuList = [];
    
    this.menu = new Menu();
    
    // if (ismain) this.menu
    //   .add_label('Play with:')
    //   .add_button('2 players', () => {
    //     startMatch(2);
    //   })
    //   .add_button('3 players', () => {
    //     startMatch(3);
    //   })
    //   .add_button('4 players', () => {
    //     startMatch(4);
    //   })
    // else 
      this.menu
      .add_button('Continue', () => {
        entity_destroy(this);
      })
    if (!game.lobby)
      this.menu
      .add_button('Kill All', () => {
        entity_destroy(Player)
        entity_destroy(this)
      })
      .add_button('Lobby', () => {
        game.doLobby = true;
        entity_destroy(Player);
        entity_destroy(this)
      })
    
    this.menu
      .add_label('Game Settings:')
      .add_slider('Map Size', 8, 64, 4, settings.mapSize, undefined, v => {
        settings.mapSize = v
      })
      .add_button("Customize Maze Generation", () => {
        this.open(this.mazeMenu)
      })
      .add_slider('Storm Speed', 0, 20, 1, settings.stormSpeed, undefined, v => {
        settings.stormSpeed = v
      })
      .add_button("Customize Power Ups", () => {
        this.open(this.powerUpMenu)
      })
      .add_label('Accessibility:')
      .add_radio('Flashing', ['No', 'Yep'], settings.flashing, v => {
        settings.flashing = v;
      })
      .add_radio('Screen Shake', ['Off', '50%', '100%'], settings.screenShake, v => {
        settings.screenShake = v;
      })
      .add_radio('Contrast', ['+0', '+1', '+2'], settings.contrast, v => {
        settings.contrast = v;
      })
      .add_label('Graphics:')
      .add_radio('Show Tank Direction', ['Don\'t', 'Yes'], settings.showTankDir, v => {
        settings.showTankDir = v;
      })
      .add_radio('Show FPS', ['Nope', 'Heck yea'], settings.showFPS, v => {
        settings.showFPS = v;
      })
      // .add_button('Save Settings', () => {
      //   console.log(JSON.stringify(settings))
      //   window.localStorage.setItem('settings', JSON.stringify(settings))
      // })
      // .add_button('Clear Save', () => {
      //   window.localStorage.removeItem('settings');
      // })
      //.add_slider('Test', 0, 10, 1, 0)
    //this.menu.position = 1;
    
    this.mazeMenu = new Menu();
    this.mazeMenu
      .add_button('Back', () => this.pop())
      .add_label('Maze Customization')
      .add_radio('Maze Algorithm', ['Prim', 'Cellular', 'Random'], settings.mapAlgorithm, v => settings.mapAlgorithm = v)
      .add_radio('Cellular - Chaos', ['0.5x', '1x', '2x'], settings.mapCellularStraight, v => settings.mapCellularStraight = v)
      .add_slider('Cellular - Iterations', 0, 200, 5, settings.mapCellularIterations, undefined, v => settings.mapCellularIterations = v)
      .add_slider('Random - Density', 0, 8, 1, settings.mapRandomChance, undefined, v => settings.mapRandomChance = v)
    
    this.powerUpMenu = new Menu();
    this.powerUpMenu
      .add_button('Back', () => {
        this.pop()
      })
      .add_label('Power Up Customization')
      .add_radio('Power Up Amount', ['Off', '0.5x', '1x', '2x'], settings.powerUps, v => {
        settings.powerUps = v;
      })
      .add_slider('Machine Gun Chance', 0, 10, 1, settings.powerUpWeights[0], undefined, v => settings.powerUpWeights[0] = v)
      .add_slider('Mine Chance', 0, 10, 1, settings.powerUpWeights[1], undefined, v => settings.powerUpWeights[1] = v)
      .add_slider('Laser Chance', 0, 10, 1, settings.powerUpWeights[2], undefined, v => settings.powerUpWeights[2] = v)
      .add_slider('Turret Chance', 0, 10, 1, settings.powerUpWeights[3], undefined, v => settings.powerUpWeights[3] = v)
      .add_slider('Shotgun Chance', 0, 10, 1, settings.powerUpWeights[4], undefined, v => settings.powerUpWeights[4] = v)
      .add_slider('Bomb Chance', 0, 10, 1, settings.powerUpWeights[5], undefined, v => settings.powerUpWeights[5] = v)
      .add_slider('MiniStorm Chance', 0, 10, 1, settings.powerUpWeights[6], undefined, v => settings.powerUpWeights[6] = v)
    this.powerUpMenu.position = 0;
    
    this.ignorePause = true;
    this.depth = 1000
    this.scroll = new Sod(4, 0.6, 0);
    this.imlazy = false;
    
    this.open(this.menu);
  }
  open(menu) {
    // bad idea
    let fix = 20;
    while (fix-- > 0 && menu.elements[menu.position] instanceof MenuLabel)
      menu.position++;
    menu.scrollY = new Sod(2, 1, 0);
    this.menuList.push(menu);
  }
  pop() {
    this.menuList.pop();
  }
  step() {
    const currentMenu = this.menuList[this.menuList.length - 1];
    currentMenu.scroll(
      controls[0].check_stutter('down', 14, 6) - 
      controls[0].check_stutter('up', 14, 6) );
    currentMenu.change(
      controls[0].check_stutter('right', 8, 2) - 
      controls[0].check_stutter('left', 8, 2) );
    if (controls[0].check_pressed('shoot'))
      currentMenu.click()
    
    this.scroll.update(1/60, (this.menuList.length - 1) * 256)
    
    setPause(2);
    if (this.imlazy)
      if (controls[0].check_pressed('pause'))
        this.pop()
    this.imlazy = true;
    if (this.menuList.length == 0)
      entity_destroy(this);
    
  }
  postdrawgui() {
    draw_push();
    if (this.menuList.length == 1 && !this.ismain) {
      draw_set_fill(util_toCssGrey(0, 150+ settings.contrast * 40));
      draw_nostroke()
      draw_rectangle(0, 0, surface_default.width, surface_default.height);
    }
    for (let i = 0; i < this.menuList.length; i++) {
      if (this.menuList.length > 1 && i == this.menuList.length-1) {
        draw_set_fill(util_toCssGrey(0, 150+ settings.contrast * 40));
        draw_nostroke()
        draw_rectangle(0, 0, surface_default.width, surface_default.height);
      }
      const currentMenu = this.menuList[i];
      currentMenu.scrollY.update(1/60, currentMenu.position - 1);
      currentMenu.draw(64 + i * (256) - this.scroll.value, 64 - currentMenu.scrollY.value * 12, 38);
    }
    //fill(30)
    //noStroke()
    //rect(0, height - 100, width, 100)
    draw_pop();
  }
}