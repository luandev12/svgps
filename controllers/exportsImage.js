const { get } = require('lodash');
const { v4: uuidv4 } = require('uuid');
const HFont = require('../canvas/utils/HFont');
const fabric = require('fabric').fabric;
const fs = require('fs');
const https = require('https');
const AWS = require('aws-sdk');
//initialize S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS,
  region: 'ap-southeast-1',
});

require('../canvas/objects/BackgroundPro');
require('../canvas/objects/ImagePro');
require('../canvas/objects/DynamicImagePro');
require('../canvas/objects/BoundedText');
require('../canvas/objects/MapBox');

exports.exportImage = async (req, res, next) => {
  try {
    //initialize canvas
    const canvas = new fabric.Canvas(null, {
      allowTouchScrolling: true,
      renderOnAddRemove: true,
    });
    const uuid = res.locals.mapId || uuidv4();

    const { canvasObject } = res.locals;
    const formatImg = canvasObject ? 'png' : 'png';

    const parseObjs = canvasObject ? canvasObject : get(req.body, 'objects', null);
    const arrFont = [];
    await Promise.all(
      parseObjs.map(async (item) => {
        if (item.type == 'textBoxPro') {
          const fontFamily = item.fontUrl.split('/').pop();
          const typeFont = fontFamily.split('.').pop();
          const date = Math.floor(Math.random() * (Date.now() - 0 + 1) + 0);
          const fontFamilyFormat = `${fontFamily}-${date}.${typeFont}`;
          await HFont.loadSync(item.fontFamily, item.fontUrl, fontFamilyFormat);
          arrFont.push(fontFamilyFormat);
        }
      }),
    );
    //delete font
    arrFont.map((fontFamily) => {
      if (fs.existsSync(fontFamily)) {
        fs.unlink(fontFamily, () => {});
      }
    });
    const objsConvert = Object.values(
      parseObjs.reduce((accumulatorFirst, currentValueFirst, index, array) => {
        let type = currentValueFirst.type;
        if (type == 'backgroundPro') {
          canvas.width = currentValueFirst.width;
          canvas.height = currentValueFirst.height;
          currentValueFirst.uuid = uuid;
          currentValueFirst.formatImg = formatImg;
        }
        accumulatorFirst[type] = accumulatorFirst[type] || [];
        accumulatorFirst[type].push(currentValueFirst);

        return accumulatorFirst;
      }, {}),
    ).reduce(
      (accumulatorSecond, currentValueSecond) =>
        currentValueSecond.length > 0
          ? accumulatorSecond.concat(currentValueSecond)
          : accumulatorSecond,
      [],
    );
    const dataUrls = [];
    objsConvert.forEach((item) => {
      switch (item.type) {
        case 'dynamicImagePro':
          item.src && dataUrls.push(item.src);
          break;

        case 'mapBoxPro':
          item.src && dataUrls.push(item.src);
          item.maskSrc && dataUrls.push(item.maskSrc);
          item.markerImage && dataUrls.push(item.markerImage);
          break;

        case 'backgroundPro':
          if (item.src) dataUrls.push(item.src);
          break;

        case 'imagePro':
          item.src && dataUrls.push(item.src);
          item.maskSrc && dataUrls.push(item.maskSrc);

          break;

        default:
          break;
      }
    });
    objsConvert[0].urls = dataUrls;
    const json = JSON.stringify({ objects: objsConvert });
    //load json
    canvas.loadFromJSON(json, () => {});

    const PreviewsUrl = canvasObject
      ? `https://${process.env.BUCKET_NAME_PROD}/${uuid}.${formatImg}`
      : `https://${process.env.BUCKET_NAME}/${uuid}.${formatImg}`;

    res.locals.url = PreviewsUrl;

    if (req.body.key) {
      next();
    } else {
      if (canvasObject) {
        next();
      } else {
        res.status(200).json({ data: PreviewsUrl, message: 'export image successfully!' });
      }
    }
  } catch (error) {
    next(error);
  }
};

exports.exportBase64 = async (req, res, next) => {
  const url = res.locals.url;
  const key = url.split('/').pop();
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  };
  try {
    const data = await checkUrlExist(url, params);
    return res.status(data.code).json(data);
  } catch (error) {
    next(error);
  }
};

const checkUrlExist = async (url, params) => {
  let jsonTemp;
  const urlTemp = url,
    paramsTemp = params;

  return new Promise((resolve, reject) => {
    s3.headObject(paramsTemp, async (err, data) => {
      if (err) {
        const dataTemp = await checkUrlExist(urlTemp, paramsTemp);
        if (dataTemp) {
          https.get(url, function (response) {
            if (response.statusCode !== 200) {
              reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
              return;
            }

            response.setEncoding('base64');
            let body = 'data:' + response.headers['content-type'] + ';base64,';
            response.on('data', (data) => {
              body += data;
            });
            response.on('end', async () => {
              try {
                await s3.deleteObject(params).promise();
                jsonTemp = { code: 200, data: body, message: 'export base64 successfully!' };
                resolve(jsonTemp);
              } catch (err) {
                console.log('ERROR in file Deleting : ' + JSON.stringify(err));
                jsonTemp = { code: 500, messsage: 'ERROR in file Deleting' };
                resolve(jsonTemp);
              }
            });
          });
        }
      } else {
        resolve(data);
      }
    });
  });
};
