/**
 * A code reader
 * @param {HTMLImageElement} image An image to read as code
 * @constructor
 */
const CodeReader = function(image) {
    this.pixels = this.getPixels(image);
};

CodeReader.prototype = Object.create(Code.prototype);
CodeReader.prototype.TOLERANCE = .2;

/**
 * Make a canvas out of the source image
 * @param {HTMLImageElement} image An image to read as code
 * @returns {ImageData|null} The image pixels, or null if the image was invalid
 */
CodeReader.prototype.getPixels = function(image) {
    if (image.width !== image.height)
        return null;

    const scale = (this.RADIUS << 1) / image.width;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = this.RADIUS << 1;
    canvas.height = this.RADIUS << 1;

    context.save();
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);
    context.restore();

    return context.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Create a BinBuffer from quad bits
 * @param {Number[]} quadBits The quad bits
 * @returns {BinBuffer|null} The buffer, or null when an error occurs
 */
CodeReader.prototype.createBuffer = function(quadBits) {
    const byteCount = quadBits[0] | (quadBits[1] << 2) | (quadBits[2] << 4) | (quadBits[3] << 6) | (quadBits[4] << 8);
    const checksum = quadBits[5] | (quadBits[6] << 2) | (quadBits[7] << 4) | (quadBits[8] << 6);
    const bytes = new Uint8Array(byteCount);

    for (let byte = 0; byte < byteCount; ++byte) {
        bytes[byte] =
            quadBits[(byte << 2) + 9] |
            (quadBits[(byte << 2) + 10] << 2) |
            (quadBits[(byte << 2) + 11] << 4) |
            (quadBits[(byte << 2) + 12] << 6);
    }

    if (checksum !== this.checksum(bytes))
        return null;

    return new BinBuffer(bytes);
};

/**
 * Read
 * @returns {FishBody|null} A fish body, or null if deserialization failed
 */
CodeReader.prototype.read = function() {
    if (!this.pixels)
        return null;

    const quadBits = [];
    let failure = false;

    this.iterate((color, radiusInner, radiusOuter, aStart, aEnd, base) => {
        const radius = (radiusInner + radiusOuter + (base ? radiusInner : radiusOuter)) / 3;
        const angle = .5 * (aStart + aEnd);
        const x = Math.round(this.RADIUS + Math.cos(angle) * radius);
        const y = Math.round(this.RADIUS + Math.sin(angle) * radius);
        const pixelIndex = (x + y * (this.RADIUS << 1)) << 2;
        const pixelColor = new Color(
            (this.pixels.data[pixelIndex] & 0xFF) / 0xFF,
            (this.pixels.data[pixelIndex + 1] & 0xFF) / 0xFF,
            (this.pixels.data[pixelIndex + 2] & 0xFF) / 0xFF,
            (this.pixels.data[pixelIndex + 3] & 0xFF) / 0xFF);
        let match = false;

        for (let quadBit = 0; quadBit < 4; ++quadBit) {
            const distance = pixelColor.distance(this.QUADBITS[quadBit]);

            if (distance < this.TOLERANCE) {
                quadBits[color] = quadBit;
                match = true;

                break;
            }
        }

        if (!match) {
            failure = true;

            return false;
        }

        return true;
    });

    if (failure)
        return null;

    const buffer = this.createBuffer(quadBits);

    if (!buffer)
        return null;

    let body = null;

    try {
        body = FishBody.deserialize(buffer);
    }
    catch (error) {
        return null;
    }

    return body;
};