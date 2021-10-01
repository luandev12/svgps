const fabric = require('fabric').fabric;
const { findIndex } = require('lodash');
const { Image } = require('canvas');

const { groupBoundedOption } = require('../constants/defaults');

const DynamicImagePro = fabric.util.createClass(fabric.Group, {
  type: 'dynamicImagePro',
  async: true,
  lockUniScalingWithSkew: true,
  debug: false,
  version: '4.3.1',
  _okImage: false,
  initialize: function (options) {
    this.optionId = options.optionId;
    this.imageLibraryId = options.imageLibraryId;
    fabric.util.loadImage(options.src, (image) => {
      if (options.src) {
        image.src = options.src;
      }
      const createdObj = new fabric.Image(image, {
        originX: 'center',
        originY: 'center',
        scaleX: 1,
        scaleY: 1,
      });

      const rect = new fabric.Rect({
        strokeDashArray: options.strokeDashArray,
        originX: 'center',
        originY: 'center',
        stroke: '#808080',
        strokeWidth: 0,
        width: options.width || 300,
        height: options.height || 300,
        fill: 'rgba(0, 0, 0, 0)',
      });

      this.callSuper('initialize', [createdObj, rect], Object.assign(options, groupBoundedOption));

      this.updateFromGroupScaling();
    });
  },
  _set: function (key, value) {
    this.callSuper('_set', key, value);
    switch (key) {
      case 'src':
        this._setImage(this.item(0), value);
        break;
      default:
        break;
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
    this.fixImage();
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
    this.fixImage();
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
    this.fixImage();
  },
  setLeftTop: function (left, top) {
    this.set({
      top: top,
      left: left,
    });
    this.canvas.renderAll();
  },
  setRotation: function (angle) {
    this.set('angle', angle);
    this.canvas.renderAll();
  },
  fixImage: function () {
    if (this.width >= this.height) {
      this.item(0)?.scaleToHeight(this.height);
    } else {
      this.item(0).scaleToWidth(this.width);
    }

    const width = this.item(0).width * this.item(0).scaleX;
    const height = this.item(0).height * this.item(0).scaleY;
    if (width > this.width) {
      this.item(0).scaleToWidth(this.width);
    } else if (height > this.height) {
      this.item(0)?.scaleToHeight(this.height);
    }
  },
  dynamicImage: function (src) {
    this.set('src', src);
  },
  _setImage: function (obj, source) {
    this._okImage = false;
    if (!source) {
      this.loadImage(obj, null);
      obj.set('file', null);
      obj.set('src', null);
      return;
    }
    this.loadImage(obj, source);
    obj.set('file', null);
    obj.set('src', source);
  },
  loadImage: function (obj, src) {
    fabric.util.loadImage(src, (source) => {
      if (obj.type !== 'image') {
        obj.setPatternFill(
          {
            source,
            repeat: 'repeat',
          },
          null,
        );
        obj.setCoords();
        this._okImage = true;
        this.canvas.renderAll();
        return;
      }
      // if (!source) {
      //   fabric.util.loadImage(source, img => {
      //     img.width = obj.width;
      //     img.height = obj.height;
      //   })
      // }
      obj.setElement(source);
      obj.setCoords();
      this.fixImage();
      this._okImage = true;
      this.canvas?.renderAll();
    });
  },
  updateCalcPostion: function (name, value) {
    if (name === 'left') {
      this.set({
        left: value,
      });
    }

    if (name === 'top') {
      this.set({
        top: value,
      });
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

    this.canvas.renderAll();
  },
  __updateView: function () {
    this.visible = !this.visible;
    // this.__addImageToRect();
    this.canvas.renderAll.bind(this.canvas);
    this.canvas.renderAll();
  },

  __updateLock: function () {
    this.selectable = !this.selectable;
    this.evented = !this.evented;
    // this.__addImageToRect();
    this.canvas.renderAll.bind(this.canvas);
    this.canvas.renderAll();
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
    this.canvas.renderAll();
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      id: this.id,
      elementId: this.elementId,
      optionId: this.optionId,
      imageLibraryId: this.imageLibraryId,
      name: this.name,
      src: this.src,
      step: this.step,
      indexImage: this.indexImage,
      indexText: this.indexText,
      time: this.time,
    });
  },
});

DynamicImagePro.fromObject = (options, callback) => {
  return callback(new DynamicImagePro(options));
};

fabric.DynamicImagePro = DynamicImagePro;
