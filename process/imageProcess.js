const HFont = require('../canvas/utils/HFont');
const fabric = require('fabric').fabric;
const fs = require('fs');

const { registerFont, createCanvas } = require('canvas');

const { pushImgS3 } = require('../utils/uploadS3');
const { Image } = require('canvas');

// require('../canvas/objects/BackgroundPro');
require('../canvas/objects/ImagePro');
require('../canvas/objects/DynamicImagePro');
require('../canvas/objects/BoundedText');
require('../canvas/objects/MapBox');

exports.imageProcess = async (job, done) => {
  try {
    //initialize canvas
    const canvas = new fabric.StaticCanvas(null, {
      allowTouchScrolling: true,
      renderOnAddRemove: true,
    });

    const BackgroundPro = fabric.util.createClass(fabric.Rect, {
      type: 'backgroundPro',
      text: null,
      textbox: false,
      textOffsetLeft: 0,
      textOffsetTop: 0,
      _prevObjectStacking: null,
      _prevAngle: 0,
      textHeight: 0,
      textWidth: 0,
      image: null,
      imageSelected: false,
      rangeLeft: 0,
      rangeTop: 0,
      rangeAngle: 0,
      addImageToRectInit: null,
      previousAngle: null,
      elementId: 1,

      initialize(rectOptions) {
        rectOptions || (rectOptions = {});

        this.on('added', () => {
          let imgSrc =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';
          const center = this.canvas.getCenter();
          // this.top = center.top;
          // this.left = center.left;
          if (rectOptions.src) {
            imgSrc = rectOptions.src;
          }
          fabric.Image.fromURL(imgSrc, (myImg) => {
            if (rectOptions.src) {
              myImg.set({
                originX: 'center',
                originY: 'center',
                width: myImg.width,
                height: myImg.height,
                crossOrigin: 'anonymous',
              });

              if (myImg.width >= myImg.height) {
                this.canvas.setViewportTransform([
                  this.canvas.width / myImg.width, // scaleX
                  0, // skewX
                  0, //skewY
                  this.canvas.width / myImg.width, // scaleY
                  center.left,
                  center.top,
                ]);
              } else {
                this.canvas.setViewportTransform([
                  this.canvas.height / myImg.height,
                  0,
                  0,
                  this.canvas.height / myImg.height,
                  center.left,
                  center.top,
                ]);
              }
            } else {
              myImg.set({
                originX: 'center',
                originY: 'center',
                width: rectOptions.width || 1181.1,
                height: rectOptions.height || 1181.1,
                crossOrigin: 'anonymous',
              });

              var filter = new fabric.Image.filters.BlendColor({
                color: rectOptions.fill || '#fff',
                mode: 'tint',
              });
              myImg.filters.push(filter);
              myImg.applyFilters();

              if (myImg.width < myImg.height) {
                this.canvas.setViewportTransform([
                  this.canvas.width / myImg.width,
                  0,
                  0,
                  this.canvas.width / myImg.width,
                  center.left,
                  center.top,
                ]);
              } else {
                this.canvas.setViewportTransform([
                  this.canvas.height / myImg.height,
                  0,
                  0,
                  this.canvas.height / myImg.height,
                  center.left,
                  center.top,
                ]);
              }
            }

            const loadImage = rectOptions.urls.map((item) => {
              return new Promise((res, rej) => {
                let image = new Image();
                image.onload = () => {
                  res(true);
                };

                image.onerror = () => {
                  rej(false);
                };

                image.src = item;
              });
            });

            Promise.all(loadImage)
              .then(() => {
                pushImgS3(this.canvas, rectOptions.uuid, rectOptions.formatImg, rectOptions, done);
              })
              .catch((err) => {
                console.log(err, 'error upload to S3');
              });

            this.canvas.setBackgroundImage(myImg, this.canvas.renderAll.bind(this.canvas));
          });
        });
      },

      // render
      _render(ctx) {
        this.callSuper('_render', ctx);
        ctx.save();
      },
    });

    BackgroundPro.fromObject = (options, callback) => {
      return callback(new BackgroundPro(options));
    };

    fabric.BackgroundPro = BackgroundPro;

    const { mapId, objects } = job.data;
    const formatImg = 'png';
    const parseObjs = [...objects];

    const arrFontFilter = parseObjs.filter(
      (v, i, arr) => arr.findIndex((t) => t.fontFamily === v.fontFamily) === i,
    );
    const arrFont = [];

    await Promise.all(
      arrFontFilter.map(async (item) => {
        if (item.type === 'textBoxPro') {
          const fontFamily = item.fontUrl.split('/').pop();
          const typeFont = fontFamily.split('.').pop();
          const date = Math.floor(Math.random() * (Date.now() - 0 + 1) + 0);
          const fontFamilyFormat = `${fontFamily}-${date}.${typeFont}`;
          // await HFont.loadSync(item.fontFamily, item.fontUrl, fontFamilyFormat);
          registerFont(item.fontUrl, { family: item.fontFamily });

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
          currentValueFirst.uuid = mapId;
          currentValueFirst.data = JSON.stringify(job.data);
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
          dataUrls.push(item.src);
          break;

        case 'mapBoxPro':
          dataUrls.push(item.src);
          dataUrls.push(item.maskSrc);
          dataUrls.push(item.markerImage);
          break;

        case 'backgroundPro':
          if (item.src) dataUrls.push(item.src);
          break;

        case 'imagePro':
          dataUrls.push(item.src);
          dataUrls.push(item.maskSrc);

          break;

        default:
          break;
      }
    });

    const dataUrlsTran = dataUrls
      .filter((url) => url !== undefined)
      .filter((url) => url.indexOf('blob') === -1);

    objsConvert[0].urls = dataUrlsTran;

    const json = JSON.stringify({ objects: objsConvert });
    //load json

    canvas.clear();

    canvas.loadFromJSON(json, () => {});

    const object = objects.find((item) => item.type === 'backgroundPro');

    if (object.typeCanvas) {
      const PreviewsUrl = `https://${process.env.BUCKET_NAME_PROD}/${mapId}.${formatImg}`;
      console.log({ data: PreviewsUrl, message: 'export link image successfully!' });
    } else {
      const ProductionUrl = `https://${process.env.BUCKET_NAME}/${mapId}.${formatImg}`;
      console.log({ data: ProductionUrl, message: 'export link image successfully!' });
    }
  } catch (error) {
    const { objects } = job.data;
    const object = objects.find((item) => item.type === 'backgroundPro');

    // log error
    console.log(error, 'error objects json');
  }
};
