import { getDateAndTime } from "./lib/utils";
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
export async function sndMsgConsole(logPage, logFunction, logMessage, logType = 0, logBrowser = false, logDebug = false, slackHook = "") {
    let operatingSystem = "UNKNOWN";
    let browserName = "UNKNOWN";
    try {
        if (logBrowser) {
            // Get user's operating system (only OS name)
            operatingSystem = window.navigator.platform;
            // Get user's browser
            browserName = window.navigator.appCodeName;
        }
    }
    catch {
        // Defaults are already set
    }
    // Create log message
    const shortLogMessage = `[${logPage}]_[${logFunction}]_msg: ${logMessage}`;
    const detailedLogMessage = `${getDateAndTime()}_${operatingSystem}_${browserName}_${shortLogMessage}`;
    switch (logType) {
        case 1:
            console.error(shortLogMessage);
            if (slackHook !== "") {
                await sndMsgSlack(detailedLogMessage, slackHook);
            }
            await sndMsgApi(detailedLogMessage, logType, logDebug);
            break;
        case 2:
            console.warn(shortLogMessage);
            if (logDebug) {
                if (slackHook !== "") {
                    await sndMsgSlack(detailedLogMessage, slackHook);
                }
                await sndMsgApi(detailedLogMessage, logType, logDebug);
            }
            break;
        case 3:
            console.log(shortLogMessage);
            if (logDebug) {
                if (slackHook !== "") {
                    await sndMsgSlack(detailedLogMessage, slackHook);
                }
                await sndMsgApi(detailedLogMessage, logType, logDebug);
            }
            break;
        default:
            console.log(shortLogMessage);
            if (logDebug) {
                if (slackHook !== "") {
                    await sndMsgSlack(detailedLogMessage, slackHook);
                }
                await sndMsgApi(detailedLogMessage, logType, logDebug);
            }
            break;
    }
}
/**
 * Posts a log message to the API if the log type and mode dictate it
 * @param {string} logMessage - The log message to post
 * @param {number} logType - The type of log message (1 = regular, 2 = error, 3 = critical error, 4 = warning)
 * @param {boolean} logDebug - The debug level (0 = off, 1 = on)
 */
export async function sndMsgApi(logMessage, logType, logDebug) {
    try {
        // Check which log mode is set
        const shouldLog = logType === 1 || (logType === 2 && logDebug) || (logType === 3 && logDebug);
        if (shouldLog) {
            // Create log object
            const logObject = {
                logData: logMessage,
                logMode: logType,
                logDebug: logDebug
            };
            // Post log message to API
            const response = await postToApi("v0/logging", logObject);
            // Handle any errors
            if (response.error) {
                console.error(response.error);
            }
        }
    }
    catch (error) {
        console.error("[sndMsgApi] Error sending log message to API: ", error);
    }
}
/**
 * Posts a message to a Slack channel using a Webhook URL
 * @param {string} message - The message to post to the Slack channel
 * @param {string} slackHook - The Slack Webhook URL to use
 * @returns {Promise<void>} - A Promise that resolves when the message is posted
 */
export async function sndMsgSlack(message, slackHook) {
    try {
        const slackURL = slackHook;
        const payload = { text: message };
        await fetch(slackURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    }
    catch (error) {
        console.error("[sndMsgSlack] Error sending log message to Slack: ", error);
    }
}
/**
 * Posts data to the specified API endpoint
 * @param {string} endpoint - The API endpoint to post to
 * @param {any} data - The data to post
 * @returns {Promise<any>} - A Promise that resolves with the response from the API, or null if an error occurs
 */
async function postToApi(endpoint, data) {
    try {
        const url = "https://api.instantwms.com/" + endpoint;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return await response.json();
    }
    catch (error) {
        console.error("[postToApi] Error posting log message to API: ", error);
    }
}
