Neo Tank Trouble v0.10
A wip reimagining of Tank Trouble. 
tinyurl.com/neotank

Use the arrow keys to navigate the menu, and ctrl to select.

Controls --
  Select the amount of players you want, then play.
  Red tank uses the arrow keys and ctrl to shoot.
  Blue tank uses ESDF and Q to shoot.
  Green tank uses IJKL and Y to shoot.
  Yellow tank uses the number pad's 8456 and 0 to shoot.
  Press Shift or Escape to pause, and Shift or Escape to back out of a submenu / unpause.

How --
  Collect rainbow powerups, shoot the other tanks, and be that last one standing to win. 
  Shooting walls will damage them until they disappear. 
  The pink circle will shrink throughout the round, killing any tank in it's path.

Go to File > Download to download an offline version of this. Use "game.html".

Issues --
  Powerups animate when paused
  The camera needs more work. It has trouble dealing with anyone that wants to move away from each other, and feels strange more than 2 people.
  You may end up spawning in a wall if you pause - it shouldn't happen (...anymore) but I'm not sure

Changelog --
  v0.10 Jan 12 2023 --
    Tweaked Yellow's color
    Lowed turn acceleration
  v0.9, Jan 9 2023 --
    Added an attempt at showing controls in the lobby
    Added an option to go back to the lobby in the menu
    Removed the "Round Positions" option, it's now on permanently(for walls)
  v0.8, Jan 6 2023 --
    Happy (late) new year!
    I rewrote the entire game, and wrote a custom game engine to go with it, meaning the game is officially disconnected from p5.js! That means quite a few things, namely:
      It'll be easier to put this game onto a 'proper' website
      I get full control over the performance of various things, and any engine level optimizations I'm able to implement, I'll be able to do(the game is already notably faster than with the p5js dependancy)
    It should also be a bit faster, except for the menu which got slower. I really tried my best to speed up the menu, but it just isn't fast and I'm unsure why.
    A *lot* changed, and I might miss some here in this list
    A lobby of sorts was added. Press the shoot button of any tank for them to join. 
    When you die, a little marking of your color will be left, your corpse
    Tank graphics were tweaked very slighty, and the colors were changed to be more saturated
    The maze does a nice animation between rounds, instead of instantly switching the maze
      Specifically, the maze will 'animate' the maze generation(it's completely fake), and players corpses will be smoothly moved to their new position, and any storms will fade out
    Graphics should (hopefully) look more crisp
    The storm will slide in
    Ministorm bullets have an animation now
    Ministorms will bounce outward when created
    Increased storm start radius
    Tank acceleration speed up a bit
    Walls are a bit brighter
    The laser's collision is a more accurate and has a maximum range now
    The laser shot graphic was improved slightly
    Turret buffed a lot, it shoots faster and reacts quicker
    Turret graphic changed slightly
    Increased the spawn rate of power ups slightly
    Switched the default maze algorithm to Cellular x2
  v0.7, Dec 28 2022 --
    Added slight acceleration to turning and movement
    Increased tank turning speed
    Walls are slightly brighter now
  v0.6, Dec 27 2022 --
    Updated menu sliders to not scale it's text value
    Renamed "Power Up Chance" option to "Power Up Amount", and moved it to the "Customize Power Ups" sub menu.
    The machine gun, turret, and ministorm powerups are slightly rarer.
    You can now customize the chances of any powerup spawning in(Note: Setting all the chances to zero will make all powerups machine guns. To turn off powerups, set "Power Up Amount" to "Off")
    Pause key is also mapped to Shift
    When the camera is zoomed out enough, a graphic will appear in front of each tank showing what direction their facing. You may turn this off in settings.
    Small bullet's graphics are clamped more to make them more visible when the camera is zoomed out
    Attempted to make the camera less weird, it will now take the average of everyone's position + the point between the 2 furthest apart, instead of only the 2 furthest apart from each other. I expect there to be issues with players being able to escape the camera, but I haven't found any yet aside from extreme cases. I'll continue adjusting.
    Added new map generation options, you can now choose between 3 maze generation algorithms -
      Prim's algorithm, the original default one. It leads to many twists and turns, and the occasional straight path. The wall breaking mechanics are well suited to this one.
      Cellular Automota, which can generally generates more 'chaotically' than Prim, often generating straight paths and the occasional small room. You can configure it to generate mostly straight paths as well. You may also want to mess araound with it's iterations, which will allow it more time to generate, sometimes leading to more straighter paths, though it may increase map generation times. Setting it's iterations to 0 is identical to using the Random algorithm set to 5.
      Random, which is just uniformly random. You can set the general density of it, but you can't set it to anything higher than 8, since that may lead to issues when trying to find a place to put any player.
      I eventually want to add more algorithms, so. Yea. Gamaing
    Fixed issue where turrets just were not shooting anything
    Slowed down tank turning speed(both normal and laser focus) slightly to make aiming a bit easier
    The bomb's timer is shorter
    The turret now waits 1 second before firing after being createed, down from the previous ~4 seconds
  v0.5, Dec 23 2022 --
    Added a "Show FPS" setting, under a new graphics section
    Walls are now rounded to integer positions, which speeds up rendering quite a bit. You can turn it off in settings if it's too disorientating. You can also choose to round all(most) positions, which very likely doesn't do anything for performance.
    Walls are rendered differently and less dumbly. I'm able to get 60 fps with a size 64 map fully zoomed out on my terrible laptop now.
    Walls are a bit brighter, particularly at one health left, to make them easier to see
    Fixed laser insta-killing you if you use it into a wall, instead it's timer is shortened. I'm sure this won't be abused :)
    Lasers won't be instantly destroyed if it hits someone
    Added Turret powerup
  v0.4, Dec 22 2022 --
    Camera will now consider tank direction
    Camera scale is smaller and capped
    Added Shotgun powerup
    Added Mine powerup
    Bomb's wall damage radius made much bigger, player kill radius unchanged
    Shrank the storm powerup's graphic
    Fixed far bottom and right walls not being destroyed by bombs
    Clamped powerups will size themselves based on how far they are
    Reorganized files
  v0.3, Dec 19 2022 --
    Eased border flashing
    Added Machine Gun powerup
    Added Laser powerup
    Added Bomb powerup
    Added Powerup icons, with full animations
      Unfortunately I can't use actual pngs, so they have to be very simple. 
    There is an indication for what powerup you currently have, and what a powerup collectable is
    Camera now scales properly
    Lowered laser amount from 3 to 2
    Added subtle scroll to menu
    Snapped spawns to grid
    Powerups won't spawn near each other
    Powerups will spawn slightly more in the middle
    Bullet sizes are clamped to keep them visible when zoomed out
    Added pause menu
    Increased the distance bullets you shoot spawn from you, which makes shooting through corners easier
    Shooting into walls won't instantly destroy the wall, and will very likely kill you now
  v0.2, Dec 18 2022 --
    Slowed down tank rotation speed
    Fixed crash when 2 tanks are in the same position
    Fixed the camera position when the last 2 tanks die on the same frame
    Redid the main menu to use arrow keys instead of mouse+button.
    The menu now features various accessibility options, specifically options to turn of flashing, screen shake, and increase the contrast. 
    You can also customize the map size, from 8 to 64 tiles.
    You can also customize the storm speed.
    The storm flashes, and turns dark blue when theres <=1 tank. 
    Tanks spawn in with a random direction now
    There is now a graphic for the border of the map
    If the last player dies before their score goes up, it won't go up - a tie.
    Screen shake is no longer affected by zooming.
    Started working on powerups. I got a ministorm powerup first, I'll do more later.
  v0.1, Dec 17 2022 --
    Slowed down bullet speed
    Slowed down tank rotation speed
    Storm starts a bit bigger than the map now
    The game is fullscreen now
    The camera should keep everyone inside the window now
    Score will float above players now
    Tanks are rendered procedurally now
    The game no longer freezes when loading a new round
    Made the walls slightly brighter
    Updated controls to match the original Tank Trouble
  v0.0, Dec 5 2022 --
    Started project

TODO --
  Figure out text rendering
  AI
  Graphics
  Allow adding/removing players in matches
  Key rebinding? 
  Save Settings
  Sound Effects
  Document code
  Controller Support
  ... Multiplayer?

DISCLAIMER --
  Do yourself a favor and don't try to learn from the code here. 



