# DeviantArt Archiver

Archive any DeviantArt user/group galleries and favourites locally.

(Sane download timeouts are set to 6 seconds.)

## Folder structure

This tool expects a filesystem structure of a "base" folder, under which each user/group's archive is kept inside its own folder, organized by the user's image gallery (under its own folder) and favourites (under its _favourites subfolder).

Eg.

```bash
~/da                    <--root folder of all DeviantArt users
~/da/user1              <--user1 gallery folder
~/da/user1/_favourites  <--user1 favourites folder
```

## Args

- `-u`: usernames (space separated) [optional]
- `-g`: groups (space separated) [optional]
- `-b`: basefolder [optional]

> Note: you must provide at least `-u` or `-g`; or both.

## Arg modifiers

- prefix with `g!<username>` to avoid archiving the `username`'s gallery.
  - Eg. `g!hyung86` = "don't download their gallery"
- prefix with `f!<username>` to avoid archiving the `username`'s favourites.
  - Eg. `f!hyung86` = "don't download their favourites"

## Example command

>`da-archiver -b '~/da/archives/' -u myuser1 f!myuser1favsonly -g mygroup1`

## Debug logs

This package uses [debug](https://www.npmjs.com/package/debug). You can set the ENV variable `DEBUG=*` for verbose tracing logs.

Eg. [PowerShell](https://www.npmjs.com/package/debug#powershell-vs-code-default):

`$env:DEBUG='*';da-archiver ...`
`$env:DEBUG='downloader';da-archiver ...`

## Tools (power-user bonus)

If you clone this repo, there are a few helper tools/scripts for "bonus discovery" features. These are found in the `./src/tools` folder.

>Note: argument order *matters*, all required!!

These scripts can be run like such, for example:

>`npm run tools:ubg -- {root_folder} {best_users.md}`

- Update the galleries of some of your top users by tracking them in a markdown list format:
`$env:DEBUG='downloader';node ./src/tools/update-best-galleries.js {root_folder} {best_users.md}`

>`npm run tools:dp -- {root_folder} {discover_archive_file.txt}`

- Scrape your existing users' favourites, to see which ones are "popular" on DeviantArt, and store user list in a file:
`$env:DEBUG='downloader';node ./src/tools/discover-popular.js {root_folder} {discover_archive_file.txt}`

>`npm run tools:sa -- {root_folder} {discover_archive_file.txt}`

- Download one sample image from each users' gallery that is listed in this file (i.e. to get a feel for their style):
`$env:DEBUG='downloader';node ./src/tools/sample-art.js {root_folder} {discover_archive_file.txt}`
