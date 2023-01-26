const debug = require("debug")("fav:http");
const fetch = require("node-fetch");

const processor = require("./process-payload");
const headers = require("../tools/headers");

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = (opts) => async (pr, folderId) => {
  await pr;
  if (!folderId) return;

  let { username } = opts;
  let json = { nextOffset: 0, hasMore: true };

  while (json.hasMore) {
    const { nextOffset } = json;
    debug("Query fav folder:", folderId, username, "offset:", nextOffset);

    await delay(2000 + (Math.random() * 100)); // DELAY (to avoid DDOS detection)
    const url = `https://www.deviantart.com/_napi/da-user-profile/api/collection/contents?username=${username
      }&offset=${json.nextOffset}&limit=24${folderId ? "&folderid=" + folderId : ""
      }`;
    json = await fetch(url, { headers, timeout: 6000 })
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

    try {
      await processor(username, { json, ...opts });
    } catch (err) {
      debug(username, err.message)
      break;
    }

    opts.pages++; // ref pointer, used in parent
    if (!json.nextOffset) {
      json.hasMore = false;
    }
  }
};
