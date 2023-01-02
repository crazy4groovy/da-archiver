const debug = require("debug")("fav:http");
const fetch = require("node-fetch");

const processor = require("./process-payload");
const headers = require("../tools/headers");

module.exports = (opts) => async (pr, folderId) => {
  await pr;
  if (!folderId) return;

  let json = { nextOffset: 0, hasMore: true };
  while (json.hasMore) {
    const { nextOffset } = json;
    debug("Query fav folder:", folderId, opts.author, "offset:", nextOffset);
    const url = `https://www.deviantart.com/_napi/da-user-profile/api/collection/contents?username=${
      opts.author
    }&offset=${json.nextOffset}&limit=24${
      folderId ? "&folderid=" + folderId : ""
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
    await processor(opts.author, json, opts.folder);
    opts.pages++;
    if (!json.nextOffset) {
      // json.nextOffset = nextOffset + 24;
      json.hasMore = false;
    }
    await new Promise((res) => setTimeout(res, 1300 + Math.random() * 200));
  }
};
