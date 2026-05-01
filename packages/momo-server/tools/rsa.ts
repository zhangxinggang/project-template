var fs = require('fs');
var NodeRSA = require('node-rsa');
var key = new NodeRSA();
key.generateKeyPair();
var publicKey = key.exportKey('pkcs8-public-pem');
console.log(publicKey);
var privateKey = key.exportKey('pkcs1-private-pem');
console.log(privateKey);

var s = {
  public_pkcs8: publicKey,
  public_pkcs1: key.exportKey('pkcs1-public-pem'),
  private_pkcs1: privateKey,
  private_pkcs8: key.exportKey('pkcs8-private-pem'),
};
var util = require('util');
var path = require('path');
var fileName = path.join(__dirname, './hellman.ts');
var content = 'module.exports=' + util.inspect(s);
fs.writeFile(fileName, content, function (err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(res);
  }
});
console.log('非对称加密的公钥私钥已重新生成，文件已更新：' + fileName);
