const fabric = require('fabric').fabric;
const { get, findIndex } = require('lodash');
const { Image } = require('canvas');

const { groupBoundedOption, rectOption } = require('../constants/defaults');

const ImagePro = fabric.util.createClass(fabric.Group, {
  type: 'imagePro',
  async: true,
  lockUniScalingWithSkew: false,
  debug: true,
  version: '4.3.1',
  _okImage: false,
  maskPath: null,
  mask: null,
  _imageRect: null,
  rotationStep: 1,
  _originalStroke: null,
  _originalStrokeWidth: null,
  initialize: function (options) {
    // const img = new Image();
    // if (options.src) {
    //   img.src = options.src;
    // }
    fabric.util.loadImage(options.src, (img) => {
      img.onload = () => {
        this.optionId = options.optionId;
        this.imageLibraryId = options.imageLibraryId;
        this.src = options.src;
        if (options.angleImage) this.angleImage = options.angleImage;
        if (options.leftImage) this.leftImage = options.leftImage;
        if (options.topImage) this.topImage = options.topImage;
        if (options.widthImage) this.widthImage = options.widthImage;
        if (options.heightImage) this.heightImage = options.heightImage;

        const image = new fabric.Image(img, {
          originX: 'center',
          originY: 'center',
        });

        const rect = new fabric.Rect({
          ...rectOption,
          strokeWidth: options.borderWidth || 0,
          width: options.width || 300,
          height: options.height || 300,
        });

        this._originalStroke = rect.stroke;
        this._originalStrokeWidth = rect.strokeWidth;

        this.callSuper('initialize', [image, rect], Object.assign(options, groupBoundedOption));

        // if (this.fillArea) {
        //   console.log('filarea');
        //   console.log('width', this.width);
        //   console.log('height', this.height);

        //   if (this.width >= this.height) {
        //     this.item(0).scaleToWidth(this.widthImage || this.width);
        //   } else {
        //     this.item(0)?.scaleToHeight(this.heightImage || this.height);
        //   }
        // } else {
        //   console.log('not filarea');
        //   if (this.width >= this.height) {
        //     this.item(0)?.scaleToHeight(this.heightImage || this.height);
        //   } else {
        //     this.item(0).scaleToWidth(this.widthImage || this.width);
        //   }
        // }

        // this.item(0).left = this.leftImage || this.item(0).left || this.item(1).left;
        // this.item(0).top = this.topImage || this.item(0).left || this.item(1).top;
        // this.item(0).angle = this.angleImage || this.item(1).angle;

        this._updateMask();
        this.updateFromGroupScaling();
      };
    });
  },
  _set: function (key, value) {
    this.callSuper('_set', key, value);
    switch (key) {
      case 'src':
        this._okImage = false;
        this._setImage(this.item(0), value, () => {
          this._okImage = true;
          this._updateScaledImage();
        });
        break;
      default:
        break;
    }
  },
  _updateMask: function () {
    if (this.maskSrc) {
      const image = new Image();
      image.src = this.maskSrc;
      image.onload = async () => {
        const maskPath = new fabric.Image(image, {
          originX: 'center',
          originY: 'center',
          absolutePositioned: true,
        });
        // this._setImage(maskPath, this.maskSrc, () => {
        maskPath.scaleY = this.getScaledHeight() / maskPath.height;
        maskPath.scaleX = this.getScaledWidth() / maskPath.width;
        maskPath.top = this.top;
        maskPath.left = this.left;
        maskPath.angle = this.angle;
        maskPath.setCoords();
        this.item(0).set('clipPath', maskPath);
        this.canvas?.renderAll();
        // });
        // console.log('1', this.maskSrc)
      };
      // console.log('2', this.maskSrc)
    } else {
      const rectMask = new fabric.Rect({
        width: this.getScaledWidth(),
        height: this.getScaledHeight(),
        originX: 'center',
        originY: 'center',
        absolutePositioned: true,
        top: this.top,
        left: this.left,
        angle: this.angle,
      });
      rectMask.setCoords();
      this.item(0).set('clipPath', rectMask);
      this.canvas?.renderAll();
    }
  },
  updateFromGroupScaling: function () {
    const width = this.width * this.scaleX;
    const height = this.height * this.scaleY;
    this.scaleX = 1;
    this.scaleY = 1;
    this.setWidth(width);
    this.setHeight(height);
  },
  getWidth: function () {
    return this.width * this.scaleX;
  },
  setWidth: function (width) {
    if (!width) {
      width = 0;
    }
    this.item(1).set('width', width);
    this.set('width', width);
    this._updateScaledImage();
  },
  getHeight: function () {
    return this.height * this.scaleY;
  },
  setHeight: function (height) {
    if (!height) {
      height = 0;
    }
    this.item(1).set('height', height);
    this.set('height', height);
    this._updateScaledImage();
  },
  setWidthHeight: function (width, height) {
    if (!width) {
      width = 0;
    }
    if (!height) {
      height = 0;
    }
    this.item(1).set('width', width);
    this.set('width', width);
    this.item(1).set('height', height);
    this.set('height', height);
    this._updateScaledImage();
  },
  setImage: function (src) {
    this.set('src', src);
  },
  setRotation: function (angle) {
    this.set('angle', angle);
    this._updateMask();
    this.canvas?.renderAll();
  },
  setLeftTop: function (left, top) {
    this.set({
      top: top,
      left: left,
    });
    this._updateMask();
    this.setCoords();
    this.canvas?.renderAll();
  },
  setFillArea: function (fillArea) {
    this.set('fillArea', fillArea);
    this._updateScaledImage();
  },
  setRotationLock: function (rotationLock) {
    if (rotationLock) {
      this.set('rotationStep', 90);
    } else {
      this.set('rotationStep', 1);
    }
    this.set('rotationLock', rotationLock);
  },
  setMask: function (blob, url) {
    if (blob) {
      this.mask = blob;
    } else if (url) {
      getImageBase64(url, (base64) => {
        this.mask = base64;
        this._updateMask();
      });
    } else {
      this.mask = null;
    }
    this.set('maskSrc', url);
    this._updateMask();
    this.canvas?.renderAll();
  },
  _updateScaledImage: function () {
    if (!this._okImage) return;

    if (this.fillArea) {
      if (this.width >= this.height) {
        this.item(0).scaleToWidth(this.widthImage || this.width);
      } else {
        this.item(0)?.scaleToHeight(this.heightImage || this.height);
      }
      // const width = this.item(0).width * this.item(0).scaleX;
      // const height = this.item(0).height * this.item(0).scaleY;
      // if (width < this.width) {
      //   this.item(0).scaleToWidth(this.width);
      // } else if (height < this.height) {
      //   this.item(0)?.scaleToHeight(this.height);
      // }
    } else {
      if (this.width >= this.height) {
        this.item(0)?.scaleToHeight(this.heightImage || this.height);
      } else {
        this.item(0).scaleToWidth(this.widthImage || this.width);
      }

      // const width = this.item(0).width * this.item(0).scaleX;
      // const height = this.item(0).height * this.item(0).scaleY;
      // if (width > this.width) {
      //   this.item(0).scaleToWidth(this.width);
      // } else if (height > this.height) {
      //   this.item(0)?.scaleToHeight(this.height);
      // }
    }
    this.item(0).left = this.leftImage || this.item(0).left || this.item(1).left;
    this.item(0).top = this.topImage || this.item(0).left || this.item(1).top;
    this.item(0).angle = this.angleImage || this.item(1).angle;
    this._okImage = true;
    this._updateMask();
    this.canvas?.renderAll();
  },
  _setImage: function (obj, source, callback) {
    if (!source) {
      this._loadImage(obj, null, callback);
      obj.set('file', undefined);
      obj.set('src', '');
      return;
    }
    this._loadImage(obj, source, callback);
    obj.set('file', undefined);
    obj.set('src', source);
  },
  _loadImage: function (obj, src, callback) {
    const url = src;
    if (!url) {
      return;
    }
    fabric.util.loadImage(url, (source) => {
      if (obj.type !== 'image') {
        obj.setPatternFill(
          {
            source,
            repeat: 'repeat',
          },
          null,
        );
        obj.setCoords();
        this.canvas?.renderAll();
        callback();
        return;
      }
      obj.setElement(source);
      obj.setCoords();
      this.canvas?.renderAll();
      callback();
    });
  },
  updateCalcPostion: function (name, value) {
    if (name === 'left') {
      this.setLeftTop(value, this.top);
    }

    if (name === 'top') {
      this.setLeftTop(this.left, value);
    }

    if (name === 'width') {
      this.setWidth(value);
    }

    if (name === 'height') {
      this.setHeight(value);
    }

    if (name === 'angle') {
      this.setRotation(value);
    }

    if (name === 'elementId') this.elementId = value;

    if (name === 'optionId') this.optionId = value;

    if (name === 'imageLibraryId') this.imageLibraryId = value;

    this.canvas?.renderAll();
  },
  __updateView: function () {
    this.visible = !this.visible;
    // this.addImageToRect();
    this.canvas.renderAll.bind(this.canvas);
    this.canvas?.renderAll();
  },

  __updateLock: function () {
    this.selectable = !this.selectable;
    this.evented = !this.evented;

    // this.addImageToRect();
    this.canvas.renderAll.bind(this.canvas);
    this.canvas?.renderAll();
  },
  countStepForward: function () {
    let step = 0;
    const objects = this.canvas.getObjects();
    const indexThis = findIndex(objects, { id: this.id });
    let i = indexThis + 1;
    const length = objects.length;
    // let count = 0
    while (i < length) {
      step++;
      if (objects[i].id) {
        return step;
      }
      i++;
    }
    return step;
  },
  countStepBackward: function () {
    let step = 0;
    const objects = this.canvas.getObjects();
    const indexThis = findIndex(objects, { id: this.id });
    let i = indexThis - 1;
    let count = 0;
    while (i >= 1) {
      if (objects[i].id) {
        count++;
      }

      if (count === 1) {
        step++;
      } else {
        if (count === 2) {
          return step;
        }
      }
      i--;
    }

    return step;
  },
  setZIndex: function (name) {
    if (name === 'forward') {
      const stepForward = this.countStepForward();
      for (let i = 0; i < stepForward; i++) {
        this.canvas.bringForward(this);
      }
    } else {
      const stepBackward = this.countStepBackward();

      for (let i = 0; i < stepBackward; i++) {
        this.canvas.sendBackwards(this);
      }
    }
    this.canvas?.renderAll();
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      container: this.get('container'),
      editable: this.get('editable'),
      objects: null,
      elementId: this.elementId,
      src: this.src,
      maskSrc: this.maskSrc,
      fillArea: this.fillArea,
      rotationStep: this.rotationStep,
      rotationLock: this.rotationLock,
      id: this.id,
      name: this.name,
      step: this.step,
      optionId: this.optionId,
      imageLibraryId: this.imageLibraryId,
    });
  },
});

ImagePro.fromObject = (options, callback) => {
  return callback(new ImagePro(options));
};

fabric.ImagePro = ImagePro;
