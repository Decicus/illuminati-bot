'use strict';
const config = require('./config');
const discordjs = require('discord.js');
const datastore = require('@google-cloud/datastore')(config.gcloud);
const log = require('./core/log');
const _ = require('./core/helpers');

const client = new discordjs.Client();

let ignore = {
    channels: [],
    users: []
};
const readIgnore = _.readFile(config.settings.ignore);
if (readIgnore !== false) {
    ignore = JSON.parse(readIgnore);
    log(`Successfully read the ignore file (${config.settings.ignore}).`);
}

const messageKind = config.settings.gcloud.messages;
/**
 * Handles logging of messages
 *
 * @param  {Object} msg   Discord.js Message object
 * @param  {Object} after Discord.js Message object, only applicable for "messageUpdated"
 * @return {Void}
 */
const handleMessage = (msg, after) => {
    if (after) {
        msg = after;
    }

    const channel = msg.channel;
    if (ignore.channels.includes(channel.id) || channel.type !== 'text') {
        return;
    }

    const user = msg.author;
    if (ignore.users.includes(user.id)) {
        return;
    }

    const mentions = msg.mentions;
    let content = msg.content;
    mentions.users.forEach((user) => {
        const reg = new RegExp(`<@${user.id}>`, 'g');
        content.replace(reg, `<${_.userName(user)} [${user.id}]>`);
    });

    mentions.channels.forEach((channel) => {
        const reg = new RegExp(`<#${channel.id}>`, 'g');
        content.replace(reg, `#${channel.name}`);
    });

    mentions.roles.forEach((role) => {
        const reg = new RegExp(`<@&${role.id}>`, 'g');
        content.replace(reg, `@${role.name}`);
    });

    const server = msg.guild;
    const edited = msg.editedTimestamp ? true : false;
    const timestamp = msg.editedTimestamp || msg.createdTimestamp;
    const data = {
        id: msg.id,
        message: content,
        channel_id: channel.id,
        user_id: user.id,
        timestamp,
        edited,
        attachments: {},
        channel: {
            id: channel.id,
            name: channel.name
        },
        server: {
            id: server.id,
            name: server.name
        },
        user: {
            id: user.id,
            name: user.username,
            discriminator: user.discriminator
        }
    };

    msg.attachments.forEach((att) => {
        data.attachments[att.id] = {
            name: att.filename,
            url: att.url,
            size: att.filesize
        }
    });

    const key = datastore.key([messageKind, `${msg.id}-${timestamp}`]);
    datastore.insert({
        key,
        data
    }, (err) => {
        if (err) {
            log(err, 'error');
        }
    });
};

/**
 * Registers message events.
 */
client.on('message', handleMessage);
client.on('messageUpdate', handleMessage);

client.on('warn', (warning) => {
    log(warning);
});

client.login(config.discord.token);

process.on('SIGINT', () => {
    log('Logging out of Discord and shutting down process.');
    client
    .destroy()
    .catch((err) => {
        if (err) {
            log(err, 'error');
            process.exit(1);
        }
    })
    .then(() => {
        process.exit(0);
    });
});
