# Commands
All commands require the the user's Discord ID to be specified in the `config.js` file (specifically the `config.discord.admins` array) when the bot starts up.

All commands need to be prefixed with what is specified in the `config.js` (under `config.settings.cmdPrefix`) file. By default it's `!`.

Parameters are specified as `<required>`, `[optional]` and `(none)`.

All commands work in channels that the bot can read/send messages in, including direct messages between a user and the bot.

| Command | Parameters | Description |
| :---: | :---: | :---: |
| `adduser` | `<userId OR userMention(s)>` | This will add user(s) to the "allowedUsers" setting, and give those users access to the web interface. If valid user mentions are specified, it will go through each user mention and add them all. If it's only user IDs, it will only take in the first user ID specified. |
| `addusers` | `<userId OR userMentions(s)>` | Alias of `adduser`. |
| `admins` | `(none)` | Returns a comma-separated list of admin users. |
| `deluser` | `<userId OR userMentions(s)>` | Basically the same as `adduser`, except this **removes** the access for the specified user(s). |
| `delusers` | `<userId OR userMentions(s)>` | Alias of `deluser`. |
| `users` | `(none)` | Returns a comma-separated list of users that are allowed to access the web interface. |
| `ignorechannel` | `<channelMention(s)>` | Stops logging messages in the specified channel(s). |
| `ic` | `<channelMention(s)>` | Alias of `ignorechannel`. |
| `unignorechannel` | `<channelMention(s)>` | Restarts logging of messages in the specified channel(s). Opposite of `ignorechannel`. |
| `uic` | `<channelMention(s)>` | Alias of `ignorechannel` |
| `channels` | `(none)` | Returns a comma-separated list of channels where messages are currently not being logged. |
