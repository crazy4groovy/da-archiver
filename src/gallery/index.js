const debug = require("debug")("gallery");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const { headers, cookie } = require('../tools/headers')

const { createReducer } = require("../download");
const { parseRssXml } = require("./parseRssXml");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function main(username, { basefolder = ".", quitEarly }) {
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  username.split("/").forEach((usernameChunk) => {
    basefolder = path.join(basefolder, usernameChunk);
    fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  });

  let imgs;
  let allImgs = [];
  // Uses DeviantArt RSS feed to download all gallery images via offset param contained in next
  let url = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;
  debug(`Start Gallery: ${username} URL: ${url}`);

  do {
    // await delay(2000 + 2000 * Math.random());
    await delay(20_000 + 10_000 * Math.random());

    const xml = await fetch(url, { timeout: 6000, headers: { ...headers, cookie } })
      .then((r) => r.text())
      .catch(async (err) => null);
    if (xml === null || xml.includes("CloudFront")) {
      debug("XML FETCH ERROR - try again:", url);
      continue;
    }

    ({ imgs, next: url } = parseRssXml(xml));
    debug("Collected gallery images:", imgs.length, username);

    if (imgs.length === 0) {
      await delay(5000);
      break;
    }

    const downloadReducer = createReducer(username, basefolder, imgs.length, quitEarly);

    const { prevPromise, count } = await imgs.reduce(downloadReducer, { prevPromise: true, count: 0 });
    await prevPromise;

    allImgs = allImgs.concat(imgs);
    debug("Tally images:", allImgs.length, count);

    if (count === 0 && quitEarly) break;

    debug("next URL:", url);
  } while (url);

  debug("Total collected images:", allImgs.length, username);
};

module.exports.parseRssXml = parseRssXml;
