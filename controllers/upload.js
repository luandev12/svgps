const AWS = require('aws-sdk');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS,
  region: 'ap-southeast-1',
});

exports.UploadMedia = (req, res) => {
  const file = req.files.file;
  const { f } = req.params;
  const cdn = process.env.CDN;

  const bucket = () => {
    if (f === 'a') return `${cdn}/husblizer/app`;
    if (f === 'c') return `${cdn}/husblizer/customer`;
    if (f === 'f') return `${cdn}/husblizer/font`;
    if (f === 't') return `${cdn}/husblizer/template`;
    if (f === 'r-preview') return `${cdn}/husblizer/render/preview`;
    if (f === 'r-products') return `${cdn}/husblizer/render/products`;
  };

  const params = {
    Bucket: bucket(),
    Key: file.name + '-' + Date.now() + path.extname(file.name),
    Body: file.data,
    ContentType: file.mimetype,
    // ACL: 'public-read',
  };

  s3.upload(params, (err, data) => {
    if (err) {
      return res.status(500).json({ error: true, Message: err });
    } else {
      const result = {
        src: `https://${cdn}/${data.Key}`,
      };
      return res.status(200).json(result);
    }
  });
};
