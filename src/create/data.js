const dependencies = {
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "preact": ""
};

export default function GetPackage(name, opts) {
  const { bundle = false, isReactPackage = false, extDeps = [] } = opts || {};
  //a name would be like "react" or "react-dom/client"
  //replace the name with the version, prefix with "https://esm.sh/", suffix with "@<version>"

  //if it is a react package, then append ?external=react,react-dom
  //use url search params to append the query.
  //if bundle is true, add bundle query
  const pkgName = name.split("/")[0];
  let scope = name.replace(pkgName, "");
  scope = scope.split("?")[0];
  let url = `https://esm.sh/${pkgName}@${dependencies[pkgName]}${scope}`;
  url = new URL(url);
  if (isReactPackage) {
    url.searchParams.append("external", "react,react-dom");
  }
  if(extDeps.length) {
    url.searchParams.append("external", extDeps.join(","));
  }
  if (bundle) {
    url.searchParams.append("bundle", "");
  }
  return url.toString();
}