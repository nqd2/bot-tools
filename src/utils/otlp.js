function getAttributeValue(attr) {
  const value = attr?.value;
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  if (value.stringValue !== undefined) return value.stringValue;
  if (value.intValue !== undefined) return Number(value.intValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.boolValue !== undefined) return value.boolValue;
  if (value.arrayValue?.values?.length) {
    return value.arrayValue.values.map((item) => getAttributeValue({ value: item }));
  }

  const [first] = Object.values(value);
  return first;
}

function spanAttributesToMap(attributes = []) {
  return attributes.reduce((map, attr) => {
    if (attr?.key) {
      map[attr.key] = getAttributeValue(attr);
    }
    return map;
  }, {});
}

function* iterateSpans(body) {
  const resourceSpans = body?.resourceSpans || [];
  for (const resourceSpan of resourceSpans) {
    const scopeSpans = resourceSpan?.scopeSpans || [];
    for (const scopeSpan of scopeSpans) {
      const spans = scopeSpan?.spans || [];
      for (const span of spans) {
        yield span;
      }
    }
  }
}

module.exports = {
  getAttributeValue,
  spanAttributesToMap,
  iterateSpans,
};
