const debug = require("debug")("gallery");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const parser = require("xml2json");
const _get = require("lodash.get");

const { reducer: dlReducer } = require("../download");

// Uses DeviantArt RSS feed to download all gallery images via offset param

function parseRssXml(xml) {
  const json = parser.toJson(xml, {
    object: true,
    coerce: true,
    arrayNotation: false,
    alternateTextNode: false,
  });

  let next = [] // coerce single into array
    .concat(_get(json, "rss.channel.atom:link", []))
    .find((l) => l.rel === "next");
  next = next && next.href;

  const imgs = [] // coerce single into array
    .concat(_get(json, "rss.channel.item", []))
    .filter(({ "media:content": mc }) => mc && mc.medium === "image")
    .reduce((imgs, { link, "media:content": mc }) => {
      imgs.push({
        link: link, // not used
        imgUrl: mc.url,
      });
      return imgs;
    }, []);

  return { next, imgs };
}

module.exports = async function main(username, { basefolder = ".", quitEarly }) {
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  username.split("/").forEach((usernameChunk) => {
    basefolder = path.join(basefolder, usernameChunk);
    fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  });

  let imgs;
  let allImgs = [];
  let url = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;

  while (url) {
    const xml = await fetch(url, { timeout: 6000 })
      .then((r) => r.text())
      .catch(() => null);
    if (xml === null) {
      debug("XML FETCH ERROR - try again:", url);
      continue;
    }

    ({ next: url, imgs } = parseRssXml(xml));
    debug("next:", url);
    debug("Collected images:", imgs.length);

    const downloader = dlReducer(username, basefolder, imgs.length, quitEarly);
    try {
      await imgs.reduce(downloader, Promise.resolve());
    } catch (err) {
      debug(username, err.message)
      break;
    }

    allImgs = allImgs.concat(imgs);
    debug("Tally images:", allImgs.length);
  }

  debug("Total collected images:", allImgs.length, username);
};

module.exports.parseRssXml = parseRssXml;
