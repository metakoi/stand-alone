/**
 * A fish body
 * @param {Pattern} pattern A body pattern
 * @param {Fins} fins The fins
 * @param {Tail} tail The tail
 * @param {Number} length The body length
 * @param {Number} radius The body radius
 * @param {Number} growthSpeed The growth speed in the range [0, 255]
 * @param {Number} matingFrequency The frequency with which this fish can mate in the range [0, 255]
 * @param {Number} offspringCount The offspring count in the range [0, 255]
 * @param {Number} [age] The fish age in updates, zero by default
 * @constructor
 */
const FishBody = function(
    pattern,
    fins,
    tail,
    length,
    radius,
    growthSpeed,
    matingFrequency,
    offspringCount,
    age = 0) {
    this.pattern = pattern;
    this.fins = fins;
    this.finInstances = fins.makeAll();
    this.tail = tail;
    this.length = length;
    this.lengthSampled = this.SAMPLER_LENGTH.sample(length / 0xFF);
    this.radius = radius;
    this.radiusSampled = this.lengthSampled * this.SAMPLER_RADIUS.sample(radius / 0xFF);
    this.growthSpeed = growthSpeed;
    this.matingFrequency = matingFrequency;
    this.offspringCount = offspringCount;
    this.age = age;
    this.samplerSize = new SamplerInverse(
        this.SIZE_MIN,
        1,
        this.SAMPLER_GROWTH_MULTIPLIER.sample(growthSpeed / 0xFF));
    this.size = this.samplerSize.sample(this.age / 0xFFFF);
    this.spine = new Array(Math.ceil(this.lengthSampled / this.RESOLUTION));
    this.tailOffset = this.spine.length - 1;
    this.finGroups = this.assignFins(this.spine.length);
    this.spinePrevious = new Array(this.spine.length);
    this.springs = this.makeSprings(
        this.SAMPLER_SPRING_START.sample(this.radius / 0xFF),
        this.SAMPLER_SPRING_END.sample(this.radius / 0xFF),
        this.SPRING_POWER);
    this.phase = 0;
    this.finPhase = 0;
    this.spacing = 0;
    this.inverseSpacing = 0;
    this.tailAudioCountdown = 0;

    this.calculateSpacing();
};

FishBody.prototype.RESOLUTION = .12;
FishBody.prototype.SWIM_AMPLITUDE = 11;
FishBody.prototype.SWIM_SPEED = 6;
FishBody.prototype.SPEED_SWING_THRESHOLD = .01;
FishBody.prototype.SPEED_WAVE_THRESHOLD = .055;
FishBody.prototype.WAVE_RADIUS = .15;
FishBody.prototype.WAVE_INTENSITY_MIN = .05;
FishBody.prototype.WAVE_INTENSITY_MULTIPLIER = 2;
FishBody.prototype.WAVE_TURBULENCE = .4;
FishBody.prototype.FIN_PHASE_SPEED = .4;
FishBody.prototype.FIN_FRONT_AT = new Sampler(.11, .23);
FishBody.prototype.FIN_BACK_AT = new Sampler(.45, .7);
FishBody.prototype.SIZE_MIN = .1;
FishBody.prototype.SAMPLER_LENGTH = new SamplerPower(.6, 1.2, 1.2);
FishBody.prototype.SAMPLER_RADIUS = new SamplerPlateau(.1, .13, .21, 1.7);
FishBody.prototype.SAMPLER_OFFSPRING_COUNT = new SamplerPower(2, 7, 1.2);
FishBody.prototype.SAMPLER_MATING_FREQUENCY = new SamplerPower(100, 400, .3);
FishBody.prototype.SAMPLER_GROWTH_MULTIPLIER = new SamplerPower(30, 80, 4);
FishBody.prototype.SAMPLER_SPRING_START = new Sampler(.4, .85);
FishBody.prototype.SAMPLER_SPRING_END = new Sampler(.3, .6);
FishBody.prototype.SPINE_LOOP_FLEXIBILITY = new SamplerPower(0, 2.3, .16);
FishBody.prototype.SPINE_LOOP_ANGLE_AMPLITUDE = .07;
FishBody.prototype.SPINE_LOOP_PHASE_AMPLITUDE = .6;
FishBody.prototype.SPRING_POWER = 1.7;
FishBody.prototype.OFFSPRING_VERTEBRA = .4;
FishBody.prototype.KILOGRAMS_PER_AREA = 22;
FishBody.prototype.HEAVY_THRESHOLD = 2.3;
FishBody.prototype.FAST_THRESHOLD = .045;
FishBody.prototype.TAIL_AUDIO_THRESHOLD = .08;
FishBody.prototype.TAIL_AUDIO_RAMP = .025;
FishBody.prototype.TAIL_AUDIO_VOLUME_MIN = .4;
FishBody.prototype.TAIL_AUDIO_COOLDOWN = 30;
FishBody.prototype.BROAD_RADIUS = 3;

