import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const port = config.server.port;

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});