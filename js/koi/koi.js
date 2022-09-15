/**
 * The koi game
 * @param {Storage} storage A storage system
 * @param {Systems} systems The render systems
 * @param {AudioBank} audio Game audio
 * @param {GUI} gui The GUI
 * @param {Number} environmentSeed The seed for all stable systems
 * @param {Function} save A function that saves the game
 * @param {Tutorial} tutorial The tutorial object, or null if no tutorial is active
 * @param {Random} random A randomizer
 * @constructor
 */
const Koi = function(
    storage,
    systems,
    audio,
    gui,
    environmentSeed,
    save,
    tutorial,
    random) {
    this.storage = storage;
    this.systems = systems;
    this.audio = audio;
    this.gui = gui;
    this.random = random;
    this.effectsRandom = new Random();
    this.environmentSeed = environmentSeed;
    this.save = save;
    this.saveCountdown = this.AUTOSAVE_FREQUENCY;
    this.tutorial = tutorial;
    this.scale = this.getScale(systems.width, systems.height);
    this.constellation =  new Constellation(
        systems.width / this.scale,
        systems.height / this.scale,
        this.onBreed.bind(this),
        this.onMutate.bind(this));
    this.mover = new Mover(this.constellation, audio, gui);
    this.shadowBuffer = null;
    this.rocks = null;
    this.background = null;
    this.foreground = null;
    this.underwater = null;
    this.water = null;
    this.air = null;
    this.constellationMeshWater = null;
    this.constellationMeshDepth = null;
    this.reflections = null;
    this.weather = null;
    this.weatherFilterChanged = false;
    this.spawner = new Spawner(
        this.constellation,
        tutorial instanceof TutorialBreeding ? new SpawnerBehaviorTutorial() : new SpawnerBehaviorDefault());
    this.mutations = new Mutations();
    this.time = this.UPDATE_RATE;
    this.phase = 0;
    this.touchGrassSign = 1;

    this.createRenderables();

    gui.setKoi(this);
};

Koi.prototype.FRAME_TIME_MAX = 1;
Koi.prototype.UPDATE_RATE = 1 / 14;
Koi.prototype.SCALE_FACTOR = .051;
Koi.prototype.SCALE_MIN = 50;
Koi.prototype.FISH_CAPACITY = 320;
Koi.prototype.COLOR_BACKGROUND = Color.fromCSS("--color-earth");
Koi.prototype.PHASE_SPEED = .005;
Koi.prototype.TOUCH_WATER_RADIUS = .1;
Koi.prototype.TOUCH_WATER_INTENSITY = .5;
Koi.prototype.TOUCH_WATER_VOLUME = .7;
Koi.prototype.TOUCH_GRASS_RADIUS = 1;
Koi.prototype.TOUCH_GRASS_INTENSITY = .7;
Koi.prototype.TOUCH_GRASS_VOLUME = .4;
Koi.prototype.AUTOSAVE_FREQUENCY = 2520;

/**
 * Serialize the koi
 * @param {BinBuffer} buffer A buffer to serialize to
 */
Koi.prototype.serialize = function(buffer) {
    this.constellation.serialize(buffer);
    this.spawner.getState().serialize(buffer);
    this.weather.getState().serialize(buffer);
};

/**
 * Deserialize the koi
 * @param {BinBuffer} buffer A buffer to deserialize from
 * @throws {RangeError} A range error if deserialized values are not valid
 */
Koi.prototype.deserialize = function(buffer) {
    try {
        this.constellation.deserialize(buffer, this.systems.atlas, this.systems.randomSource);
        this.spawner.setState(SpawnerState.deserialize(buffer));
        this.weather.setState(WeatherState.deserialize(buffer));
        this.weatherFilterChanged = true;

        this.foreground.bugs.initialize(this.weather.state, this.effectsRandom);
    }
    catch (error) {
        this.free();

        throw error;
    }
};

/**
 * Iterate over every fish body in the game
 * @param {Function} f A callback function to call for every fish body
 */
Koi.prototype.forEveryFishBody = function(f) {
    for (const fish of this.constellation.small.fish)
        f(fish.body);

    for (const fish of this.constellation.river.fish)
        f(fish.body);

    for (const fish of this.constellation.big.fish)
        f(fish.body);

    for (const card of this.gui.cards.cards)
        f(card.body);
};

/**
 * A function that is called after breeding takes place
 * @param {Pond} pond The pond where the breeding took place
 * @param {Boolean} mutated True if a mutation occurred
 */
