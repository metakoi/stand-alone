/**
 * A container for all persistent rendering systems
 * @param {WebGLRenderingContext} gl A WebGL context
 * @param {Random} random A randomizer which may be used only once
 * @param {Number} width The WebGL context width in pixels
 * @param {Number} height The WebGL context height in pixels
 * @constructor
 */
const Systems = function(gl, random, width, height) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.blit = new Blit(gl);
    this.quad = new Quad(gl, this.blit);
    this.sand = new Sand(gl);
    this.waves = new Waves(gl);
    this.ponds = new Ponds(gl);
    this.influencePainter = new InfluencePainter(gl);
    this.bodies = new Bodies(gl);
    this.vegetation = new Vegetation(gl);
    this.stone = new Stone(gl);
    this.shadows = new Shadows(gl);
    this.blur = new Blur(gl, this.quad);
    this.wind = new Wind(gl, this.quad);
    this.patterns = new Patterns(gl);
    this.atlas = new Atlas(gl, this.patterns, Koi.prototype.FISH_CAPACITY);
    this.distanceField = new DistanceField(gl, this.quad);
    this.drops = new Drops(gl);
    this.flying = new Flying(gl);
    this.fishBackground = new FishBackground(gl);
    this.preview = new Preview(gl, this.fishBackground);
    this.still = new Still(gl, this.fishBackground);
    this.randomSource = new RandomSource(gl, random);
};

/**
 * Resize the WebGL context
 * @param {Number} width The WebGL context width in pixels
 * @param {Number} height The WebGL context height in pixels
 */
Systems.prototype.resize = function(width, height) {
    this.width = width;
    this.height = height;
};

/**
 * Target the framebuffer visible to the user
 */
Systems.prototype.targetMain = function() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, this.width, this.height);
};

/**
 * Free all rendering systems
 */
Systems.prototype.free = function() {
    this.atlas.free();
    this.blit.free();
    this.patterns.free();
    this.sand.free();
    this.waves.free();
    this.ponds.free();
    this.influencePainter.free();
    this.bodies.free();
    this.quad.free();
    this.vegetation.free();
    this.stone.free();
    this.shadows.free();
    this.blur.free();
    this.wind.free();
    this.distanceField.free();
    this.drops.free();
    this.flying.free();
    this.preview.free();
    this.still.free();
    this.fishBackground.free();
    this.randomSource.free();
};