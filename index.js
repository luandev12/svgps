const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const axios = require('axios');
const FileUpload = require('express-fileupload');

const port = 8080;

const app = express();
const fileUpload = {
  limits: { fileSize: 50 * 1024 * 1024 },
};

app.use(cors());
app.use(FileUpload(fileUpload));

app.post('/svg/:type', async (req, res) => {
  const { type } = req.params;
  const files = req.files.file;
  const url = `https://vector.express/api/v2/public/convert/svg/librsvg`;

  if (type === 'ps' || type === 'eps' || type === 'pdf') {
    axios({
      url: `${url}/${type}`,
      method: 'POST',
      data: files.data,
    })
      .then(({ data }) => {
        res.json({
          id: data.id,
          inputUrl: data.inputUrl,
          resultUrl: data.resultUrl,
          time: data.time,
          format: data.format,
        });
      })
      .catch((err) => {
        console.log(err.response);
        res.status(400).json({ message: 'error' });
      });
  }

  if (type === 'all') {
    const types = ['pdf', 'ps', 'eps'];
    const result = [];

    for (const type of types) {
      await axios({
        url: `${url}/${type}`,
        method: 'POST',
        data: files.data,
      })
        .then(async ({ data }) => {
          await result.push({
            id: data.id,
            inputUrl: data.inputUrl,
            resultUrl: data.resultUrl,
            time: data.time,
            format: data.format,
          });
        })
        .catch((err) => {
          console.log(err.response);
          res.status(400).json({ message: 'error' });
        });
    }

    res.status(200).json(result);
  }
});

app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ type: '*/*', limit: '50mb' }));

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports.server = serverless(app);