Koi.prototype.onBreed = function(pond, mutated) {
    if (this.tutorial)
        this.tutorial.onBreed(this.constellation, pond, mutated);
};

/**
 * A function that is called when a pattern mutation occurs
 */
Koi.prototype.onMutate = function() {
    if (this.tutorial)
        this.tutorial.onMutate();
};

/**
 * A function that is called when a card is stored in the card book
 * @param {Card} card The card that was stored
 */
Koi.prototype.onStoreCard = function(card) {
    if (this.tutorial)
        this.tutorial.onStoreCard(card);
};

/**
 * A function that is called when the card book unlocks a page
 */
Koi.prototype.onUnlock = function() {
    if (this.tutorial)
        this.tutorial.onUnlock();
};

/**
 * Perform first time initialization
 */
Koi.prototype.initialize = function() {
    this.spawner.spawnInitial(this.systems.atlas, this.systems.randomSource, this.random);
};

/**
 * Create all renderable instances
 */
Koi.prototype.createRenderables = function() {
    const environmentRandomizer = new Random(this.environmentSeed);

    // Create constellation meshes
    this.constellationMeshWater = this.constellation.makeMeshWater(this.systems.gl);
    this.constellationMeshDepth = this.constellation.makeMeshDepth(this.systems.gl);

    // Assign constellation meshes to systems
    this.systems.sand.setMesh(this.constellationMeshDepth);
    this.systems.shadows.setMesh(this.constellationMeshDepth);
    this.systems.blur.setMesh(this.constellationMeshWater);
    this.systems.waves.setMesh(this.constellationMeshWater);
    this.systems.ponds.setMesh(this.constellationMeshWater);

    // Create systems that depend on the environment randomizer
    this.weather = new Weather(
        this.systems.gl,
        this.constellation,
        environmentRandomizer);

    // Assign weather meshes
    this.systems.drops.setMesh(this.weather.rain.mesh);

    // Create scene objects
    this.shadowBuffer = new ShadowBuffer(
        this.systems.gl,
        this.constellation.width,
        this.constellation.height);
    this.background = new Background(
        this.systems.gl,
        this.systems.sand,
        this.systems.blit,
        this.systems.width,
        this.systems.height,
        this.systems.randomSource,
        this.scale);
    this.foreground = new Foreground(
        this.systems.gl,
        this.constellation,
        environmentRandomizer);
    this.underwater = new RenderTarget(
        this.systems.gl,
        this.systems.width,
        this.systems.height,
        this.systems.gl.RGB,
        false,
        this.systems.gl.LINEAR);
    this.water = new Water(
        this.systems.gl,
        this.systems.influencePainter,
        this.constellation.width,
        this.constellation.height);
    this.air = new Air(
        this.systems.gl,
        this.systems.influencePainter,
        this.constellation.width,
        this.constellation.height,
        this.random);

    // Assign constellation meshes to objects
    this.background.setMesh(this.constellationMeshDepth);

    // Assign scene object meshes
    this.systems.stone.setMesh(this.foreground.rocks.mesh);
    this.systems.vegetation.setMesh(this.foreground.plants.mesh);

    // Create systems that depend on mesh initialization
    const shore = new Shore(
        this.systems.gl,
        this.constellation.width,
        this.constellation.height,
        this.systems.stone,
        this.systems.ponds,
        this.systems.distanceField);

    this.reflections = new Reflections(
        this.systems.gl,
        this.constellation.width,
        this.constellation.height,
        shore,
        this.systems.stone,
        this.systems.vegetation,
        this.systems.blur,
        this.systems.quad);

    shore.free();

    this.foreground.bugs.initialize(this.weather.state, this.effectsRandom);
};

/**
 * Free all renderable objects
 */
Koi.prototype.freeRenderables = function() {
    this.shadowBuffer.free();
    this.background.free();
    this.foreground.free();
    this.underwater.free();
    this.water.free();
    this.air.free();
    this.reflections.free();
    this.weather.free();

    this.constellationMeshWater.free();
    this.constellationMeshDepth.free();
};

/**
 * Touch the water at a given point
 * @param {Number} x The X coordinate in meters
 * @param {Number} y The Y coordinate in meters
 */
