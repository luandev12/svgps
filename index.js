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

app.post('/svg/:type', (req, res) => {
  const { type } = req.params;
  const files = req.files.file;
  const url = `https://vector.express/api/v2/public/convert/svg/librsvg`;

  if (type === 'ps' || type === 'eps') {
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
      });
  }
});

app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ type: '*/*', limit: '50mb' }));

app.listen(port, () => console.log(`App listening on port ${port}!`));

module.exports.server = serverless(app);
