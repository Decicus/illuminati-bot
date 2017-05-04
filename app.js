'use strict';
const config = require('./config');
const discordjs = require('discord.js');
const datastore = require('@google-cloud/datastore')(config.gcloud);
const log = require('./core/log');

const client = new discordjs.Client();

client.on('warn', (warning) => {
    log(warning);
});

client.login(config.discord.token);
