const fabric = require('fabric').fabric;
const Queue = require('bull');

const { pushImgS3 } = require('../../utils/uploadS3');
const { Image } = require('canvas');

const renderQueue = new Queue('render_Preview', process.env.REDIS_SERVER);
const renderQueueProd = new Queue('render_Production', process.env.REDIS_SERVER);

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
            pushImgS3(this.canvas, rectOptions.uuid, rectOptions.formatImg, rectOptions);
          })
          .catch((err) => {
            console.log('error upload to S3');
            // requeue if error
            if (rectOptions.typeCanvas) {
              renderQueueProd.add('render_Production', JSON.parse(rectOptions.data), {
                delay: 5000,
                attempts: 5,
                backoff: 2,
                removeOnComplete: false,
              });
            } else {
              renderQueue.add('render_Preview', JSON.parse(rectOptions.data), {
                delay: 2000,
                attempts: 5,
                backoff: 2,
                removeOnComplete: false,
              });
            }
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
