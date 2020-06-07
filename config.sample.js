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
    admins: [
        '81332863928119296',
        '66271559538446336',
        '99787077444464640',
        '89332412911210496',
        '140911637321351168',
        '99618921019117568',
        '141813591459364864',
        '99655085218336768',
        '135050210899394560',
        '203343129338839040',
    ],

    /**
     * The Discord client ID for authentication with the web interface.
     *
     * @type {String}
     */
    clientId: '',

    /**
     * The Discord client secret for authentication.
     *
     * @type {String}
     */
    clientSecret: '',

    /**
     * The Discord authentication redirect URI.
     *
     * @type {String}
     */
    redirectUri: 'http://localhost:8000/auth/discord/callback',

    /**
     * Should the bot show as offline in the userlist?
     *
     * @type {Boolean}
     */
    showAsOffline: false,

    /**
     * The Discord bot token
     *
     * @type {String}
     */
    token: '',
};

/**
 * See Google Cloud options: https://googlecloudplatform.github.io/google-cloud-node/#/docs/google-cloud/latest/google-cloud
 *
 * @type {Object}
 */
config.gcloud = {
    projectId: 'grape-spaceship-123',
    keyFilename: '/path/to/key.json',
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
    cmdPrefix: '!',

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
     * Guilds and channels that are "forbidden" to request messages for.
     * These guild IDs and channel IDs will not show up in the /api/channels endpoint
     * and thus not in the web UI as well.
     *
     * ** Keep in mind that messages from these channels and guilds will still be logged.
     * ** Therefore making it different from the ignore.json file.
     */
    forbidden: {
        channels: [],
        guilds: [],
    },

    /**
     * API tokens that do not require any other authentication.
     */
    apiTokens: [],

    /**
     * Express-related settings.
     *
     * @type {Object}
     */
    express: {
        /**
         * If the Express web server is enabled or not.
         *
         * @type {Boolean}
         */
        enabled: false,

        /**
         * The port Express should listen to.
         *
         * @type {Number}
         */
        port: process.env.PORT || 8000,

        /**
         * The maximum amount of messages allowed to request through the Express API.
         *
         * @type {Number}
         */
        maxLimit: 50,

        /**
         * Website title
         *
         * @type {String}
         */
        title: 'Illuminati Bot',
    },

    /**
     * The different "kinds" for the different types of information to store.
     *
     * @type {Object}
     */
    gcloud: {
        logs: 'logs',
        messages: 'messages',
    },
};

module.exports = config;
