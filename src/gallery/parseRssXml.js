const parser = require("xml2json");
const _get = require("lodash.get");

module.exports.parseRssXml = function parseRssXml(xml) {
  let json;
  try {
    json = parser.toJson(xml, {
      object: true,
      coerce: true,
      arrayNotation: false,
      alternateTextNode: false,
    });
  } catch (err) {
    if (xml.toLowerCase().includes("cloudfront")) {
      console.log("CloudFront ERROR");
    }
    console.log("SKIP: Error parsing RSS XML", err, xml);
    // throw err;
    return { next: '', imgs: [] };
  }

  let next = [] // coerce into array
    .concat(_get(json, "rss.channel.atom:link", []))
    .find((l) => l.rel === "next");
  next = next && next.href;

  const imgs = [] // coerce into array
    .concat(_get(json, "rss.channel.item", []))
    .filter(({ "media:content": mc }) => mc && mc.medium === "image" && !mc.url.includes("blur_"))
    .reduce((imgs, { link, "media:content": mc }) => {
      imgs.push({
        link: link, // note: never used
        imgUrl: mc.url,
      });
      return imgs;
    }, []);

  return { next, imgs };
}
