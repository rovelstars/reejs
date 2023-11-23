import p from "node:process";
import k from "node:os";
import A from "node:tty";
var C =
    (r = 0) =>
    e =>
      `\x1B[${e + r}m`,
  B =
    (r = 0) =>
    e =>
      `\x1B[${38 + r};5;${e}m`,
  y =
    (r = 0) =>
    (e, t, o) =>
      `\x1B[${38 + r};2;${e};${t};${o}m`,
  n = {
    modifier: {
      reset: [0, 0],
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      overline: [53, 55],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29],
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      blackBright: [90, 39],
      gray: [90, 39],
      grey: [90, 39],
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39],
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      bgBlackBright: [100, 49],
      bgGray: [100, 49],
      bgGrey: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49],
    },
  },
  q = Object.keys(n.modifier),
  N = Object.keys(n.color),
  _ = Object.keys(n.bgColor),
  z = [...N, ..._];
function P() {
  let r = new Map();
  for (let [e, t] of Object.entries(n)) {
    for (let [o, l] of Object.entries(t))
      (n[o] = { open: `\x1B[${l[0]}m`, close: `\x1B[${l[1]}m` }),
        (t[o] = n[o]),
        r.set(l[0], l[1]);
    Object.defineProperty(n, e, { value: t, enumerable: !1 });
  }
  return (
    Object.defineProperty(n, "codes", { value: r, enumerable: !1 }),
    (n.color.close = "\x1B[39m"),
    (n.bgColor.close = "\x1B[49m"),
    (n.color.ansi = C()),
    (n.color.ansi256 = B()),
    (n.color.ansi16m = y()),
    (n.bgColor.ansi = C(10)),
    (n.bgColor.ansi256 = B(10)),
    (n.bgColor.ansi16m = y(10)),
    Object.defineProperties(n, {
      rgbToAnsi256: {
        value(e, t, o) {
          return e === t && t === o
            ? e < 8
              ? 16
              : e > 248
                ? 231
                : Math.round(((e - 8) / 247) * 24) + 232
            : 16 +
                36 * Math.round((e / 255) * 5) +
                6 * Math.round((t / 255) * 5) +
                Math.round((o / 255) * 5);
        },
        enumerable: !1,
      },
      hexToRgb: {
        value(e) {
          let t = /[a-f\d]{6}|[a-f\d]{3}/i.exec(e.toString(16));
          if (!t) return [0, 0, 0];
          let [o] = t;
          o.length === 3 && (o = [...o].map(s => s + s).join(""));
          let l = Number.parseInt(o, 16);
          return [(l >> 16) & 255, (l >> 8) & 255, l & 255];
        },
        enumerable: !1,
      },
      hexToAnsi256: {
        value: e => n.rgbToAnsi256(...n.hexToRgb(e)),
        enumerable: !1,
      },
      ansi256ToAnsi: {
        value(e) {
          if (e < 8) return 30 + e;
          if (e < 16) return 90 + (e - 8);
          let t, o, l;
          if (e >= 232) (t = ((e - 232) * 10 + 8) / 255), (o = t), (l = t);
          else {
            e -= 16;
            let R = e % 36;
            (t = Math.floor(e / 36) / 5),
              (o = Math.floor(R / 6) / 5),
              (l = (R % 6) / 5);
          }
          let s = Math.max(t, o, l) * 2;
          if (s === 0) return 30;
          let a =
            30 + ((Math.round(l) << 2) | (Math.round(o) << 1) | Math.round(t));
          return s === 2 && (a += 60), a;
        },
        enumerable: !1,
      },
      rgbToAnsi: {
        value: (e, t, o) => n.ansi256ToAnsi(n.rgbToAnsi256(e, t, o)),
        enumerable: !1,
      },
      hexToAnsi: {
        value: e => n.ansi256ToAnsi(n.hexToAnsi256(e)),
        enumerable: !1,
      },
    }),
    n
  );
}
var w = P(),
  c = w;
