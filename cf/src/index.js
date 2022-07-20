addEventListener('fetch', function (event) {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Only GET requests work with this proxy.
  if (request.method !== 'GET') return MethodNotAllowed(request);
  let url = request.url.replace("https://reejs.rovelstars.com", "");
  url = url.replace("https://ree.rovel.workers.dev","");
  let extension;
  let route = await matchUrl(url);
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
  let response;
  if(!route){
   response = await fetch("https://ree.js.org"+url);
  }
  else {
    response = await fetch("https://ree.js.org");
  }
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

async function matchUrl(realUrl) {
  realUrl = realUrl.split("?")[0];
  let routes = await fetch("https://cdn.jsdelivr.net/gh/rovelstars/reejs/retool/routes.json");
  routes = await routes.json();
  let foundRoute = routes.find((templateUrl) => {
    let urlRegex = pathToRegexp(templateUrl.url);
    return urlRegex.test(realUrl);
  });
  return foundRoute;
}

function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          (code >= 48 && code <= 57) ||
          // `A-Z`
          (code >= 65 && code <= 90) ||
          // `a-z`
          (code >= 97 && code <= 122) ||
          // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name) throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError(
              "Capturing groups are not allowed at ".concat(j)
            );
          }
        }
        pattern += str[j++];
      }
      if (count) throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern) throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes,
    prefixes = _a === void 0 ? "./" : _a;
  var defaultPattern = "[^".concat(
    escapeString(options.delimiter || "/#?"),
    "]+?"
  );
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = function (type) {
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
  };
  var mustConsume = function (type) {
    var value = tryConsume(type);
    if (value !== undefined) return value;
    var _a = tokens[i],
      nextType = _a.type,
      index = _a.index;
    throw new TypeError(
      "Unexpected "
        .concat(nextType, " at ")
        .concat(index, ", expected ")
        .concat(type)
    );
  };
  var consumeText = function () {
    var result = "";
    var value;
    while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
      result += value;
    }
    return result;
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix: prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix: prefix,
        suffix: suffix,
        modifier: tryConsume("MODIFIER") || "",
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict,
    strict = _a === void 0 ? false : _a,
    _b = options.start,
    start = _b === void 0 ? true : _b,
    _c = options.end,
    end = _c === void 0 ? true : _c,
    _d = options.encode,
    encode =
      _d === void 0
        ? function (x) {
            return x;
          }
        : _d,
    _e = options.delimiter,
    delimiter = _e === void 0 ? "/#?" : _e,
    _f = options.endsWith,
    endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  // Iterate over the tokens and create our regexp string.
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys) keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:"
              .concat(prefix, "((?:")
              .concat(token.pattern, ")(?:")
              .concat(suffix)
              .concat(prefix, "(?:")
              .concat(token.pattern, "))*)")
              .concat(suffix, ")")
              .concat(mod);
          } else {
            route += "(?:"
              .concat(prefix, "(")
              .concat(token.pattern, ")")
              .concat(suffix, ")")
              .concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:"
              .concat(token.pattern, ")")
              .concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:"
          .concat(prefix)
          .concat(suffix, ")")
          .concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict) route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited =
      typeof endToken === "string"
        ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
        : endToken === undefined;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
function pathToRegexp(path, keys, options) {
  return stringToRegexp(path, keys, options);
}
