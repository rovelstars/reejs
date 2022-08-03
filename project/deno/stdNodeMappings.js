//this maps the deno std/node polyfill urls to node's builtin modules
export default function stdNodeMappings(url) {
  if (url.startsWith("https://deno.land/std")) {
    //replace url, with std@versioning/node regex for versioning
    return url.replace(/^https:\/\/deno.land\/std\/node\//,"").replace(/^https:\/\/deno.land\/std@[0-9.]+\/node\//, "node:").slice(0, -3);
  }
  return url;
}