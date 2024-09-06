const mongoose = require("mongoose");
async function connectdb() {
  await mongoose.connect(process.env.MONGO_URL);
}

module.exports = connectdb;
