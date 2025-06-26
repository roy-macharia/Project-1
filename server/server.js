const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('db.json'); // your db.json file
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 3000;

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use('/api', router);  // Optional: use /api prefix

server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});