const express = require('express');
const mysql = require('mysql2');

//******** TODO: Insert code to import 'express-session' *********//
const session = require("express-session")


const flash = require('connect-flash');

const app = express();



// Database connection
const db = mysql.createConnection({
    host: '58408t.h.filess.io',
    user: 'C237database_rememberas',
    password: 'd69706986739f0637dc47ce2d0be7405b30f57a2',
    database: 'C237database_rememberas',
    port: 3307
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

//******** TODO: Insert code for Session Middleware below ********//
app.use(session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    //session will expires after 1 week of inactivity 
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 7}
}));


app.use(flash());

// Setting up EJS
app.set('view engine', 'ejs');

//******** TODO: Create a Middleware to check if user is logged in. ********//
const checkAuthenticated = (req,res,next) => {
    if (req.session.user){
        return next();
    } else {
        req.flash("error", "please log in to view this resource");
        res.redirect("/login");
    }
};

//******** TODO: Create a Middleware to check if user is admin. ********//
const checkAdmin = (req,res, next) => {
    if (req.session.user.role === "admin"){
        return next();
    } else {
        req.flash("error", "access denied");
        res.redirect("/dashboard");
    }
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { user: req.session.user, messages: req.flash('success')});
});

app.get('/register', (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
});


//******** TODO: Create a middleware function validateRegistration ********//
const validateRegistration = (req, res, next) => {
    const{username, email, password, address, contact} = req.body;

    if (!username || !email || !password || !address || !contact){
        return res.status(400).send("All fields are required");
    }
    if (password.length < 0){
        req.flash("Error", "Password should be at least 6 or more characters long");
        req.flash("formData", req.body);
        return res.redirect("/register");
    }
    next(); //if all validation pass, the next function is called, allowung the request to proceed to the //next middleware functi9on or route handler
}


//******** TODO: Integrate validateRegistration into the register route. ********//
app.post('/register', validateRegistration,(req, res) => {
    //******** TODO: Update register route to include role. ********//
    const { username, email, password, address, contact, role} = req.body;

    const sql = 'INSERT INTO users (username, email, password, address, contact, role) VALUES (?, ?, SHA1(?), ?, ?, ?)';
    db.query(sql, [username, email, password, address, contact, role], (err, result) => {
        if (err) {
            throw err;
        }
        console.log(result);
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
});

//******** TODO: Insert code for login routes to render login page below ********//
app.get("/login", (req,res) => {
    res.render("login",{
        messages: req.flash("success"), //retrieve success messages from the sessi9on and pass them to the view 
        errors: req.flash("error") //retrieve error messages from the session and pass them to the view
    });
});


//******** TODO: Insert code for login routes for form submission below ********//
app.post("/login", (req,res) => {
    const {email, password} = req.body;

    //validate email and password 
    if (!email || !password){
        req.flash("error", "All fields are required");
        return res.redirect("/login")
    }
    
    const sql = "SELECT * FROM users WHERE email = ? AND password = SHA1(?)";
    db.query(sql, [email, password], (err,results) => {
        if (err) {
            throw err;
        }
        if (results.length > 0){
            //successful login 
            req.session.user = results[0]; //stores user in session 
            req.flash("success", "login successful!");
            res.redirect("/dashboard")
        } else {
            //invalid creditials 
            req.flash("error", "invalid email or password:");
            res.redirect("/login");
        }
    });
});

//******** TODO: Insert code for dashboard route to render dashboard page for users. ********//
app.get("/dashboard", checkAuthenticated, (req,res) => {
    res.render("dashboard", {user: req.session.user});
});

//******** TODO: Insert code for admin route to render dashboard page for admin. ********//
app.get("/admin", checkAuthenticated, checkAdmin, (req,res) => {
    res.render("admin", {user: req.session.user});
})

//******** TODO: Insert code for logout route ********//
app.get("/logout", (req,res) => {
    req.session.destroy();
    res.redirect("/");
})


// Starting the server
const port = process.env.port || 3000 
app.listen(port, () => {
    console.log(`Server is connected at http://localhost:${port}`);
});
