/**
 * A 3D vector
 * @param {Number} [x] The X value
 * @param {Number} [y] The Y value
 * @param {Number} [z] The Z value
 * @constructor
 */
const Vector3 = function(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
};

Vector3.prototype.UP = new Vector3(0, 1, 0);
Vector3.prototype.UP_ALT = new Vector3(.1, 1, 0);

/**
 * Serialize this vector
 * @param {BinBuffer} buffer A buffer to serialize to
 */
Vector3.prototype.serialize = function(buffer) {
    buffer.writeFloat(this.x);
    buffer.writeFloat(this.y);
    buffer.writeFloat(this.z);
};

/**
 * Deserialize this vector
 * @param {BinBuffer} buffer A buffer to deserialize from
 * @returns {Vector3} This vector
 */
Vector3.prototype.deserialize = function(buffer) {
    this.x = buffer.readFloat();
    this.y = buffer.readFloat();
    this.z = buffer.readFloat();

    return this;
};

/**
 * Set this vector to another vector
 * @param {Vector3} other The vector to copy from
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.set = function(other) {
    this.x = other.x;
    this.y = other.y;
    this.z = other.z;

    return this;
};

/**
 * Copy this vector
 * @returns {Vector3} A copy of this vector
 */
Vector3.prototype.copy = function() {
    return new Vector3(this.x, this.y, this.z);
};

/**
 * Create an interpolated vector from this one to another vector
 * @param {Vector3} to The vector to interpolate towards
 * @param {Number} x The interpolation factor in the range [0, 1]
 * @returns {Vector3} A new vector
 */
Vector3.prototype.interpolate = function(to, x) {
    return new Vector3(
        this.x + (to.x - this.x) * x,
        this.y + (to.y - this.y) * x,
        this.z + (to.z - this.z) * x);
};

/**
 * A function that evaluates whether this vector is a normal vector
 * @returns {Boolean} True if this vector is approximately a normal vector
 */
Vector3.prototype.isNormal = function() {
    return Math.abs(this.length() - 1) < .01;
};

/**
 * Validate whether all vector components are within the given limits
 * @param {Number} min The minimum value
 * @param {Number} max The maximum value
 * @returns {Boolean} True if all components are within limits
 */
Vector3.prototype.withinLimits = function(min, max) {
    return this.x >= min && this.y >= min && this.z >= min && this.x <= max && this.y <= max && this.z <= max;
};

/**
 * Make a vector that is orthogonal to this one
 * @returns {Vector3} An orthogonal vector
 */
Vector3.prototype.makeOrthogonal = function() {
    if (this.equals(this.UP))
        return this.cross(this.UP_ALT).normalize();

    return this.cross(this.UP).normalize();
};

/**
 * Add a vector to this vector
 * @param {Vector3} other A vector
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.add = function(other) {
    this.x += other.x;
    this.y += other.y;
    this.z += other.z;

    return this;
};

/**
 * Subtract a vector from this vector
 * @param {Vector3} other A vector
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.subtract = function(other) {
    this.x -= other.x;
    this.y -= other.y;
    this.z -= other.z;

    return this;
};

/**
 * Multiply this vector by a scalar
 * @param {Number} scalar A number
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.multiply = function(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;

    return this;
};

/**
 * Divide this vector by a scalar
 * @param {Number} scalar A number
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.divide = function(scalar) {
    return this.multiply(1 / scalar);
};

/**
 * Get the dot product of this vector and another vector
 * @param {Vector3} other A vector
 * @returns {Number} The dot product
 */
Vector3.prototype.dot = function(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z;
};

/**
 * Calculate the length of this vector
 * @returns {Number} The length of this vector
 */
Vector3.prototype.length = function() {
    return Math.sqrt(this.dot(this));
};

/**
 * Check whether this vector is equal to another vector
 * @param {Vector3} other The other vector
 * @returns {Boolean} A boolean indicating whether the vectors are the same
 */
Vector3.prototype.equals = function(other) {
    return this.x === other.x && this.y === other.y && this.z === other.z;
};

/**
 * Normalize this vector
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.normalize = function() {
    const length = this.length();

    if (length !== 0)
        return this.divide(length);
    else {
        this.x = 1;
        this.y = this.z = 0;

        return this;
    }
};

/**
 * Get the cross product of this vector and another vector
 * @param {Vector3} other A vector
 * @returns {Vector3} The cross product of this vector and the other vector
 */
Vector3.prototype.cross = function(other) {
    return new Vector3(
        this.y * other.z - other.y * this.z,
        this.z * other.x - other.z * this.x,
        this.x * other.y - other.x * this.y);
};

/**
 * Get the 2D part of this vector
 * @returns {Vector2} The 2D part of this vector
 */
Vector3.prototype.vector2 = function() {
    return new Vector2(this.x, this.y);
};

/**
 * Set this vector to a random unit vector
 * @param {Random} random A randomizer
 * @returns {Vector3} The modified vector
 */
Vector3.prototype.randomUnit = function(random) {
    const lambda = Math.acos(2 * random.getFloat() - 1) - .5 * Math.PI;
    const phi = 2 * Math.PI * random.getFloat();

    this.x = Math.cos(lambda) * Math.cos(phi);
    this.y = Math.cos(lambda) * Math.sin(phi);
    this.z = Math.sin(lambda);

    return this;
};