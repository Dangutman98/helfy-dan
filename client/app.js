const http = require("http");
const fs = require("fs");

const server = http.createServer(function (req, res) {
  const data = fs.readFileSync("index.html");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(data);
});

server.listen(8080);
console.log("Client running on port 8080");
