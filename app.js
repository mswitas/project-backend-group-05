const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();

// Konfiguracja sesji
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: "mongodb://localhost:27017/session_store",
      ttl: 7 * 24 * 60 * 60, // czas życia sesji w sekundach (tydzień)
    }),
  })
);

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

// Importuj router użytkowników
const usersRouter = require("./routes/api/users");
// Importuj router transakcji
const transRouter = require("./routes/api/transactions");

// Użyj routera użytkowników
app.use("/api", usersRouter);
app.use("/api", transRouter);

// Obsługa 404 - Nie znaleziono
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Obsługa błędów serwera
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;
