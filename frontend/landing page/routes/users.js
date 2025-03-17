const express = require('express');
const router = express.Router();
const User = require('../models/usermodel'); // Use PascalCase for models (best practice)

// CRUD Operations 

// **1️⃣ Read Users (GET)**
router.get('/users', async (req, res) => { // Fixed typo
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// **2️⃣ Create User (POST)**
router.post('/signUp', async (req, res) => {
    console.log("Received request for Postman API");

    try {
        const { username, password ,firstname,lastname,dob,email} = req.body;
        console.log(req.body);
        

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already taken" });
        }

        const newUser = new User({ username, password ,firstname,lastname,email,dob});
        await newUser.save();

        res.status(201).json({ message:"User SuccessFully Created :)",// 201 Created
            success: true,
            user: newUser,
            redirect: "/dashboard"
        });
    } catch (err) {
        console.log("Sign-up error",err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.post('/login', async (req, res) => {
    console.log("Received request for Postman API");

    try {
        const { username, password} = req.body;
        console.log(req.body);
        

        // Check if username already exists
        const existingUser = await User.findOne({ username });

        if (!existingUser){
            return res.status(400).json({ success: false, message: "Username not found" });
        }

        const isPasswordValid = await existingUser.comparePassword(password);

        if (!existingUser || !isPasswordValid) {
            return res.status(400).json({ success: false, message: "Password is incorrect" });
        }

        res.status(201).json({ message:"Logged in", 
            success: true,
            redirect: "/dashboard"
        });
    } catch (err) {
        console.log("Sign-up error",err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// **3️⃣ Update User (PUT)**
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password,firstname,lastname,email,dob} = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { username, password },
            { new: true } // Return updated user
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" }); // 404 Not Found
        }

        res.status(200).json({
            success: true,
            user: updatedUser
        });
    } catch (err) { // Fixed missing 'err'
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// **4️⃣ Delete User (DELETE)**
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" }); // 404 Not Found
        }

        res.status(200).json({
            success: true,
            user: deletedUser
        });
    } catch (err) { // Fixed missing 'err'
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
