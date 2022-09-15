/**
 * A cubic noise
 * @param {Number} width The width of the range that can be sampled
 * @param {Number} height The height of the range that can be sampled
 * @param {Random} randomizer A randomizer
 * @constructor
 */
const CubicNoise = function(width, height, randomizer) {
    this.width = width;
    this.height = height;
    this.randomizer = randomizer;
    this.values = new Array((width + 2) * (height + 3) + 1);

    for (let i = 0; i < this.values.length; ++i)
        this.values[i] = randomizer.getFloat();
};

/**
 * Create a new cubic noise with the same parameters, but different values
 * @returns {CubicNoise} A cubic noise
 */
CubicNoise.prototype.createSimilar = function() {
    return new CubicNoise(
        this.width,
        this.height,
        this.randomizer);
};

/**
 * Cubic interpolation
 * @param {Number} a The first value
 * @param {Number} b The second value
 * @param {Number} c The third value
 * @param {Number} d The fourth value
 * @param {Number} x The position to be interpolated between the second and the third value in the range [0, 1]
 * @returns {Number} The interpolated value
 */
CubicNoise.prototype.interpolate = function(a, b, c, d, x) {
    const p = (d - c) - (a - b);

    return x * (x * (x * p + ((a - b) - p)) + (c - a)) + b;
};

/**
 * Sample the noise
 * @param {Number} x The X value within [0, width]
 * @param {Number} y The Y value within [0, height]
 * @returns {Number} The noise value at the given coordinates
 */
CubicNoise.prototype.sample = function(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);

    return this.interpolate(
        this.interpolate(
            this.values[yi * (this.width + 2) + xi],
            this.values[yi * (this.width + 2) + xi + 1],
            this.values[yi * (this.width + 2) + xi + 2],
            this.values[yi * (this.width + 2) + xi + 3],
            x - xi),
        this.interpolate(
            this.values[(yi + 1) * (this.width + 2) + xi],
            this.values[(yi + 1) * (this.width + 2) + xi + 1],
            this.values[(yi + 1) * (this.width + 2) + xi + 2],
            this.values[(yi + 1) * (this.width + 2) + xi + 3],
            x - xi),
        this.interpolate(
            this.values[(yi + 2) * (this.width + 2) + xi],
            this.values[(yi + 2) * (this.width + 2) + xi + 1],
            this.values[(yi + 2) * (this.width + 2) + xi + 2],
            this.values[(yi + 2) * (this.width + 2) + xi + 3],
            x - xi),
        this.interpolate(
            this.values[(yi + 3) * (this.width + 2) + xi],
            this.values[(yi + 3) * (this.width + 2) + xi + 1],
            this.values[(yi + 3) * (this.width + 2) + xi + 2],
            this.values[(yi + 3) * (this.width + 2) + xi + 3],
            x - xi),
        y - yi) * .5 + .25;
};
