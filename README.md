# DeviantArt Archiver

Archive any DeviantArt user/group galleries and favourites locally.

(Sane download timeouts are set to 6 seconds.)

## Install

>`npm i -g da-archiver`

## Command example

>`da-archiver -b ~/da/archives/ -u myuser1 f!myuser1favsonly -g mygroup1`

## Command args

- `-u`: usernames (space separated) [optional]
- `-g`: groups (space separated) [optional]
- `-b`: basefolder [optional]

> Note: you must provide at least `-u` or `-g`; or both.

## Command arg modifiers

- prefix with `g!<username>` to avoid archiving the `username`'s gallery.
  - Eg. `g!hyung86` = "don't download their gallery"
- prefix with `f!<username>` to avoid archiving the `username`'s favourites.
  - Eg. `f!hyung86` = "don't download their favourites"

## Archive folder structure

This tool expects a filesystem structure of a "base" folder, under which each user/group's archive is kept inside its own folder, organized by the user's image gallery (under its own folder) and favourites (under its _favourites subfolder).

Eg:

```bash
~/da                    <--root folder of all DeviantArt users
~/da/user1              <--user1 gallery folder
~/da/user1/_favourites  <--user1 favourites folder
```

## Debug logs

This package uses [debug](https://www.npmjs.com/package/debug).

- `main`
- `downloader`
- `favs:http`
- `fav:http`
- `fav:process`
- `gallery`
- `group`
- `*` for all debug loggers

Eg. [PowerShell env](https://www.npmjs.com/package/debug#powershell-vs-code-default):

`$env:DEBUG='*';da-archiver ...`
`$env:DEBUG='downloader';da-archiver ...`

## Tools (power-user bonus)

If you `git clone` this repo, there are a few helper tools for "bonus discovery" features. These scripts are found in the `./src/tools` folder.

>Note: argument order *matters*, all required!!

These scripts can be run like such, for example (in Powershell):

>`npm run tools:ubg -- {root_folder} {best_users.md}`

- Updates the galleries of your "best"/top users by tracking them in a formatted markdown *list*:
`$env:DEBUG='downloader';node .\src\tools\update-best-galleries.js {root_folder} {best_users.md}`

>`npm run tools:dp -- {root_folder} {discover_archive_file.txt}`

- Scrapes your existing users' favourites, to see which ones are "popular" on DeviantArt, and store user list in a file:
`$env:DEBUG='downloader';node .\src\tools\discover-popular.js {root_folder} {discover_archive_file.txt}`

>`npm run tools:sa -- {root_folder} {discover_archive_file.txt}`

- Downloads one sample image from each users' gallery which is listed in this text file (i.e. to get a feel for their art style):
`$env:DEBUG='downloader';node .\src\tools\sample-art.js {root_folder} {discover_archive_file.txt}`
