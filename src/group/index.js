// This is inteded as a helper script for the old-style Galleries
const debug = require("debug")("group");
const fetch = require("node-fetch");

const gallery = require("../gallery");

module.exports = async function main(group, { basefolder = ".", quitEarly }) {
  const url = `https://www.deviantart.com/${group}/gallery/`;
  const html = await fetch(url, { timeout: 6000 }).then((r) => r.text());

  let match;
  const regexGroups = /title="([^"]+)" href="([^"]+)"/gm;

  while ((match = regexGroups.exec(html)) !== null) {
    let [, title, url] = match;
    title = title.split(": ").pop().replace('&#039;', '\''); // take last
    const folderId = url.split("%2F")[1].split("&amp")[0];
    debug(`Group: ${title} ${group}/${folderId}`);
    await gallery(`${group}/${folderId}`, basefolder, quitEarly); //, path.join(group, title));
  }
};
