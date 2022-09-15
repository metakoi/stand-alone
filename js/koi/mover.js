/**
 * A fish mover for moving fish through user input
 * @param {Constellation} constellation A constellation to move fish in
 * @param {AudioBank} audio Game audio
 * @param {GUI} gui The GUI
 * @constructor
 */
const Mover = function(constellation, audio, gui) {
    this.constellation = constellation;
    this.audio = audio;
    this.gui = gui;
    this.move = null;
    this.cursor = new Vector2();
    this.cursorPrevious = new Vector2();
    this.cursorPreviousUpdate = new Vector2();
    this.offset = new Vector2();
    this.cursorOffset = new Vector2();
    this.touch = false;
    this.dragIdle = 0;
    this.dragPointer = null;
};

Mover.prototype.SPLASH_DROP_RADIUS = 0.13;
Mover.prototype.SPLASH_DROP_AMPLITUDE = 0.4;
Mover.prototype.SPLASH_DROP_DISTANCE = 0.1;
Mover.prototype.AIR_RADIUS = 1.5;
Mover.prototype.AIR_INTENSITY = .2;
Mover.prototype.AIR_INTENSITY_POWER = .3;
Mover.prototype.AIR_HEIGHT = .5;
Mover.prototype.AIR_INTERVAL = 1;
Mover.prototype.FOREGROUND_DISPLACEMENT_RADIUS = Mover.prototype.AIR_RADIUS;
Mover.prototype.GRANULAR_VOLUME = .17;
Mover.prototype.GRANULAR_INTENSITY_THRESHOLD = .1;
Mover.prototype.GRANULAR_INTERVAL = 0.75;
Mover.prototype.DRAG_POINTER_TIME = 15;

/**
 * Displace air between the last two cursor positions
 * @param {Number} dx The X delta for this movement
 * @param {Number} dy The Y delta for this movement
 * @param {Number} distance The moved distance
 * @param {Air} air The air to displace
 */
Mover.prototype.displaceAir = function(
    dx,
    dy,
    distance,
    air) {
    const steps = Math.ceil(distance / this.AIR_INTERVAL);
    const intensity = Math.sign(dx) * Math.pow(Math.abs(dx), this.AIR_INTENSITY_POWER) * this.AIR_INTENSITY;

    for (let step = 0; step < steps; ++step) {
        const f = step / steps;
        const x = this.cursorPreviousUpdate.x + dx * f;
        const y = this.cursorPreviousUpdate.y + dy * f;

        air.addDisplacement(x, y + this.AIR_HEIGHT, this.AIR_RADIUS, intensity);
    }
};

/**
 * Create grass audio effects while moving
 * @param {Number} dx The X delta for this movement
 * @param {Number} dy The Y delta for this movement
 * @param {Number} distance The moved distance
 * @param {AudioBank} audio Game audio
 * @param {PlantMap} plantMap The plant map
 */
Mover.prototype.createGrassAudio = function(
    dx,
    dy,
    distance,
    audio,
    plantMap) {
    const steps = Math.ceil(distance / this.GRANULAR_INTERVAL);
    let intensity = 0;

    for (let step = 0; step < steps; ++step) {
        const f = step / steps;

        intensity = Math.max(intensity, plantMap.sample(
            this.cursor.x + dx * f,
            this.cursor.y + dy * f + this.AIR_HEIGHT));
    }

    if (intensity < this.GRANULAR_INTENSITY_THRESHOLD)
        return;

    const panFactor = Math.max(0, Math.min(1, this.cursor.x / this.constellation.width));

    audio.effectGrass.set(
        audio.effectGrass.effect.engine.transformPan(2 * panFactor - 1),
        Math.min(1, Math.abs(dx) * this.GRANULAR_VOLUME));
};

/**
 * Apply motion effects
 * @param {Air} air The air to displace
 * @param {AudioBank} audio Game audio
 * @param {Foreground} foreground The foreground
 * @param {Random} random A randomizer
 */
