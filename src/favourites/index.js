const debug = require("debug")("favs:http");
const fetch = require("node-fetch");

const processor = require("./process-folder");
const { headers, accept, favourites } = require("../tools/headers");
// const { csrf, cookie } = favourites.index;
// console.log("index", { csrf, cookie });

// const accept = "application/json, text/plain, */*";
const csrf = "iX41tJ9GK9y-Bp-W.s1rjfm.M0Hma8wKZHGc5C3CrPCauKcopVqoyyN0DRO-Q3pVKqc";
const cookie = "pxcts=08123d90-57f5-11ee-916e-c56fa0079e20; _pxvid=0812316b-57f5-11ee-916e-ad5f9d2bc019; auth_secure=__1f756d3d3c3dc71b2576%3B%225c5b83b3c21aabe8ffc471f1b13c09e4%22; userinfo=__89b4528a879e96ef9b92%3B%7B%22username%22%3A%22bootz15%22%2C%22uniqueid%22%3A%22138840a8a281a66d46862f1692323468%22%2C%22dvs9-1%22%3A1%7D; auth=__0bf775d7464fe3e25e4f%3B%2224739b3dcb4405c528b075948d015a58%22; td=0:944%3B3:304%3B7:1359%3B12:333x783%3B20:1384"

module.exports = async function main(username, { basefolder, quitEarly, onPayload }) {
  debug(`Start Favourites: ${username}`);

  // Uses internal PUPPY API to download all favourites images via offset param
  const url = `https://www.deviantart.com/_puppy/dauserprofile/init/favourites?username=${username}&deviations_limit=24&with_subfolders=true&da_minor_version=20230710&csrf_token=${csrf}`;
  const response = await fetch(url, { headers: { ...headers, accept, cookie } })
    .then((r) => r.text())
    .then((t) => {
      const errs = t
        .split("\n")
        .filter((l) => l.toLowerCase().includes("cloudfront"));
      if (errs.length) {
        throw new Error(errs.join(), { cause: t });
      }
      try {
        return JSON.parse(t);
      } catch (err) {
        //throw new Error(`Error parsing response JSON: ${err.message}`, { cause: t });
        console.error(`Error parsing response JSON: ${err.message}`, { cause: t });
        return null;
      }
    })
    .catch((err) => {
      console.error("FAVS ERROR:", username, url, err.message, err.cause?.slice(0, 500));
      return null;
    });
  // console.log("FAV", url,
  //    response.message, !!(response?.gruser?.page?.modules),
  //    response?.gruser?.page?.modules?.length);

  if (!(response?.gruser?.page?.modules)) return;

  const folderIds = response.gruser?.page?.modules
    .find((m) => m.name === "folders")
    .moduleData.folders.results.map((r) => r.folderId)
    .filter((folderId) => folderId > 0);
  debug("Total folders:", folderIds, username);

  const opts = { pages: 0, username, basefolder, quitEarly, onPayload };
  await folderIds.reduce(processor(opts), null);

  debug("Total pages:", opts.pages, username, folderIds);
};
