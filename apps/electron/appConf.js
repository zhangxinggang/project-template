module.exports = {
  loadUrl: '',
  openDevTools: true,
  closeConfirm: true,
  databaseName: 'database.sql',
  browserWindow: {
    width: 1200,
  },
  server: {
    httpPort: 8081,
    httpsPort: 8080,
    upload: {
      maxFileSize: 1000 * 1024 * 1024,
    },
  },
};
