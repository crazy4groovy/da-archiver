const { Command } = require("commander");

// https://www.npmjs.com/package/commander
const program = new Command();

module.exports = program
  .version(require("../package.json").version)
  .option(
    "-u, --usernames <user1><space...>",
    "author[/gallery-id] username(s); supports gallery-id format"
  )
  .option("-g, --groups <group1><space...>", "group names")
  .option("-b, --basefolder <path>", "base folder for image downloads")
  .parse(process.argv)
  .opts();
