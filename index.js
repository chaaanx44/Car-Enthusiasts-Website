const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use an environment variable for production
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/subscription-api', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Could not connect to MongoDB', err);
});

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the public directory
app.use(express.static('public'));

// Define a User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Create a User model
const User = mongoose.model('User', userSchema);

// Define validation schemas
const userSchemaJoi = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required()
});

// Function to save a user
const saveUser = async (userData) => {
    const user = new User(userData);
    return await user.save();
};

// Define routes
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <link rel="stylesheet" type="text/css" href="/styles.css">
                <title>Subscription API</title>
            </head>
            <body>
                <h1>Welcome to the Subscription API!</h1>
                <div class="container">
                    <p>This is a simple API with styled responses.</p>
                </div>
            </body>
        </html>
    `);
});

// Example route for user registration
app.post('/register', async (req, res) => {
    const { error } = userSchemaJoi.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { username, password } = req.body;
    try {
        const user = await saveUser({ username, password });
        res.status(201).send({ message: 'User registered successfully', user });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).send({ message: 'Error registering user', error });
    }
});

// Example route for user login
app.post('/login', async (req, res) => {
    const { error } = userSchemaJoi.validate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { username, password } = req.body;
    // Logic for user login (e.g., validate credentials)
    // For demonstration, assume the user is valid
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ message: 'User logged in successfully', token });
});

// Example route for adding a new user
app.post('/users', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await saveUser({ username, password });
        res.status(201).send({ message: 'User added successfully', user });
    } catch (error) {
        res.status(500).send({ message: 'Error adding user', error });
    }
});

// Example route for getting all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find(); // Fetch all users from the database
        res.status(200).send({ message: 'List of users', users });
    } catch (error) {
        res.status(500).send({ message: 'Error retrieving users', error });
    }
});

// Example route for updating a user
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    // Logic to update user in the database
    res.status(200).send({ message: 'User updated successfully', user: { id, username } });
});

// Example route for deleting a user
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    // Logic to delete user from the database
    res.status(200).send({ message: 'User deleted successfully', userId: id });
});

// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Example of a protected route
app.get('/protected', authenticateJWT, (req, res) => {
    res.send('This is a protected route');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 