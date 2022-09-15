/**
 * The fish spawner
 * @param {Constellation} constellation A constellation to spawn fish in
 * @param {SpawnerBehavior} behavior Spawner behavior
 * @param {SpawnerState} [state] The state of this spawner
 * @constructor
 */
const Spawner = function(constellation, behavior, state = new SpawnerState()) {
    this.constellation = constellation;
    this.behavior = behavior;
    this.state = state;
    this.time = 0;
};

Spawner.prototype.SPAWN_OVERHEAD = 200;
Spawner.prototype.SPAWN_LIMIT = 16;

/**
 * Set the spawner state
 * @param {SpawnerState} state The spawner state
 */
Spawner.prototype.setState = function(state) {
    this.state = state;
};

/**
 * Get the spawner state
 * @returns {SpawnerState} The spawner state
 */
Spawner.prototype.getState = function() {
    return this.state;
};

/**
 * Set the spawning behavior
 * @param {SpawnerBehavior} behavior Spawner behavior
 */
Spawner.prototype.setBehavior = function(behavior) {
    this.behavior = behavior;
};

/**
 * Spawn the initial fish
 * @param {Atlas} atlas The atlas to render newly spawned patterns on
 * @param {RandomSource} randomSource A random source
 * @param {Random} random A randomizer
 */
Spawner.prototype.spawnInitial = function(atlas, randomSource, random) {
    this.state.spawnInitial(
        this.constellation,
        atlas,
        randomSource,
        random);
};

/**
 * Update the spawner
 * @param {Atlas} atlas The atlas to render newly spawned patterns on
 * @param {WeatherState} weatherState The weather state
 * @param {RandomSource} randomSource A random source
 * @param {Random} random A randomizer
 */
Spawner.prototype.update = function(
    atlas,
    weatherState,
    randomSource,
    random) {
    this.state.update(
        this.behavior,
        this.constellation,
        atlas,
        weatherState,
        randomSource,
        this.SPAWN_LIMIT,
        this.SPAWN_OVERHEAD,
        random);
};