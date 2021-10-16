// log author username, or download media images to _favourites
const debug = require("debug")("fav:process");
const fs = require("fs");
const path = require("path");
const _get = require("lodash.get");

const { reducer: dlReducer } = require("../download");

const validtypes = ["fullview", "preview", "400T", "350T", "300W"];

function _findBestTypeUrl(types, prettyName) {
  const foundTypes = validtypes
    .map((vt) => types.find((t) => t.t === vt && t.c))
    .filter(Boolean);

  let typeUrl = _get(foundTypes[0], "c", "");
  if (typeUrl) typeUrl = "/" + typeUrl.replace("<prettyName>", prettyName);

  return typeUrl;
}

module.exports = async (author, json, folder = ".") => {
  if (!Array.isArray(json)) json = [json];

  const dynVal = (i) => {
    if (!author) {
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
    return f;
  };

  const s = new Set();
  json.forEach((d) =>
    d.results.forEach((i) => {
      s.add(dynVal(i));
    })
  );
  const payload = [...s]
    .filter(Boolean)
    .sort((a, b) => a.toLowerCase() > b.toLowerCase());

  // if (!author) {
  //   return console.log(payload.join(","));
  // }

  fs.existsSync(folder) || fs.mkdirSync(folder);
  folder = path.join(folder, author);
  fs.existsSync(folder) || fs.mkdirSync(folder);
  folder = path.join(folder, "_favourites");
  fs.existsSync(folder) || fs.mkdirSync(folder);

  const downloader = dlReducer(author, folder, payload.length);
  return payload.map((imgUrl) => ({ imgUrl })).reduce(downloader, null);
};