/**
 * Deserialize a fish body
 * @param {BinBuffer} buffer A buffer to deserialize from
 * @param {Atlas} [atlas] The atlas
 * @param {RandomSource} [randomSource] A random source
 * @returns {FishBody} The deserialized fish body
 * @throws {RangeError} A range error if deserialized values are not valid
 */
FishBody.deserialize = function(buffer, atlas = null, randomSource = null) {
    const pattern = Pattern.deserialize(buffer);

    if (atlas)
        atlas.write(pattern, randomSource);

    return new FishBody(
        pattern,
        Fins.deserialize(buffer),
        Tail.deserialize(buffer),
        buffer.readUint8(),
        buffer.readUint8(),
        buffer.readUint8(),
        buffer.readUint8(),
        buffer.readUint8(),
        buffer.readUint16());
};

/**
 * Serialize this fish body
 * @param {BinBuffer} buffer A buffer to serialize to
 */
FishBody.prototype.serialize = function(buffer) {
    this.pattern.serialize(buffer);
    this.fins.serialize(buffer);
    this.tail.serialize(buffer);

    buffer.writeUint8(this.length);
    buffer.writeUint8(this.radius);
    buffer.writeUint8(this.growthSpeed);
    buffer.writeUint8(this.matingFrequency);
    buffer.writeUint8(this.offspringCount);
    buffer.writeUint16(this.age);
};

/**
 * Get a hash byte of this fish body
 * @returns {Number} The byte value
 */
FishBody.prototype.hash = function() {
    const ageHash = ((this.age & 0xFF) ^ ((this.age >> 8) & 0xFF));

    return this.length ^ this.radius ^ this.growthSpeed ^ this.matingFrequency ^ this.offspringCount ^ ageHash;
};

/**
 * Check whether this fish is considered heavy
 * @returns {Boolean}
 */
FishBody.prototype.isHeavy = function() {
    return this.getWeight() > this.HEAVY_THRESHOLD;
};

/**
 * Get the age of this fish body
 * @returns {Number} The age in seconds
 */
FishBody.prototype.getAge = function() {
    return this.age * Koi.prototype.UPDATE_RATE;
};

/**
 * Get the length of this fish body
 * @returns {Number} The length
 */
FishBody.prototype.getLength = function() {
    if (imperial)
        return Units.toFeet((this.spine.length - 1) * this.spacing * this.size * 100);

    return (this.spine.length - 1) * this.spacing * this.size * 100;
};

/**
 * Get the minimum number of updates between mating
 * @returns {Number} The minimum number of updates between mating
 */
FishBody.prototype.getMateTimeout = function() {
    return this.SAMPLER_MATING_FREQUENCY.sample(this.matingFrequency / 0xFF);
};

/**
 * Get the number of children this fish should produce
 * @returns {Number} The number of children this fish should produce
 */
FishBody.prototype.getOffspringCount = function() {
    return Math.round(this.SAMPLER_OFFSPRING_COUNT.sample(this.offspringCount / 0xFF));
};

/**
 * Get the weight of the fish
 * @returns {Number} The weight
 */
FishBody.prototype.getWeight = function() {
    const axisLength = this.lengthSampled * .5 * this.size;
    const axisRadius = this.radiusSampled * this.size;

    if (imperial)
        return Units.toPounds(Math.PI * axisLength * axisRadius * this.KILOGRAMS_PER_AREA);

    return Math.PI * axisLength * axisRadius * this.KILOGRAMS_PER_AREA;
};

/**
 * Get the position to spawn offspring at
 * @returns {Vector2} A position
 */
FishBody.prototype.getOffspringPosition = function() {
    return this.spine[Math.round((this.spine.length - 1) * this.OFFSPRING_VERTEBRA)];
};

/**
 * Get the previous position to spawn offspring at
 * @returns {Vector2} A position
 */
FishBody.prototype.getOffspringPositionPrevious = function() {
    return this.spinePrevious[Math.round((this.spine.length - 1) * this.OFFSPRING_VERTEBRA)];
};

