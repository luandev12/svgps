
const HFont = require('./HFont');

function draw(
  character,
  font,
  strokeRenderingCanvas,
  opentypeStrokeWidth,
  kerning,
  tracking,
  ctx,
  align
) {
  var path = font.getPath(character, 0, 0, getFontSizeCustom.call(ctx), {
    kerning: kerning,
    tracking: tracking,
    features: {
      liga: ctx.ligatures,
      rlig: ctx.ligatures,
    },
  });
  var cropData = path.getBoundingBox();
  strokeRenderingCanvas.width =
    cropData.x2 - cropData.x1 + 3 * opentypeStrokeWidth + 2;
  strokeRenderingCanvas.height =
    cropData.y2 - cropData.y1 + 3 * opentypeStrokeWidth + 2;
  var ctxL = strokeRenderingCanvas.getContext("2d");
  ctxL.lineJoin = "round";
  ctxL.clearRect(
    0,
    0,
    strokeRenderingCanvas.width,
    strokeRenderingCanvas.height
  );
  ctxL.save();

  ctxL.strokeStyle = opentypeStrokeWidth > 0 ? "#ff0000" : null;
  ctxL.lineWidth = opentypeStrokeWidth;
  path.offsetX = 2 * opentypeStrokeWidth;
  if ("right" === align) {
    path.offsetX = 0;
  }
  path.offsetY = strokeRenderingCanvas.height - opentypeStrokeWidth;
  render([path], ctxL, true, true);
  var filters = ctxL.getImageData(
    0,
    0,
    strokeRenderingCanvas.width,
    strokeRenderingCanvas.height
  ).data;
  var max = -1;
  var min = -1;
  var res = (function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  })("#000000");
  var results = 0;
  if ("left" === align) {
    var w = 0;
    for (; w < strokeRenderingCanvas.width; ++w) {
      var y = 0;
      for (; y < strokeRenderingCanvas.height; ++y) {
        var f =
          filters[
            (fieldStorage = y * (4 * strokeRenderingCanvas.width) + 4 * w)
          ];
        var value = filters[fieldStorage + 1];
        var filter = filters[fieldStorage + 2];
        var name = filters[fieldStorage + 3];
        if (0 === f && 0 === value && 0 === filter && 0 === name) {
        } else {
          if (
            0 !== name &&
            f === res.r &&
            value === res.g &&
            filter === res.b
          ) {
            min = w;
            results = -1 === max ? 0 : min - max + 1;
            w = strokeRenderingCanvas.width;
            break;
          }
          if (-1 === max) {
            max = w;
          }
        }
      }
    }
  } else {
    w = strokeRenderingCanvas.width - 1;
    for (; w >= 0; --w) {
      y = 0;
      for (; y < strokeRenderingCanvas.height; ++y) {
        var fieldStorage;
        f =
          filters[
            (fieldStorage = y * (4 * strokeRenderingCanvas.width) + 4 * w)
          ];
        value = filters[fieldStorage + 1];
        filter = filters[fieldStorage + 2];
        name = filters[fieldStorage + 3];
        if (0 === f && 0 === value && 0 === filter && 0 === name) {
        } else {
          if (
            0 !== name &&
            f === res.r &&
            value === res.g &&
            filter === res.b
          ) {
            min = w;
            results = -1 === max ? 0 : max - min + 1;
            w = -1;
            break;
          }
          if (-1 === max) {
            max = w;
          }
        }
      }
    }
  }
  return results;
}
/**
 * @param {!Array} opts
 * @param {!CanvasRenderingContext2D} ctx
 * @param {boolean} i
 * @param {boolean} value
 * @return {undefined}
 */
