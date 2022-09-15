/**
 * A path sampler
 * @param {Path} path A path
 * @constructor
 */
const PathSampler = function(path) {
    this.path = path;
    this.segmented = path.isLinear() ? null : new PathSamplerSegmented(path);
    this.length = path.isLinear() ? path.getLinearLength() : this.segmented.getLength();
};

PathSampler.prototype.DERIVATIVE_DELTA = .05;

/**
 * Get the path of this sampler
 * @returns {Path} The path
 */
PathSampler.prototype.getPath = function() {
    return this.path;
};

/**
 * Get the exact length of this path
 * @returns {Number} The length
 */
PathSampler.prototype.getLength = function() {
    return this.length;
};

/**
 * Sample the path assuming it is linear
 * @param {Object} vector The vector to store the sample in
 * @param {Number} at The distance from the starting point, no higher than the path length
 */
PathSampler.prototype.sampleLinear = function(vector, at) {
    this.path.sample(vector, at / this.length);
};

/**
 * Sample the path assuming it is segmented
 * @param {Object} vector The vector to store the sample in
 * @param {Number} at The distance from the starting point, no higher than the path length
 */
PathSampler.prototype.sampleSegmented = function(vector, at) {
    this.segmented.sample(vector, at);
};

/**
 * Sample the path
 * @param {Object} vector The vector to store the sample in
 * @param {Number} at The distance from the starting point, no higher than the path length
 */
PathSampler.prototype.sample = function(vector, at) {
    if (this.path.isLinear())
        this.sampleLinear(vector, at);
    else
        this.sampleSegmented(vector, at);
};

/**
 * Get the direction vector at a certain point
 * @param {Object} vector The vector to store the direction in
 * @param {Number} at The distance from the starting point, no higher than the path length
 */
PathSampler.prototype.sampleDirection = function(vector, at) {
    const before = this.path.getStart().copy();
    const after = before.copy();

    this.sample(before, Math.max(0, at - this.DERIVATIVE_DELTA));
    this.sample(after, Math.min(this.length, at + this.DERIVATIVE_DELTA));

    vector.set(after).subtract(before).normalize();
};