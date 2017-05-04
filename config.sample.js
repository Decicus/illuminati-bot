'use strict';
const config = {};

/**
 * Discord API/bot settings
 *
 * @type {Object}
 */
config.discord = {
    /**
     * The user IDs that should be considered admins.
     *
     * @type {Array}
     */
    admins: ['81332863928119296'],

    /**
     * The Discord client ID
     *
     * @type {String}
     */
    clientId: '',

    /**
     * The Discord bot token
     *
     * @type {String}
     */
    token: ''
};

/**
 * See Google Cloud options: https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/latest/google-cloud
 *
 * @type {Object}
 */
config.gcloud = {
    projectId: 'grape-spaceship-123',
    keyFilename: '/path/to/key.json'
};

/**
 * Miscellaneous settings used by the bot.
 *
 * @type {Object}
 */
config.settings = {
    /**
     * The prefix for admin commands.
     *
     * @type {String}
     */
    cmdPrefix: "!",

    /**
     * Location of data file with information about what is ignored (channels, users etc.)
     *
     * @type {String}
     */
    ignore: __dirname + '/data/ignore.json',

    /**
     * Location of settings file for extra settings
     *
     * @type {String}
     */
    settings: __dirname + '/data/settings.json',

    /**
     * Express-related settings.
     *
     * @type {Object}
     */
    express: {
        enabled: false,
        port: 8000
    },

    /**
     * The different "kinds" for the different types of information to store.
     *
     * @type {Object}
     */
    gcloud: {
        logs: 'logs',
        messages: 'messages'
    }
};

module.exports = config;
