const { Router } = require('express');

const { exportImage, exportBase64 } = require('../controllers/exportsImage');

const router = Router();

router.post('/render', exportImage);

router.post('/render-base64', exportImage, exportBase64);

module.exports = router;
