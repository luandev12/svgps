const Queue = require('bull');

const { imageProcess } = require('../process/imageProcess');

const renderQueue = new Queue('render_Preview', process.env.REDIS_SERVER);

exports.imagePreviewProcess = () => {
  renderQueue.process('render_Preview', async (job, done) => {
    await imageProcess(job, done);
  });
};
