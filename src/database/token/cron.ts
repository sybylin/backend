import { CronJob } from 'cron';
import TokenController from './controller';

const removeUselessToken = new CronJob(
	'0 */12 * * *',
	() => TokenController.deletePassedToken()
);

removeUselessToken.start();
