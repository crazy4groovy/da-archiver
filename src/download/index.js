const debug = require("debug")("downloader");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const createAbort = require("./abort");

const regexFn = /\/([\w\d_.-]+\.\w+)/g;

// Note: serially process async via .reduce()
module.exports.reducer = (author, folder, len, quitEarly) =>
async function dl(pr, { imgUrl }, i) {
    pr = await pr;
    if (pr === null && quitEarly) {
      throw new Error("quitEarly");
    }

    const filename = (imgUrl.match(regexFn) || []).pop(); // take last match
    if (!filename) {
      debug("DL ERROR: filename not found within " + imgUrl);
      return null;
    }

    const destFilename = path.join(folder, filename);
    if (fs.existsSync(destFilename)) return null;

    const percent = ((i / len) * 100).toFixed(1) + "%";
    debug(new Date().toLocaleTimeString(), percent, author, destFilename);

    const { clear, signal } = createAbort();
    return fetch(imgUrl, { signal })
      .then((res) => {
        const destWriteStream = fs.createWriteStream(destFilename);
        res.body.pipe(destWriteStream);
      })
      .catch((err) => {
        // if (err.name === "AbortError") {
        //   console.error("DL was aborted, try again: " + err.message);
        //   return dl(pr, { imgUrl }, i)
        // }
        console.error("DL ERROR: " + err.message + " : " + imgUrl);
        return null;
      })
      .finally(clear);
  };
