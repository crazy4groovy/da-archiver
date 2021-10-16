// This is intended to discover new usernames from existing downloaded archive files
const {
  createReadStream,
  lstatSync,
  readdirSync,
  writeFileSync,
  existsSync,
} = require("fs");
const readline = require("readline");
const { join, relative, parse } = require("path");
const fetch = require("node-fetch");
const walker = require("folder-walker");

const throttler = require("../throttler");

const isDirectory = (folder) =>
  existsSync(folder) && lstatSync(folder).isDirectory();

let [, , baseFolder, discoverArchiveFile] = process.argv;
if (!baseFolder) throw new Error("Required baseFolder missing");
baseFolder = relative(".", baseFolder);
const discoverFile = join(
  baseFolder,
  `_discover-authors-${new Date().toJSON().split("T")[0]}.txt`
);
const appendOpts = {
  encoding: "utf8",
  flag: "a+",
  mode: 0o666,
};

function isPopular(stats) {
  if (stats.reject) {
    return false;
  }
  let pop =
    stats.deviations + stats.favourites > 1999 &&
    stats.watchers > 5999 &&
    stats.watching > 99;
  pop = pop || (stats.watchers > 9999 && stats.pageviews > 199999);
  return pop;
}

async function stats(author) {
  const url = `https://www.deviantart.com/_napi/da-user-profile/api/init/favourites?username=${author}&deviations_limit=24&with_subfolders=true`;
  const response = await fetch(url, { timeout: 6000 })
    .then((r) => r.json())
    .catch(() => ({ pageData: { stats: {} } }));

  const { stats } = response.pageData;
  stats.isPopular = isPopular(stats);
  return stats;
}

(async () => {
  console.log("!START!");

  let foundUsernames = readdirSync(baseFolder)
    .map((name) => join(baseFolder, name))
    .filter(isDirectory)
    .map((full) => parse(full).base.replace(/_/g, "-").toLowerCase())
    .sort();
  console.log("Existing:", baseFolder, "\n", foundUsernames.join("\n"));
  // convert list to map, for efficient lookups
  foundUsernames = foundUsernames.reduce((map, un) => {
    map[un] = true;
    return map;
  }, {});

  writeFileSync(discoverFile, "", "utf8");

  const regexLine = /^\t?([\w-]+)\s?(.*)$/;
  const handleLine = (l) => {
    try {
      if (l.length <= 2) return;
      let [, name, data] = l.match(regexLine) || [];
      if (!name) return;
      name = name.toLowerCase();

      if (name && !foundUsernames[name]) {
        foundUsernames[name] = true;

        data = JSON.parse(data || '{"reject":true}');
        const wasPopular = data.isPopular;
        delete data.isPopular;
        data.isPopular = isPopular(data);
        data.isPopular &&
          !wasPopular &&
          console.log(author, data.isPopular, wasPopular);

        const line =
          (data.isPopular ? "" : "\t") +
          `${name} ${JSON.stringify(data)}` +
          "\n";
        writeFileSync(discoverFile, line, appendOpts);
      }
    } catch (error) {
      console.error(`ERROR discoverArchiveFile: ${error.message}`);
    }
  };

  const doneReadArch = new Promise((done) => {
    if (discoverArchiveFile && existsSync(discoverArchiveFile)) {
      const rl = readline.createInterface({
        input: createReadStream(discoverArchiveFile, "utf8"),
        output: process.stdout,
        terminal: false,
      });
      rl.on("line", handleLine);
      rl.on("close", done);
    }
  });
  await doneReadArch;
  console.log("!doneReadArch!");

  const regexFilename = /_by_([\w_]+)_\w+-.*\.jpg$/;
  async function processor(img) {
    const name = (((img.basename || img).match(regexFilename) || [])[1] || "")
      .replace(/_/g, "-")
      .toLowerCase()
      .split("-by-")
      .pop();
    if (name && !foundUsernames[name]) {
      foundUsernames[name] = true;
      //console.log(name, f.basename || f);
      const data = await throttler(stats, name);
      data.isPopular && console.log(name, data.isPopular);
      const writeLine =
        (data.isPopular ? "" : "\t") + `${name} ${JSON.stringify(data)}` + "\n";
      writeFileSync(discoverFile, writeLine, appendOpts);
    }
  }

  const doneWalkBaseFolder = new Promise((done) => {
    const stream = walker([baseFolder]);
    stream.on("data", processor);
    stream.on("end", done);
  });
  await doneWalkBaseFolder;
  console.log("!doneWalkBaseFolder!");
})();
