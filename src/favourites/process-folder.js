const debug = require("debug")("fav:http");
const fetch = require("node-fetch");

const processor = require("./process-payload");
const { headers, accept, favourites } = require("../tools/headers");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const csrf = "4yD6rESb5aebkMro.s1rjl4.mNiPJPP8fyrZ0AWnDxbPrnMlUiGof7q9MUEnKTvGGQM";
const cookie = "pxcts=08123d90-57f5-11ee-916e-c56fa0079e20; _pxvid=0812316b-57f5-11ee-916e-ad5f9d2bc019; auth_secure=__1f756d3d3c3dc71b2576%3B%225c5b83b3c21aabe8ffc471f1b13c09e4%22; userinfo=__89b4528a879e96ef9b92%3B%7B%22username%22%3A%22bootz15%22%2C%22uniqueid%22%3A%22138840a8a281a66d46862f1692323468%22%2C%22dvs9-1%22%3A1%7D; auth=__0bf775d7464fe3e25e4f%3B%2224739b3dcb4405c528b075948d015a58%22; td=0:1081%3B3:731%3B7:1376%3B10:731%3B11:536%3B12:1161x800%3B20:1384"

module.exports = (opts) => async (pr, folderId) => {
  await pr;
  if (!folderId) return;

  let { username, onPayload, quitEarly } = opts;
  let json = { nextOffset: 0, hasMore: true };

  do {
    const { nextOffset } = json;
    debug("Query fav folder:", folderId, username, "offset:", nextOffset);

    await delay(4000 + (Math.random() * 1000)); // DELAY (to avoid DDOS detection)

    const url = `https://www.deviantart.com/_puppy/dashared/gallection/contents?username=${username
    }&type=collection&offset=${nextOffset}&limit=24${folderId ? "&folderid=" + folderId : ""}&csrf_token=${csrf}`
    json = await fetch(url, { headers: { ...headers, accept, cookie }, timeout: 6000 })
      .then((r) => r.text())
      .then((t) => {
        const errs = t
          .split("\n")
          .filter((l) => l.toLowerCase().includes("cloudfront"));
        if (errs.length) {
          throw new Error(errs.join());
        }
        return JSON.parse(t);
      })
      .catch((err) => {
        console.error("FAV ERROR:" + err.message, url);
        return {
          ...json,
          nextOffset: undefined,
          results: [],
        };
      });

    debug(
      "Process page results:",
      json.results?.length,
      "hasMore:",
      json.hasMore
    );

    let count;
    try {
      count = await processor(username, { ...opts, json });
      if (onPayload) throw new Error('onPayload');
    } catch (err) {
      json.hasMore = false
    }

    if (!json.nextOffset || (!count && quitEarly)) {
      json.hasMore = false;
    }
    opts.pages++; // ref pointer, used in parent
  } while (json.hasMore && !onPayload) // Note: list only the first page of favs
};
