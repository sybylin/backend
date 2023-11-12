export const Role = {
    USER: "USER",
    MODERATOR: "MODERATOR",
    ADMINISTRATOR: "ADMINISTRATOR"
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export const SeriesStatus = {
    UNPUBLISHED: "UNPUBLISHED",
    PENDING: "PENDING",
    PUBLISHED: "PUBLISHED"
} as const;
export type SeriesStatus = (typeof SeriesStatus)[keyof typeof SeriesStatus];
export const Solution = {
    STRING: "STRING",
    ARRAY: "ARRAY",
    OBJECT: "OBJECT"
} as const;
export type Solution = (typeof Solution)[keyof typeof Solution];
