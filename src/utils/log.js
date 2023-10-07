import DynamicImport from "@reejs/imports/dynamicImport.js";
import env from "@reejs/imports/env.js";
let chalk = DynamicImport(await import("./chalk.js"));
let oc = console;

export default function styleit(message, ...styles) {
  // Split the message by the placeholder %c and trim the spaces
  let messageArray = message.split("%c");
  // Remove the first empty string
  if (messageArray[0].trim() == "") messageArray.shift();
  // Initialize an array to store the chalk objects
  let chalkArray = [];
  // Loop through the styles array and create the chalk objects
  for (let style of styles) {
    // Split the style string by semicolons and trim the spaces
    let styleArray = style.split(";").map(s => s.trim());
    // Initialize a chalk object
    let chalkObject = chalk;
    // Loop through the style array and apply the corresponding methods to the chalk object
    for (let s of styleArray) {
      // Split the style by colon and trim the spaces
      let [property, value] = s.split(":").map(s => s.trim());
      // Convert the property and value to lower case
      property = property?.toLowerCase();
      value = value?.toLowerCase();
      // Switch on the property and apply the value as a method to the chalk object
      switch (property) {
        case "color":
          if (value.startsWith("#")) {
            chalkObject = chalkObject.hex(value);
          } else if (value.startsWith("rgb(")) {
            let [r, g, b] = value
              .replace("rgb(", "")
              .replace(")", "")
              .split(",")
              .map(e => parseInt(e.trim()));
            chalkObject = chalkObject.rgb(r, g, b);
          } else {
            chalkObject = chalkObject[value];
          }
          break;
        case "font-weight":
          if (value === "bold") {
            chalkObject = chalkObject.bold;
          }
          break;
        case "font-style":
          if (value === "italic") {
            chalkObject = chalkObject.italic;
          }
          break;
        case "text-decoration":
          if (value === "underline") {
            chalkObject = chalkObject.underline;
          }
          if (value === "line-through") {
            chalkObject = chalkObject.strikethrough;
          }
          break;
        case "background-color":
          if (value.startsWith("#")) {
            chalkObject = chalkObject.bgHex(value);
          } else if (value.startsWith("rgb(")) {
            let [r, g, b] = value
              .replace("rgb(", "")
              .replace(")", "")
              .split(",")
              .map(e => parseInt(e.trim()));
            chalkObject = chalkObject.bgRgb(r, g, b);
          } else {
            chalkObject =
              chalkObject[`bg${value[0].toUpperCase()}${value.slice(1)}`];
          }
          break;
        default:
          // Ignore other properties
          break;
      }
    }
    // Push the chalk object to the chalk array
    chalkArray.push(chalkObject);
  }
  // Initialize a string to store the final message
  let finalMessage = "";
  // Loop through the message array and the chalk array and concatenate the styled messages
  for (let i = 0; i < messageArray.length; i++) {
    // If there is a chalk object for the current index, apply it to the message
    if (chalkArray[i]) {
      finalMessage += "" + chalkArray[i](messageArray[i]);
    } else {
      // Otherwise, just append the message
      finalMessage += "" + messageArray[i];
    }
  }
  // return the final message
  return finalMessage;
}
function logWithStyle(type, message, ...styles) {
  if (message instanceof Error) {
    oc.error(message);
    return;
  }
  //if message is an object or json, return back to original console.
  if (typeof message === "object" || typeof message === "json") {
    return oc[type](message, ...styles);
  }
  if (!message?.includes?.("%c") || !styles?.length) {
    return oc[type](message, ...styles);
  }
  oc[type](styleit(message, ...styles));
}
if (env == "node" || env == "bun") {
  globalThis.console = {
    ...oc,
    log: (...args) => {
      logWithStyle("log", ...args);
    },
    warn: (...args) => {
      logWithStyle("warn", ...args);
    },
    error: (...args) => {
      logWithStyle("error", ...args);
    },
    info: (...args) => {
      logWithStyle("info", ...args);
    },
  };
}
