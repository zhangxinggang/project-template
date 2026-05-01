const projectName = (NKGlobal.config.project || {}).name || 'nk';

const cookies = {
  token: `${projectName}-access-token`,
};

export = cookies;
