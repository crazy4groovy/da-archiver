const debug = require("debug")("favs:http");
const fetch = require("node-fetch");

const processor = require("./process-folder");
const headers = require("../tools/headers");

// fetch ==> `https://www.deviantart.com/_napi/da-user-profile/api/init/favourites?username=${author}&deviations_limit=24&with_subfolders=true`
// folderIds = response.sectionData.modules.find(m => m.name === "folders").moduleData.folders.results.map(r => r.folderId).filter(id => id > 0)
// https://www.deviantart.com/_napi/da-user-profile/api/collection/contents?username=${author}&offset=10&limit=24&folderid=${folderId}
// https://www.deviantart.com/_napi/da-user-profile/api/collection/contents?username=${author}&offset=34&limit=24&folderid=${folderId}

module.exports = async function main(author, folder) {
  const url = `https://www.deviantart.com/_napi/da-user-profile/api/init/favourites?username=${author}&deviations_limit=24&with_subfolders=true`;
  const response = await fetch(url, { headers })
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
      console.error("FAVS ERROR:" + err.message, author, url);
      return null;
    });
  if (!response?.sectionData?.modules) return;

  const folderIds = response.sectionData.modules
    .find((m) => m.name === "folders")
    .moduleData.folders.results.map((r) => r.folderId)
    .filter((folderId) => folderId > 0);
  debug("Total folders:", folderIds, author);

  const opts = { pages: 0, author, folder };
  await folderIds.reduce(processor(opts), null);

  debug("Total pages:", opts.pages, author, folderIds);
};
