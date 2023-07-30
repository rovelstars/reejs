export default function merge (obj1, obj2) {
  return obj1.concat(obj2).reduce((acc, cur) => {
    const found = acc.find(e => e?.name === cur?.name);
    if (found) {
      Object.assign(found, cur);
    } else if (cur) {
      acc.push(cur);
    }
    return acc;
  }, []);
};