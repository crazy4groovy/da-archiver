#!/usr/bin/env node
require("please-upgrade-node")(require("../package.json"));

const debug = require("debug")("main");

const argv = require('./argv');
const gallery = require("./gallery");
const favs = require("./favourites");
const group = require("./group");

const { usernames = [], groups = [], basefolder, quitEarly } = argv;
debug("Start!", usernames, basefolder || "", process.argv);

(async () => {
  await usernames.reduce(async (pr, user) => {
    await pr;

    // isolate the optional avoid prefixes: f!, g!
    const parts = user.split("!");
    user = parts.pop(); // take last
    const avoidAction = parts.length ? parts.pop().toLowerCase() : null;

    if (avoidAction !== "g") {
      console.log(">>", user, "GALLERY");
      await gallery(user, { basefolder, quitEarly });
    }
    if (avoidAction !== "f") {
      console.log(">>", user, "FAVS");
      await favs(user.split("/")[0], { basefolder, quitEarly });
    }
  }, null);

  await groups.reduce(async (pr, groupname) => {
    await pr;
    await group(groupname, { basefolder, quitEarly });
  }, null);

  debug("Done!", usernames);
})();
