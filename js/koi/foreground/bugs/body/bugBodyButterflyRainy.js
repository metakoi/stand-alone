/**
 * A rainy weather butterfly
 * @param {WebGLRenderingContext} gl A WebGL rendering context
 * @param {Random} random A randomizer
 * @constructor
 */
const BugBodyButterflyRainy = function(gl, random) {
    BugBodyButterfly.call(
        this,
        gl,
        this.SAMPLER_BODY_HEIGHT,
        this.SAMPLER_TOP_LENGTH,
        this.SAMPLER_TOP_ANGLE,
        this.SAMPLER_BOTTOM_LENGTH,
        this.SAMPLER_BOTTOM_ANGLE,
        this.COLOR_WINGS,
        this.COLOR_WINGS_EDGE,
        false,
        this.SPEED,
        random);
};

BugBodyButterflyRainy.prototype = Object.create(BugBodyButterfly.prototype);
BugBodyButterflyRainy.prototype.SPEED = new SamplerPower(.002, .1, .38);
BugBodyButterflyRainy.prototype.COLOR_WINGS = Color.fromCSS("--color-bug-butterfly-blue");
BugBodyButterflyRainy.prototype.COLOR_WINGS_EDGE = Color.fromCSS("--color-bug-butterfly-blue-edge");
BugBodyButterflyRainy.prototype.SAMPLER_BODY_HEIGHT = new SamplerPower(.07, .08, 2);
BugBodyButterflyRainy.prototype.SAMPLER_TOP_LENGTH = new SamplerPower(.5, .56, 2);
BugBodyButterflyRainy.prototype.SAMPLER_TOP_ANGLE = new Sampler(Math.PI * .27, Math.PI * .33);
BugBodyButterflyRainy.prototype.SAMPLER_BOTTOM_LENGTH = new SamplerPower(.38, .42, 2);
BugBodyButterflyRainy.prototype.SAMPLER_BOTTOM_ANGLE = new Sampler(Math.PI * -.37, Math.PI * -.42);