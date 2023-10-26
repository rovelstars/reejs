export default async function (url) {
  let data = {};
  let urlObj = new URL(url);
  data.protocol = urlObj.protocol;
  data.host = urlObj.host;
  let clearInfo = url
    .replace(data.protocol + "//", "")
    .replace(data.host + "/", "")
    .split("?")[0]
    .split("&")[0];
  if (data.host == "cdn.jsdelivr.net")
    clearInfo = clearInfo.replace("npm/", ""); //fix jsdelivr cdn
  data.name = clearInfo.startsWith("@")
    ? clearInfo.split("/")[0] + "/" + clearInfo.split("/")[1].split("@")[0]
    : clearInfo.split("/")[0].split("@")[0];
  data.isScoped = data.name.startsWith("@");
  data.version = clearInfo.split("@").pop().split("/")[0];
  let num = clearInfo.split("@").length;
  let latestVersion;
  async function getLatestVersion() {
    if (latestVersion) return latestVersion;
    let i = 0;
    while (i < 3) {
      // try 3 times
      try {
        let res = await fetch(`https://registry.npmjs.org/${data.name}/latest`);
        let json = await res.json();
        latestVersion = json.version;
        break; // exit loop if successful
      } catch (err) {
        i++; // increment counter
        if (i === 3) throw err; // throw error if failed 3 times
      }
    }
    return latestVersion;
  }
  if (num == 1) data.version = await getLatestVersion();
  if (data.isScoped && num < 2) data.version = await getLatestVersion();
  if (data.name.includes(data.version)) data.version = await getLatestVersion();
  clearInfo = //remove package and version from url
    clearInfo.replace(data.name, "").replace("@" + data.version, "");
  if (clearInfo.startsWith("/")) clearInfo = clearInfo.replace("/", "");
  if (clearInfo.endsWith("/")) clearInfo = clearInfo.replace("/", "");
  data.file = clearInfo;
  if (data.file) {
    //check if file has extension
    if (!data.file.includes(".")) data.file += ".js";
    //if file ends with .mjs, replace with .js
    if (data.file.endsWith(".mjs"))
      data.file = data.file.substring(0, data.file.length - 4) + ".js";
    if (data.file.includes("/"))
      //save foldername
      data.folder = data.file.replace(data.file.split("/").pop() + "/", "");
  }
  if (!data.file) data.file = "index.js";
  delete data.protocol;
  return data;
}
