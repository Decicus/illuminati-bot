# illuminati-bot

Logs Discord chats... and a few other things.

## Setup

- Setup [Google Cloud Datastore](https://console.cloud.google.com/datastore/).
- Setup [node & npm](https://nodejs.org/) - I recommend LTS (at the time of writing: v6.x.x).
- Install dependencies using `npm install`.
- Copy `config.sample.js` to `config.js` and edit the values (read the comments).
    - I recommend checking the `admins` array and removing all user IDs.
- Copy `data/index.sample.yaml` to `data/index.yaml` and edit each `kind` to what you wish to store it as in Google Cloud Datastore. Anything else should (by default) be left as-is.
    - The easiest way to create these indexes is by installing [Google Cloud SDK](https://cloud.google.com/sdk/) on your local machine, then running `gcloud init` after installing. Make sure to select the right project.
    - After that:
        - Copy `data/index.sample.yaml` from the repository & save it somewhere as `index.yaml` (on the system you installed `gcloud`).
        - Edit the `index.yaml` file, and modify the `kind` names to match the ones in the config file.
        - (In the directory of `index.yaml`) Run `gcloud datastore create-indexes index.yaml` and it should create the indexes.
        - If you wanna make sure you don't have unnecessary indexes on GC Datastore, run `gcloud datastore cleanup-indexes index.yaml` in the same directory (this is usually not necessary).
- Inside the `data` folder:
    - Copy `ignore.sample.json` to `ignore.json`.
    - Copy `settings.sample.json` to `settings.json`.
        - I recommend opening `settings.json` in your favorite text editor and removing all the user IDs for `allowedUsers`.
- Run the bot using `node app.js`, or alternatively use [pm2](https://pm2.keymetrics.io/).

## License

[MIT License](LICENSE.md)
