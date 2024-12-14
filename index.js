const express = require('express');
const playwright = require('playwright');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Direktori sementara untuk menyimpan gambar
const tmpDir = path.join(__dirname, 'tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// Middleware untuk memparsing request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Utils
const utils = {
  getBrowser: (...opts) =>
    playwright.chromium.launch({
      args: [
        '--incognito',
        '--single-process',
        '--no-sandbox',
        '--no-zygote',
        '--no-cache',
      ],
      executablePath: process.env.CHROME_BIN,
      headless: true,
      ...opts,
    }),

  generateBrat: async (text) => {
    const browser = await utils.getBrowser();
    try {
      const page = await browser.newPage();
      await page.goto('https://www.bratgenerator.com/');
      const consentButton = await page.$('button#onetrust-accept-btn-handler');
        if (consentButton) {
        await consentButton.click();
        await page.waitForSelector('.onetrust-pc-dark-filter', { hidden: true });
        }
      await page.click('#toggleButtonWhite');
      await page.locator('#textInput').fill(text);
      const output = path.join(tmpDir, `${utils.randomName('.jpg')}`);
      await page.locator('#textOverlay').screenshot({ path: output });
      return output;
    } catch (e) {
      throw e;
    } finally {
      if (browser) await browser.close();
    }
  },

  randomName: (suffix = '') => Math.random().toString(36).slice(2) + suffix,

  getError: (err) => (err.message || 'Unknown Error'),

  isTrue: (val) => val === true || val === 'true',
};

// Endpoint untuk brat
app.all(/^\/brat/, async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return res
      .status(405)
      .json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const obj = req.method === 'GET' ? req.query : req.body;
    if (!obj.text) {
      return res
        .status(400)
        .json({ success: false, message: "Required parameter 'text'" });
    }

    const image = await utils.generateBrat(obj.text);
    const resultUrl = `http://${req.hostname}:${PORT}/${image.replace(
      tmpDir,
      'file'
    )}`;
    utils.isTrue(obj.json)
      ? res.json({ success: true, result: resultUrl })
      : res[utils.isTrue(obj.raw) ? 'send' : 'redirect'](resultUrl);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: utils.getError(e) });
  }
});

// Endpoint untuk menyajikan file gambar
app.use('/file', express.static(tmpDir));

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
