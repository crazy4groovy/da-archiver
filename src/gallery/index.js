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

  let next = [] // coerse single into array
    .concat(_get(json, "rss.channel.atom:link", []))
    .find((l) => l.rel === "next");
  next = next && next.href;

  const imgs = [] // coerse single into array
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

module.exports = async function main(username, folder = ".") {
  let allImgs = [],
    next = `https://backend.deviantart.com/rss.xml?offset=0&q=gallery:${username}`;
  while (next) {
    const xml = await fetch(next, { timeout: 6000 })
      .then((r) => r.text())
      .catch(() => null);
    if (xml === null) {
      debug("XML FETCH ERROR - try again:", next);
      continue;
    }

    let imgs;
    ({ next, imgs } = parseRssXml(xml));
    debug("next:", next);
    debug("Collected images:", imgs.length);

    allImgs = allImgs.concat(imgs);
  }

  debug("Total collected images:", allImgs.length, username);
  if (allImgs.length === 0) return;

  fs.existsSync(folder) || fs.mkdirSync(folder);
  username.split("/").forEach((usernameChunk) => {
    folder = path.join(folder, usernameChunk);
    fs.existsSync(folder) || fs.mkdirSync(folder);
  });

  const downloader = dlReducer(username, folder, allImgs.length);
  return allImgs.reduce(downloader, null);
};

module.exports.parseRssXml = parseRssXml;