function render(paths, ctx, isStroke, value) {
  ctx.beginPath();
  for (var index = 0; index < paths.length; ++index) {
    var e = paths[index];
    var l = e.offsetX;
    var h = e.offsetY;
    var i = 0;
    for (; i < e.commands.length; i = i + 1) {
      var option = e.commands[i];
      if ("M" === option.type) {
        ctx.moveTo(option.x + l, option.y + h);
      } else {
        if ("L" === option.type) {
          ctx.lineTo(option.x + l, option.y + h);
        } else {
          if ("C" === option.type) {
            ctx.bezierCurveTo(
              option.x1 + l,
              option.y1 + h,
              option.x2 + l,
              option.y2 + h,
              option.x + l,
              option.y + h
            );
          } else {
            if ("Q" === option.type) {
              ctx.quadraticCurveTo(
                option.x1 + l,
                option.y1 + h,
                option.x + l,
                option.y + h
              );
            } else {
              if ("Z" === option.type) {
                ctx.closePath();
              }
            }
          }
        }
      }
    }
  }
  ctx.closePath();
  if (ctx.lineWidth && isStroke) {
    ctx.stroke();
  }
  if (ctx.fillStyle && value) {
    ctx.fill();
    if (ctx._fillPattern) {
      ctx.save();
      ctx.fillStyle = ctx._fillPattern;
      ctx.transform(
        ctx._fillPatternImage.scaleX || 1,
        0,
        0,
        ctx._fillPatternImage.scaleY || 1,
        -ctx._fillPatternImage.source.width / 2,
        -ctx._fillPatternImage.source.height / 2
      );
      ctx.fill();
      ctx.restore();
    }
  }
}

const fillTextCustom = function(
  text,
  x,
  y,
  width,
  tracking
) {
  var options;
  options = this.lineMetrics ? this.lineMetrics : this.measureText(text);
  var fontFamily = getFontFamilyCustom.call(this);
  // while (Object.keys(window.husblizerFont).length !== DataFonts.FONTS.length) {
  //   loadFontFamilies()
  // }
  var font = !!HFont.hasFont(fontFamily) && HFont.resolve(fontFamily); 
  if (!font) {
    return this._fillText
      ? this._fillText.call(this, text, x, y, width)
      : this.fillText.call(this, text, x, y);
  }
  var paths = font.getPaths(text, x, y, getFontSizeCustom.call(this), {
    kerning: true,
    tracking: tracking,
    features: {
      liga: this.ligatures,
      rlig: this.ligatures,
    },
  });
  var doAll = false;
  var o = 0;
  var headerRowHtml = 0;
  var d = false;
  var prevContentItem = false;
  var child = false;
  if (width && options.totalWidth < width) {
    prevContentItem = true;
    var remaining = width - options.totalWidth;
    var array = text.match(/\s/g);
    if (array) {
      headerRowHtml = remaining / array.length;
    } else {
      child = true;
      headerRowHtml = remaining / (text.length - 1);
    }
  }
  for (let i = 0; i < paths.length; ++i) {
    var path = paths[i];
    var character = text[i];
    path.character = character;
    if (prevContentItem && (doAll || (child && 0 !== i))) {
      d = true;
      o = o + headerRowHtml;
      doAll = false;
    }
    if (prevContentItem && width && /[ \t\r]/.test(character)) {
      doAll = true;
    }
    path.offsetY = 0;
    path.offsetX = o;
  }
  this.save();
  
  this.strokeStyle = this.opentypeStroke;
  this.lineWidth = this.opentypeStrokeWidth;
  this.lineJoin = "round";
  render(paths, this, this.opentypeStrokeWidth > 0, false);
  this.lineWidth = 0;
  render(paths, this, false, true);
  this.restore();
  if (d) {
    options.width = width + (this.opentypeStrokeWidth || 0);
    options.totalWidth = width + (this.opentypeStrokeWidth || 0);
  }
  this.lastDrawnData = {
    paths: paths,
    x: x,
    y: y,
    strokeWidth: this.opentypeStrokeWidth,
  };
  return options;
};

const getFontSizeCustom = function () {
  return this.trueFontSize || 1 * this.font.match(/\d+/)[0];
};

const getFontFamilyCustom = function () {
  var t = this.font.match(/(\s*\d+(\.\d{1,50})?)px (.*)/);
  return t ? t[t.length - 1] : "";
};
/**
 * @param {string} text
 * @param {string} x
 * @param {string} width
 * @param {number} template
 * @return {?}
 */
