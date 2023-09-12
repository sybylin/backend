/**
 * ##_0##: Error code
 * ##_1##: Success code
 */

const list: {
	[key: string]: Record<string, string>;
} = {
	general: {
		GE_001: 'Internal server error, contact the administrator',
		GE_002: 'Mail system failed, contact the administrator',
		GE_003: 'Account creation failed, contact administrator'
	},
	request: {
		RE_001: 'Request body is empty',
		RE_002: 'Key is not present in the request body or is empty'
	},
	jwt: {
		JW_001: 'jwt is invalid',
		JW_002: 'User linked to the jwt does not have the necessary rights',
		JW_101: 'User linked to the jwt have the necessary rights'
	},

	/// Modules
	user: {
		US_001: 'User not exist in the database',
		US_002: 'Incorrect password',
		US_003: 'This account is already verified',
		US_004: 'Email normalize failed',
		US_005: 'Email is invalid',
		US_006: 'An account already exists with this username',
		US_007: 'An account already exists with this email address',
		US_008: 'Token is malformed',
		US_009: 'Token is expired, please repeat the process',
		US_010: 'Token is invalid',
		US_011: 'Token deadline not exist',
		US_020: 'Password reset initialization failed',
		US_021: 'Passwords aren\'t the same',
		US_022: 'Reset link does not exist or is no longer valid',

		US_101: 'User has been successfully authenticated',
		US_102: 'Verification is awaiting a response',
		US_103: 'Account verification is successful',
		US_104: 'Account has been created',
		US_105: 'Account update success',
		US_106: 'Account is deleted',
		US_107: 'User exist',
		US_108: 'User is recognized',
		US_120: 'Password reset initialization started',
		US_121: 'Password reset successful',
		US_122: 'Role is updated'
	},
	enigma: {
		EN_001: 'Incorrect id',
		EN_002: 'Incorrect enigma and/or user id',

		EN_101: 'Enigma',
		EN_102: 'Enigmas',
		EN_103: 'Enigma finished',
		EN_104: 'Enigma solution'
	}
};

export default list;
