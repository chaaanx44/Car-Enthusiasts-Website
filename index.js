require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');
const cors = require('cors');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'your_development_secret';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate essential configuration
if (!MONGODB_URI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined.');
    process.exit(1);
}
if (!process.env.JWT_SECRET && NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET is not defined in production.');
    process.exit(1);
}

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('public'));

// --- Database Connection ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        await seedDatabase();
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

connectDB();

// --- Mongoose Models ---

// Product Schema & Model
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
    description: String
});
const Product = mongoose.model('Product', productSchema);

// User Schema & Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true, minlength: 6 }
});
const User = mongoose.model('User', userSchema);

// Cart Schema & Model
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, default: 1, min: 1 }
    }]
});
const Cart = mongoose.model('Cart', cartSchema);

// --- Validation Schemas (Joi) ---
const userValidationSchema = Joi.object({
    username: Joi.string().min(3).max(30).required()
        .pattern(/^[a-zA-Z0-9_]+$/).message('Username can only contain letters, numbers, and underscores'),
    password: Joi.string().min(6).required()
});

const cartValidationSchema = Joi.object({
    productId: Joi.string().required(),
});

// --- Authentication Middleware ---
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// --- Routes ---

// Health Check
app.get('/health', (req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime() }));

// Root redirect
app.get('/', (req, res) => res.redirect('/login.html'));

// Authentication Routes
app.post('/register', async (req, res, next) => {
    try {
        const { error } = userValidationSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, password } = req.body;

        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ message: 'Username already registered.' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ username, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        next(err);
    }
});

app.post('/login', async (req, res, next) => {
    try {
        const { error } = Joi.object({ username: Joi.string().required(), password: Joi.string().required() }).validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Invalid username or password.' });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ message: 'Invalid username or password.' });

        const token = jwt.sign({ username: user.username, _id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
        next(err);
    }
});

// Product Routes (Protected)
app.get('/api/products', authenticateJWT, async (req, res, next) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        next(err);
    }
});

// Example: Adding a product (you might want admin roles for this)
app.post('/api/products', authenticateJWT, async (req, res, next) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (err) {
        next(err);
    }
});

// Cart Routes (Protected)
app.get('/api/cart', authenticateJWT, async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ userId: req.user._id }).populate('products.productId');
        res.status(200).json(cart || { products: [] });
    } catch (err) {
        next(err);
    }
});

app.post('/api/cart', authenticateJWT, async (req, res, next) => {
    let cart;
    try {
        const { error } = cartValidationSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { productId } = req.body;
        const userId = req.user._id;

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, products: [{ productId, quantity: 1 }] });
        } else {
            const existingProductIndex = cart.products.findIndex(p => p.productId.toString() === productId);
            if (existingProductIndex > -1) {
                cart.products[existingProductIndex].quantity += 1;
            } else {
                cart.products.push({ productId, quantity: 1 });
            }
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate('products.productId');
        res.status(200).json(populatedCart);
    } catch (err) {
        next(err);
    }
});

app.delete('/api/cart/:productId', authenticateJWT, async (req, res, next) => {
    let cart;
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.products = cart.products.filter(p => p.productId.toString() !== productId);

        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate('products.productId');
        res.status(200).json(populatedCart);
    } catch (err) {
        next(err);
    }
});

// --- Database Seeding ---
async function seedDatabase() {
    try {
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('No products found, seeding database...');
            const testProducts = [
                {
                    name: 'Tesla Model S',
                    price: 80000,
                    image: '/images/tesla.jpg',
                    description: 'Luxury electric sedan with cutting-edge technology'
                },
                {
                    name: 'BMW M3',
                    price: 70000,
                    image: '/images/bmw.jpg',
                    description: 'High-performance luxury sports car'
                },
                {
                    name: 'Toyota Camry',
                    price: 25000,
                    image: '/images/camry.jpg',
                    description: 'Reliable mid-size sedan'
                }
            ];
            await Product.insertMany(testProducts);
            console.log('Test products seeded successfully.');
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

// --- Unhandled Rejection & Uncaught Exception Handling ---
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// --- Start Server ---
const server = app.listen(PORT, () => {
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
});