'use strict';
const config = require('./config');
const discordjs = require('discord.js');
const datastore = require('@google-cloud/datastore')(config.gcloud);
