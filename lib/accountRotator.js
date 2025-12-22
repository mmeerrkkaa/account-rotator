const { MESSAGES } = require('../constants');

class AccountRotator {
    constructor(bot, log) {
        this.bot = bot;
        this.log = log;
        this.currentIndex = 0;
        this.accounts = [];
    }

    /**
     * Парсинг списка аккаунтов из формата username:password
     */
    parseAccounts(accountStrings) {
        this.accounts = [];

        for (const accountStr of accountStrings) {
            if (!accountStr || !accountStr.includes(':')) {
                this.log(`[AccountRotator] ${MESSAGES.INVALID_FORMAT.replace('{account}', accountStr)}`);
                continue;
            }

            const [username, password] = accountStr.split(':');

            if (!username || !password) {
                this.log(`[AccountRotator] ${MESSAGES.INVALID_FORMAT.replace('{account}', accountStr)}`);
                continue;
            }

            this.accounts.push({
                username: username.trim(),
                password: password.trim()
            });
        }

        return this.accounts;
    }

    /**
     * Получить следующий аккаунт по порядку
     */
    getNextSequential() {
        if (this.accounts.length === 0) return null;

        const account = this.accounts[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.accounts.length;

        return account;
    }

    /**
     * Получить случайный аккаунт
     */
    getNextRandom() {
        if (this.accounts.length === 0) return null;

        const randomIndex = Math.floor(Math.random() * this.accounts.length);
        return this.accounts[randomIndex];
    }

    /**
     * Получить следующий аккаунт в зависимости от настройки order
     */
    getNextAccount(order) {
        if (order === 'random') {
            return this.getNextRandom();
        } else {
            return this.getNextSequential();
        }
    }

    /**
     * Сменить аккаунт с retry логикой
     */
    async changeAccount(order, maxAttempts = null) {
        if (this.accounts.length === 0) {
            this.log(`[AccountRotator] ${MESSAGES.NO_ACCOUNTS}`);
            return false;
        }

        const attempts = maxAttempts || this.accounts.length;
        let lastError = null;

        for (let i = 0; i < attempts; i++) {
            const account = this.getNextAccount(order);

            if (!account) {
                this.log(`[AccountRotator] ${MESSAGES.NO_ACCOUNTS}`);
                return false;
            }

            try {
                this.log(`[AccountRotator] Попытка ${i + 1}/${attempts}: смена на ${account.username}...`);

                await this.bot.api.changeCredentials({
                    username: account.username,
                    password: account.password
                });

                this.log(`[AccountRotator] ${MESSAGES.ACCOUNT_CHANGED.replace('{username}', account.username)}`);
                return true;

            } catch (error) {
                lastError = error;
                this.log(`[AccountRotator] ${MESSAGES.ACCOUNT_CHANGE_ERROR
                    .replace('{username}', account.username)
                    .replace('{error}', error.message)}`);

                if (i < attempts - 1) {
                    this.log(`[AccountRotator] ${MESSAGES.TRYING_NEXT}`);
                }
            }
        }

        this.log(`[AccountRotator] ${MESSAGES.ALL_FAILED}`);
        if (lastError) {
            this.log(`[AccountRotator] Последняя ошибка: ${lastError.message}`);
        }

        return false;
    }
}

module.exports = AccountRotator;
