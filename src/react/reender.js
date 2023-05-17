// this file is imported on browsers. it loads the dynamic island architecture
// look for html elements with the attribute "client:load" and get the file
// attribute and render them
export default async function reender(page, browserFn) {
  if (browserFn) {
    (await import(browserFn)).default();
  }
  let $ = (selector) => document.querySelector(selector);
  let $$ = (selector) => document.querySelectorAll(selector);
  let React;
  // available attributes: client:load, client:idle, client:visible,
  // client:media, user:click, user:hover

  // client:load
  let load = $$("[island='client:load']");
  for (let i = 0; i < load.length; i++) {
    if (!React)
      React = (await import("react")).default;
    let e = load[i];
    let file = e.getAttribute("__filename");
    let fn = e.getAttribute("__compname") || "default";
    let p = (await import("/__reejs/serve/" + file))[fn];
    React.render(React.createElement(p), e);
  }

  load = $$("[island='client:idle']");
    for (let i = 0; i < load.length; i++) {
      // load the component and react when the browser is idle
      let e = load[i];
      let file = e.getAttribute("__filename");
      let fn = e.getAttribute("__compname") || "default";
      window.requestIdleCallback(async () => {
        setTimeout(async()=>{
        if (!React)
          React = (await import("react"));
        let p = (await import("/__reejs/serve/" + file))[fn];
        React.render(React.createElement(p), e);
        }, 2000);
      });
    }

  load = $$("[island='client:visible']");
  if (load.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          if (!React)
            React = (await import("react"));
          let e = entry.target;
          let file = e.getAttribute("__filename");
          let fn = e.getAttribute("__compname") || "default";
          let p = (await import("/__reejs/serve/" + file))[fn];
          React.render(React.createElement(p), e);
        }
      });
    });
    for (let i = 0; i < load.length; i++) {
      observer.observe(load[i]);
    }
  }

  load = $$("[island='client:media']");
  for (let i = 0; i < load.length; i++) {
    let e = load[i];
    let file = e.getAttribute("__filename");
    let fn = e.getAttribute("__compname") || "default";
    let q = e.getAttribute("mediaquery");
    if (!q)
      console.warn("Mediaquery attribute is missing for", e);
    const mql = window.matchMedia(q);
    const listener = async (ev) => {
      if (ev.matches) {
        if (!React)
          React = (await import("react"));
        let p = (await import("/__reejs/serve/" + file))[fn];
        React.render(React.createElement(p), e);
      } else {
        mql.addEventListener("change", listener, { once: true });
      }
    };
    listener(mql);
  }

  load = $$("[island='user:click']");
  for (let i = 0; i < load.length; i++) {
    let e = load[i];
    let file = e.getAttribute("__filename");
    let fn = e.getAttribute("__compname") || "default";
    e.addEventListener("click", async () => {
      if (!React)
        React = (await import("react"));
      let p = (await import("/__reejs/serve/" + file))[fn];
      React.render(React.createElement(p), e);
      // click the child element to register the click from user now
      e.children[0].click();
    }, { once: true });
  }

  load = $$("[island='user:hover']");
  for (let i = 0; i < load.length; i++) {
    let e = load[i];
    let file = e.getAttribute("__filename");
    let fn = e.getAttribute("__compname") || "default";
    e.addEventListener("mouseover", async () => {
      if (!React)
        React = (await import("react"));
      let p = (await import("/__reejs/serve/" + file))[fn];
      React.render(React.createElement(p), e);
    }, { once: true });
  }
}
