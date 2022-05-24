window.ree = {};
import twgen from "/twgen.js";
let router = await import("/router.js");

window.ree.router = router;
window.ree.debug = async function(){
  window.ree.debugger = await import("/Debugger.js");
}
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
let routes = [
  { url: "/", jsx: "/pages/index.js" },
  { url: "/failure", jsx: "/pages/failure.js" },
  { url: "/management", jsx: "/pages/management.js" },
  { url: "/test/:id", jsx: "/pages/test.js" },
  { url: "/crash", jsx: "/pages/hmm.js" },
  { url: "/coolpage", jsx: "/pages/coolpage.js" },
  { url: "/404", jsx: "/pages/notfound.js" },
  { url: "/500", jsx: "/pages/crash.js" },
]
router.registerRoutes(routes);

window.addEventListener("mousemove", async () => {
  if (!window.didMouseMove) {
    window.didMouseMove = true;
    document.getElementById("app-not-loaded-msg").innerText = "Starting App!";
    await import("/tw.js?plugins=forms,typography,aspect-ratio,line-clamp");
    await import("/twcfg.js");
    document.getElementById("app").innerHTML = "";
    await router.load(location.pathname + location.search);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
      .then(function(reg) {
        console.log('Registration successful, scope is:', reg.scope);
      })
      .catch(function(error) {
        console.log('Service worker registration failed, error:', error);
      });
      //wait for service worker to be ready
      navigator.serviceWorker.ready.then(function(reg) {
        console.log("I feel like sw is ready!",reg);
        reg.active.postMessage({type: 'ROUTES_REGISTER', routes});
      });
      navigator.serviceWorker.addEventListener("message",(e)=>{
        if(e.data.type === "WTFM") {
          console.log("[WTFM] Routes registered!");
        }
        if(e.data.type=== "LOAD_ROUTE") {
          router.load(e.data.url);
        }
      })
    }
  }
});
