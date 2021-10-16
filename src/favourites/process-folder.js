const debug = require("debug")("fav:http");
const fetch = require("node-fetch");

const processor = require("./process-payload");

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
    json = await fetch(url, { timeout: 6000 })
      .then((r) => r.json())
      .catch((err) => {
        console.error("FAV ERROR:" + err.message);
        return {
          ...json,
          results: [],
        };
      });
    debug(
      "Process page results:",
      json.results.length,
      "hasMore:",
      json.hasMore
    );
    await processor(opts.author, json, opts.folder);
    opts.pages++;
    if (!json.nextOffset) {
      json.nextOffset = nextOffset + 24;
    }
  }
};
