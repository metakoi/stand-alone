/**
 * A plateau shaped sampler
 * @param {Number} min The minimum value
 * @param {Number} plateau The plateau value, which must be between min and max
 * @param {Number} max The maximum value
 * @param {Number} width The plateau width factor, in the range [0, infinite>
 * @constructor
 */
const SamplerPlateau = function(min, plateau, max, width) {
    Sampler.call(this, min, max);

    this.width = width;
    this.power = Math.log((plateau - min) / this.getDomain()) / Math.log(.5);
};

SamplerPlateau.prototype = Object.create(Sampler.prototype);

/**
 * Sample this sample
 * @param {Number} x A value in the range [0, 1]
 * @returns {Number} A number in the range [min, max]
 */
SamplerPlateau.prototype.sample = function(x) {
    const at = x - .5;
    const multiplier = Math.pow(1 - Math.sin(Math.PI * x), this.width);

    return this.min + this.getDomain() * Math.pow(4 * at * at * at * multiplier + .5, this.power);
};