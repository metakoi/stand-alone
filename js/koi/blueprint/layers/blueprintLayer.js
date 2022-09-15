/**
 * A blueprint for a layer
 * @param {Number} [paletteIndex] A palette sample index, if applicable
 * @constructor
 */
const BlueprintLayer = function(paletteIndex = 0) {
    this.paletteIndex = paletteIndex;
};

BlueprintLayer.PALETTE_RANDOM = -1;

/**
 * Spawn a layer
 * @param {Random} random A randomizer
 * @param {Number} paletteIndex The palette index
 * @returns {Layer} A ridge layer
 */
BlueprintLayer.prototype.spawn = function(random, paletteIndex) {
    return null;
};