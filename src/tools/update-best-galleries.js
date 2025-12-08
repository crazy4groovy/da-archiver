// This is intended to dl the galleries from the BEST.md list
const { readFileSync, existsSync } = require("fs");
const { relative } = require("path");

const updateGallery = require("../gallery");
const updateFavourites = require("../favourites");
const updateGroup = require("../group");
const { checkAvoidAction } = require("../utils/check-avoid-action");
const throttler = require("../throttler")(1);

let [, , basefolder, bestListFile] = process.argv;
if (!basefolder) throw new Error("Required baseFolder missing");
if (!bestListFile) throw new Error("Required BEST.md file missing");
console.log("START!");

basefolder = relative(".", basefolder);
if (!existsSync(basefolder)) {
  throw new Error("ERROR - Base folder missing: " + basefolder);
}

let usernames = readFileSync(bestListFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter(Boolean)
  .filter((line) => ["-", "*"].indexOf(line.charAt(0)) > -1) // is a list item
  .map((item) => item.split("- ")[1]); // remove list item char

const isGroup = usernames.map((un) => un.indexOf("(group)") > -1);
usernames = usernames.map((un) => un.replace(" (group)", ""));

const quitEarly = true; // usernames.length > 20;

usernames.forEach((username, i) => {
  const { username, avoidAction } = checkAvoidAction(username);
  console.log(
    "THROTTLE FOR:",
    username,
    isGroup[i] ? `- is group? ${isGroup[i]}` : ''
  );

  const handlers = isGroup[i]
    ? [updateGroup]
    : !avoidAction
      ? [updateGallery]//, updateFavourites]
      : avoidAction !== "g" ? [updateGallery] : [updateFavourites];

  handlers.forEach((handler) => throttler(handler, username, { basefolder, quitEarly }));
});
