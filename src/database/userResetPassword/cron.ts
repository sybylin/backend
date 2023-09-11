import { CronJob } from 'cron';
import UserResetPassword from './controller';

const removeUselessToken = new CronJob(
	'0 */12 * * *',
	() => UserResetPassword.deletePassedToken()
);

removeUselessToken.start();
