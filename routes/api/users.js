const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

router.post("/register", async (req, res) => {
  try {
    console.log("register run");
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: "User already exists" });

    user = new User({ email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.json({
      email: user.email,
      id: user._id,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // POBIERANIE UŻYTKOWNIKA NA PODSTAWIE MAILA
    const user = await User.findOne({ email });

    // SPRAWDZENIE CZY UŻYTKOWNIK ISTNIEJE
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // SPRAWDZENIE POPRAWNOŚCI HASŁA
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // USTAWIENIE USER ID
    req.session.userId = user._id;

    // GENEROWANIE TOKENU, PRZY UTWORZONYM UŻYTKOWNIKU
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      "jwtSecret",
      { expiresIn: 3600 }, // CZAS TRWANIA SESJI
      (err, token) => {
        if (err) throw err;
        res.json({
          accessToken: token,
          refreshToken: "refreshTokenHere",
          sid: user.id,
          userData: {
            email: user.email,
            balance: user.balance,
            id: user._id,
            transactions: user.transactions,
          },
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post("/logout", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(404).json({ error: "Invalid user / Invalid session" });
    }

    delete req.session.userId;

    res.status(204).send();
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
router.post("/transaction/income", async (req, res) => {
  try {
    // Sprawdzenie czy użytkownik jest zalogowany
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { description, amount, date } = req.body;

    // Pobranie aktualnego użytkownika z bazy danych
    const user = await User.findById(req.session.userId);

    // Sprawdzenie czy użytkownik istnieje
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Dodanie nowej transakcji do listy transakcji użytkownika
    user.transactions.push({
      description,
      amount,
      date,
      category: "Przychod", // Kategoria przychodu
    });

    // Aktualizacja salda użytkownika
    user.balance += amount;

    // Zapisanie zmian w bazie danych
    await user.save();

    // Tworzenie odpowiedzi
    const newTransaction = user.transactions[user.transactions.length - 1]; // Pobranie ostatniej dodanej transakcji
    res.json({
      newBalance: user.balance,
      transaction: newTransaction,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
