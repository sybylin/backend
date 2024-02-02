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
		RE_002: 'Key is not present in the request body or is empty',
		RE_003: 'Key is not present in the params',
		RE_004: 'No file is present in the request',
		RE_005: 'No files are present in the request',
		RE_006: 'The file type is not authorized',
		RE_007: 'Request params is empty',
		RE_008: 'Request querys is empty',
		RE_009: 'Key is not present in the querys',
	},
	jwt: {
		JW_001: 'jwt is invalid',
		JW_002: 'User linked to the jwt does not have the necessary rights',
		JW_101: 'User linked to the jwt have the necessary rights'
	},
	captcha: {
		CA_001: 'Captcha is invalid',
		CA_101: 'Captcha is valid'
	},

	/// Modules
	achievement: {
		AC_001: 'This achievement not exist',

		AC_101: 'Achievement has been added',
		AC_102: 'User has this achievement',
		AC_103: 'User does not have this achievement'
	},
	series: {
		SE_001: 'A serie already exists with this name',
		SE_002: 'Serie creation failed, contact administrator',
		SE_003: 'User does not have the necessary rights to edit this serie',
		SE_004: 'Serie is pending or published, edition is forbidden',

		SE_101: 'Serie has been created',
		SE_102: 'Serie has been updated',
		SE_103: 'Serie image has been updated',
		SE_104: 'Serie has been deleted'
	},
	user: {
		US_001: 'User not exist in the database',
		US_002: 'Incorrect password',
		US_003: 'This account is already verified',
		US_004: 'Email normalize failed',
		US_005: 'Email is invalid',
		US_006: 'A account already exists with this username',
		US_007: 'A account already exists with this email address',
		US_008: 'Token is malformed',
		US_009: 'Token is expired, please repeat the process',
		US_010: 'Token is invalid',
		US_011: 'Token deadline not exist',
		US_012: 'Password is malformed',
		US_020: 'Password reset initialization failed',
		US_021: 'Passwords aren\'t the same',
		US_022: 'Reset link does not exist or is no longer valid',
		US_030: 'You cannot change your own role',
		US_031: 'This user name cannot be used',

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
		US_122: 'Role is updated',
		US_131: 'Users list'
	},
	enigma: {
		EN_001: 'Incorrect id',
		EN_002: 'Incorrect enigma and/or user id',
		EN_003: 'Enigma creation failed',
		EN_004: 'A enigma already exists with this name',
		EN_005: 'User does not have the necessary rights to edit this enigma',

		EN_101: 'Enigma',
		EN_102: 'Enigmas',
		EN_103: 'Enigma finished',
		EN_104: 'Enigma solution',
		EN_105: 'User have the necessary rights to edit this enigma',
	},
	report: {
		RP_001: 'Report creation failed',
		RP_101: 'Report has been created',
		RP_102: 'Report list',
		RP_103: 'Report has been updated'
	}
};

export default list;
