let path = await import("/pathToRegexp.js");
import { html, render, Component } from "/reender.js";
let preloader = undefined;
let routes = [];
let postRender = undefined;
let history = localStorage.getItem("historyData")
  ? JSON.parse(localStorage.getItem("historyData"))
  : []; //[{url, data}]
if (!localStorage.getItem("historyData")) {
  localStorage.setItem("historyData", JSON.stringify(history));
}
window.html = html;
window.render = render;
window.Component = Component;

if (!window.ree) {
  window.ree = {};
}

export async function renderJsx(url, data = undefined) {
  window.ree.routerData.currentPageUrl = url;
  window.ree.routerData.currentPageJsx = await import(url);
  if (data) {
    console.log("data", data);
    render(
      html`<${ree.routerData.currentPageJsx.default} data=${data} />`,
      document.getElementById("app")
    );
  } else {
    render(
      html`<${ree.routerData.currentPageJsx.default} />`,
      document.getElementById("app")
    );
  }
}
export function pushData(data) {
  //find if theres an object with the same url
  let index = history.findIndex((x) => x.url === window.location.pathname);
  if (index === -1) {
    //when not found, simply push the object to the history
    history.push({ url: window.location.pathname, data: data });
  } else {
    history[index] = { url: window.location.pathname, data: data };
  }
  localStorage.setItem("historyData", JSON.stringify(history));
}

export function getData() {
  let data = undefined;
  //find the object from history that has the current url
  for (let i = 0; i < history.length; i++) {
    if (history[i].url == window.location.pathname) {
      data = history[i].data;
      break;
    }
  }
  window.ree.routerData.currentPageData = data;
  return data;
}

export function registerRoute(route) {
  console.log("registering route", route);
  routes.push({ url: route.url, jsx: route.jsx });
}

export function registerRoutes(routes) {
  routes.forEach(registerRoute);
}

export function registerPreloader(str) {
  preloader = str;
}

export function registerPostRender(fn) {
  postRender = fn;
}

export async function runPostFn(fn) {
  await fn();
}

export function runPostFnSync(fn) {
  fn();
}

export function getUrlData(realUrl) {
  let foundRoute = matchUrl(realUrl);
  if (!foundRoute) {
    return { query: undefined, param: undefined, url: undefined };
  } else {
    var search = realUrl.split("?")[1];
    let result;
    if (search) {
      result = JSON.parse(
        '{"' +
          decodeURI(search)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
          '"}'
      );
    }
    let params = path.match(foundRoute.url, { decode: decodeURIComponent })(
      realUrl
    ).params;
    console.log(params);
    return { query: result, params: params, url: foundRoute.url };
  }
}

function matchUrl(realUrl) {
  realUrl = realUrl.split("?")[0];
  let foundRoute = routes.find((templateUrl) => {
    let urlRegex = path.pathToRegexp(templateUrl.url);
    console.log(
      templateUrl.url == "/404"
        ? `No Route found for url ${realUrl}, defaulting to route /404`
        : `Does Route ${templateUrl.url} match ${realUrl}? ${urlRegex.test(
            realUrl
          )}`
    );
    return urlRegex.test(realUrl);
  });
  return foundRoute;
}

export async function load(url = "/") {
  if (preloader) {
    await renderJsx(preloader);
  }
  if (url) {
    console.log(
      "Saving current data to history",
      window.ree.routerData.currentPageData
    );
    window.history.pushState(
      { data: window.ree.routerData.currentPageData },
      "",
      url
    );
  }
  let route = matchUrl(url);
  console.log("Rendering Route", route);
  if (!route) {
    //if no route is found, render 404 page
    let data = getUrlData(url);
    await renderJsx("/pages/notfound.js", data);
    //apply function to all the a tags
    let aTags = document.querySelectorAll("a");
    aTags.forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        let url = a.getAttribute("href");
        load(url);
      });
    });
    if (postRender) {
      console.log("Running Post Render!");
      if (postRender[Symbol.toStringTag] == "AsyncFunction") await postRender();
      else postRender();
    }
  } else {
    let data = getUrlData(url);
    //if route is found, render the jsx
    await renderJsx(route.jsx, data);
    //apply function to all the a tags
    let aTags = document.querySelectorAll("a");
    aTags.forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        let url = a.getAttribute("href");
        load(url);
      });
    });
    if (postRender) {
      console.log("Running Post Render!");
      if (postRender[Symbol.toStringTag] == "AsyncFunction") await postRender();
      else postRender();
    }
  }
}

//listen for popevent and load the url
window.addEventListener("popstate", (e) => {
  load(e.path[0].location.pathname);
});
