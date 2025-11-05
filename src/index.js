#!/usr/bin/env node
require("please-upgrade-node")(require("../package.json"));

const debug = require("debug")("main");

const argv = require('./argv');
const gallery = require("./gallery");
const favs = require("./favourites");
const group = require("./group");
const { checkAvoidAction } = require("./utils/check-avoid-action");

const { usernames = [], groups = [], basefolder, quitEarly } = argv;
debug("Start!", usernames, basefolder || "", process.argv);

(async () => {
  await usernames.reduce(async (pr, usernamefull) => {
    await pr;
    // isolate the optional "avoid" prefixes: f!, g!
    const { username, avoidAction } = await checkAvoidAction(usernamefull);
    if (avoidAction !== "g") {
      console.log(">>", username, "GALLERY");
      await gallery(username, { basefolder, quitEarly });
    }
    if (avoidAction !== "f") {
      console.log(">>", username, "FAVS");
      await favs(username.split("/")[0], { basefolder, quitEarly });
    }
  }, null);

  await groups.reduce(async (pr, groupname) => {
    await pr;
    await group(groupname, { basefolder, quitEarly });
  }, null);

  debug("Done!", usernames);
})();
