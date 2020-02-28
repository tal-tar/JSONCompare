/**
 * @param {Object} o1     First object
 * @param {Object} o2     Second object
 * @param {Object} rules  oldName:NewName
 * @returns {Object}      Object containing all differences
 */
function compareObjects(o1, o2, rules) {
  function isObject(x) {
    return Object(x) === x;
  }

  function renameKeys(obj) {
    if (!rules) return obj;
    return Object.keys(obj).reduce(
      (acc, key) => ({
        ...acc,
        ...{ [rules[key] || key]: obj[key] },
      }),
      {}
    );
  }

  const isArray = Array.isArray;

  const mut = (o, [k, v]) => ((o[k] = v), o);

  const diff1 = (left = {}, right = {}, rel = "left") =>
    Object.entries(left)
      .map(([k, v]) =>
        isObject(v) && isObject(right[k])
          ? [k, diff1(v, right[k], rel)]
          : right[k] !== v
          ? [k, { [rel]: v }]
          : [k, {}]
      )
      .filter(([k, v]) => Object.keys(v).length !== 0)
      .reduce(mut, isArray(left) && isArray(right) ? [] : {});

  const merge = (left = {}, right = {}) =>
    Object.entries(right)
      .map(([k, v]) =>
        isObject(v) && isObject(left[k]) ? [k, merge(left[k], v)] : [k, v]
      )
      .reduce(mut, left);

  const diff = (x = {}, y = {}) =>
    merge(diff1(x, y, "leftTextarea"), diff1(y, x, "rightTextarea"));

  return diff(renameKeys(o1), renameKeys(o2));
}
