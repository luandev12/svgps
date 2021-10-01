require('dotenv').config();
const express = require('express');
const cors = require('cors');
const FileUpload = require('express-fileupload');
const morgan = require('morgan');
const cluster = require('cluster');

const os = require('os').cpus().length;
const numCluster = os;
const PORT = 8081;
const app = express();

const router = require('./routers');

const fileUpload = {
  limits: { fileSize: 50 * 1024 * 500024 },
};

if (cluster.isMaster) {
  for (let i = 0; i < numCluster; i++) {
    cluster.fork();
    console.log(`The Worker number: ${i + 1} is alive`);
  }
  cluster.on('exit', (worker) => {
    console.log(`The Worker number: ${worker.id} has died`);
    cluster.fork();
  });
} else {
  app.use(cors({ credentials: true, origin: true, exposedHeaders: '*' }));
  app.use(FileUpload(fileUpload));
  app.use(morgan('dev'));

  app.use(express.urlencoded({ extended: false, limit: '50mb' }));
  app.use(express.json({ type: '*/*', limit: '50mb' }));

  app.use('/api', router);
  app.get('/a', (req, res) => {
    console.log(`Worker ${process.pid} started`);
    res.send('Hello World!, This is Render Server!');
  });

  app.listen(PORT, () => {
    console.log(`Worker ${process.pid} started`);
    console.log(`Timezones by location application is running on port ${PORT}.`);
  });
}