/**
 * Assign fins to an array matching the vertebrae
 * @param {Number} spineLength The length of the spine
 * @returns {Fin[][]} An array containing an array of fins per vertebrae
 */
FishBody.prototype.assignFins = function(spineLength) {
    const spineFins = new Array(spineLength).fill(null);
    const indexFront = this.fins.front.getVertebraIndex(spineLength, this.FIN_FRONT_AT);
    const indexBack = this.fins.back.getVertebraIndex(spineLength, this.FIN_BACK_AT);

    spineFins[indexFront] = [this.finInstances[0], this.finInstances[1]];
    spineFins[indexBack] = [this.finInstances[2], this.finInstances[3]];

    this.finInstances[0].connect(this.pattern, this.pattern.shapeBody.sample(indexFront / (spineLength - 1)) * this.radiusSampled);
    this.finInstances[1].connect(this.pattern, this.pattern.shapeBody.sample(indexFront / (spineLength - 1)) * this.radiusSampled);
    this.finInstances[2].connect(this.pattern, this.pattern.shapeBody.sample(indexBack / (spineLength - 1)) * this.radiusSampled);
    this.finInstances[3].connect(this.pattern, this.pattern.shapeBody.sample(indexBack / (spineLength - 1)) * this.radiusSampled);

    return spineFins;
};

/**
 * Disturb water while swimming
 * @param {Water} water A water plane to disturb
 * @param {AudioBank} audio Game audio
 * @param {Constellation} constellation The Constellation
 * @param {Number} speed The fish speed
 * @param {Random} random A randomizer
 */
FishBody.prototype.disturbWater = function(
    water,
    audio,
    constellation,
    speed,
    random) {
    const tailIndex = this.spine.length - 2;
    const dx = this.spine[tailIndex].x - this.spinePrevious[tailIndex].x;
    const dy = this.spine[tailIndex].y - this.spinePrevious[tailIndex].y;
    const tailSpeedSquared = dx * dx + dy * dy;

    if (tailSpeedSquared > this.SPEED_WAVE_THRESHOLD * this.SPEED_WAVE_THRESHOLD) {
        const tailSpeed = Math.sqrt(tailSpeedSquared);
        const intensity = this.WAVE_INTENSITY_MIN + (tailSpeed - this.SPEED_WAVE_THRESHOLD) *
            this.WAVE_INTENSITY_MULTIPLIER;

        water.addFlare(
            this.spine[tailIndex].x,
            this.spine[tailIndex].y,
            this.WAVE_RADIUS,
            intensity * (random.getFloat() * this.WAVE_TURBULENCE + (1 - this.WAVE_TURBULENCE)));

        if (this.tailAudioCountdown === 0 && tailSpeed > this.TAIL_AUDIO_THRESHOLD) {
            const x = this.spine[tailIndex].x;

            if (x > 0 && x < constellation.width) {
                const pan = 2 * this.spine[tailIndex].x / constellation.width - 1;
                const volume = this.TAIL_AUDIO_VOLUME_MIN +
                    Math.min(1, (tailSpeed - this.TAIL_AUDIO_THRESHOLD) / this.TAIL_AUDIO_RAMP) *
                    (1 - this.TAIL_AUDIO_VOLUME_MIN);

                this.tailAudioCountdown = this.TAIL_AUDIO_COOLDOWN;

                if (speed > this.FAST_THRESHOLD)
                    audio.effectFishTailFast.play(pan, volume);
                else {
                    if (this.isHeavy())
                        audio.effectFishTailBig.play(pan, volume);
                    else
                        audio.effectFishTailSmall.play(pan, volume);
                }
            }
        }
    }
};

/**
 * Instantly move the body to the given position
 * @param {Vector2} position The position to move the spine head to
 */
FishBody.prototype.moveTo = function(position) {
    const dx = position.x - this.spine[0].x;
    const dy = position.y - this.spine[0].y;

    for (const vertebra of this.spine) {
        vertebra.x += dx;
        vertebra.y += dy;
    }

    this.storePreviousState();

    for (const fin of this.finInstances)
        fin.shift(dx, dy);

    this.tail.shift(dx, dy);
};

/**
 * Check if this fish overlaps the given position
 * @param {Number} x The X position
 * @param {Number} y The Y position
 * @param {Object} hits The array of fish passing the broad phase
 * @param {Fish} fish The fish collisions are being checked for
 * @returns {Boolean} True if the fish was definitely hit, false otherwise
 */
