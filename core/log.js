'use strict';
const config = require('../config');
const datastore = require('@google-cloud/datastore')(config.gcloud);
const kind = config.settings.gcloud.logs;
const _ = require('./helpers');

module.exports = (message, type) => {
    if (!type) {
        type = 'info';
    } else {
        type = type.toLowerCase();
    }

    if (_.isObj(message)) {
        message = _.JSONify(message);
    }

    const timestamp = Date.now();
    switch (type) {
        case 'error':
            console.error(message);
            break;
        default:
            console.log(message);
    }

    const data = {
        message,
        timestamp,
        type
    };

    const key = datastore.key([kind, `${_.randomInt(0, 1000)}-${timestamp}`]);
    datastore.insert({
        key,
        data
    }, (err) => {
        if (err) {
            console.error(err);
        }
    });
};