Koi.prototype.touchWater = function(x, y) {
    this.water.addFlare(x, y, this.TOUCH_WATER_RADIUS, this.TOUCH_WATER_INTENSITY);

    this.audio.effectFishUp.play(
        this.audio.effectFishUp.engine.transformPan(2 * x / this.constellation.width - 1),
        this.TOUCH_WATER_VOLUME);
};

/**
 * Touch the grass at a given point
 * @param {Number} x The X coordinate in meters
 * @param {Number} y The Y coordinate in meters
 */
Koi.prototype.touchGrass = function(x, y) {
    this.air.addDisplacement(x, y, this.TOUCH_GRASS_RADIUS, this.touchGrassSign * this.TOUCH_GRASS_INTENSITY);

    this.audio.effectGrass.set(
        this.audio.effectGrass.effect.engine.transformPan(2 * x / this.constellation.width - 1),
        this.TOUCH_GRASS_VOLUME);

    this.touchGrassSign = -this.touchGrassSign;
};

/**
 * A key is pressed
 * @param {String} key The key
 * @returns {Boolean} True if a key event has been handled
 */
Koi.prototype.keyDown = function(key) {
    return this.gui.keyDown(key);
};

/**
 * Start a touch event
 * @param {Number} x The X position in pixels
 * @param {Number} y The Y position in pixels
 * @param {Boolean} control True if the control button is down
 * @param {Boolean} shift True if the shift button is down
 */
Koi.prototype.touchStart = function(x, y, control, shift) {
    const wx = this.constellation.getWorldX(x, this.scale);
    const wy = this.constellation.getWorldY(y, this.scale);

    const fish = this.mover.hasFish() ? null : this.constellation.pick(
        wx,
        wy,
        this.tutorial ? this.tutorial.getInteractionWhitelist() : null);

    if (fish) {
        if (control)
            this.constellation.swap(fish, this.mover, this.water, this.random);
        else if (shift)
            this.constellation.discard(fish, this.mover, this.water, this.random);
        else
            this.mover.pickUp(fish, wx, wy, this.water, this.random);
    }
    else {
        if (this.constellation.contains(wx, wy)) {
            this.touchWater(wx, wy);
            this.constellation.chase(wx, wy);
        }
        else
            this.touchGrass(wx, wy);

        this.mover.startTouch(wx, wy);
    }

    this.gui.interactGame();
};

/**
 * Move a touch event
 * @param {Number} x The X position in pixels
 * @param {Number} y The Y position in pixels
 * @param {Boolean} [entered] True if the cursor just entered the view
 */
Koi.prototype.touchMove = function(x, y, entered = false) {
    this.mover.touchMove(
        this.constellation.getWorldX(x, this.scale),
        this.constellation.getWorldY(y, this.scale),
        x,
        y,
        entered,
        this.tutorial ? this.tutorial.handEnabled : true);
};

/**
 * The mouse has left the window
 */
Koi.prototype.mouseLeave = function() {
    if (!this.mover.move)
        this.touchEnd();
};

/**
 * End a touch event
 */
Koi.prototype.touchEnd = function() {
    this.mover.drop(
        this.water,
        this.systems.atlas,
        this.scale,
        this.random);
};

/**
 * Calculate the scene scale
 * @param {Number} width The view width in pixels
 * @param {Number} height The view height in pixels
 */
Koi.prototype.getScale = function(width, height) {
    return Math.max(this.SCALE_MIN, Math.sqrt(width * width + height * height) * this.SCALE_FACTOR);
};

/**
 * Notify that the renderer has resized
 */
Koi.prototype.resize = function() {
    this.scale = this.getScale(this.systems.width, this.systems.height);
    this.constellation.resize(
        this.systems.width / this.scale,
        this.systems.height / this.scale,
        this.systems.atlas);

    const weatherState = this.weather.state;

    this.freeRenderables();
    this.createRenderables();

    this.weather.setState(weatherState);
    this.weatherFilterChanged = true;

    this.foreground.bugs.initialize(this.weather.state, this.effectsRandom);
};

/**
 * Update ambient audio
 */
Koi.prototype.updateAudio = function() {
    this.audio.ambientWaterTop.update(this.UPDATE_RATE);
    this.audio.ambientWaterLow.update(this.UPDATE_RATE);
    this.audio.ambientWind.update(this.UPDATE_RATE);

    if (!this.weather.state.isRaining())
        this.audio.ambientBirds.update(this.UPDATE_RATE);
};

/**
 * Update the scene
 */
