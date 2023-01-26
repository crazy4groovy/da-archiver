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

const throttler = require("../throttler")(1);

const isDirectory = (folder) =>
  existsSync(folder) && lstatSync(folder).isDirectory();

let [, , basefolder, discoverArchiveFile] = process.argv;
if (!basefolder) throw new Error("Required baseFolder missing");
basefolder = relative(".", basefolder);
const discoverFile = join(
  basefolder,
  `_discover-authors-${new Date().toJSON().split("T")[0]}.txt`
);
const appendOpts = {
  encoding: "utf8",
  flag: "a+",
  mode: 0o666,
};

function enrichStats(stats) {
  if (stats.reject) {
    return false;
  }
  let pop =
    stats.deviations > 999 && stats.watchers > 5999 && stats.watching > 49;
  pop = pop || (stats.watchers > 9999 && stats.pageviews > 199999);
  stats.isPopular = pop;
  const fav = stats.favourites > 1999;
  stats.isFavouritesWatcher = fav;
}

async function fetchStats(author) {
  const url = `https://www.deviantart.com/_napi/da-user-profile/api/init/favourites?username=${author}&deviations_limit=24&with_subfolders=true`;
  const response = await fetch(url, { timeout: 6000 })
    .then((r) => r.json())
    .catch(() => ({ pageData: { stats: {} } }));

  const { stats } = response.pageData;

  enrichStats(stats); // <<<<<<<<<<<<<<<<<
}

(async () => {
  console.log("!START!");

  let foundUsernames = readdirSync(basefolder)
    .map((name) => join(basefolder, name))
    .filter(isDirectory)
    .map((full) => parse(full).base.replace(/_/g, "-").toLowerCase())
    .sort();
  console.log("Existing:", basefolder, "\n", foundUsernames.join("\n"));
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

        const stats = JSON.parse(data || '{"reject":true}');
        const wasPopular = stats.isPopular;
        delete stats.isPopular;

        enrichStats(stats); // <<<<<<<<<<<<<<<<<

        stats.isPopular &&
          !wasPopular &&
          console.log(author, stats.isPopular, wasPopular);

        const line =
          (stats.isPopular ? "" : "\t") +
          `${name} ${JSON.stringify(stats)}` +
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
      const data = await throttler(fetchStats, name);

      const keeper = data.isPopular || data.isFavouritesWatcher;
      keeper && console.log(name, data.isPopular, data.isFavouritesWatcher);
      const writeLine =
        (keeper ? "" : "\t") + `${name} ${JSON.stringify(data)}` + "\n";
      writeFileSync(discoverFile, writeLine, appendOpts);
    }
  }

  const doneWalkBaseFolder = new Promise((done) => {
    const stream = walker([basefolder]);
    stream.on("data", processor);
    stream.on("end", done);
  });
  await doneWalkBaseFolder;
  console.log("!doneWalkBaseFolder!");
})();
