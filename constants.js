const PLUGIN_OWNER_ID = 'plugin:account-rotator';

const MESSAGES = {
    STARTED: 'Ротация аккаунтов запущена. Режим: {mode}, интервал: {interval} мин',
    STOPPED: 'Ротация аккаунтов остановлена',
    ACCOUNT_CHANGED: 'Аккаунт изменён на: {username}',
    ACCOUNT_CHANGE_ERROR: 'Ошибка смены аккаунта {username}: {error}',
    NO_ACCOUNTS: 'Список аккаунтов пуст. Добавьте аккаунты в настройках.',
    INVALID_FORMAT: 'Неверный формат аккаунта: {account}. Используйте формат username:password',
    TRYING_NEXT: 'Попытка использовать следующий аккаунт...',
    ALL_FAILED: 'Не удалось подключиться ни с одним аккаунтом из списка',
};

module.exports = {
    PLUGIN_OWNER_ID,
    MESSAGES,
};
