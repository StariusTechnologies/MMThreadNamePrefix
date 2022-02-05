module.exports = async function ({ bot, config, hooks }) {
    const KEY = 'tnp';
    const truthyValues = ['on', '1', 'true'];
    const falsyValues = ['off', '0', 'false', 'null'];

    function log(message) {
        console.log(`[Thread Name Prefix] ${message}`);
    }

    /**
     * Parses a boolean from the input string.
     * String must be either truthy or falsy to return boolean
     * @return boolean|null
     */
    function parseCustomBoolean(input) {
        if (typeof input === 'boolean') {
            return input;
        }

        if (truthyValues.includes(input)) return true;
        if (falsyValues.includes(input)) return false;

        return null;
    }

    const SETTING_NAMES = Object.freeze({
        PREFIX: 'prefix',
        SCHEDULED_CLOSE_PREFIX: 'scheduledClosePrefix',
    });

    // Init with defaults
    const settings = new Map([
        [SETTING_NAMES.PREFIX, null],
        [SETTING_NAMES.SCHEDULED_CLOSE_PREFIX, null],
    ]);

    // Load config settings
    if (KEY in config) {
        for (const [name, override] of Object.entries(config[KEY])) {
            if (!settings.has(name)) {
                log(`Setting ${name} is not a valid setting`);
                continue;
            }

            if (name.toLowerCase().includes('enabled')) {
                const parsedBool = parseCustomBoolean(override);

                if (parsedBool === null) {
                    log(`Value ${override} is not a valid truthy or falsy value`);
                } else {
                    settings.set(name, parsedBool);
                }
            } else {
                settings.set(name, override);
            }
        }
    }

    const prefix = settings.get(SETTING_NAMES.PREFIX);
    const scheduledClosePrefix = settings.get(SETTING_NAMES.SCHEDULED_CLOSE_PREFIX);
    let inboxGuild = null;

    if (!prefix || prefix.length < 1) {
        log(`Thread Name Prefix plugin disengaged, no configuration provided.`);
        return;
    }

    const getInboxGuild = () => {
        if (!inboxGuild) {
            inboxGuild = bot.guilds.find(g => g.id === config.inboxServerId)
        }

        return inboxGuild;
    };

    const beforeThread = ({ opts }) => {
        opts.channelName = `${prefix}${opts.channelName}`;
    };

    const afterThreadCloseScheduled = async ({ thread }) => {
        if (!scheduledClosePrefix) {
            return;
        }

        const channel = getInboxGuild().channels.get(thread.channel_id);
        const prefixLength = prefix?.length ?? 0;
        const hasPrefix = prefix && channel.name.startsWith(prefix);
        const channelName = hasPrefix ? channel.name.slice(prefixLength) : channel.name;

        channel?.edit({ name: scheduledClosePrefix + channelName });
    };

    const afterThreadCloseScheduleCanceled = async ({ thread }) => {
        if (!scheduledClosePrefix) {
            return;
        }

        const channel = getInboxGuild().channels.get(thread.channel_id);
        const prefixLength = scheduledClosePrefix?.length ?? 0;
        const hasPrefix = scheduledClosePrefix && channel.name.startsWith(scheduledClosePrefix);
        const channelName = hasPrefix ? channel.name.slice(prefixLength) : channel.name;

        channel?.edit({ name: (prefix ?? '') + channelName });
    };

    hooks.beforeNewThread(beforeThread);
    hooks.afterThreadCloseScheduled(afterThreadCloseScheduled);
    hooks.afterThreadCloseScheduleCanceled(afterThreadCloseScheduleCanceled);

    log(`Thread Name Prefix plugin engaged.`);
};
