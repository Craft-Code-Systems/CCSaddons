
export interface funcResponse<T = any> {
    status: 'OK' | 'ERROR';
    data?: T;
    error?: string;
}

export const authFields = [
    'uri'
] as const

export type authFields = typeof authFields[number]