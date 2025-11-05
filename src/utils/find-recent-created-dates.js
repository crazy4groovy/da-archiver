const fs = require('fs');
const path = require('path');

function findRecentCreatedDates(folderPath, limit = 10) {
  if (!fs.existsSync(folderPath)) {
    throw new Error('Folder path does not exist');
  }

  const fileDates = fs.readdirSync(folderPath)
    .filter(file => {
      const stats = fs.lstatSync(path.join(folderPath, file));
      return stats.isFile();
    })
    .map(file => {
      const stats = fs.statSync(path.join(folderPath, file));
      return new Date(stats.birthtimeMs);
    });

  fileDates.sort((a, b) => b > a ? -1 : 1);

  return [...new Set(fileDates.slice(0, limit))];
}

module.exports = { findRecentCreatedDates };
