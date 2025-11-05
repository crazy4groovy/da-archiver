// Parser for the old-style DA Galleries

const debug = require("debug")("group");
const fetch = require("node-fetch");

const gallery = require("../gallery");
const { headers } = require("../tools/headers");

const regexGroups = /title="([^"]+)" href="([^"]+)"/gm;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = async function main(group, { basefolder = ".", quitEarly }) {
  const url = `https://www.deviantart.com/${group}/gallery/`;
  const html = await fetch(url, { headers, timeout: 6000 })
    .then((r) => r.text())
    .catch(async (err) => {
      await delay(4000)
      throw err
    });

  let match;
  while ((match = regexGroups.exec(html)) !== null) {
    let [, title, url] = match;
    title = title.split(": ").pop().replace('&#039;', '\''); // take last
    const folderId = url.split("%2F")[1].split("&amp")[0];
    debug(`Group: ${title} ${group}/${folderId}`);
    await gallery(`${group}/${folderId}`, { basefolder, quitEarly }); //, path.join(group, title));
  }
};
