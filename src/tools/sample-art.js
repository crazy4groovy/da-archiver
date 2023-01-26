// This is intended to dl one art per popular discovered author
const { createWriteStream, readFileSync, existsSync } = require("fs");
const { join, relative } = require("path");
const fetch = require("node-fetch");

const { parseRssXml } = require("../gallery");
const throttler = require("../throttler")(1);

let [, , basefolder, discoverArchiveFile] = process.argv;
if (!basefolder) throw new Error("Required baseFolder missing");
if (!discoverArchiveFile) throw new Error("Required archive file missing");
console.log("START!");

basefolder = relative(".", basefolder);

const usernames = readFileSync(discoverArchiveFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter(Boolean)
  .filter((l) => l.charAt(0) !== "*") // not a blocked
  .filter((l) => l.charAt(0) !== "\t") // not an unpopular
  .map((l) => l.split(" ")[0]);

console.log(usernames.sort().join("\n"), "\n", usernames.length);

const handleUsername =  async (username, imgIdx) => {
  const destFilename = join(basefolder, username + "_" + imgIdx + ".jpg");
  // console.log(baseFolder, username, destFilename, imgs[0].imgUrl);
  if (existsSync(destFilename)) {
    console.log("IMAGE EXISTS:", username);
    return;
  }

  const url = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;
  const xml = await fetch(url, { timeout: 6000 }).then((r) => r.text());
  const { imgs } = parseRssXml(xml);

  if (!imgs.length || !imgs[imgIdx]) {
    console.log("NO IMAGES:", username, imgs.length);
    return;
  }

  await fetch(imgs[imgIdx].imgUrl)
    .then((res) => {
      const destWriteStream = createWriteStream(destFilename);
      res.body.pipe(destWriteStream);
    })
    .catch((e) => {
      console.error("DL ERROR: " + e.message);
    });
};

const imgIdx = 0; // which image index to download from list?
usernames.forEach((username) => throttler(handleUsername, username, imgIdx));
