'use strict';
const config = require('./config');
const discordjs = require('discord.js');
const datastore = require('@google-cloud/datastore')(config.gcloud);

const log = require('./core/log');
const _ = require('./core/helpers');

const client = new discordjs.Client();

const botAuthUrl = `https://discordapp.com/oauth2/authorize?client_id=${config.discord.clientId}&scope=bot&permissions=84992`;

let ignore = {
    channels: [],
    users: []
};
const readIgnore = _.readFile(config.settings.ignore);
if (readIgnore !== false) {
    ignore = JSON.parse(readIgnore);
    log(`Successfully read the ignore file (${config.settings.ignore}).`);
}

let settings = {
    allowedUsers: []
};
const readSettings = _.readFile(config.settings.settings);
if (readSettings !== false) {
    settings = JSON.parse(readSettings);
    log(`Successfully read the settings file (${config.settings.settings}).`);
}

/**
 * Store settings to file.
 */
const saveSettings = () => {
    _.writeFile(config.settings.settings, _.JSONify(settings));
};

/**
 * Store "ignore" settings to file.
 */
const saveIgnore = () => {
    _.writeFile(config.settings.ignore, _.JSONify(ignore));
};

/**
 * Commands for handling updating of users and such.
 *
 * @type {Object}
 */
const commands = {};

/**
 * Add user to allowed users.
 */
commands.adduser = (msg) => {
    const mentions = msg.mentions.users;

    if (!mentions || mentions.size === 0) {
        _.reply(msg, 'At least one user has to be mentioned.');
        return;
    }

    const usersToAdd = [];
    mentions.forEach((user) => {
        const userId = user.id;

        if (settings.allowedUsers.includes(userId)) {
            _.reply(msg, `<@${userId}> is already an allowed user.`);
        } else {
            usersToAdd.push(userId);
        }
    });

    if (usersToAdd.length === 0) {
        return;
    }

    usersToAdd.forEach((userId) => {
        log(`${_.userName(msg.author)} added ${userId} to allowed users.`);
        settings.allowedUsers.push(userId);
    });

    saveSettings();
    _.reply(msg, `The users: ${_.joinUsers(usersToAdd)} were added to allowed users.`);
};

/**
 * List admin users.
 */
commands.admins = (msg) => {
    _.reply(msg, `Admin users: <@${config.discord.admins.join('>, <@')}>`);
};

/**
 * Alias of commands.adduser.
 *
 * @type {Function}
 */
commands.addusers = commands.adduser;

/**
 * Remove a user from allowed users.
 */
commands.deluser = (msg) => {
    const mentions = msg.mentions.users;

    if (!mentions || mentions.size === 0) {
        _.reply(msg, 'At least one user has to be mentioned.');
        return;
    }

    const usersToRemove = [];
    mentions.forEach((user) => {
        const userId = user.id;

        if (!settings.allowedUsers.includes(userId)) {
            _.reply(msg, `<@${userId}> is not an allowed user.`);
        } else {
            usersToRemove.push(userId);
        }
    });

    if (usersToRemove.length === 0) {
        return;
    }

    usersToRemove.forEach((userId) => {
        log(`${_.userName(msg.author)} removed ${userId} from allowed users.`);
        settings.allowedUsers.splice(settings.allowedUsers.indexOf(userId), 1);
    });

    saveSettings();
    _.reply(msg, `The users: ${_.joinUsers(usersToRemove)} were removed from allowed users.`);
};

/**
 * Alias of commands.deluser.
 *
 * @type {Function}
 */
commands.delusers = commands.deluser;

/**
 * Adds a channel to the channel ignore list.
 */
commands.ignorechannel = (msg) => {
    const mentions = msg.mentions.channels;

    if (!mentions || mentions.size === 0) {
        _.reply(msg, 'At least one channel has to be mentioned.');
        return;
    }

    const channelIds = [];
    mentions.forEach((channel) => {
        const id = channel.id;
        if (ignore.channels.includes(id)) {
            _.reply(msg, `Channel <#${id}> is already in the ignore list.`);
            return;
        }

        channelIds.push(channel.id);
    });

    if (channelIds.length === 0) {
        return;
    }

    channelIds.forEach((channel) => {
        log(`${_.userName(msg.author)} added ${channel} to channel ignore list.`);
        ignore.channels.push(channel);
    });

    saveIgnore();
    _.reply(msg, `The channels: ${_.joinChannels(channelIds)} are now being ignored (messages in these channels are not logged).`);
};

/**
 * Removes a channel from the channel ignore list.
 */
