import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { Role, Solution } from "./enums";

export type Achievement = {
    id: Generated<number>;
    name: string;
    description: string;
    points: Generated<number>;
    creation_date: Generated<Timestamp | null>;
    modification_date: Timestamp | null;
};
export type AchievementCreator = {
    achievement_id: number;
    user_id: number;
};
export type Enigma = {
    id: Generated<number>;
    serie_id: number;
    title: string;
    image: string | null;
    description: string;
    points: Generated<number>;
    creation_date: Generated<Timestamp | null>;
    modification_date: Timestamp | null;
};
export type EnigmaCreator = {
    enigma_id: number;
    user_id: number;
};
export type EnigmaFinished = {
    enigma_id: number;
    user_id: number;
    completion_date: Generated<Timestamp | null>;
};
export type EnigmaSolution = {
    enigma_id: number;
    type: Generated<Solution>;
    solution: string;
};
export type Serie = {
    id: Generated<number>;
    title: string;
    image: string | null;
    description: string;
    points: Generated<number>;
    creation_date: Generated<Timestamp | null>;
    modification_date: Timestamp | null;
};
export type SerieCreator = {
    serie_id: number;
    user_id: number;
};
export type SerieEnigmaOrder = {
    serie_id: number;
    enigma_id: number;
    order: number;
};
export type SerieFinished = {
    serie_id: number;
    user_id: number;
    completion_date: Generated<Timestamp | null>;
};
export type Token = {
    user_id: number;
    token: string;
    is_invalid: Generated<boolean>;
    deadline: Timestamp;
};
export type User = {
    id: Generated<number>;
    name: string;
    email: string;
    password: string;
    avatar: string | null;
    role: Generated<Role>;
    verify: Generated<boolean | null>;
    last_connection: Timestamp | null;
    token: Generated<number | null>;
    token_deadline: Generated<Timestamp | null>;
    creation_date: Generated<Timestamp | null>;
    modification_date: Timestamp | null;
};
export type UserAchievement = {
    user_id: number;
    achievement_id: number;
    unlocking_date: Generated<Timestamp | null>;
};
export type UserResetPassword = {
    user_id: number;
    token: string;
    deadline: Timestamp;
};
export type DB = {
    Achievement: Achievement;
    AchievementCreator: AchievementCreator;
    Enigma: Enigma;
    EnigmaCreator: EnigmaCreator;
    EnigmaFinished: EnigmaFinished;
    EnigmaSolution: EnigmaSolution;
    Serie: Serie;
    SerieCreator: SerieCreator;
    SerieEnigmaOrder: SerieEnigmaOrder;
    SerieFinished: SerieFinished;
    Token: Token;
    User: User;
    UserAchievement: UserAchievement;
    UserResetPassword: UserResetPassword;
};
