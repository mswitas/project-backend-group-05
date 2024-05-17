const express = require("express");
const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const URI_DATABASE =
  process.env.URI_DATABASE || "mongodb://localhost:27017/Kapusta";

const server = async () => {
  try {
    const mongooseOptions = {};

    await mongoose.connect(URI_DATABASE, mongooseOptions);
    console.log("Database connection successful");

    app.listen(3000, () => {
      console.log(`Server running. Use our API on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Cannot connect to database");
    console.log(error);
    process.exit(1);
  }
};

server();