commands.unignorechannel = (msg) => {
    const mentions = msg.mentions.channels;

    if (!mentions || mentions.size === 0) {
        _.reply(msg, 'At least one channel has to be mentioned.');
        return;
    }

    const channelIds = [];
    mentions.forEach((channel) => {
        const id = channel.id;
        if (!ignore.channels.includes(id)) {
            _.reply(msg, `Channel <#${id}> is not in the ignore list.`);
            return;
        }

        channelIds.push(channel.id);
    });

    if (channelIds.length === 0) {
        return;
    }

    channelIds.forEach((channel) => {
        log(`${_.userName(msg.author)} removed ${channel} from channel ignore list.`);
        ignore.channels.splice(ignore.channels.indexOf(channel), 1);
    });

    saveIgnore();
    _.reply(msg, `The channels: ${_.joinChannels(channelIds)} are no longer ignored (messages in these channels are now being logged again).`);
};

/**
 * Alias of commands.ignorechannel & commands.unignorechannel.
 */
commands.ic = commands.ignorechannel;
commands.uic = commands.unignorechannel;

/**
 * Lists currently ignored channels
 */
commands.channels = (msg) => {
    if (ignore.channels.length === 0) {
        _.reply(msg, 'Currently ignored channels: None.');
        return;
    }

    _.reply(msg, `Currently ignored channels: ${_.joinChannels(ignore.channels)}`);
};

/**
 * Lists currently allowed users.
 */
commands.users = (msg) => {
    if (settings.allowedUsers.length === 0) {
        msg.reply('Currently allowed users: None.');
        return;
    }

    _.reply(msg, `Currently allowed users: <@${settings.allowedUsers.join('>, <@')}>`);
};

/**
 * List commands available to admins
 */
