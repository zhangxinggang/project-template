import crypto from 'crypto';
import NodeRSA from 'node-rsa';
import NKDiffieHellman = require('./diffieHellman');

interface DiffieHellmanKeys {
  public_pkcs8: string;
  private_pkcs1: string;
}

const keys = NKDiffieHellman as DiffieHellmanKeys;

const security = {
  MD5: {
    encryptPwd: (str: string): string => {
      return security.MD5.encrypt(str);
    },
    encrypt: (str: string): string => {
      return crypto.createHash('md5').update(str, 'utf8').digest('hex');
    },
  },
  DiffieHellman: {
    /**
     * 鍏挜鍔犲瘑
     * @param {string} str 瑕佸姞瀵嗙殑瀛椾覆
     * @return {string} 鍔犲瘑鍚庣殑瀛椾覆銆?
     */
    encrypt: (str: string): string => {
      const encoder = new NodeRSA(keys.public_pkcs8, {
        encryptionScheme: 'pkcs1',
      });
      return encoder.encrypt(str, 'base64', 'utf8');
    },
    /**
     * 绉侀挜瑙ｅ瘑
     * @param {string} str 瑕佽В瀵嗙殑瀛椾覆
     * @return {string} 瑙ｅ瘑鍚庣殑瀛椾覆
     */
    decrypt: (str: string): string => {
      const decoder = new NodeRSA(keys.private_pkcs1, {
        encryptionScheme: 'pkcs1',
      });
      return decoder.decrypt(str, 'utf8');
    },
    /**
     * 绉侀挜绛惧悕銆備负瀛椾覆璁＄畻涓€涓緝鐭殑鐗瑰緛瀛椾覆銆?
     * @param {string} str 瑕佺鍚嶇殑瀛椾覆
     * @return {string} 绛惧悕鍚庣殑瀛椾覆
     */
    sign: (str: string): string => {
      const encoder = new NodeRSA(keys.private_pkcs1, {
        encryptionScheme: 'pkcs1',
      });
      return encoder.sign(str, 'base64', 'utf8');
    },
    /**
     * 鍏挜楠岃瘉銆傞獙璇佸瓧涓叉槸涓嶆槸涓庢煇涓鍚嶅尮閰嶃€?
     * @param {string} str 瑕侀獙璇佺殑瀛椾覆銆?
     * @param {string} signature 绛惧悕銆?
     * @return {boolean} 鏄惁鍖归厤銆?
     */
    verify: (str: string, signature: string): boolean => {
      const decoder = new NodeRSA(keys.public_pkcs8, {
        encryptionScheme: 'pkcs1',
      });
      return decoder.verify(str, signature, 'utf8', 'base64');
    },
  },
};

export = security;
