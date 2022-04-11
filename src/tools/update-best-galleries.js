// This is intended to dl the galleries from the BEST.md list
const { readFileSync, existsSync } = require("fs");
const { relative } = require("path");

const updateGallery = require("../gallery");
const updateFavourites = require("../favourites");
const updateGroup = require("../group");
const throttler = require("../throttler")(2);

let [, , baseFolder, bestListFile] = process.argv;
if (!baseFolder) throw new Error("Required baseFolder missing");
if (!bestListFile) throw new Error("Required BEST.md file missing");
console.log("START!");

baseFolder = relative(".", baseFolder);
if (!existsSync(baseFolder)) {
  throw new Error("ERROR - Base folder missing: " + username);
}

let usernames = readFileSync(bestListFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter(Boolean)
  .filter((line) => ["-", "*"].indexOf(line.charAt(0)) > -1) // is a list item
  .map((item) => item.split("- ")[1]); // remove list item char
const isGroup = usernames.map((un) => un.indexOf("(group)") > -1);
usernames = usernames.map((un) => un.replace(" (group)", ""));

// console.log(usernames.sort().join("\n"), "\n", usernames.length);

usernames.forEach((username, i) => {
  console.log(
    "THROTTLE FOR:",
    username,
    isGroup[i] ? `- is group? ${isGroup[i]}` : ''
  );
  const handlers = isGroup[i]
    ? [updateGroup]
    : [updateGallery, updateFavourites];
  handlers.forEach((handler) => throttler(handler, username, baseFolder));
});