const measureTextCustom = function (
  text,
  kerning,
  width,
  tracking
) {
  var fontFamily = getFontFamilyCustom.call(this);
  // while (Object.keys(window.husblizerFont).length !== DataFonts.FONTS.length) {
  //   loadFontFamilies()
  // }
  var font = !!HFont.hasFont(fontFamily) && HFont.resolve(fontFamily);
  if (!font) {
    return this._measureText
      ? this._measureText.call(this, text)
      : this.measureText.call(this, text);
  }
  if ("undefined" === typeof kerning) {
    kerning = false;
  }
  this.lineSpacing = this.lineSpacing || 1;
  if (this.lineSpacing < 0) {
    this.lineSpacing = 0.01;
  }
  var fontSize = getFontSizeCustom.call(this);
  var c = 0;
  var right = -99999999;
  var h = -99999999;
  var t = 99999999;
  var y = 99999999;
  var nxnymag = 0;
  var ascent = 0;
  var plane_w = 0;
  var plane_h = 0;
  var scale = (1 / font.unitsPerEm) * fontSize;
  var top = font.fontHeight * scale * this.lineSpacing;
  var rbound = font.totalAscender * scale;
  var endDotRadius = font.totalDescender * scale;
  var horizontalGap = 0;
  var itemWidth = 0;

  if ((this.opentypeStrokeWidth || 0) > 0) {
    var c1 = text[0];
    var t1 = text[text.length - 1];
    if (c1 && t1) {
      horizontalGap = draw(
        c1,
        font,
        this.strokeRenderingCanvas,
        this.opentypeStrokeWidth || 0,
        kerning,
        tracking,
        this,
        "left"
      );
      itemWidth = draw(
        t1,
        font,
        this.strokeRenderingCanvas,
        this.opentypeStrokeWidth || 0,
        kerning,
        tracking,
        this,
        "right"
      );
    }
  }
  font.forEachGlyph(
    text,
    0,
    0,
    getFontSizeCustom.call(this),
    {
      kerning: kerning,
      tracking: tracking,
      features: {
        liga: this.ligatures,
        rlig: this.ligatures,
      },
    },
    function (options, offset, height, offset_1000) {
      var scale = (1 / options.path.unitsPerEm) * offset_1000;
      if (options.path.commands.length > 0 && scale) {
        var font = options.getMetrics();
        right = Math.max(font.xMax * scale + offset, right);
        t = Math.min(font.xMin * scale + offset, t);
        h = Math.max(font.yMax * scale + height, h);
        y = Math.min(font.yMin * scale + height, y);
        if (0 == c) {
          plane_w = font.leftSideBearing * scale;
        } else {
          plane_h = font.rightSideBearing * scale;
        }
        nxnymag = Math.max(nxnymag, options.descent * scale);
        ascent = Math.max(ascent, options.ascent * scale);
      } else {
        if (scale) {
          right = Math.max(options.advanceWidth * scale + offset, right);
          t = Math.min(options.advanceWidth * scale + offset, t);
        } else {
          right = Math.max(offset, right);
          t = Math.min(offset, t);
          h = Math.max(height, h);
          y = Math.min(height, y);
        }
      }
      ++c;
    }
  );
  var w;
  var totalWidth = right - t;
  var height = h - y;
  if (0 == totalWidth) {
    totalWidth = 1;
  }
  if (0 == height) {
    height = 1;
  }
  font.forEachGlyph(
    text + " ",
    0,
    0,
    fontSize,
    {
      kerning: kerning,
      tracking: tracking,
      features: {
        liga: this.ligatures,
        rlig: this.ligatures,
      },
    },
    function (canCreateDiscussions, wmax, n) {
      w = wmax;
    }
  );
  var rowWidth = totalWidth + horizontalGap + itemWidth;
  if (width) {
    var searchRegex = new RegExp("\\s$", "gi");
    if (text.length > 1 && null == searchRegex.exec(text)) {
      w = totalWidth = width - horizontalGap - itemWidth;
    }
  }

  totalWidth = totalWidth + (horizontalGap + itemWidth);
  // console.log(totalWidth);
  return ({
    width: (w = w + (horizontalGap + itemWidth)),
    height: height + (this.opentypeStrokeWidth || 0),
    heightNoStroke: height,
    totalWidth: totalWidth,
    totalWidthNoJustify: rowWidth,
    minY: y,
    maxY: h,
    minX: t,
    maxX: right,
    fontHeight: top,
    fontAscender: rbound,
    fontDescender: endDotRadius,
    descent: nxnymag,
    ascent: ascent,
    leftSideBearing: plane_w,
    rightSideBearing: plane_h,
    leftStrokeWidth: horizontalGap,
    rightStrokeWidth: itemWidth,
  });
};

module.exports = {
  fillTextCustom,
  getFontSizeCustom,
  getFontFamilyCustom,
  measureTextCustom
}