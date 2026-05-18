const FEATURES = {
  openrouter: {
    label: 'OpenRouter traces',
  },
};

function isValidFeature(key) {
  return Object.prototype.hasOwnProperty.call(FEATURES, key);
}

function listFeatureKeys() {
  return Object.keys(FEATURES);
}

module.exports = {
  FEATURES,
  isValidFeature,
  listFeatureKeys,
};
