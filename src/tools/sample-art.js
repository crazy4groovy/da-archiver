// This is intended to dl one art per popular discovered author
const { createWriteStream, readFileSync, existsSync } = require("fs");
const { join, relative } = require("path");
const fetch = require("node-fetch");

const { parseRssXml } = require("../gallery");
const throttler = require("../throttler");

let [, , baseFolder, discoverArchiveFile] = process.argv;
if (!baseFolder) throw new Error("Required baseFolder missing");
if (!discoverArchiveFile) throw new Error("Required archive file missing");
console.log("START!");

baseFolder = relative(".", baseFolder);

const usernames = readFileSync(discoverArchiveFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter(Boolean)
  .filter((l) => l.charAt(0) !== "*") // not a blocked
  .filter((l) => l.charAt(0) !== "\t") // not an unpopular
  .map((l) => l.split(" ")[0]);

console.log(usernames.sort().join("\n"), "\n", usernames.length);

const handleUsername = async (username) => {
  const destFilename = join(baseFolder, username + ".jpg");
  // console.log(baseFolder, username, destFilename, imgs[0].imgUrl);
  if (existsSync(destFilename)) {
    console.log("IMAGE EXISTS:", username);
    return;
  }

  const url = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;
  const xml = await fetch(url, { timeout: 6000 }).then((r) => r.text());
  const { imgs } = parseRssXml(xml);

  if (!imgs.length) {
    console.log("NO IMAGES:", username);
    return;
  }

  await fetch(imgs[0].imgUrl)
    .then((res) => {
      const destWriteStream = createWriteStream(destFilename);
      res.body.pipe(destWriteStream);
    })
    .catch((e) => {
      console.error("DL ERROR: " + e.message);
    });
};

usernames.forEach((username) => throttler(handleUsername, username));