function u(r, e = globalThis.Deno ? globalThis.Deno.args : p.argv) {
  let t = r.startsWith("-") ? "" : r.length === 1 ? "-" : "--",
    o = e.indexOf(t + r),
    l = e.indexOf("--");
  return o !== -1 && (l === -1 || o < l);
}
var { env: i } = p,
  m;
u("no-color") || u("no-colors") || u("color=false") || u("color=never")
  ? (m = 0)
  : (u("color") || u("colors") || u("color=true") || u("color=always")) &&
    (m = 1);
function S() {
  if ("FORCE_COLOR" in i)
    return i.FORCE_COLOR === "true"
      ? 1
      : i.FORCE_COLOR === "false"
        ? 0
        : i.FORCE_COLOR.length === 0
          ? 1
          : Math.min(Number.parseInt(i.FORCE_COLOR, 10), 3);
}
function L(r) {
  return r === 0
    ? !1
    : { level: r, hasBasic: !0, has256: r >= 2, has16m: r >= 3 };
}
function Y(r, { streamIsTTY: e, sniffFlags: t = !0 } = {}) {
  let o = S();
  o !== void 0 && (m = o);
  let l = t ? m : o;
  if (l === 0) return 0;
  if (t) {
    if (u("color=16m") || u("color=full") || u("color=truecolor")) return 3;
    if (u("color=256")) return 2;
  }
  if ("TF_BUILD" in i && "AGENT_NAME" in i) return 1;
  if (r && !e && l === void 0) return 0;
  let s = l || 0;
  if (i.TERM === "dumb") return s;
  if (p.platform === "win32") {
    let a = k.release().split(".");
    return Number(a[0]) >= 10 && Number(a[2]) >= 10586
      ? Number(a[2]) >= 14931
        ? 3
        : 2
      : 1;
  }
  if ("CI" in i)
    return "GITHUB_ACTIONS" in i
      ? 3
      : [
            "TRAVIS",
            "CIRCLECI",
            "APPVEYOR",
            "GITLAB_CI",
            "BUILDKITE",
            "DRONE",
          ].some(a => a in i) || i.CI_NAME === "codeship"
        ? 1
        : s;
  if ("TEAMCITY_VERSION" in i)
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(i.TEAMCITY_VERSION) ? 1 : 0;
  if (i.COLORTERM === "truecolor" || i.TERM === "xterm-kitty") return 3;
  if ("TERM_PROGRAM" in i) {
    let a = Number.parseInt((i.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (i.TERM_PROGRAM) {
      case "iTerm.app":
        return a >= 3 ? 3 : 2;
      case "Apple_Terminal":
        return 2;
    }
  }
  return /-256(color)?$/i.test(i.TERM)
    ? 2
    : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
          i.TERM
        ) || "COLORTERM" in i
      ? 1
      : s;
}
function E(r, e = {}) {
  let t = Y(r, { streamIsTTY: r && r.isTTY, ...e });
  return L(t);
}
var G = {
    stdout: E({ isTTY: A.isatty(1) }),
    stderr: E({ isTTY: A.isatty(2) }),
  },
  $ = G;
function F(r, e, t) {
  let o = r.indexOf(e);
  if (o === -1) return r;
  let l = e.length,
    s = 0,
    a = "";
  do (a += r.slice(s, o) + e + t), (s = o + l), (o = r.indexOf(e, s));
  while (o !== -1);
  return (a += r.slice(s)), a;
}
function D(r, e, t, o) {
  let l = 0,
    s = "";
  do {
    let a = r[o - 1] === "\r";
    (s +=
      r.slice(l, a ? o - 1 : o) +
      e +
      (a
        ? `\r
`
        : `
`) +
      t),
      (l = o + 1),
      (o = r.indexOf(
        `
`,
        l
      ));
  } while (o !== -1);
  return (s += r.slice(l)), s;
}
var { stdout: M, stderr: x } = $,
  O = Symbol("GENERATOR"),
  b = Symbol("STYLER"),
  f = Symbol("IS_EMPTY"),
  I = ["ansi", "ansi", "ansi256", "ansi16m"],
  g = Object.create(null),
  V = (r, e = {}) => {
    if (e.level && !(Number.isInteger(e.level) && e.level >= 0 && e.level <= 3))
      throw new Error("The `level` option should be an integer from 0 to 3");
    let t = M ? M.level : 0;
    r.level = e.level === void 0 ? t : e.level;
  },
  Z = class {
    constructor(r) {
      return j(r);
    }
  },
  j = r => {
    let e = (...t) => t.join(" ");
    return V(e, r), Object.setPrototypeOf(e, h.prototype), e;
  };
function h(r) {
  return j(r);
}
Object.setPrototypeOf(h.prototype, Function.prototype);
for (let [r, e] of Object.entries(c))
  g[r] = {
    get() {
      let t = d(this, T(e.open, e.close, this[b]), this[f]);
      return Object.defineProperty(this, r, { value: t }), t;
    },
  };
g.visible = {
  get() {
    let r = d(this, this[b], !0);
    return Object.defineProperty(this, "visible", { value: r }), r;
  },
};
var v = (r, e, t, ...o) =>
    r === "rgb"
      ? e === "ansi16m"
        ? c[t].ansi16m(...o)
        : e === "ansi256"
          ? c[t].ansi256(c.rgbToAnsi256(...o))
          : c[t].ansi(c.rgbToAnsi(...o))
      : r === "hex"
        ? v("rgb", e, t, ...c.hexToRgb(...o))
        : c[t][r](...o),
  U = ["rgb", "hex", "ansi256"];
for (let r of U) {
  g[r] = {
    get() {
      let { level: t } = this;
      return function (...o) {
        let l = T(v(r, I[t], "color", ...o), c.color.close, this[b]);
        return d(this, l, this[f]);
      };
    },
  };
  let e = "bg" + r[0].toUpperCase() + r.slice(1);
  g[e] = {
    get() {
      let { level: t } = this;
      return function (...o) {
        let l = T(v(r, I[t], "bgColor", ...o), c.bgColor.close, this[b]);
        return d(this, l, this[f]);
      };
    },
  };
}
var W = Object.defineProperties(() => {}, {
    ...g,
    level: {
      enumerable: !0,
      get() {
        return this[O].level;
      },
      set(r) {
        this[O].level = r;
      },
    },
  }),
  T = (r, e, t) => {
    let o, l;
    return (
      t === void 0
        ? ((o = r), (l = e))
        : ((o = t.openAll + r), (l = e + t.closeAll)),
      { open: r, close: e, openAll: o, closeAll: l, parent: t }
    );
  },
  d = (r, e, t) => {
    let o = (...l) => H(o, l.length === 1 ? "" + l[0] : l.join(" "));
    return Object.setPrototypeOf(o, W), (o[O] = r), (o[b] = e), (o[f] = t), o;
  },
  H = (r, e) => {
    if (r.level <= 0 || !e) return r[f] ? "" : e;
    let t = r[b];
    if (t === void 0) return e;
    let { openAll: o, closeAll: l } = t;
    if (e.includes("\x1B"))
      for (; t !== void 0; ) (e = F(e, t.close, t.open)), (t = t.parent);
    let s = e.indexOf(`
`);
    return s !== -1 && (e = D(e, l, o, s)), o + e + l;
  };
Object.defineProperties(h.prototype, g);
var K = h(),
  ee = h({ level: x ? x.level : 0 }),
  re = K;
export {
  Z as Chalk,
  _ as backgroundColorNames,
  _ as backgroundColors,
  ee as chalkStderr,
  z as colorNames,
  z as colors,
  re as default,
  N as foregroundColorNames,
  N as foregroundColors,
  q as modifierNames,
  q as modifiers,
  M as supportsColor,
  x as supportsColorStderr,
};
//# sourceMappingURL=chalk.bundle.js.map