Koi.prototype.update = function() {
    this.updateAudio();
    this.gui.update();

    if (this.tutorial && this.tutorial.update(this)) {
        if (this.tutorial instanceof TutorialBreeding) {
            this.spawner.setBehavior(new SpawnerBehaviorDefault());
            this.tutorial = new TutorialCards(this.storage, this.gui.overlay);
        }
        else
            this.tutorial = null;
    }

    this.spawner.update(this.systems.atlas, this.weather.state, this.systems.randomSource, this.random);
    this.constellation.update(
        this.systems.atlas,
        this.systems.patterns,
        this.systems.randomSource,
        !this.tutorial || this.tutorial.allowMutation ? this.mutations : null,
        this.tutorial ? this.tutorial.forceMutation : false,
        this.water,
        this.audio,
        this.weather.state.isRaining(),
        this.random);
    this.weather.update(this.air, this.water, this.audio, this.foreground.plants.plantMap, this.random);
    this.mover.update(this.air, this.audio, this.foreground, this.tutorial !== null, this.effectsRandom);
    this.foreground.update(this.weather.state, this.effectsRandom);

    this.systems.waves.propagate(this.water, this.systems.influencePainter);
    this.systems.wind.propagate(this.air, this.systems.influencePainter);

    if ((this.phase += this.PHASE_SPEED) > 1)
        --this.phase;

    if (--this.saveCountdown === 0) {
        this.save();
        this.saveCountdown = this.AUTOSAVE_FREQUENCY;
    }
};

/**
 * Render the scene
 * @param {Number} deltaTime The amount of time passed since the last frame
 * @param {Object} externalSettings The external settings object
 */
Koi.prototype.render = function(deltaTime, externalSettings) {
    this.time += Math.min(this.FRAME_TIME_MAX, deltaTime);

    while (this.time > this.UPDATE_RATE) {
        this.time -= this.UPDATE_RATE;

        this.update();
    }

    const time = this.time / this.UPDATE_RATE;

    // Update GUI animations
    this.gui.render(time);

    if (this.tutorial)
        this.tutorial.render(this.constellation, this.scale, time);

    // Apply filter color
    if (this.weatherFilterChanged) {
        this.systems.stone.setFilter(this.weather.filter);
        this.systems.vegetation.setFilter(this.weather.filter);
        this.systems.ponds.setFilter(this.weather.filter);
        this.systems.flying.setFilter(this.weather.filter);
    }

    // Render shadows
    this.shadowBuffer.target();
    this.constellation.render(this.systems.bodies, this.systems.atlas, time,true);
    this.shadowBuffer.blur(this.systems.blur);

    // Target underwater buffer
    this.underwater.target();

    // Render background
    this.background.render();

    // Render shadows
    this.systems.shadows.render(
        this.shadowBuffer,
        this.systems.height,
        this.scale);

    // Render pond contents
    this.constellation.render(
        this.systems.bodies,
        this.systems.atlas,
        time,
        false,
        false);

    // Target main buffer
    this.systems.targetMain();

    // Clear background
    this.systems.gl.clearColor(
        this.COLOR_BACKGROUND.r * this.weather.filter.r,
        this.COLOR_BACKGROUND.g * this.weather.filter.g,
        this.COLOR_BACKGROUND.b * this.weather.filter.b,
        1);
    this.systems.gl.clear(this.systems.gl.COLOR_BUFFER_BIT | this.systems.gl.DEPTH_BUFFER_BIT);

    // Enable Z buffer
    this.systems.gl.enable(this.systems.gl.DEPTH_TEST);

    // Render foreground
    this.foreground.render(
        this.systems.vegetation,
        this.systems.stone,
        this.systems.flying,
        this.air,
        time);

    // Render shaded water
    this.systems.ponds.render(
        this.underwater.texture,
        this.reflections.texture,
        this.water,
        this.systems.width,
        this.systems.height,
        this.scale,
        this.phase + time * this.PHASE_SPEED,
        time);

    // Render weather effects
    this.weatherFilterChanged = this.weather.render(
        this.systems.drops,
        time,
        externalSettings.flash);

    // Disable Z buffer
    this.systems.gl.disable(this.systems.gl.DEPTH_TEST);

    // Render mover
    this.mover.render(
        this.systems.bodies,
        this.systems.atlas,
        this.constellation.width,
        this.constellation.height,
        time);
};

/**
 * Free all resources maintained by the simulation
 */
Koi.prototype.free = function() {
    this.freeRenderables();
};