addEventListener('fetch', function (event) {
  event.respondWith(handleRequest(event.request));
});
async function handleRequest(request) {
  // Only GET requests work with this proxy.
  if (request.method !== 'GET') return MethodNotAllowed(request);
  let url = request.url.replace("https://ree.rovel.workers.dev", "");
  let extension;
  if(url.split("?")[0].endsWith(".js")){
    extension = "text/javascript";
  }
  else if(url.split("?")[0].endsWith(".css")){
    extension = "text/css";
  }
  else if(url.split("?")[0].endsWith(".png")){
    extension = "image/png";
  }
  else extension = "text/html";
  let response = await fetch("https://reejs.rovelstars.com"+url);
  return new Response(response.body, {
    headers: {
      "Content-Type": extension
    }});
}
function MethodNotAllowed(request) {
  return new Response(`Method ${request.method} not allowed.`, {
    status: 405,
    headers: {
      Allow: 'GET',
    },
  });
}