module.exports = async function ({ config, hooks }) {
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
    });

    // Init with defaults
    const settings = new Map([
        [SETTING_NAMES.PREFIX, null],
    ]);

    // Load config settings
    if (KEY in config) {
        for (const [name, override] of Object.entries(config[KEY])) {
            if (!settings.has(name)) {
                log(`Setting ${name} is not a valid setting`);
            }

            if (name.toLowerCase().includes("enabled")) {
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

    if (!prefix || prefix.length < 1) {
        log(`Thread Name Prefix plugin disengaged, no configuration provided.`);
        return;
    }

    const beforeThread = ({ opts }) => {
        opts.channelName = `${prefix}${opts.channelName}`;
    };

    hooks.beforeNewThread(beforeThread);

    log(`Thread Name Prefix plugin engaged.`);
};
