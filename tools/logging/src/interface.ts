export const authFields = [
    'slack_hook'
] as const

export type authFields = typeof authFields[number]