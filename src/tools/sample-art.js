// This is intended to dl one art per popular discovered author
const { createWriteStream, readFileSync, readdirSync, existsSync } = require("fs");
const { join, relative } = require("path");
const fetch = require("node-fetch");

const { parseRssXml } = require("../gallery");
const favs = require("../favourites");
const createThrottler = require("../throttler");

const throttlerFavs = createThrottler(1);
const throttlerUsername = createThrottler(1);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const delayTime = 5000;

function getFileNames(folder) {
  return readdirSync(folder, { withFileTypes: true })
    // .filter(fileEnt => fileEnt.isDirectory())
    .map(fileEnt => fileEnt.name.toLowerCase());
}

// let [, , basefolder, discoverArchiveFile, checkFavs] = process.argv;
let [, , basefolder, bestListFile, checkFavs] = process.argv;

if (!basefolder) throw new Error("Required baseFolder missing");
// if (!discoverArchiveFile) throw new Error("Required archive file missing");
if (!bestListFile) throw new Error("Required bestList file missing");
console.log("START!");

basefolder = relative(".", basefolder);
console.log({ basefolder });
const existingUsernames = getFileNames(basefolder);
basefolder = join(basefolder, "__sample-art");
console.log({ basefolder });
const existingSampleArtNames = getFileNames(basefolder).map((n) => n.split("_")[0]);

// const usernames = readFileSync(discoverArchiveFile, "utf8")
//   .replace(/\r/g, "")
//   .split("\n")
//   .filter(Boolean)
//   .filter((l) => l.charAt(0) !== "*") // not a blocked
//   .filter((l) => l.charAt(0) !== "\t") // not an unpopular
//   .map((l) => l.split(" ")[0]);

const usernames = readFileSync(bestListFile, "utf8")
  .replace(/\r/g, "")
  .split("\n")
  .filter(Boolean)
  .filter((line) => ["-", "*"].indexOf(line.charAt(0)) > -1) // is a list item
  .map((item) => item.split("- ")[1]) // remove list item char
  .filter((un) => un.indexOf("(group)") === -1);
usernames.sort();

console.log(usernames.join("\n"), "\n", usernames.length);

const handleUsername = async (username) => {
  console.log(">> handleUsername:", username);

  const url = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;
  const xml = await fetch(url, { timeout: 6000 }).then((r) => r.text()).catch(() => '');
  const { imgs } = parseRssXml(xml);

  if (!imgs.length) {
    console.log("NO IMAGES:", username, imgs.length);
    return await delay(delayTime);
  }

  const imgIdxs = [0, 1, 2, 3]; // which image indexes to download from list?
  imgIdxs.forEach(async (imgIdx) => {
    if (!imgs[imgIdx]) {
      console.log("NO IMAGE MATCH:", username, imgs.length, imgIdx);
      return;
    }

    const destFilename = join(basefolder, username + "_" + imgIdx + ".jpg");
    // console.log(baseFolder, username, destFilename, imgs[0].imgUrl);
    if (existsSync(destFilename)) {
      console.log("IMAGE EXISTS:", username);
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
  });

  await delay(delayTime);
};

async function main() {
  const unameSet = new Set([...existingUsernames, ...existingSampleArtNames]);
  const regex = /by_(.*?)_d.{6}-/;

  if (!checkFavs) {
    usernames.forEach((username) => throttlerUsername(handleUsername, username));
    return;
  }

  const onPayload = async (favUsernames, username) => {
    favUsernames = favUsernames
    // parse out usernames:
      .map((un) => (un.match(regex) || [])[1])
      .filter(Boolean)
      .map(un => un.replace(/_/g, "-"))
      .map(un => un.split('by-').pop()) // weird sanitization :shrug:
    // check set:
      .filter((username) => !unameSet.has(username));
    // update set:
    favUsernames = [ ...new Set(favUsernames) ];
    favUsernames.forEach((username) => unameSet.add(username));

    console.log(">> FAVS list for", username, ":\n-", favUsernames.join("\n- "));

    // queue into throttler:
    favUsernames.forEach((username) => throttlerUsername(handleUsername, username));

    return await delay(Math.max(delayTime - (unameSet.size / 4), 0));
  }

  for (const username of usernames) {
    throttlerFavs(favs, username, { basefolder, quitEarly: true, onPayload });
  }
}

main();
