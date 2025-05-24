/**
 * Sends a log message to the console, with optional browser information,
 * and posts it to an API if specified.
 *
 * @param {string} logPage - The page or component where the log originates.
 * @param {string | number} [logFunction] - The function or operation associated with the log.
 * @param {string | number} [logMessage] - The message or data to be logged.
 * @param {number} [logType=0] - The type of log message (1 = critical, 2 = warning, 3 = info).
 * @param {boolean} [logBrowser=false] - Flag to determine if browser information should be included.
 */
export declare function sndMsgConsole(logPage: string, logFunction?: string | number, logMessage?: string | number, logType?: number, logBrowser?: boolean, logDebug?: boolean, slackHook?: string): Promise<void>;
/**
 * Posts a log message to the API if the log type and mode dictate it
 * @param {string} logMessage - The log message to post
 * @param {number} logType - The type of log message (1 = regular, 2 = error, 3 = critical error, 4 = warning)
 * @param {boolean} logDebug - The debug level (0 = off, 1 = on)
 */
export declare function sndMsgApi(logMessage: string, logType: number, logDebug: boolean): Promise<void>;
/**
 * Posts a message to a Slack channel using a Webhook URL
 * @param {string} message - The message to post to the Slack channel
 * @param {string} slackHook - The Slack Webhook URL to use
 * @returns {Promise<void>} - A Promise that resolves when the message is posted
 */
export declare function sndMsgSlack(message: string, slackHook: string): Promise<void>;
