export function merge(target, source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (isUnsafeMergeKey(key)) continue;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nextTarget = target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]) ? target[key] : {};
      target[key] = merge(nextTarget, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function isUnsafeMergeKey(key) {
  return key === '__proto__' || key === 'prototype' || key === 'constructor';
}
