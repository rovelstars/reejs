window.isLocalDev = true;
window.ree = {};
import twgen from "/twgen.js";
let router = await import("/router.js");

window.ree.router = router;

window.ree.routerData = {
  currentPageUrl: undefined,
  currentPageJsx: undefined,
  currentPageData: undefined,
};
window.sus = false;
window.twgen = twgen;

twgen.addClasses([
  {
    className: "mask-squircle",
    value:
      "mask-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KCiAgPHBhdGggZD0iTSAxMDAgMCBDIDIwIDAgMCAyMCAwIDEwMCBDIDAgMTgwIDIwIDIwMCAxMDAgMjAwIEMgMTgwIDIwMCAyMDAgMTgwIDIwMCAxMDAgQyAyMDAgMjAgMTgwIDAgMTAwIDAgWiIvPgoKPC9zdmc+);",
  },
  {
    className: "btn-blurple",
    value: "rounded-md bg-indigo-600 text-white p-2",
  },
  { className: "btn-green", value: "rounded-md bg-green-600 text-white p-2" },
  { className: "btn-red", value: "rounded-md bg-red-500 text-white p-2" },
]);

router.registerPreloader("/pages/components/Loader.js");
router.registerPostRender(() => {
  twgen.liveSetup();
});

router.registerRoutes([
  { url: "/", jsx: "/pages/index.js" },
  { url: "/failure", jsx: "/pages/failure.js" },
  { url: "/management", jsx: "/pages/management.js" },
  { url: "/test/:id", jsx: "/pages/test.js" },
  { url: "/crash", jsx: "/pages/hmm.js" },
  { url: "/404", jsx: "/pages/notfound.js" },
  { url: "/500", jsx: "/pages/crash.js" },
]);

window.addEventListener("mousemove", async () => {
  if (!window.didMouseMove) {
    window.didMouseMove = true;
    document.getElementById("app-not-loaded-msg").innerText = "Starting App!";
    if(isLocalDev) {
    await import("/tw.js?plugins=forms,typography,aspect-ratio,line-clamp");
    } else {
      await import("https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp");
    }
    await import("/twcfg.js");
    document.getElementById("app").innerHTML = "";
    await router.load(location.pathname + location.search);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('Registration successful, scope is:', registration.scope);
      })
      .catch(function(error) {
        console.log('Service worker registration failed, error:', error);
      });
    }
  }
});