FishBody.prototype.atPosition = function(x, y, hits, fish) {
    const radius = this.spacing * (this.spine.length - 1) * .5 + this.radiusSampled * this.BROAD_RADIUS;
    let dx = x - this.getOffspringPosition().x;
    let dy = y - this.getOffspringPosition().y;
    let nearestSquared = 1000;

    if (dx * dx + dy * dy > radius * radius)
        return false;

    for (let segment = 0; segment < this.spine.length - 1; ++segment) {
        const lx = (this.spine[segment + 1].x - this.spine[segment].x) / this.spacing;
        const ly = (this.spine[segment + 1].y - this.spine[segment].y) / this.spacing;

        dx = x - this.spine[segment].x;
        dy = y - this.spine[segment].y;

        const projected = Math.max(0, Math.min(this.spacing, lx * dx + ly * dy));
        const px = this.spine[segment].x + lx * projected;
        const py = this.spine[segment].y + ly * projected;

        dx = x - px;
        dy = y - py;

        const squared = dx * dx + dy * dy;

        if (squared < this.radiusSampled * this.radiusSampled)
            return true;

        if (squared < nearestSquared)
            nearestSquared = dx * dx + dy * dy;
    }

    if (nearestSquared < this.radiusSampled * this.BROAD_RADIUS * this.radiusSampled * this.BROAD_RADIUS)
        hits.push({
            fish: fish,
            distance: nearestSquared
        });

    return false;
};

/**
 * Initialize the spine
 * @param {Vector2} [head] The head position
 * @param {Vector2} [direction] The initial body direction
 */
FishBody.prototype.initializeSpine = function(head = new Vector2(), direction = new Vector2(1, 0)) {
    const step = direction.copy().multiply(this.spacing);

    this.spine[0] = head.copy();
    this.spinePrevious[0] = head.copy();

    for (let vertebra = 1; vertebra < this.spine.length; ++vertebra) {
        this.spine[vertebra] = this.spine[vertebra - 1].copy().subtract(step);
        this.spinePrevious[vertebra] = this.spine[vertebra].copy();

        if (this.finGroups[vertebra]) for (const fin of this.finGroups[vertebra])
            fin.initializePosition(this.spine[vertebra]);
    }

    this.tailOffset = this.tail.connect(this.spine, this.radiusSampled);
};

/**
 * Make spring strengths
 * @param {Number} start The spring strength at the head
 * @param {Number} end The spring strength at the tail
 * @param {Number} power A power to apply to the spring strength attenuation
 * @returns {Number[]} An array of strings
 */
FishBody.prototype.makeSprings = function(start, end, power) {
    const sampler = new SamplerPower(start, end, power);
    const springs = new Array(this.spine.length - 1);

    for (let spring = 0; spring < this.spine.length - 1; ++spring)
        springs[spring] = start + (end - start) * sampler.sample(spring / (this.spine.length - 2));

    return springs;
};

/**
 * Store the current state into the previous state
 */
FishBody.prototype.storePreviousState = function() {
    for (let segment = 0; segment < this.spine.length; ++segment)
        this.spinePrevious[segment].set(this.spine[segment]);
};

/**
 * Calculate the spacing of this body
 */
FishBody.prototype.calculateSpacing = function() {
    this.spacing = this.size * this.lengthSampled / (this.spine.length - 1);
    this.inverseSpacing = 1 / this.spacing;
};

/**
 * Update the body state
 * @param {Vector2} head The new head position
 * @param {Vector2} direction The normalized head direction
 * @param {Number} speed The fish speed
 * @param {Boolean} [updateAge] A boolean indicated whether the body should age this update
 * @param {Water} [water] A water plane to disturb
 * @param {AudioBank} [audio] Game audio
 * @param {Constellation} [constellation] The Constellation
 * @param {Random} [random] A randomizer, required when water is supplied
 */
