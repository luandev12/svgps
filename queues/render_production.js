const Queue = require('bull');

const { imageProcess } = require('../process/imageProcess');

const renderQueue = new Queue('render_Production', process.env.REDIS_SERVER);

exports.imageProductionProcess = () => {
  renderQueue.process('render_Production', async (job, done) => {
    await imageProcess(job, done);
  });
};
