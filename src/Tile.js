import {
  sendTestResults,
  testBallPosition,
  testBallVelocity,
  testBallShape,
  testBallSize,
  testBallRender,
} from "./tests.js";
let { Bodies, Body, Composite } = Matter;
import Game from "./Game.js";
import { parseOptions } from "./helpers.js";
import config from "../config.js";
import Entity from "./Entity.js";

/**
 * A tile in the game grid
 * @class {Tile}
 */
class Tile {
  constructor() {
    Game.tiles.push(this);

    this.id = Game.tiles.length - 1;
    this.height = Game.TILE_HEIGHT;
    this.width = Game.TILE_WIDTH;
    this.left = (this.id % Game.NUM_TILES_X) * Game.TILE_WIDTH;
    this.top = Math.floor(this.id / Game.NUM_TILES_Y) * Game.TILE_WIDTH;
    this.right = this.left + Game.TILE_WIDTH;
    this.bottom = this.right + Game.TILE_HEIGHT;
    this.testsPassed = 0;
    this.numTests = 5;
    this.game = Game;
    this.ball = this.game.ball;
    this.matter = Matter; // for advanced users
    this.bodies = []; // list of objects in this tile

    /* User Defined Member Variables */
    this.ballStart = {};
    this.ballEnd = {};

    /* User Defined Member Functions */
    this.setup;
    this.onBallEnter;
    this.onTick;
    this.onTickBackground;
  }

  testExit() {
    let c = config.tests.exit;
    console.log(Game.ball.render);
    this.testsPassed += !c.position || testBallPosition(Game.ball, this.ballEnd);
    this.testsPassed += !c.velocity || testBallVelocity(Game.ball, this.ballEnd);
    this.testsPassed += !c.shape || testBallShape(Game.ball);
    this.testsPassed += !c.size || testBallSize(Game.ball);
    this.testsPassed += !c.render || testBallRender(Game.ball);
    sendTestResults(this);
  }

  /**
   * @method setBackgroundColor
   * @param {string} color 
   * @returns {void}
   */
  setBackgroundColor(color) {
    Game.render.options.background = color;
  }

  /**
   * @method createRectangle
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {bool} moveable
   * @param {Object} options
   * @returns {Entity}
   */
  createRectangle(x, y, width, height, moveable = false, options = {}) {
    options.isStatic = !moveable;
    parseOptions(options);
    let body = Bodies.rectangle(this.left + x, this.top + y, width, height, options);
    Composite.add(Game.engine.world, body);
    return new Entity(body, this);
  }

  /**
   * @method createCircle
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {bool} moveable
   * @param {Object} options
   * @returns {Entity}
   */
  createCircle(x, y, radius, moveable = false, options = {}) {
    options.isStatic = !moveable;
    parseOptions(options);
    let body = Bodies.circle(this.left + x, this.top + y, radius, options);
    Composite.add(Game.engine.world, body);
    return new Entity(body, this);
  }

  /**
   * @method createConveyorBelt
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {number} speed 
   * @param {Object} options 
   * @returns {Entity}
   */
  createConveyorBelt(x, y, width, height, speed, options = { isStatic: true }) {
    parseOptions(options);
    options.render.fillStyle = "green";
    let body = Bodies.rectangle(this.left + x, this.top + y, width, height, options);
    body.isStatic = true;
    body.isSensor = true;
    body.speedUp = (ball) => {
      Body.setVelocity(ball, { x: speed, y: 0 });
    };
    Game.detector.bodies.push(body);
    Composite.add(Game.engine.world, body);
    return new Entity(body, this);
  }

  /**
   * callback is triggered when button pressed.
   * endCallback is triggered when button becomes unpressed.
   * options.trigger_threshold (amount of mass required to trigger a button)
   * @method createButton
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {function} callback 
   * @param {function} endCallback 
   * @param {Object} options 
   * @returns {Entity}
   */
  createButton(
    x,
    y,
    width,
    height,
    callback,
    endCallback = (_) => {},
    options = { isStatic: true }
  ) {
    /* Trigger callback when button is pushed by object */
    parseOptions(options);
    let unpressedColor = options.unpressedColor || "red";
    let pressedColor = options.pressedColor || "green";
    options.render.fillStyle = unpressedColor;
    let button_body = Bodies.rectangle(
      this.left + x,
      this.top + y,
      width,
      height,
      options
    );
    let startCollide = () => {
      callback();
      button_body.render.fillStyle = pressedColor;
    };
    let endCollide = () => {
      endCallback();
      button_body.render.fillStyle = unpressedColor;
    };
    button_body.callback = startCollide;
    button_body.endCallback = endCollide;
    button_body.label = "button";
    button_body.trigger_threshold = 0.1; // amount of mass needed to trigger
    button_body.current_mass = 0.0;
    Composite.add(Game.engine.world, button_body);
    return new Entity(button_body, this);
  }

  /**
   * @method createSpring
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   * @param {vector} launchVelocity 
   * @param {Object} options 
   * @returns {Entity}
   */
  createSpring(x, y, width, height, launchVelocity, options = { isStatic: true }) {
    parseOptions(options);
    let base = Bodies.rectangle(this.left + x, this.top + y, width, height, options);
    let spring = Bodies.rectangle(this.left + x, this.top + y, width, height, options);
    Composite.add(Game.engine.world, spring);
    return new Entity(spring, this);
  }

  /**
   * Removes all non-static objects in the tile 
   * @method clear
   * @returns {void}
   */
  clear() {
    Composite.remove(this.game.engine.world, this.bodies);
  }
}

export default Tile;
