const { Schema, model } = require("mongoose");
const bcrypt = require('bcrypt'); // For bcrypt

// Schema creation
const userSchema = new Schema({
  firstname: {
    type: String,
    required: true,
    maxlength: 50,
  },
  lastname: {
    type: String,
    required: true,
    maxlength: 50,
  },
  username: {
    type: String,
    required: true,
    unique: true, // Ensures unique usernames
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures unique emails
    match: [/.+\@.+\..+/, "Please enter a valid email address"], // Basic validation
  },
  password: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10); // Hash password
  next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Model creation
const User = model("user", userSchema);

module.exports = User;
