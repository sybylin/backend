export type token = Record<'token' | 'xsrf' | 'remember', string | boolean>;
export type tokenContent = Record<'id' | 'name' | 'xsrfToken', string | number>

export enum jwtToken {
	unauthorized = 1,
	forceLogout,
	noUser,
	invalidToken
}
