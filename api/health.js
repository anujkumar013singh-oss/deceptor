module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Deceptor API Serverless Engine is ONLINE',
    time: new Date().toISOString(),
  });
};
