var U = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
function s(Q, K = "@") {
  if (!A) return t.then(() => s(Q));
  let E = Q.length + 1,
    B =
      (A.__heap_base.value || A.__heap_base) +
      4 * E -
      A.memory.buffer.byteLength;
  B > 0 && A.memory.grow(Math.ceil(B / 65536));
  let J = A.sa(E - 1);
  if (((U ? G : q)(Q, new Uint16Array(A.memory.buffer, J, E)), !A.parse()))
    throw Object.assign(
      new Error(
        `Parse error ${K}:${
          Q.slice(0, A.e()).split(`
`).length
        }:${
          A.e() -
          Q.lastIndexOf(
            `
`,
            A.e() - 1,
          )
        }`,
      ),
      { idx: A.e() },
    );
  let L = [],
    F = [];
  for (; A.ri(); ) {
    let C = A.is(),
      I = A.ie(),
      D = A.ai(),
      o = A.id(),
      k = A.ss(),
      i = A.se(),
      g;
    A.ip() && (g = w(Q.slice(o === -1 ? C - 1 : C, o === -1 ? I + 1 : I))),
      L.push({ n: g, s: C, e: I, ss: k, se: i, d: o, a: D });
  }
  for (; A.re(); ) {
    let C = A.es(),
      I = A.ee(),
      D = A.els(),
      o = A.ele(),
      k = Q.slice(C, I),
      i = k[0],
      g = D < 0 ? void 0 : Q.slice(D, o),
      a = g ? g[0] : "";
    F.push({
      s: C,
      e: I,
      ls: D,
      le: o,
      n: i === '"' || i === "'" ? w(k) : k,
      ln: a === '"' || a === "'" ? w(g) : g,
    });
  }
  function w(C) {
    try {
      return (0, eval)(C);
    } catch {}
  }
  return [L, F, !!A.f()];
}
function q(Q, K) {
  let E = Q.length,
    B = 0;
  for (; B < E; ) {
    let J = Q.charCodeAt(B);
    K[B++] = ((255 & J) << 8) | (J >>> 8);
  }
}
function G(Q, K) {
  let E = Q.length,
    B = 0;
  for (; B < E; ) K[B] = Q.charCodeAt(B++);
}
var A,
  t = WebAssembly.compile(
    ((N =
      "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"),
    typeof Buffer < "u"
      ? Buffer.from(N, "base64")
      : Uint8Array.from(atob(N), Q => Q.charCodeAt(0))),
  )
    .then(WebAssembly.instantiate)
    .then(({ exports: Q }) => {
      A = Q;
    }),
  N;
export { t as init, s as parse };
//# sourceMappingURL=es-module-lexer.bundle.js.map
