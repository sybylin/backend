import { Router } from 'express';
import info from 'routes/defaultResponse';

export default Router()
	.all('/', (_req, res) => {
		res.send(info());
	});
