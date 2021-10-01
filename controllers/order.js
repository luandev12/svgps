const { get } = require('lodash');

const Client = require('../configs/index');

const { createOrder, getImageLibrary, getCart } = require('../graphql/order');

exports.order = async (req, res, next) => {
  const { line_items, customer, order_status_url } = req.body;

  const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
  const { tokenAuth } = req.query;

  if (tokenAuth === JWT_SECRET_KEY) {
    let isPersonalizer = false;

    line_items.map((item) => {
      const templateGuid = item.properties.find((i) => i.name === 'templateGuid')?.value;
      const previews = item.properties.find((i) => i.name === '_husblizer-preview-url')?.value;
      const mapId = item.properties.find((i) => i.name === '_mapId')?.value;

      if (mapId) {
        // check if personalizer set true
        isPersonalizer = true;
        // request get data render
        Client.request(getCart, {
          mapId: {
            _eq: mapId.toString(),
          },
        }).then(async (data) => {
          const eps = data.cart[0].eps;
          let result = [];

          // get url origin
          for (const i of eps) {
            if (i.type === 'dynamicImagePro' && i.imageLibraryId) {
              await Client.request(getImageLibrary, {
                library_id: {
                  _eq: i.imageLibraryId,
                },
                position: {
                  _eq: i.optionId,
                },
              }).then((dataImage) => {
                const src = dataImage?.library_image_2[0]?.url;
                const item = { ...i };
                if (src) item.src = src;

                result.push({ ...item, typeCanvas: 'eps' });
              });
            } else {
              result.push({ ...i, typeCanvas: 'eps' });
            }
          }

          Promise.all([result]).then(async (data) => {
            // set pro global

            res.locals.canvasObject = data[0];
            res.locals.previews = previews;
            res.locals.mapId = mapId;
            res.locals.orderInfo = {
              price: item.price,
              productId: item.product_id,
              title: item.name,
              url: '',
              checkout: order_status_url,
              cutomer: customer,
              properties: item.properties,
            };
            next();
          });
        });
      }
    });

    // response to shopify
    if (!isPersonalizer) return res.status(200).send('Ok');
  } else {
    return res.status(403).send('Fail');
  }
};

exports.createOrder = async (req, res) => {
  const { canvasObject, orderInfo, url, previews } = res.locals;

  Client.request(createOrder, {
    object: {
      ...orderInfo,
      url,
      previewUrl: previews,
      canvas: canvasObject,
    },
  })
    .then(({ data }) => {
      const message = 'create order success';
      return res.status(200).send('200 OK');
    })
    .catch((err) => {
      console.log(err, 'error order');
    });
};