FishBody.prototype.update = function(
    head,
    direction,
    speed,
    updateAge = false,
    water = null,
    audio = null,
    constellation = null,
    random = null) {
    if (updateAge && this.age !== 0xFFFF)
        this.size = this.samplerSize.sample(++this.age / 0xFFFF);

    if (this.tailAudioCountdown !== 0)
        --this.tailAudioCountdown;

    this.storePreviousState();
    this.spine[0].set(head);
    this.calculateSpacing();

    const speedFactor = speed - this.SPEED_SWING_THRESHOLD;
    const angle = direction.angle() + Math.PI + Math.cos(this.phase) * speedFactor * this.SWIM_AMPLITUDE;

    let xDir = Math.cos(angle);
    let yDir = Math.sin(angle);

    for (let vertebra = 1, vertebrae = this.spine.length; vertebra < vertebrae; ++vertebra) {
        let dx = this.spine[vertebra].x - this.spine[vertebra - 1].x;
        let dy = this.spine[vertebra].y - this.spine[vertebra - 1].y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        const spring = this.springs[vertebra - 1] + (1 - this.springs[vertebra - 1]) * (1 - this.size);
        const dxc = this.spine[vertebra - 1].x + xDir * this.spacing - this.spine[vertebra].x;
        const dyc = this.spine[vertebra - 1].y + yDir * this.spacing - this.spine[vertebra].y;
        const xDirPrevious = xDir;
        const yDirPrevious = yDir;

        xDir = dx / distance;
        yDir = dy / distance;

        dx += dxc * spring;
        dy += dyc * spring;

        distance = Math.sqrt(dx * dx + dy * dy);

        this.spine[vertebra].set(this.spine[vertebra - 1]);
        this.spine[vertebra].x += this.spacing * dx / distance;
        this.spine[vertebra].y += this.spacing * dy / distance;

        if (this.finGroups[vertebra]) for (const fin of this.finGroups[vertebra])
            fin.update(
                this.spine[vertebra],
                xDirPrevious,
                yDirPrevious,
                this.finPhase,
                this.size);
    }

    this.tail.update(this.spine);

    if ((this.phase += this.SWIM_SPEED * speed / this.size) > Math.PI + Math.PI)
        this.phase -= Math.PI + Math.PI;

    if ((this.finPhase -= this.FIN_PHASE_SPEED) < 0)
        this.finPhase += Math.PI + Math.PI;

    if (water)
        this.disturbWater(water, audio, constellation, speed, random);
};

/**
 * Render the body
 * @param {Bodies} bodies The bodies renderer
 * @param {Number} time The interpolation factor
 */
FishBody.prototype.render = function(bodies, time) {
    for (const fin of this.finInstances)
        fin.render(bodies, time);

    const indexOffsetFin = bodies.buffer.getVertexCount();
    const indexOffset = indexOffsetFin + this.tail.getVertexCount();
    const indexOffsetBack = indexOffset + ((this.tailOffset + 1) << 1);

    this.tail.renderBottom(bodies, indexOffsetFin, indexOffsetBack, this.size, this.pattern, time);

    let xp, x = this.spinePrevious[0].x + (this.spine[0].x - this.spinePrevious[0].x) * time;
    let yp, y = this.spinePrevious[0].y + (this.spine[0].y - this.spinePrevious[0].y) * time;
    let dxp, dx;
    let dyp, dy;
    let startIndex = indexOffset;

    for (let vertebra = 1, vertebrae = this.spine.length; vertebra < vertebrae; ++vertebra) {
        xp = x;
        yp = y;

        x = this.spinePrevious[vertebra].x + (this.spine[vertebra].x - this.spinePrevious[vertebra].x) * time;
        y = this.spinePrevious[vertebra].y + (this.spine[vertebra].y - this.spinePrevious[vertebra].y) * time;

        if (vertebra === 1) {
            dx = x - xp;
            dy = y - yp;
        }

        dxp = dx;
        dyp = dy;
        dx = x - xp;
        dy = y - yp;

        const radius = this.radiusSampled * this.size;
        const dxAveraged = (dx + dxp) * .5;
        const dyAveraged = (dy + dyp) * .5;
        const u = this.pattern.region.uBodyStart + (this.pattern.region.uBodyEnd - this.pattern.region.uBodyStart) *
            (vertebra - 1) / (vertebrae - 1);

        bodies.buffer.addVertices(
            xp - radius * dyAveraged * this.inverseSpacing,
            yp + radius * dxAveraged * this.inverseSpacing,
            u,
            this.pattern.region.vStart,
            xp + radius * dyAveraged * this.inverseSpacing,
            yp - radius * dxAveraged * this.inverseSpacing,
            u,
            this.pattern.region.vEnd);

        if (vertebra > this.tailOffset) {
            bodies.buffer.addVertices(
                xp,
                yp,
                this.pattern.region.uFinStart + (this.pattern.region.uFinEnd - this.pattern.region.uFinStart) * .5,
                this.pattern.region.vStart + (this.pattern.region.vEnd - this.pattern.region.vStart) * .5);

            if (vertebra === vertebrae - 1)
                bodies.buffer.addIndices(
                    startIndex,
                    startIndex + 1,
                    startIndex + 3);
            else
                bodies.buffer.addIndices(
                    startIndex,
                    startIndex + 1,
                    startIndex + 4,
                    startIndex + 4,
                    startIndex + 3,
                    startIndex);

            startIndex += 3;
        }
        else {
            bodies.buffer.addIndices(
                startIndex,
                startIndex + 1,
                startIndex + 3,
                startIndex + 3,
                startIndex + 2,
                startIndex);

            startIndex += 2;
        }
    }

    bodies.buffer.addVertices(
        this.spinePrevious[this.spine.length - 1].x +
            (this.spine[this.spine.length - 1].x - this.spinePrevious[this.spine.length - 1].x) * time,
        this.spinePrevious[this.spine.length - 1].y +
            (this.spine[this.spine.length - 1].y - this.spinePrevious[this.spine.length - 1].y) * time,
        this.pattern.region.uBodyEnd,
        (this.pattern.region.vStart + this.pattern.region.vEnd) * .5);
    bodies.buffer.addVertices(
        this.spinePrevious[this.spine.length - 1].x +
        (this.spine[this.spine.length - 1].x - this.spinePrevious[this.spine.length - 1].x) * time,
        this.spinePrevious[this.spine.length - 1].y +
        (this.spine[this.spine.length - 1].y - this.spinePrevious[this.spine.length - 1].y) * time,
        this.pattern.region.uFinStart + (this.pattern.region.uFinEnd - this.pattern.region.uFinStart) * .5,
        (this.pattern.region.vStart + this.pattern.region.vEnd) * .5);

    this.tail.renderTop(bodies, indexOffsetFin, indexOffsetBack);
};

