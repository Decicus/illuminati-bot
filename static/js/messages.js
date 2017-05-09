/**
 * HTML-encodes certain characters
 *
 * @param  {String} str The string to encode
 * @return {String}     The encoded string
 */
const htmlEntities = (str) => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

/**
 * Gets the value from the selector and trims it.
 *
 * @param  {String} selector The selector jQuery should look for.
 * @return {String}          The string value from the selector.
 */
const value = (selector) => {
    return $(selector).val().trim();
};

/**
 * Fills the error box with the specified value.
 *
 * @param  {String} error The error to fill in with.
 * @return {Void}
 */
const error = (err) => {
    const element = $('#error');
    if (element.hasClass('hidden')) {
        element.removeClass('hidden');
    }

    element.html(err);
};

/**
 * The rest of update() only runs if this is false.
 *
 * @type {Boolean}
 */
let updating = false;

/**
 * Request options for fetch().
 *
 * @type {Object}
 */
const fetchSettings = {
    credentials: 'include',
    method: 'GET'
};

/**
 * Clone the info button element.
 *
 * @type {Object}
 */
const infoBtn = $('#info-btn')
                .clone()
                .removeAttr('id')
                .removeClass('hidden');

/**
 * The modal for display message information.
 *
 * @type {Object}
 */
const msgModal = $('#message-information');

/**
 * Displays more message details.
 * Not using ES6 arrow functions, because apparently `this` isn't set to the element - TIL
 *
 * @return {Void}
 */
const showMessage = function() {
    const _this = $(this);
    const id = _this.attr('id');

    fetch(`/api/message?id=${id}`, fetchSettings).then((response) => {
        return response.json();
    }, (err) => {
        error(err);
    }).then((json) => {
        if (!json.success) {
            error(`An error occurred loading message: ${json.message}`);
            return;
        }

        if (json.count > 0) {
            const message = json.messages[0];
            $('#message-id', msgModal).html(id);
            // TODO: Make this displayed prettier.
            $('code', msgModal).html(htmlEntities(JSON.stringify(message, null, 4)));
            msgModal.modal();
            return;
        }

        error(`No message was found with the ID: ${id}`);
    });
};

const update = () => {
    if (updating) {
        error('You are already requesting messages. Please wait until the previous request has finished before requesting more messages.');
        return;
    }

    const channel = value('#channel');
    const user = value('#user');

    if (channel.length === 0 && user.length === 0) {
        error('Either a channel or user ID has to be specified!');
        return;
    }

    updating = true;

    const limit = value('#limit');
    const offset = value('#offset');

    const messages = $('#messages');
    messages.before('<p class="text-warning" id="loading">Loading...</p>');
    const loading = $('#loading');
    const refresh = $('#refresh');
    const count = $('#count');
    const countP = count.parent('div');

    if (!messages.hasClass('hidden')) {
        messages.addClass('hidden');
    }

    const err = $('#error');
    if (!err.hasClass('hidden')) {
        err.addClass('hidden');
    }

    $('tbody tr', messages).remove();

    if (!refresh.hasClass('disabled')) {
        refresh.addClass('disabled');
    }

    if (!countP.hasClass('hidden')) {
        countP.addClass('hidden');
    }

    $('.fa', refresh).addClass('fa-spin');

    const url = `/api/messages?channel=${channel}&user=${user}&limit=${limit}&offset=${offset}`;
    fetch(url, fetchSettings).then((response) => {
        return response.json();
    }, (err) => {
        error(err);

        updating = false;
        loading.remove();
        refresh.removeClass('disabled');
        $('.fa', refresh).removeClass('fa-spin');
    }).then((json) => {
        if (!json.success) {
            error(`An error occurred loading messages: ${json.message}`);
            return;
        }

        const msgs = json.messages;
        msgs.forEach((data) => {
            const {channel, id, message, server, timestamp, user} = data;

            const date = new Date(timestamp);
            const locale = date.toLocaleString();
            const utcDate = date.toUTCString();

            infoBtn.attr('id', id);

            $('<tr />')
                .html(`<th title="${utcDate}">${locale}</th><td>${server.name} - #${channel.name}</td><td title="${user.id}">${user.name}#${user.discriminator}</td><td>${htmlEntities(message)}</td><td>${infoBtn.prop('outerHTML')}</td>`)
                .appendTo('tbody', messages);
            $(`button#${id}`).on('click', showMessage);
        });

        messages.removeClass('hidden');
        countP.removeClass('hidden');
        count.html(json.count);

        updating = false;
        loading.remove();
        refresh.removeClass('disabled');
        $('.fa', refresh).removeClass('fa-spin');
    });
};

$(document).ready(() => {
    fetch('/api/channels', fetchSettings).then((response) => {
        return response.json();
    }, (err) => {
        error(err);
    }).then((json) => {
        if (!json.success) {
            error(`An error occurred loading channels: ${json.message}`);
            return;
        }

        const channels = json.channels;
        $.each(channels, (id, channel) => {
            $('#channel').append(
                $('<option/>')
                    .val(id)
                    .html(`${channel.guild.name} - #${channel.name}`)
            );
        });
    });

    $('#refresh').on('click', update);
    $('#channel').on('change', update);
    $('#username').on('change', update);
    $('#limit').on('change', update);
    $('#offset').on('change', update);
});
