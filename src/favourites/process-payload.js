// log author username, or download media images to _favourites
const debug = require("debug")("fav:process");
const fs = require("fs");
const path = require("path");
const _get = require("lodash.get");

const { reducer: dlReducer } = require("../download");

const validTypes = ["fullview", "preview", "400T", "350T", "300W"];

function _findBestTypeUrl(types, prettyName) {
  const foundTypes = validTypes
    .map((vt) => types.find((t) => t.t === vt && t.c))
    .filter(Boolean);

  let typeUrl = _get(foundTypes[0], "c", "");
  if (typeUrl) typeUrl = "/" + typeUrl.replace("<prettyName>", prettyName);
  typeUrl = typeUrl.replace(new RegExp('//', 'g'), '/')

  return typeUrl;
}

module.exports = async (username, { json, basefolder = ".", quitEarly }) => {
  const dynSrc = (i) => {
    if (!username) {
      return `${i.deviation.author.username}`;
    }
    if (!_get(i, "deviation.media.token", false)) {
      return;
    }

    const token = _get(i, "deviation.media.token")[0];
    const prettyName = _get(i, "deviation.media.prettyName");
    const types = _get(i, "deviation.media.types");
    const typeUrl = _findBestTypeUrl(types, prettyName);
    const uri = _get(i, "deviation.media.baseUri");
    const f = `${uri}${typeUrl}?token=${token}`;
    debug("final img src:", f);

    return f;
  };

  if (!Array.isArray(json)) json = [json];
  const s = new Set();
  json.forEach((d) =>
    d.results.forEach((i) => {
      s.add(dynSrc(i));
    })
  );
  const payload = [...s]
    .filter(Boolean)
    .sort((a, b) => a.toLowerCase() > b.toLowerCase());

  // if (!author) {
  //   return console.log(payload.join(","));
  // }

  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  basefolder = path.join(basefolder, username);
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  basefolder = path.join(basefolder, "_favourites");
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);

  const downloader = dlReducer(username, basefolder, payload.length, quitEarly);
  return payload.map((imgUrl) => ({ imgUrl })).reduce(downloader, Promise.resolve());
};
