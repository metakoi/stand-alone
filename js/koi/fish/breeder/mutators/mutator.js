/**
 * A property mutator containing common mutation functions
 * @constructor
 */
const Mutator = function() {

};

Mutator.prototype = Object.create(NumericManipulator.prototype);

/**
 * Mutate an unsigned 8 bit integer
 * @param {Number} n The 8 bit integer
 * @param {Sampler} sampler A sample to sample mutation offset from
 * @param {Number} x A random number in the range [0, 1] to use for sampling
 * @returns {Number} The mutated integer
 */
Mutator.prototype.mutateUint8 = function(n, sampler, x) {
    return this.clampUint8(n + sampler.sample(x));
};

/**
 * Move a 3D vector in a random direction
 * @param {Vector3} vector The vector to move
 * @param {Sampler} distance A distance sampler
 * @param {Random} random A randomizer
 */
Mutator.prototype.mutateVector3 = function(vector, distance, random) {
    vector.add(new Vector3().randomUnit(random).multiply(distance.sample(random.getFloat())));
};

/**
 * Mutate a 3D normal vector
 * @param {Vector3} vector A 3D normal vector
 * @param {Sampler} distance A distance sampler
 * @param {Random} random A randomizer
 */
Mutator.prototype.mutateNormalVector3 = function(vector, distance, random) {
    const angle = Math.PI * 2 * random.getFloat();
    const radius = distance.sample(random.getFloat());
    const x = vector.makeOrthogonal();
    const y = vector.cross(x);
    // TODO: Implement proper 3d vector rotation instead
    vector.x += Math.cos(angle) * radius * x.x + Math.sin(angle) * radius * y.x;
    vector.y += Math.cos(angle) * radius * x.y + Math.sin(angle) * radius * y.y;
    vector.z += Math.cos(angle) * radius * x.z + Math.sin(angle) * radius * y.z;

    vector.normalize();
};