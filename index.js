const { PLUGIN_OWNER_ID, MESSAGES } = require('./constants');
const AccountRotator = require('./lib/accountRotator');

let rotationInterval = null;
let accountRotator = null;

async function onLoad(bot, options) {
    const log = bot.sendLog;
    const settings = options.settings || {};
    const store = options.store;

    try {
        accountRotator = new AccountRotator(bot, log);
        const mode = settings.mode || 'interval';
        const interval = settings.interval || 30;
        const accounts = settings.accounts || [];
        const order = settings.order || 'sequential';

        const parsedAccounts = accountRotator.parseAccounts(accounts);

        if (parsedAccounts.length === 0) {
            log(`[AccountRotator] ${MESSAGES.NO_ACCOUNTS}`);
            log('[AccountRotator] Плагин загружен, но неактивен.');
            return;
        }

        log(`[AccountRotator] Загружено аккаунтов: ${parsedAccounts.length}`);

        if (mode === 'startup') {
            log('[AccountRotator] Режим: смена при запуске');

            setTimeout(async () => {
                try {
                    const lastRotationTime = await store.get('last_rotation_time');
                    const now = Date.now();
                    const timeSinceLastRotation = lastRotationTime ? now - lastRotationTime : Infinity;

                    if (timeSinceLastRotation < 10000) {
                        log('[AccountRotator] Ротация пропущена: недавно уже была смена аккаунта');
                        return;
                    }

                    const success = await accountRotator.changeAccount(order);

                    if (success) {
                        await store.set('last_rotation_time', now);
                    }
                } catch (error) {
                    log(`[AccountRotator] Ошибка при смене аккаунта: ${error.message}`);
                }
            }, 2000);

        } else if (mode === 'interval') {
            log(`[AccountRotator] ${MESSAGES.STARTED
                .replace('{mode}', 'интервал')
                .replace('{interval}', interval)}`);

            rotationInterval = setInterval(async () => {
                try {
                    const success = await accountRotator.changeAccount(order);

                    if (success) {
                        await store.set('last_rotation_time', Date.now());
                    }
                } catch (error) {
                    log(`[AccountRotator] Ошибка при смене аккаунта: ${error.message}`);
                }
            }, interval * 60 * 1000);
        }

        log('[AccountRotator] Плагин успешно загружен.');

    } catch (error) {
        log(`[AccountRotator] [FATAL] Ошибка при загрузке: ${error.stack}`);
    }
}

async function onUnload({ botId, prisma }) {
    console.log(`[AccountRotator] Выгрузка плагина для бота ID: ${botId}`);

    try {
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
        console.log(`[AccountRotator] Ресурсы успешно очищены.`);
    } catch (error) {
        console.error(`[AccountRotator] Ошибка при очистке:`, error);
    }
}

async function onDisable({ botId, settings, store, prisma }) {
    console.log(`[AccountRotator] Плагин отключён для бота ${botId}`);

    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

async function onEnable({ botId, settings, store, prisma }) {
    console.log(`[AccountRotator] Плагин включён для бота ${botId}`);
}

module.exports = { onLoad, onUnload, onEnable, onDisable };
