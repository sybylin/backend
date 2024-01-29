/**
 * ##_0##: Error code
 * ##_1##: Success code
 */

const list: {
	[key: string]: Record<string, string>;
} = {
	general: {
		GE_001: 'Erreur interne du serveur, contactez l\'administrateur',
		GE_002: 'Échec du système de messagerie, contactez l\'administrateur',
		GE_003: 'La création du compte a échoué, contactez l\'administrateur'
	},
	request: {
		RE_001: 'Le corps de la requête est vide',
		RE_002: 'La clé n\'est pas présente dans le corps de la requête ou est vide',
		RE_003: 'La clé n\'est pas présente dans les paramètres',
		RE_004: 'Aucun fichier n\'est présent dans la requête',
		RE_005: 'Aucun fichiers ne sont présent dans la requête',
		RE_006: 'Le type de fichier n\'est pas autorisé'
	},
	jwt: {
		JW_001: 'jwt est invalide',
		JW_002: 'L\'utilisateur lié au jwt n\'a pas les droits nécessaires',
		JW_101: 'L\'utilisateur lié au jwt dispose des droits nécessaires'
	},
	captcha: {
		CA_001: 'Le Captcha est invalide',
		CA_101: 'Le Captcha est valide'
	},

	/// Modules
	achievement: {
		AC_001: 'Ce succès n\'existe pas',

		AC_101: 'Le succès a été ajouté',
		AC_102: 'L\'utilisateur a ce succès',
		AC_103: 'L\'utilisateur n\'a pas ce succès'
	},
	series: {
		SE_001: 'Une série existe déjà sous ce nom',
		SE_002: 'La création d\'une série a échoué, contacter l\'administrateur',
		SE_003: 'L\'utilisateur n\'a pas les droits nécessaires pour éditer cette série',
		SE_004: 'La série est en vérification ou publiée, les modifications sont interdit',

		SE_101: 'La série a été créée',
		SE_102: 'La série a été mise à jour',
		SE_103: 'L\'image de la série a été mise à jour'
	},
	user: {
		US_001: 'Utilisateur inexistant dans la base de données',
		US_002: 'Mot de passe incorrect',
		US_003: 'Ce compte est déjà vérifié',
		US_004: 'La normalisation de l\'email à échoué',
		US_005: 'L\'email n\'est pas valide',
		US_006: 'Un compte existe déjà avec ce nom d\'utilisateur',
		US_007: 'Un compte existe déjà avec cette adresse email',
		US_008: 'Le jeton est malformé',
		US_009: 'Le jeton a expiré, veuillez répéter le processus',
		US_010: 'Le jeton n\'est pas valide',
		US_011: 'La limite de jeton n\'existe pas',
		US_012: 'Le mot de passe est malformé',
		US_020: 'L\'initialisation de la réinitialisation du mot de passe a échoué',
		US_021: 'Les mots de passe sont différents',
		US_022: 'Le lien de réinitialisation n\'existe pas ou n\'est plus valide',
		US_030: 'Vous ne pouvez pas changer votre propre rôle',
		US_031: 'Ce nom d\'utilisateur ne peut pas être utilisé',

		US_101: 'L\'utilisateur a été authentifié avec succès',
		US_102: 'La vérification est en attente d\'une réponse',
		US_103: 'La vérification du compte a réussi',
		US_104: 'Le compte a été créé',
		US_105: 'La mise à jour du compte est réussie',
		US_106: 'Le compte est supprimé',
		US_107: 'L\'utilisateur existe',
		US_108: 'L\'utilisateur a été reconnu',
		US_120: 'L\'initialisation de la réinitialisation du mot de passe a commencé',
		US_122: 'Le rôle est mis à jour',
		US_131: 'Liste d\'utilisateurs'
	},
	enigma: {
		EN_001: 'Identifiant incorrect',
		EN_002: 'Énigma ou utilisateur incorrect',

		EN_101: 'Énigme',
		EN_102: 'Énigmes',
		EN_103: 'Énigme fini',
		EN_104: 'Solution de l\'énigme'
	}
};

export default list;
