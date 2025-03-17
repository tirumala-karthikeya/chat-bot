// Function to show Sign Up form
function showSignUp() {
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("signUpForm").classList.remove("hidden");
}

// Function to show Login form
function showLogin() {
    document.getElementById("signUpForm").classList.add("hidden");
    document.getElementById("loginForm").classList.remove("hidden");
}

// Sign-Up Function (Stores user data in database)
async function signUp() {
    let firstname = document.getElementById("signup-firstname").value;
    let lastname = document.getElementById("signup-lastname").value;
    let username = document.getElementById("signup-username").value;
    let email = document.getElementById("signup-email").value;
    let password = document.getElementById("signup-password").value;
    let dob = document.getElementById("signup-dob").value; // Ensure it's in YYYY-MM-DD format

    // Validate fields
    if (!firstname || !lastname || !dob || !email || !username || !password) {
        alert("Please fill in all fields!");
        return;
    }

    const apiUrl = "http://localhost:3000/api/signUp"; // ✅ Corrected API route

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ firstname, lastname, username, email, password, dob })
        });

        const data = await response.json();
        console.log(data); // ✅ Debug response


        if (response.ok) {
            alert("Sign-Up Successful! You can now log in.");
            window.location.href = data.redirect; // Redirect to login page after sign-up
        } else {
            alert(data.error || "Sign-Up Failed! Please check your inputs.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
    }
}

// Login Function (Only authenticates, does not save login data)
async function login() {
    let username = document.getElementById("login-email").value;
    let password = document.getElementById("login-password").value;
    let selectedOption = document.getElementById("options").value;

    const apiUrl = "http://localhost:3000/api/login"; // ✅ Corrected API route

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }) // ✅ Only authentication, no saving data
        });

        const data = await response.json();

        if (response.ok) {
            alert("Login Successful! You selected: " + selectedOption);
            window.location.href = data.redirect; // Redirect to dashboard/////////////////////////////////////////////////////////////////////////
        } else {
            alert(data.error || "Invalid Credentials! Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
    }
}

//toggle eye button for password 
function togglePasswordVisibility(inputId, eyeIconId) {
    let passwordField = document.getElementById(inputId);
    let eyeIcon = document.getElementById(eyeIconId);

    if (passwordField.type === "password") {
        passwordField.type = "text";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
    } else {
        passwordField.type = "password";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
    }
}

// Forgot Password Function (Sends password reset request)
async function forgotPassword() {
    let email = prompt("Enter your registered email:");

    if (!email) {
        alert("Please enter an email address!");
        return;
    }

    const apiUrl = "http://localhost:3000/api/users"; // ✅ Corrected API route

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Password reset link sent to your email!");
        } else {
            alert(data.error || "Email not found! Please try again.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again later.");
    }
}

// Dark Mode Toggle
document.getElementById("theme-toggle").addEventListener("change", function() {
    document.body.classList.toggle("dark-mode");
});

// Sidebar Toggle
document.getElementById("menu-icon").addEventListener("click", function() {
    document.getElementById("sidebar").classList.toggle("open");
});

// Display User's Name in Navbar (Fetch from localStorage after login)
window.onload = function() {
    const userFirstName = localStorage.getItem("userFirstName");
    const userLastName = localStorage.getItem("userLastName");

    if (userFirstName && userLastName) {
        document.getElementById("user-info").innerText = `Hello, ${userFirstName} ${userLastName}`;
    }
};

