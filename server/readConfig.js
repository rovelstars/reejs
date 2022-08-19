export default function readConfig(arr, word) {
    let e = arr
    .filter((l)=>{return !l.startsWith("#")})
    .filter((l) => {
      return l.split(":")[0].trim() == word.trim();
    });
    if (e?.length) {
      let r = e[0];
      r = r.startsWith(`${word}: `)?r.replace(`${word}: `, ""):r.replace(`${word}:`, "");
      if (r.includes("|") ||(r.startsWith("[") && r.endsWith("]"))) {
        r = r.substring(1, r.length - 1);
        r = r.split("|").map((e) => {
          e = e.trim();
          if (e.startsWith("\"") && e.endsWith("\"")) {
            e = e.substring(1, e.length - 1);
          }
          return e;
        });
        return r;
      } else {
        r = r.trim();
        if (r.startsWith("\"") && r.endsWith("\"")) {
          r = r.substring(1, r.length - 1);
        }
        return r;
      }
    } else return undefined;
  }