/**
 * Animate the spine with the loop animation
 * @param {Number} xStart The X start position in meters
 * @param {Number} yStart The Y start position in meters
 * @param {Number} xEnd The X end position in meters
 * @param {Number} yEnd The Y end position in meters
 * @param {Number} progress The animation progress in the range [0, 1]
 */
FishBody.prototype.animateSpineLoop = function(
    xStart,
    yStart,
    xEnd,
    yEnd,
    progress) {
    const dx = xEnd - xStart;
    const dy = yEnd - yStart;
    const d = Math.sqrt(dx * dx + dy * dy);
    const direction = -Math.atan2(dy, dx) + Math.PI;
    const shift = .5 * (d - (this.spine.length - 1) * this.spacing);

    this.spine[0].x = xStart + shift * dx / d;
    this.spine[0].y = yStart + shift * dy / d;

    for (let vertebra = 1, vertebrae = this.spine.length; vertebra < vertebrae; ++vertebra) {
        const distance = vertebra / (vertebrae - 1);
        const phase = progress * Math.PI * 2;
        const angle = Math.sin((this.SPINE_LOOP_FLEXIBILITY.sample(distance) - progress) * Math.PI * 2) *
            this.SPINE_LOOP_ANGLE_AMPLITUDE - direction;
        const xDir = Math.cos(angle);
        const yDir = Math.sin(angle);

        this.spine[vertebra].x = this.spine[vertebra - 1].x - xDir * this.spacing;
        this.spine[vertebra].y = this.spine[vertebra - 1].y - yDir * this.spacing;

        if (this.finGroups[vertebra]) for (const fin of this.finGroups[vertebra])
            fin.setNeutral(this.spine[vertebra], -xDir, -yDir, phase, this.SPINE_LOOP_PHASE_AMPLITUDE, this.size);
    }

    this.tail.setNeutral(this.spine);
};

/**
 * @param {Number} xStart The X start position in meters
 * @param {Number} yStart The Y start position in meters
 * @param {Number} xEnd The X end position in meters
 * @param {Number} yEnd The Y end position in meters
 * @param {Bodies} bodies The bodies renderer
 * @param {Number} progress The animation progress in the range [0, 1]
 */
FishBody.prototype.renderLoop = function(
    xStart,
    yStart,
    xEnd,
    yEnd,
    bodies,
    progress) {
    this.animateSpineLoop(xStart, -yStart, xEnd, -yEnd, progress);

    this.render(bodies, 1);
};

/**
 * Free all resources maintained by this body
 * @param {Atlas} atlas The texture atlas
 */
FishBody.prototype.free = function(atlas) {
    this.pattern.free(atlas);
};