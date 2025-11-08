    const express = require("express");
    const router = express.Router();
    const { signup, signupAdmin, login } = require("../controllers/authController");

    // 🩸 Donor signup
    router.post("/signup", signup);

    // 🧠 Admin signup
    router.post("/signupAdmin", signupAdmin);

    // 🔐 Login (both)
    router.post("/login", login);

    module.exports = router;
