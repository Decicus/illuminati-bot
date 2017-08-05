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
 * Converts newlines to <br> tags.
 *
 * @param  {String} str
 * @return {String}
 */
const nl2br = (str) => {
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');
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
 * Standard format for date/time stamps.
 *
 * @type {String}
 */
const dtFormat = "LL - LTS ([UTC]Z)";

/**
 * Displays more message details.
 * Not using ES6 arrow functions, because apparently `this` isn't set to the element - TIL
 *
 * @return {Void}
 */
const showMessage = function() {
    const _this = $(this);
    const id = _this.attr('id');

    fetch(`./api/message?id=${id}`, fetchSettings).then((response) => {
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

            const user = message.user;
            const userBody = $('#user tbody', msgModal);
            const userCreated = moment(user.createdAt);

            $('#name', userBody).html(`${user.name}#${user.discriminator}`);
            $('#user_id', userBody).html(user.id);
            $('#avatar', userBody).attr('src', user.avatarUrl || user.defaultAvatarUrl);
            $('#created_at', userBody).html(userCreated.format(dtFormat));
            $('#bot', userBody).html(user.bot ? 'Yes' : 'No');

            const msgDetails = $('#message', msgModal);
            $('#updated_at', msgDetails).html(moment(message.timestamp).format(dtFormat));
            $('#content', msgDetails).html(htmlEntities(message.message));

            const attachments = message.attachments;
            const attDiv = $('#attachments', msgModal);

            if (Object.keys(attachments).length > 0) {
                attDiv.removeClass('hidden');
                const attBody = $('#attachments tbody', msgModal);
                $('tr', attBody).remove(); // Remove old entries

                $.each(attachments, (id, att) => {
                    const row = $('<tr/>');

                    $('<td/>').html(htmlEntities(att.name)).appendTo(row);
                    $('<a/>').attr('href', att.url).html(htmlEntities(att.url)).appendTo($('<td/>').appendTo(row));

                    row.appendTo(attBody);
                });
            } else {
                if (!attDiv.hasClass('hidden')) {
                    attDiv.addClass('hidden');
                }
            }

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
    const user = value('#userid');

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

    const url = `./api/messages?channel=${channel}&user=${user}&limit=${limit}&offset=${offset}`;
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

            updating = false;
            loading.remove();
            refresh.removeClass('disabled');
            $('.fa', refresh).removeClass('fa-spin');
            return;
        }

        const msgs = json.messages;
        msgs.forEach((data) => {
            const {channel, id, message, server, timestamp, user} = data;

            const date = moment(timestamp);

            infoBtn.attr('id', `${id}_${timestamp}`);

            const htmlString = `<th>${date.format("LL - LTS ([UTC]Z)")}</th>
            <td>${server.name} - #${channel.name}</td>
            <td class="discord-id" title="Click to copy user ID" data-clipboard-text="${user.id}">${user.name}#${user.discriminator}</td>
            <td>${nl2br(htmlEntities(message))}</td>
            <td>${infoBtn.prop('outerHTML')}</td>`;

            $('<tr />')
                .html(htmlString)
                .appendTo('#messages tbody');
            $(`button#${id}_${timestamp}`).on('click', showMessage);
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
    fetch('./api/channels', fetchSettings).then((response) => {
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
    $('#userid').on('change', update);
    $('#limit').on('change', update);
    $('#offset').on('change', update);
    const clipboard = new Clipboard('.discord-id');
});
