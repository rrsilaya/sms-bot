import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

import { logger } from './util';

dotenv.config();
const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 8000;
app.listen(port, () => {
  logger(`Bot is running at port ${port}`, 'SERVER');
});