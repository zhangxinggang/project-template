const fs = require('fs');
const path = require('path');
const { STATIC_FOLDER_NAME, CONFIG_FILE, SERVER_FOLDER } = require('../../src/utils/constant');

module.exports = async function (context) {
  const { appOutDir } = context;
  // 删除不必要的多语言
  const localeDir = context.appOutDir + '/locales/';
  fs.readdir(localeDir, function (err, files) {
    if (!(files && files.length)) return;
    for (let i = 0, len = files.length; i < len; i++) {
      const match = files[i].match(/zh-CN\.pak/); //只保留中文
      if (match === null) {
        fs.unlinkSync(localeDir + files[i]);
      }
    }
  });
  const copyList = [
    {
      source: path.join(__dirname, '../../', STATIC_FOLDER_NAME),
      dest: path.join(appOutDir, STATIC_FOLDER_NAME),
    },
    {
      source: path.join(__dirname, '../../', CONFIG_FILE),
      dest: path.join(appOutDir, CONFIG_FILE),
    },
    {
      source: path.join(__dirname, '../../', SERVER_FOLDER),
      dest: path.join(appOutDir, SERVER_FOLDER),
    },
  ];
  return new Promise((resolve, reject) => {
    Promise.all(
      copyList.map((item) => {
        return new Promise((re, rj) => {
          fs.cp(item.source, item.dest, { recursive: true }, (err) => {
            if (err) {
              console.error(err);
              rj(err);
            } else {
              re(1);
            }
          });
        });
      }),
    )
      .then(resolve)
      .catch(reject);
  });
};
