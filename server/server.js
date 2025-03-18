const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('../uploads'));
app.use('/api/uploads', express.static('../uploads'));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crud_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "../uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database!');
    connection.release();
});

// Загрузка файлов
app.post("/api/upload", upload.array("images"), async (req, res) => {
    const uploadedFiles = req.files.map((file) => `/uploads/${file.filename}`);
    res.json({ images: uploadedFiles });
});

// Аутентификация
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).send("Invalid credentials");

    const user = rows[0];

    const token = jwt.sign({ id: user.id, email: user.email }, "your-secret-key", {
        expiresIn: "1h",
    });

    res.json({ user, token });
});

// Создание разделов
app.post("/api/sections", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO sections (title, description, path, timestamp, images) VALUES (?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images)]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
});

// Создание категорий
app.post("/api/categories", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp, parentId } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO categories (title, description, path, timestamp, images, parentId) VALUES (?, ?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images), parentId]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
});

// Создание продуктов
app.post("/api/products", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp, parentId } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO products (title, description, path, timestamp, images, parentId) VALUES (?, ?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images), parentId]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
});

// Обновление продукта
app.put("/api/products/:id", upload.array("images"), async (req, res) => {
    const { id } = req.params;
    const { title, description, path, timestamp, characteristics } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const updatedImages = JSON.parse(req.body.images || "[]").concat(images);

    const [result] = await pool.query(
        "UPDATE products SET title = ?, description = ?, path = ?, timestamp = ?, images = ?, characteristics = ? WHERE id = ?",
        [
            title,
            description,
            path,
            timestamp,
            JSON.stringify(updatedImages),
            JSON.stringify(characteristics),
            id,
        ]
    );

    if (result.affectedRows === 0) return res.status(404).send("Product not found");
    res.sendStatus(204);
});

// Получение всех разделов
app.get("/api/sections", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM sections");
        res.json(rows);
    } catch (err) {
        console.error("Error fetching sections:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Получение конкретного раздела по ID
app.get("/api/sections/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM sections WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).send("Section not found");
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching section:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Получение всех категорий
app.get("/api/categories", async (req, res) => {
    try {
        const { parentId } = req.query;
        const query = parentId
            ? "SELECT * FROM categories WHERE parentId = ?"
            : "SELECT * FROM categories";
        const [rows] = await pool.query(query, parentId ? [parentId] : []);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Получение конкретной категории по ID
app.get("/api/categories/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).send("Category not found");
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching category:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Получение всех продуктов
app.get("/api/products", async (req, res) => {
    try {
        const { parentId } = req.query;
        const query = parentId
            ? "SELECT * FROM products WHERE parentId = ?"
            : "SELECT * FROM products";
        const [rows] = await pool.query(query, parentId ? [parentId] : []);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching products:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Получение конкретного продукта по ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).send("Product not found");
        res.json(rows[0]);
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Удаление раздела по ID
app.delete("/api/sections/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM sections WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).send("Section not found");
        res.sendStatus(204);
    } catch (err) {
        console.error("Error deleting section:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Удаление категории по ID
app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).send("Category not found");
        res.sendStatus(204);
    } catch (err) {
        console.error("Error deleting category:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Удаление продукта по ID
app.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
        if (result.affectedRows === 0) return res.status(404).send("Product not found");
        res.sendStatus(204);
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(500).send("Internal Server Error");
    }
});

// Обновление раздела по ID
app.put("/api/sections/:id", upload.array("images"), async (req, res) => {
    const { id } = req.params;
    const { title, description, path, timestamp, parentId, order } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const updatedImages = JSON.parse(req.body.images || "[]").concat(images);

    const [result] = await pool.query(
        "UPDATE sections SET title = ?, description = ?, path = ?, timestamp = ?, parentId = ?, images = ?, `order` = ? WHERE id = ?",
        [
            title,
            description,
            path,
            timestamp,
            parentId,
            JSON.stringify(updatedImages),
            order,
            id,
        ]
    );

    if (result.affectedRows === 0) return res.status(404).send("Section not found");
    res.sendStatus(204);
});

// Обновление категории по ID
app.put("/api/categories/:id", upload.array("images"), async (req, res) => {
    const { id } = req.params;
    const { title, description, path, timestamp, parentId, order } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const updatedImages = JSON.parse(req.body.images || "[]").concat(images);

    const [result] = await pool.query(
        "UPDATE categories SET title = ?, description = ?, path = ?, timestamp = ?, parentId = ?, images = ?, `order` = ? WHERE id = ?",
        [
            title,
            description,
            path,
            timestamp,
            parentId,
            JSON.stringify(updatedImages),
            order,
            id,
        ]
    );

    if (result.affectedRows === 0) return res.status(404).send("Category not found");
    res.sendStatus(204);
});

// Обновление продукта по ID
app.put("/api/products/:id", upload.array("images"), async (req, res) => {
    const { id } = req.params;
    const { title, description, path, timestamp, parentId, characteristics, order } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const updatedImages = JSON.parse(req.body.images || "[]").concat(images);

    const [result] = await pool.query(
        "UPDATE products SET title = ?, description = ?, path = ?, timestamp = ?, parentId = ?, images = ?, characteristics = ?, `order` = ? WHERE id = ?",
        [
            title,
            description,
            path,
            timestamp,
            parentId,
            JSON.stringify(updatedImages),
            JSON.stringify(characteristics),
            order,
            id,
        ]
    );

    if (result.affectedRows === 0) return res.status(404).send("Product not found");
    res.sendStatus(204);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));