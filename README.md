# Meta Koi

A Koi breeding game. Get it [on steam](https://store.steampowered.com/app/1518810/Koi_Farm) or [on itch.io](https://jobtalle.itch.io/koifarm).

[![alt text](screenshots.png "Meta Koi")](https://youtu.be/2JS6PEr1jUo)

## Building

HTML, CSS and Javascript content is compressed using [squish.py](https://github.com/jobtalle/squish.py), which is included in this repository as a submodule. Before building, ensure that this library has been cloned as well.

Make sure [node.js](https://www.nodejs.org) and [python 3](https://www.python.org/) are installed. After calling `npm i` to install all required packages, the following commands can be used to create binaries using [electron](https://github.com/electron/electron):

| Operating system | Command |
| --- | --- |
| Windows (32 bit) | `npm run build-win-32` |
| Windows (64 bit) | `npm run build-win-64` |
| Linux (64 bit) | `npm run build-linux-64` |
| Mac (64 bit) | `npm run build-mac-64` |

Additionally, `npm run compress` can be called to compress HTML, CSS and Javscript content without building binaries. The compressed HTML file `release.html` will be created in the project root. The file requires the `audio`, `font`, `svg` and `language` directories to run, as well as `favicon.ico` and `manifest.json`.


## License

Meta Koi is distributed under the [Apache 2.0 with Commons Clause](LICENSE.md) license.

Audio by [3xBlast](http://3xblast.com/3xblast.com/).

Concept art by [Samma van Klaarbergen](https://www.artstation.com/samma).

Logo by [Eveline Dubblinga](https://rosebolt.me/).