Mover.prototype.applyMotion = function(air, audio, foreground, random) {
    const dx = this.cursor.x - this.cursorPreviousUpdate.x;
    const dy = this.cursor.y - this.cursorPreviousUpdate.y;

    if (dx === 0)
        return;

    const distance = Math.sqrt(dx * dx + dy * dy);

    this.displaceAir(dx, dy, distance, air);
    this.createGrassAudio(dx, dy, distance, audio, foreground.plants.plantMap);

    foreground.displace(
        this.cursorPreviousUpdate.x,
        this.cursorPreviousUpdate.y + this.AIR_HEIGHT,
        dx,
        dy,
        this.FOREGROUND_DISPLACEMENT_RADIUS,
        random);
};

/**
 * Update the mover
 * @param {Air} air The air to displace
 * @param {AudioBank} audio Game audio
 * @param {Foreground} foreground The foreground
 * @param {Boolean} tutorial True if any tutorial is active
 * @param {Random} random A randomizer
 */
Mover.prototype.update = function(air, audio, foreground, tutorial, random) {
    if (this.move) {
        this.move.body.update(
            this.move.position,
            this.move.direction,
            this.move.speed);

        if (!tutorial && ++this.dragIdle === this.DRAG_POINTER_TIME && !this.dragPointer) {
            this.dragPointer = this.gui.overlay.createArrowElement("down");
            this.gui.cards.dropTarget.appendChild(this.dragPointer);
        }
    }

    if (this.touch)
        this.applyMotion(air, audio, foreground, random);

    audio.effectGrass.update(Koi.prototype.UPDATE_RATE);

    this.cursorPreviousUpdate.set(this.cursor);
};

/**
 * Render the mover
 * @param {Bodies} bodies The bodies renderer
 * @param {Atlas} atlas The atlas containing the fish textures
 * @param {Number} width The scene width
 * @param {Number} height The scene height
 * @param {Number} time The interpolation factor since the last update
 */
Mover.prototype.render = function(
    bodies,
    atlas,
    width,
    height,
    time) {
    if (this.move) {
        this.move.render(bodies, time);

        bodies.render(atlas, width, height, false, true);
    }
};

/**
 * Move the cursor
 * @param {Number} x The X position in meters
 * @param {Number} y The Y position in meters
 * @param {Number} xPixel The X position in pixels
 * @param {Number} yPixel The Y position in pixels
 * @param {Boolean} entered True if the cursor just entered the view
 * @param {Boolean} handEnabled True if the card hand is enabled
 */
Mover.prototype.touchMove = function(
    x,
    y,
    xPixel,
    yPixel,
    entered,
    handEnabled) {
    if (this.touch) {
        this.cursorPrevious.set(this.cursor);
        this.cursor.x = x;
        this.cursor.y = y;

        if (entered)
            this.cursorPreviousUpdate.set(this.cursor);

        if (this.move) {
            this.dragIdle = 0;
            this.cursorOffset.set(this.cursor).add(this.offset);
            this.move.moveTo(this.cursorOffset);

            if (!this.gui.cards.hand.isOutside(xPixel, yPixel))
                this.gui.cards.hand.hide();

            if (handEnabled)
                this.gui.cards.hand.moveDraggable(xPixel, yPixel);
        }
    }
};

/**
 * Check whether this mover has a fish
 * @returns {Boolean} True if a fish is being carried
 */
Mover.prototype.hasFish = function() {
    return this.move !== null;
};

/**
 * Create a fish body shaped splash
 * @param {FishBody} body A fish body
 * @param {Water} water A water plane to splash on
 * @param {Random} random A randomizer
 */
