const debug = require("debug")("downloader");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const createAbort = require("./abort");
const { headers } = require("../tools/headers");

const regexFn = /\/([\w\d_.-]+\.\w+)/g;

// Note: serially process async via .reduce()
module.exports.createReducer = (author, folder, len, quitEarly) =>
  async function dl(payloadPr, { imgUrl }, i) {
      let { prevPromise, count } = await payloadPr;

      prevPromise = await prevPromise;
      if (prevPromise == null && quitEarly) {
        debug("DL ERROR: QUIT EARLY");
        return { prevPromise: null, count };
      }

      const filename = (imgUrl.match(regexFn) || []).pop(); // take last match
      if (!filename) {
        debug("DL SKIP: filename not found within " + imgUrl);
        return { prevPromise: true, count };
      }

      const destFilename = path.join(folder, filename);
      if (fs.existsSync(destFilename)) {
        // debug("DL SKIP: file already exists " + destFilename);
        return { prevPromise: true, count };
      }

      const percent = ((i / len) * 100).toFixed(1) + "%";
      debug(new Date().toLocaleTimeString(), percent, author, destFilename);
      count += 1;

      const payload = { prevPromise: downloadImage(imgUrl, destFilename), count };
      return payload;
    };

async function downloadImage(imgUrl, destFilename) {
  return new Promise((resolve) => {
    const { clear, signal } = createAbort(15000);
    fetch(imgUrl, { headers, signal })
      .then((res) => {
        const destStream = fs.createWriteStream(destFilename);
        destStream.on('finish', () => resolve(true));
        destStream.on('error', () => resolve(null));
        res.body.pipe(destStream);
      })
      .catch((err) => {
        // if (err.name === "AbortError") {
        //   console.error("DL was aborted, try again: " + err.message);
        // }
        console.error("DL ERROR: " + err.name || err.message + " : " + imgUrl);
        resolve(null);
      })
      .finally(clear);
  });
}
