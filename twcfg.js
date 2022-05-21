function setThemeColor(r) {
  return ({ opacityValue: e }) =>
    void 0 === e ? `rgb(var(${r}))` : `rgb(var(${r}) / ${e})`;
}

tailwind.config = {
  theme: {
    extend: {
      colors: {
        branding: setThemeColor("--branding"),
        bg: setThemeColor("--bg"),
        "bg-lighter": setThemeColor("--bg-lighter"),
        success: setThemeColor("--success"),
        warning: setThemeColor("--warning"),
        blush: setThemeColor("--blush"),
        "darker-delta": setThemeColor("--darker-delta"),
        rain: setThemeColor("--rain"),
        "scary-dark": setThemeColor("--scary-dark"),
        skyline: setThemeColor("--skyline"),
        bsod: setThemeColor("--bsod"),
        "white-text": setThemeColor("--white-text"),
        "black-text": setThemeColor("--black-text"),
        "text-darker": setThemeColor("--text-darker"),
      },
      fontSize: {
        "3xl": "1.7rem",
        "4xl": "2rem",
        "5xl": "3rem",
        "6xl": "4rem",
        "7xl": "5rem",
      },
      fontFamily: {
        display: ['"Founders Grotesk"', "arial"],
        body: ["Quicksand", "arial"],
        heading: ["Cubano", "arial"],
      },
    },
  },
  darkMode: "class",
};