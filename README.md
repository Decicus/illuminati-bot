# illuminati-bot
Logs Discord chats... and a few other things.

## Setup
- Setup [Google Cloud Datastore](https://console.cloud.google.com/datastore/).
- Setup [node & npm](https://nodejs.org/).
- Install dependencies using `npm install`.
- Copy `config.sample.js` to `config.js` and edit the values (read the comments).
- Copy `data/index.sample.yaml` to `data/index.yaml` and edit each `kind` to what you wish to store it as in Google Cloud Datastore. Anything else should (by default) be left as-is.
    - The easiest way to create these indexes is by installing [Google Cloud SDK](https://cloud.google.com/sdk/), then running `gcloud init` after installing.
    - After that, while being in the directory of this bot, run `gcloud preview datastore create-indexes data/index.yaml` and it should create the indexes.
    - If you wanna make sure you don't have unnecessary indexes on GC Datastore, run `gcloud preview datastore cleanup-indexes data/index.yaml` in the same directory.
- Copy `ignore.sample.json` to `ignore.json`.
- Run the bot using `node app.js`, or alternatively use [pm2](http://pm2.keymetrics.io/).

## License
[MIT License](LICENSE.md)
