'use strict';
const _ = {};
const fs = require('fs');
const log = require('./log');

/**
 * Check if the input value is "undefined".
 *
 * @param  {Mixed} val
 * @return {Boolean}
 */
_.isUndef = (val) => {
    return typeof val === 'undefined';
};

/**
 * Check if the input value is "number".
 *
 * @param  {Mixed} val
 * @return {Boolean}
 */
_.isNum = (val) => {
    return typeof val === 'number';
};

/**
 * Check if the value is an object
 *
 * @param  {Mixed} val
 * @return {Boolean}
 */
_.isObj = (val) => {
    return typeof val === 'object';
};

/**
 * JSON-stringifies with a specific layout/format.
 *
 * @param  {Mixed} val
 * @return {String}
 */
_.JSONify = (val) => {
    return JSON.stringify(val, null, 4);
};

/**
 * Shortcut for iterating through an object.
 *
 * @param  {Object}   obj
 * @param  {Function} callback
 * @return {Void}
 */
_.forEach = (obj, callback) => {
    Object.keys(obj).forEach(callback);
};

/**
 * Reads the specified file
 *
 * @param  {String} file
 * @return {String}
 */
_.readFile = (file) => {
    try {
        return fs.readFileSync(file, 'utf-8');
    } catch (error) {
        log(error, 'error');
        return false;
    }
};

/**
 * Writes the specified data to file.
 *
 * @param  {String} filename
 * @param  {String} data
 * @return {void}
 */
_.writeFile = (filename, data) => {
    fs.writeFile(filename, data, (error) => {
        if (error) {
            log(error, 'error', true);
        }
    });
};

/**
 * Formats the username string properly
 * based on the Discord.js User Object
 *
 * @param  {Object} user
 * @return {String}
 */
_.userName = (user) => {
    return `${user.username}#${user.discriminator}`;
};

/**
 * Sends a response via the Express object
 *
 * @param  {Object} res    The Express Response object.
 * @param  {Number} status HTTP status code
 * @param  {Mixed} body    The body
 * @return {Void}
 */
_.send = (res, status, body) => {
    if (typeof body === 'object') {
        body.status = status;
    }

    body.success = (status === 200);

    res.status(status).send(body);
};

module.exports = _;
