const Diff = require('diff');
const fabric = require('fabric').fabric;
const { v4: uuidv4 } = require('uuid');
const { findIndex, lte } = require('lodash');
const OpentypeIText = require('./OpentypeIText');
const { groupBoundedOption } = require('../constants/defaults');

const BoundedText = fabric.util.createClass(fabric.Group, {
  async: true,
  type: 'textBoxPro',
  lockUniScalingWithSkew: false,
  debug: false,
  version: '4.3.1',
  lineSpacing: 1,
  _textWithoutPrefixSuffix: '',
  initialize: function (options) {
    if (options.fontFamily) {
      options.fontFamily = this._sanitizeFontFamily(options.fontFamily);
    }
    options.version = options.version || BoundedText.prototype.version;
    var txtFilter;
    var defaultss = {
      width: options.width || 300,
      height: options.height || 300,
      fontSize: options.fontSize || 200,
      originX: 'center',
      originY: 'center',
      textAlign: options.textAlign,
      centeredRotation: true,
      fontFamily: options.fontFamily || 'Arial  Regular ',
      version: options.version,
      stroke: '#000000',
      // globalCompositeOperation: 'source-atop',
      fill: options.fill || '#000000',
      tracking: options.tracking || 0,
      opentypeStrokeWidth: options.strokeWidth || 0,
      opentypeStroke: options.stroke || '#000000',
    };
    txtFilter = new OpentypeIText(options.originalText, defaultss);
    this.set('originalText', options.originalText);
    this.set('_textWithoutPrefixSuffix', options.originalText);
    const rect = new fabric.Rect({
      strokeDashArray: options.strokeDashArray,
      originX: 'center',
      originY: 'center',
      stroke: '#000000',
      strokeWidth: 0,
      width: options.width || 300,
      height: options.height || 300,
      fill: 'transparent',
    });

    this.set('caps', false);
    this.callSuper('initialize', [txtFilter, rect], Object.assign(options, groupBoundedOption));
    this.setTextAlign(options.textAlign);
    this.objectCaching = false;
    this._updateFont();
    this.on({
      added: function () {
        this.transparentCorners = false;
        // this._updateFont();
        this.setWidth(this.width);
        this.setHeight(this.height);
        this.setPrefixSuffix(options.originalText, options.prefix || '', options.suffix || '');
      },
    });
  },
  updateFromGroupScaling: function () {
    var w = this.width * this.scaleX;
    var height = this.height * this.scaleY;
    this.scaleX = 1;
    this.scaleY = 1;
    this.setWidth(w);
    this.setHeight(height);
    this.setTextAlign(this.getTextAlign());
  },
  _set: function (key, value) {
    if ('textAlign' === key) {
      this.setTextAlign(value);
    } else {
      if ('caps' === key) {
        this.setCaps(value);
      } else {
        if ('text' === key) {
          this.setText(value);
        } else {
          if ('outlineWidth' === key) {
            this.setOutlineWidth(value);
          } else {
            if ('fontFamily' === key) {
              this.setFontFamily(value);
            } else {
              if ('fill' === key && value.constructor === fabric.Pattern) {
                this.item(0).set('fillPattern', value);
              } else {
                if ('version' === key) {
                  /** @type {!Object} */
                  this.version = value;
                  this.item(0).set('version', value);
                } else {
                  if ('lineSpacing' === key) {
                    this.callSuper('_set', key, value);
                    this.item(0).set('lineSpacing', value);
                  } else {
                    if ('ligatures' === key) {
                      this.callSuper('_set', key, value);
                      this.item(0).set('ligatures', value);
                    } else {
                      this.callSuper('_set', key, value);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  getTextPaths: function () {
    return this.item(0).getTextPaths(this.getWidth(), this.getHeight());
  },
  setTopLeft: function (top, left) {
    this.set({
      top: top,
      left: left,
    });
  },
  setPrefixSuffix: function (text, prefix, suffix) {
    this.prefix = prefix;
    this.suffix = suffix;
    this.setText(text);
  },
  setSkewXY: function (skewX, skewY) {
    this.set({
      skewX: skewX,
      skewY: skewY,
    });
  },
  setMinMaxSize: function (text, minSize, maxSize) {
    this.minSize = minSize;
    this.maxSize = maxSize;
    this.setText(text, true);
  },
  setLetterSpacing: function (letterSpacing) {
    this.item(0).set('tracking', letterSpacing || 0);
    this._updateFont();
  },
  setLineHeight: function (lineHeight) {
    this.set({ lineSpacing: lineHeight });
    this._updateFont();
  },
  setTextAlign: function (align) {
    var origWidth;
    var width_box;
    if ('opentype-itext' == this.item(0).type) {
      this.item(0).set('textAlign', align);
      this.item(0).set('dirty', true);
      this.canvas && this.canvas.renderAll();
      switch (align) {
        case 'center':
          this.item(0).set({
            left: 0,
            top: 0,
          });
          break;
        case 'left':
        case 'justify':
          origWidth = this.item(0).width;
          width_box = (this.getWidth() - origWidth) / 2;
          this.item(0).set({
            left: -width_box,
            top: 0,
          });
          break;
        case 'right':
          origWidth = this.item(0).width;
          width_box = (this.getWidth() - origWidth) / 2;
          this.item(0).set({
            left: width_box,
            top: 0,
          });
      }
      // this._updateFont()
      this.canvas && this.canvas.renderAll();
    }
  },
  setTrackingAmount: function (state) {
    this.item(0).set('tracking', state || 0);
  },
  getTrackingAmount: function () {
    return this.item(0).tracking || 0;
  },
  getOutlineWidth: function () {
    return this.item(0).opentypeStrokeWidth || 0;
  },
  setOutlineWidth: function (strokeWidth) {
    this.item(0).set('opentypeStrokeWidth', strokeWidth || 0);
    this._updateFont();
  },
  getOutlineColor: function () {
    return this.item(0).opentypeStroke || '#000000';
  },
  setOutlineColor: function (rgba) {
    this.item(0).set('opentypeStroke', rgba || '#000000');
    this._updateFont();
  },
  getTextAlign: function () {
    return this.item(0).textAlign;
  },
  setCursorColor: function (p_id) {
    /** @type {string} */
    this.item(0).cursorColor = p_id;
  },
  setStroke: function (width) {
    this.item(1).set('stroke', width);
  },
  setStrokeWidth: function (width) {
    this.item(1).set('strokeWidth', width);
  },
  getStroke: function () {
    return this.item(1).stroke;
  },
  setColor: function (color) {
    this.item(0).set({
      fill: color,
    });
    this.canvas.renderAll();
  },
  getColor: function () {
    return this.item(0).fill;
  },
  getText: function () {
    return this._textWithoutPrefixSuffix;
  },
  getTextWithLines: function () {
    return this.item(0).getText();
  },
  setText: function (id, start) {
    if (!id) {
      id = '';
    }
    this.set('_textWithoutPrefixSuffix', id);
    if (this.caps) {
      id = id.toUpperCase();
    }
    id = (this.prefix || '') + id + (this.suffix || '');
    var n = start ? '' : this.originalText;
    id = this._computeTrimmedText(id, id, this.item(0), this);
    this.set('originalText', id);
    this.item(1).set('text', id);
    this._updateFont();
    return id;
  },
  forceFontSize: function (t) {
    this.item(0).set('fontSize', t);
    this.setTextAlign(this.getTextAlign());
  },
  updateFontSize: function () {
    this._updateFont();
  },
  setFontSize: function (size) {
    /** @type {number} */
    this.item(0).fontSize = size;
    this._updateFont();
  },
  getFontSize: function () {
    return this.item(0).fontSize;
  },
  _sanitizeFontFamily: function (qNameAsString) {
    return (
      qNameAsString.indexOf("'") < 0 && (qNameAsString = "'" + qNameAsString + "'"), qNameAsString
    );
  },
  setFontFamily: function (value) {
    value = this._sanitizeFontFamily(value);
    this.item(0).set('fontFamily', value);
    this._updateFont();
    // this._updateFont();
  },
  getFontFamily: function () {
    return this.item(0).fontFamily;
  },
  setWidth: function (width) {
    if (!width) {
      /** @type {number} */
      width = 0;
    }
    this.set('width', width);
    this.item(1).set('width', width);
    this.item(0).set('justifyWidth', width);
    this._updateFont();
  },
  getWidth: function () {
    return this.width * this.scaleX;
  },
  setHeight: function (height) {
    if (!height) {
      /** @type {number} */
      height = 0;
    }
    this.set('height', height);
    this.item(1).set('height', height);
    this._updateFont();
  },
  getHeight: function () {
    return this.height * this.scaleY;
  },
  setMinSizePx: function (canCreateDiscussions) {
    this.minSize = canCreateDiscussions;
    this._updateFont();
  },
  setMaxSizePx: function (canCreateDiscussions) {
    this.maxSize = canCreateDiscussions;
    this._updateFont();
  },
  setMultiline: function (multiline) {
    this.multiline = multiline;
    this._updateFont();
  },
  setCaps: function (uuid) {
    /** @type {!Object} */
    this.caps = uuid;
    if (uuid) {
      this.setText(this.getText().toUpperCase(), true);
    }
    this._updateFont();
  },
  _computeTrimmedText: function (e, o, b, el) {
    var d = Diff.diffChars(o, e);
    var a = '';
    var refs = [];
    var j = 0;
    for (; j < d.length; ++j) {
      if (d[j].removed || d[j].added) {
        if (d[j].added) {
          var messageStart = 0;
          if (j > 0) {
            var i = 1;
            for (; j - i >= 0; ++i) {
              if (!d[j - i].removed) {
                messageStart = messageStart + d[j - i].value.length;
              }
            }
          }
          refs.push({
            value: d[j].value,
            start: messageStart,
          });
        }
      } else {
        a = a + d[j].value;
      }
    }
    var break2 = false;
    j = 0;
    for (; j < refs.length && !break2; ++j) {
      var _a = a;
      var i = 0;
      for (; i < refs[j].value.length; ++i) {
        var idx = refs[j].start + i;
        a = a.substr(0, idx) + refs[j].value[i] + a.substr(idx);
        el.set('originalText', a);
        try {
          if ((b.set('text', a), el._updateFont(el, b))) {
            a = _a;
            break2 = true;
            break;
          }
          _a = a;
        } catch (g) {
          return (a = _a), el.set('originalText', a), b.set('text', a), el._updateFont(el, b), a;
        }
      }
    }
    return a;
  },
  _updateFont: function ($this, itext) {
    if (($this || ($this = this), itext || (itext = $this.item(0)), $this.canvas)) {
      const width = $this.getWidth() || $this.width;
      const height = $this.getHeight() || $this.height;
      const minSize = $this.minSize;
      const maxSize = $this.maxSize;
      const multiline = (itext.fontFamily, $this.multiline);
      let ok = false;
      const p = itext;
      p.text = $this.get('originalText');
      $this.item(0).set('dirty', true);
      this.canvas?.renderAll();
      let widthRatio =
        width / ('justify' == $this.getTextAlign() ? p.totalWidthNoJustify : p.width);
      let heightRatio = height / p.height;
      let factor = Math.min(widthRatio, heightRatio);
      let fontSize = p.fontSize * factor;
      itext.text = $this.get('originalText');
      if (fontSize < minSize) {
        let str = (' ' + $this.get('originalText')).slice(1);
        let localization = (' ' + $this.get('originalText')).slice(1);
        p.fontSize = minSize;
        if (multiline) {
          const result = (function (elem, width, canvas, $this) {
            const tmp = elem;
            const x = tmp.text;
            const existingChoices = $this.get('originalText').split(' ');
            const constrTypes = [];
            let c = existingChoices[0];
            let i = 1;
            for (; i < existingChoices.length; i++) {
              const value = existingChoices[i];
              elem.set('text', c + ' ' + value);
              canvas?.renderAll();
              if (
                ('justify' == $this.getTextAlign() ? tmp.totalWidthNoJustify : tmp.width) < width
              ) {
                c = c + (' ' + value);
              } else {
                constrTypes.push(c);
                c = value;
              }
            }
            return constrTypes.push(c), tmp.set('text', x), canvas?.renderAll(), constrTypes;
          })(p, width, $this.canvas, $this);
          str = result.join('\n');
          localization = result.join('\n');
        }
        let end = 0;
        for (; end <= str.length && fontSize < minSize; ++end) {
          localization = str.slice(0, str.length - end);
          p.text = localization;
          $this.item(0).set('dirty', true);
          $this.canvas?.renderAll();
          widthRatio =
            width / ('justify' == $this.getTextAlign() ? p.totalWidthNoJustify : p.width);
          heightRatio = height / p.height;
          factor = Math.min(widthRatio, heightRatio);
          fontSize = p.fontSize * factor;
        }
        if (fontSize > maxSize) {
          fontSize = maxSize;
        } else if (fontSize < minSize) {
          fontSize = minSize;
        }
        itext.fontSize = fontSize;
        itext.text = localization;
        $this.fontSize = itext.fontSize;
        if (end > 1) {
          ok = true;
        }
      } else {
        itext.fontSize = fontSize > maxSize ? maxSize : fontSize;
        $this.fontSize = itext.fontSize;
      }
      $this.setTextAlign(this.getTextAlign());
      $this.canvas?.renderAll();
      $this.item(0).set('dirty', true);
      $this.canvas?.renderAll();
      return ok;
    }
  },
  updateText: function (name, value, onKey) {
    // this.set("originalText", value)
    this.setText(value);
    // this.item(0).set("text", input.value)
    this._updateFont();
  },

  updateCalcPostion: function (name, value) {
    if (name === 'left') {
      this.left = value; // - this.width / 2; // rect
    }

    if (name === 'top') {
      this.top = value; //  - this.height / 2; // rect
    }

    if (name === 'width') {
      this.setWidth(value);
    }

    if (name === 'height') {
      this.setHeight(value);
    }

    if (name === 'angle') {
      this.angle = value;
    }

    if (name === 'fontSize') {
      this.setFontSize(value);
    }

    if (name === 'minSize' && value <= this.maxSize) {
      this.minSize = value;
      this._updateFont();
    }

    if (name === 'maxSize') {
      this.maxSize = value;
      this._updateFont();
    }

    if (name === 'skewX') {
      this.skewX = value;
    }

    if (name === 'skewY') {
      this.skewY = value;
    }

    if (name === 'strokeWidth') {
      this.setOutlineWidth(value);
      // this._updateFont()
    }

    if (name === 'elementId') {
      this.elementId = value;
    }
    this.canvas.renderAll();
  },
  updateColor: function (name, value) {
    if (name === 'stroke') {
      this.setOutlineColor(value);
    }

    if (name === 'fill') {
      this.setColor(value);
    }

    this.canvas.renderAll();
  },
  updateAlign: function (align) {
    this.setTextAlign(align);
    // this._updateFont();
  },
  updateFont: function (font) {
    this.setFontFamily(font);
  },
  changeMultiline: function (name, value) {
    this.setMultiline(value);
  },
  handlePickColor: function () {
    this.canvas.defaultCursor = 'copy';
    this.canvas.renderAll();
  },

  handlePickStroke: function () {
    this.canvas.defaultCursor = 'copy';
    this.canvas.renderAll();
  },
  __updateView: function () {
    this.visible = !this.visible;
    this.canvas.renderAll.bind(this.canvas);
    this.canvas.renderAll();
  },
  __updateLock: function () {
    this.selectable = !this.selectable;
    this.evented = !this.evented;

    this.canvas.renderAll.bind(this.canvas);
    this.canvas.renderAll();
  },
  countStepForward: function () {
    let step = 0;
    const objects = this.canvas.getObjects();
    const indexThis = findIndex(objects, { id: this.id });
    let i = indexThis + 1;
    const length = objects.length;
    let count = 0;
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
  cloneObject: function () {
    const { onAdd, propertiesToInclude } = this;
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) {
      return;
    }
    if (typeof activeObject.cloneable !== 'undefined' && !activeObject.cloneable) {
      return;
    }
    activeObject.clone((clonedObj) => {
      this.canvas.discardActiveObject();
      clonedObj.set({
        left: clonedObj.left + 10,
        top: clonedObj.top + 10,
        evented: true,
      });
      if (clonedObj.type === 'activeSelection') {
        const activeSelection = clonedObj;
        activeSelection.canvas = this.canvas;
        activeSelection.forEachObject((obj) => {
          obj.set('id', uuidv4());
          this.canvas.add(obj);
          this.objects = this.getObjects();
          if (obj.dblclick) {
            obj.on('mousedblclick', this.eventHandler.object.mousedblclick);
          }
        });
        if (onAdd) {
          onAdd(activeSelection);
        }
        activeSelection.setCoords();
      } else {
        if (activeObject.id === clonedObj.id) {
          clonedObj.set('id', uuidv4());
        }
        this.canvas.add(clonedObj);
        this.canvas.objects = this.canvas.getObjects();
        if (clonedObj.dblclick) {
          clonedObj.on('mousedblclick', this.eventHandler.object.mousedblclick);
        }
        if (onAdd) {
          onAdd(clonedObj);
        }
      }
      this.canvas.setActiveObject(clonedObj);
      this.canvas.requestRenderAll();
    }, propertiesToInclude);
  },
  toObject: function () {
    return fabric.util.object.extend(this.callSuper('toObject'), {
      id: this.id,
      objects: null,
      name: this.name,
      elementId: this.elementId,
      value: this.value,
      fontSize: this.item(0).fontSize,
      fontId: '',
      fontFamily: this.item(0).fontFamily,
      fonts: [],
      minSize: this.minSize,
      maxSize: this.maxSize,
      tracking: this.item(0).tracking,
      lineSpacing: this.lineSpacing,
      textAlign: this.item(0).textAlign,
      caps: this.caps,
      multiline: this.multiline,
      fill: this.item(0).fill,
      fillId: '',
      fills: [],
      stroke: this.item(0).opentypeStroke,
      strokeWidth: this.item(0).opentypeStrokeWidth,
      borderWidth: this.item(1).strokeWidth,
      prefix: this.prefix,
      suffix: this.suffix,
      originalText: 'A',
      step: this.step,
    });
  },

  _render(ctx) {
    this.callSuper('_render', ctx);
    ctx.save();
  },
});

BoundedText.fromObject = (options, callback) => {
  return callback(new BoundedText(options));
};

fabric.TextBoxPro = BoundedText;

module.exports = BoundedText;