Mover.prototype.createBodySplash = function(body, water, random) {
    for (let segment = body.spine.length; segment-- > 0;) {
        const angle = Math.PI * 2 * random.getFloat();
        const intensity = body.pattern.shapeBody.sample(segment / (body.spine.length - 1));
        const distance = this.SPLASH_DROP_DISTANCE * intensity;

        water.addFlare(
            body.spine[segment].x + Math.cos(angle) * distance,
            body.spine[segment].y + Math.sin(angle) * distance,
            this.SPLASH_DROP_RADIUS * intensity,
            this.SPLASH_DROP_AMPLITUDE * intensity);
    }
};

/**
 * Start touching the game area
 * @param {Number} x The X position in meters
 * @param {Number} y The Y position in meters
 */
Mover.prototype.startTouch = function(x, y) {
    this.cursor.x = x;
    this.cursor.y = y;
    this.touch = true;

    this.cursorPrevious.set(this.cursor);
    this.cursorPreviousUpdate.set(this.cursor);
};

/**
 * Play the fish specific interaction sound
 * @param {Fish} fish The fish to play the sound for
 * @param {Number} pan The pan in the range [-1, 1]
 */
Mover.prototype.playInteractionSound = function(fish, pan) {
    if (fish.body.isHeavy())
        this.audio.effectFishMoveBig.play(this.audio.effectFishMoveBig.engine.transformPan(pan));
    else
        this.audio.effectFishMoveSmall.play(this.audio.effectFishMoveSmall.engine.transformPan(pan));
};

/**
 * Start a new move
 * @param {Fish} fish The fish that needs to be moved
 * @param {Number} x The X position in meters
 * @param {Number} y The Y position in meters
 * @param {Water} [waterPlane] A water plane to splash on, null if fish does not come from water
 * @param {Random} [random] A randomizer
 */
Mover.prototype.pickUp = function(fish, x, y, waterPlane = null, random = null) {
    const pan = 2 * fish.position.x / this.constellation.width - 1;

    this.move = fish;
    this.offset.x = fish.position.x - x;
    this.offset.y = fish.position.y - y;

    if (waterPlane) {
        this.audio.effectFishUp.play(this.audio.effectFishUp.engine.transformPan(pan));

        this.playInteractionSound(fish, pan);

        this.createBodySplash(fish.body, waterPlane, random);
    }

    this.startTouch(x, y);
};

/**
 * Create a drop effect for a fish
 * @param {Fish} fish A fish
 * @param {Water} waterPlane A water plane to splash on
 * @param {Random} random A randomizer
 */
Mover.prototype.dropEffect = function(fish, waterPlane, random) {
    const pan = 2 * fish.position.x / this.constellation.width - 1;

    this.audio.effectFishDown.play(this.audio.effectFishDown.engine.transformPan(pan));
    this.playInteractionSound(fish, pan);
    this.createBodySplash(fish.body, waterPlane, random);
};

/**
 * Release any move
 * @param {Water} waterPlane A water plane to splash on
 * @param {Atlas} atlas The atlas
 * @param {Number} scale The world scale
 * @param {Random} random A randomizer
 */
Mover.prototype.drop = function(
    waterPlane,
    atlas,
    scale,
    random) {
    if (this.move) {
        const x = this.constellation.getPixelX(this.move.position.x, scale);
        const y = this.constellation.getPixelY(this.move.position.y, scale);

        if (this.gui.cards.onDropTarget(x, y)) {
            this.gui.cards.hand.waitdrop = true;
            const card = new Card(
                this.move.body,
                this.move.position.copy().subtract(this.offset).multiply(scale).round());

            this.gui.cards.add(card);
            this.gui.cards.toDropTarget(card);

            this.move.free(atlas);
        }
        else {
            this.dropEffect(this.move, waterPlane, random);

            this.constellation.drop(this.move);
        }

        if (this.dragPointer) {
            this.gui.cards.dropTarget.removeChild(this.dragPointer);
            this.dragPointer = null;
        }

        this.move = null;
        this.dragIdle = 0;
        this.gui.cards.hand.show();
    }

    this.touch = false;
};
