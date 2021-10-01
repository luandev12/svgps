const AWS = require('aws-sdk');

//initialize S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS,
  region: 'ap-southeast-1',
});

exports.pushImgS3 = (canvasBase, uuid, formatImg, rectOptions, done) => {
  //convert img to base64
  const stringBase64 = canvasBase.toDataURL({ format: formatImg });
  //convert base64 to File
  const base64Data = Buffer.from(stringBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  //info image
  const type = stringBase64.split(';')[0].split('/')[1];
  const nameImg = `${uuid}.${type}`;

  //push image to S3
  var data = {
    Bucket: rectOptions?.typeCanvas ? process.env.BUCKET_NAME_PROD : process.env.BUCKET_NAME,
    Key: nameImg,
    Body: base64Data,
    ContentEncoding: 'base64',
    ContentType: `image/${type}`,
  };

  s3.putObject(data, function (err, data) {
    if (err) {
      console.log(err);
      console.log('Error uploading data: ', data);
    } else {
      console.log(
        `https://${
          rectOptions?.typeCanvas ? process.env.BUCKET_NAME_PROD : process.env.BUCKET_NAME
        }/${uuid}.${type}`,
      );
      console.log('successfully uploaded the image!');
      done(null);
    }
  });
};
