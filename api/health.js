module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(
    JSON.stringify({
      status: 'ok',
      message: 'Deceptor Serverless API is ONLINE',
      time: new Date().toISOString(),
    })
  );
};
