'use strict';
const config = require('./config');
const discordjs = require('discord.js');
const datastore = require('@google-cloud/datastore')(config.gcloud);

const log = require('./core/log');
const _ = require('./core/helpers');

const client = new discordjs.Client();

const botAuthUrl = `https://discordapp.com/oauth2/authorize?client_id=${config.discord.botClientId}&scope=bot&permissions=84992`;

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

client.on('warn', (warning) => {
    log(warning);
});

client.login(config.discord.token);

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

// Passport/auth sessions setup
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

// Twig setup
web.set('views', __dirname + '/views');
web.set('view engine', 'html');
web.engine('html', twig.__express);

// TODO: Setup views and all that.
web.get('/', (req, res) => {
    res.render('home', {
        page: 'Home'
    });
});

web.get('/auth/discord', passport.authenticate('discord', {scope: scopes}), () => {});

web.get('/auth/discord/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), (req, res) => {
    res.redirect('/');
});

web.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

const api = express.Router();
api.use((req, res, next) => {
    if (!req.session.passport || !req.session.passport.user) {
        _.send(res, 403, {
            message: "Requires authentication."
        });
        return;
    }

    const id = req.session.passport.user.id;
    const allowedUser = settings.allowedUsers.includes(id);
    const isAdmin = config.discord.admins.includes(id);

    if (!allowedUser && !isAdmin) {
        _.send(res, 403, {
            message: "You do not have access."
        });
        return;
    }

    next();
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
