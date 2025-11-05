// log author username, or download media images to _favourites
const debug = require("debug")("fav:process");
const fs = require("fs");
const path = require("path");
const _get = require("lodash.get");

const { createReducer } = require("../download");

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

const dynSrc = (result) => {
  if (!_get(result, "media.token", false)) return;

  const token = _get(result, "media.token")[0];
  const prettyName = _get(result, "media.prettyName");
  const types = _get(result, "media.types");
  const typeUrl = _findBestTypeUrl(types, prettyName);
  const uri = _get(result, "media.baseUri");
  const src = `${uri}${typeUrl}?token=${token}`;
  debug("Final img src:", src);

  return src;
};

module.exports = async (username, { json, basefolder = ".", quitEarly, onPayload }) => {
  if (!Array.isArray(json)) json = [json];

  const srcSet = new Set();
  json.forEach((d) =>
    d.results.forEach((result) => {
      srcSet.add(dynSrc(result));
    })
  );

  const srcList = [...srcSet]
    .filter(Boolean)
    .sort((a, b) => a.toLowerCase() > b.toLowerCase());
  debug("Payload length", srcList.length)

  if (!srcList.length) return count;

  if (onPayload) {
    await onPayload(srcList, username);
    return count;
  }

  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  basefolder = path.join(basefolder, username);
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);
  basefolder = path.join(basefolder, "_favourites");
  fs.existsSync(basefolder) || fs.mkdirSync(basefolder);

  const downloadReducer = createReducer(username, basefolder, srcList.length, quitEarly);

  const { count } = await srcList.reduce(
    (payloadPr, imgUrl, i) => downloadReducer(payloadPr, { imgUrl }, i)
    ,{ prevPromise: true, count: 0 });

  return count;
};
