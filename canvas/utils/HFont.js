const opentype = require('opentype.js');
const https = require('https');
const fs = require('fs');

const husblizerFont = {};
class HFont {
  static resolve = (key) => {
    key = key.replace(/"/g, '').replace(/'/g, '').toLowerCase();
    return husblizerFont[key];
  };

  static hasFont = (key) => {
    key = key.replace(/"/g, '').replace(/'/g, '').toLowerCase();

    if (husblizerFont[key]) {
      return true;
    }
    return false;
  };

  static loadFontUrl = async (fontUrl, fontFamily) => {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(fontFamily);
      https
        .get(fontUrl, function (response) {
          if (response.statusCode !== 200) {
            reject(new Error(`Failed to get '${fontUrl}' (${response.statusCode})`));
            return;
          }
          response.pipe(file);
          file.on('finish', function () {
            resolve();
          });
        })
        .on('error', function (err) {
          // Handle errors
          fs.unlink(fontFamily, () => reject(err)); // Delete the file async. (But we don't check the result)
        });
    });
  };

  static loadSync = async (key, fontUrl, fontFamily) => {
    await this.loadFontUrl(fontUrl, fontFamily);

    return new Promise((resolve) => {
      opentype.load(fontFamily, function (error, data) {
        key = key.replace(/"/g, '').replace(/'/g, '').toLowerCase();
        if (error) {
          console.log('Error loading font ' + key + ' at ' + fontFamily, error);
        } else {
          husblizerFont[key] = data;
          // console.log(key, window.husblizerFont)
          let glyphStatus = null;
          let glyph;
          const status = 'x';
          let ymax = -99999999;
          let ymin = 99999999;
          for (let i = 0; i < data.glyphs.length; i++) {
            if (data.glyphs.get(i).name === status) {
              glyphStatus = data.glyphs.get(i);
              break;
            }
          }
          if (!glyphStatus) {
            for (let i = 0; i < data.glyphs.length; i++) {
              if (data.glyphs.get(i).name === status.toUpperCase()) {
                glyphStatus = data.glyphs.get(i);
                break;
              }
            }
          }
          if (glyphStatus) {
            const statusMetric = glyphStatus.getMetrics();
            for (let i = 0; i < data.glyphs.length; i++) {
              glyph = data.glyphs.get(i);
              const bounds = glyph.getMetrics();
              if ('undefined' !== typeof bounds.yMin) {
                glyph.descent = Math.abs(bounds.yMin);
                glyph.ascent = Math.abs(statusMetric.yMax - bounds.yMax);
              } else {
                glyph.ascent = 0;
                glyph.descent = 0;
              }
            }
          } else {
            // console.log("Couldn't find pattern Glyph for font: " + key);
            for (let i = 0; i < data.glyphs.length; i++) {
              data.glyphs.get(i).descent = 0;
            }
          }

          for (let i = 0; i < data.glyphs.length; i++) {
            const glyphMetric = data.glyphs.get(i).getMetrics();
            if ('undefined' !== typeof glyphMetric.yMin) {
              ymax = Math.max(glyphMetric.yMax, ymax);
              ymin = Math.min(glyphMetric.yMin, ymin);
            }
          }

          data.totalDescender = ymin;
          data.totalAscender = ymax;
          data.fontHeight = Math.abs(ymax - ymin);
          resolve();
        }
      });
    });
  };
}

module.exports = HFont;
