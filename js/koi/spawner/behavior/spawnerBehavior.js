/**
 * Spawner behavior
 * @param {Blueprint[]} blueprints A set of blueprints to choose from
 * @param {Number} chance The chance that a spawn operation is performed on getBlueprint()
 * @constructor
 */
const SpawnerBehavior = function(blueprints, chance) {
    this.blueprints = blueprints;
    this.chance = chance;
};

/**
 * Get the index of the blueprint to spawn
 * @param {WeatherState} weatherState The weather state
 * @param {Random} random The randomizer
 * @returns {Number} The blueprint index
 */
SpawnerBehavior.prototype.getBlueprintIndex = function(weatherState, random) {
    return 0;
};

/**
 * Get a fish to spawn
 * @param {Random} random A randomizer
 * @param {WeatherState} weatherState The weather state
 * @returns {Blueprint} The blueprint of the fish to spawn, nor null if none should be spawned
 */
SpawnerBehavior.prototype.getBlueprint = function(weatherState, random) {
    if (this.chance !== 1 && random.getFloat() > this.chance)
        return null;

    const index = this.getBlueprintIndex(weatherState, random);

    if (index !== -1)
        return this.blueprints[index];

    return null;
};

/**
 * Get the school size for a given blueprint
 * @param {Blueprint} blueprint The blueprint
 * @param {Random} random A randomizer
 * @returns {Number} The school size
 */
SpawnerBehavior.prototype.getSchoolSize = function(blueprint, random) {
    return blueprint.getSchoolSize(random);
};