commands.commands = (msg) => {
    _.reply(msg, `These commands are available for admins, prefixed with ${'`' + (config.settings.cmdPrefix || '!') + '`'}:\n${'`' + Object.keys(commands).join(', ') + '`'}`);
};

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
    const msgMentions = {
        channels: {},
        roles: {},
        users: {}
    };

    let content = msg.content;

    mentions.channels.forEach((channel) => {
        const {id, name} = channel;
        const reg = new RegExp(`<#${id}>`, 'g');
        content = content.replace(reg, `#${name}`);

        msgMentions.channels[id] = {
            id,
            name,
        };
    });

    mentions.roles.forEach((role) => {
        const {color, hexColor, id, name} = role;
        const reg = new RegExp(`<@&${role.id}>`, 'g');
        content = content.replace(reg, `@${role.name}`);

        msgMentions.roles[id] = {
            color,
            hexColor,
            id,
            name,
        };
    });

    mentions.users.forEach((user) => {
        const {id, username, discriminator} = user;
        const reg = new RegExp(`<@${id}>`, 'g');
        content = content.replace(reg, `<${_.userName(user)} [${id}]>`);

        msgMentions.users[id] = {
            id,
            username,
            discriminator
        };
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
        mentions: msgMentions,
        messageMeta: {
            content: msg.content,
            cleanContent: msg.cleanContent
        },
        server: {
            id: server.id,
            name: server.name
        },
        user: {
            avatar: user.avatar,
            avatarUrl: user.avatarURL,
            bot: user.bot,
            createdAt: user.createdTimestamp,
            defaultAvatarUrl: user.defaultAvatarURL,
            discriminator: user.discriminator,
            id: user.id,
            name: user.username
        }
    };

    msg.attachments.forEach((att) => {
        data.attachments[att.id] = {
            name: att.filename,
            url: att.url,
            size: att.filesize
        };
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

/**
 * Handle messages that trigger commands
 */
client.on('message', (msg) => {
    if (!config.discord.admins.includes(msg.author.id)) {
        return;
    }

    const message = msg.content;
    const split = message.split(" ");

    const prefix = config.settings.cmdPrefix || '!';
    const prefixLen = prefix.length;

    let cmd = split[0];

    if (message.length < prefixLen || cmd.length < prefixLen || message.slice(0, prefixLen) !== prefix) {
        return;
    }

    cmd = cmd.slice(prefixLen).toLowerCase();
    if (!commands[cmd]) {
        return;
    }

    commands[cmd](msg, split);
});

client.on('warn', (warning) => {
    log(warning);
});

client.login(config.discord.token).then(() => {
    const user = client.user;
    log(`Logged into Discord using account: ${user.username}#${user.discriminator}`);
});

/**
 * Web interface
 */
const express = require('express');
const twig = require('twig');
const passport = require('passport');
const session = require('express-session');
const DiscordStrategy = require('passport-discord').Strategy;
const auth = config.discord;
const web = express();

/**
 * Passport/auth sessions setup
 */
const scopes = ['identify'];
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: auth.clientId,
    clientSecret: auth.clientSecret,
    callbackURL: auth.redirectUri,
    scope: scopes
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

web.use(session({
    secret: auth.clientSecret,
    resave: false,
    saveUninitialized: false
}));
web.use(passport.initialize());
web.use(passport.session());

/**
 * Twig setup
 */
web.set('views', __dirname + '/views');
web.set('view engine', 'html');
web.engine('html', twig.__express);
web.use('/static', express.static(__dirname + '/static'));

/**
 * Normal routes
 */
web.get('/', (req, res) => {
    const data = {
        page: 'Home'
    };

    data.user = req.session.passport && req.session.passport.user ? req.session.passport.user : null;

    res.render('home', data);
});

web.get('/auth/discord', passport.authenticate('discord', {scope: scopes}), () => {});

web.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/');
});

web.get('/auth/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

/**
 * API routes
 */
const api = express.Router();
api.use((req, res, next) => {
    if (!req.session.passport || !req.session.passport.user) {
        _.send(res, 403, {
            message: "Requires authentication."
        });
        return;
    }

    const user = req.session.passport.user;
    const id = user.id;
    const allowedUser = settings.allowedUsers.includes(id);
    const isAdmin = config.discord.admins.includes(id);

    if (!allowedUser && !isAdmin) {
        _.send(res, 403, {
            message: `${user.username}#${user.discriminator} does not have access.`
        });
        return;
    }

    next();
});

api.get('/channels', (req, res) => {
    const channels = client.channels;
    const validChannels = {};

    channels.forEach((chan) => {
        if (chan.type !== 'text' || ignore.channels.includes(chan.id)) {
            return;
        }

        const {id, name} = chan;
        const g = chan.guild;

        validChannels[id] = {
            name,
            guild: {
                id: g.id,
                name: g.name
            }
        };
    });

    _.send(res, 200, {
        channels: validChannels
    });
});

api.get('/message', (req, res) => {
    const q = req.query;
    const id = q.id || "";

    if (id.length === 0) {
        _.send(res, 400, {
            message: "A message ID has to be specified."
        });
        return;
    }

    const [messageId, timestamp] = id.split("_");

    const query = datastore.createQuery(messageKind)
                    .filter('id', '=', messageId)
                    .filter('timestamp', '=', parseInt(timestamp));

    datastore.runQuery(query, (err, messages) => {
        if (err) {
            log(err, 'error');
            _.send(res, 500, {
                message: "An error occurred and has been logged."
            });

            return;
        }

        _.send(res, 200, {
            count: messages.length,
            messages: messages
        });
    });
});

api.get('/messages', (req, res) => {
    const q = req.query;
    let user = q.user || "";
    let channel = q.channel || "";
    const limit = q.limit ? parseInt(q.limit) : 25;
    const offset = q.offset ? parseInt(q.offset) : 0;
    const max = config.settings.express.maxLimit || 50;

    if (limit > max) {
        _.send(res, 400, {
            message: `The "limit" specified (${limit}) is higher than maximum (${max}) allowed.`
        });

        return;
    }

    user = user.trim();
    channel = channel.trim();

    if (user.length === 0 && channel.length === 0) {
        _.send(res, 400, {
            message: "Either a Discord channel ID or a Discord user ID (or both) has to be specified."
        });

        return;
    }

    let query = datastore.createQuery(messageKind);

    if (user.length > 0) {
        query = query.filter('user_id', '=', user);
    }

    if (channel.length > 0) {
        query = query.filter('channel_id', '=', channel);
    }

    query = query
            .offset(offset)
            .limit(limit)
            .order('timestamp', {
                descending: true
            });

    datastore.runQuery(query, (err, messages) => {
        if (err) {
            log(err, 'error');
            _.send(res, 500, {
                message: "An error occurred and has been logged."
            });

            return;
        }

        _.send(res, 200, {
            count: messages.length,
            messages: messages
        });
    });
});

api.get('/*', (req, res) => {
    _.send(res, 404, {
        message: "Route not found"
    });
});

web.use('/api', api);

const expressConf = config.settings.express;
if (expressConf.enabled) {
    web.listen(expressConf.port, (err) => {
        if (err) {
            log(err, 'error');
        }

        log(`Listening on port ${expressConf.port}`);
    });
}

process.on('SIGINT', () => {
    log('Logging out of Discord and shutting down process.');
    client
    .destroy()
    .catch((err) => {
        if (err) {
            log(err, 'error');
        }

        process.exit(1);
    })
    .then(() => {
        process.exit(0);
    });
});
