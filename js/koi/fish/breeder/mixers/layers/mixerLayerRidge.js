/**
 * Mix ridge layers
 * @param {LayerRidge} mother The mother layer
 * @param {LayerRidge} father The father layer
 * @constructor
 */
const MixerLayerRidge = function(mother, father) {
    this.mother = mother;
    this.father = father;
};

MixerLayerRidge.prototype = Object.create(Mixer.prototype);
MixerLayerRidge.prototype.SAMPLER_SAMPLE = MixerLayerSpots.prototype.SAMPLER_SAMPLE;
MixerLayerRidge.prototype.SAMPLER_PLANE = new SamplerSigmoid(0, 1, 8);
MixerLayerRidge.prototype.SAMPLER_SCALE = new SamplerSigmoid(0, 1, 15);
MixerLayerRidge.prototype.SAMPLER_POWER = new SamplerSigmoid(0, 1, 2);
MixerLayerRidge.prototype.SAMPLER_THRESHOLD = new SamplerSigmoid(0, 1, 2);
MixerLayerRidge.prototype.SAMPLER_FOCUS = new SamplerSigmoid(0, 1, 10);
MixerLayerRidge.prototype.SAMPLER_FOCUS_POWER = new SamplerSigmoid(0, 1, 11);

/**
 * Create a new layer that mixes the properties from both parents
 * @param {Random} random A randomizer
 * @returns {LayerRidge} The mixed layer
 */
MixerLayerRidge.prototype.mix = function(random) {
    const interpolateSample = random.getFloat();

    return new LayerRidge(
        this.mother.plane.interpolate(this.father.plane, this.SAMPLER_PLANE.sample(interpolateSample)),
        this.mother.paletteIndex,
        this.mixUint8(this.mother.scale, this.father.scale, this.SAMPLER_SCALE, interpolateSample),
        this.mixUint8(this.mother.power, this.father.power, this.SAMPLER_POWER, interpolateSample),
        this.mixUint8(this.mother.threshold, this.father.threshold, this.SAMPLER_THRESHOLD, interpolateSample),
        this.mixUint8(this.mother.focus, this.father.focus, this.SAMPLER_FOCUS, interpolateSample),
        this.mixUint8(this.mother.focusPower, this.father.focusPower, this.SAMPLER_FOCUS_POWER, interpolateSample));
};