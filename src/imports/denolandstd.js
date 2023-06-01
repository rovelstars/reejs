export default function Transform(url) {
  //replace https://deno.land/x/std@<version>/node/fs.ts with node:fs
  if (url.startsWith("https://deno.land/x/std")) {
    url = url.split("https://deno.land/x/std")[1];
    url = url.split("/node/")[1];
    url = url.split(".ts")[0];
    url = `node:${url}`;
  }
  return url;
}
