const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
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

app.post("/api/sections", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp } = req.body;

    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO sections (title, description, path, timestamp, images) VALUES (?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images)]
    );

    res.status(201).json({ id: result.insertId, ...req.body });
});

app.post("/api/categories", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp } = req.body;
    
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO sections (title, description, path, timestamp, images) VALUES (?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images)]
    );
    
    res.status(201).json({ id: result.insertId, ...req.body });
});

app.post("/api/products", upload.array("images"), async (req, res) => {
    const { title, description, path, timestamp } = req.body;
    
    const images = req.files.map((file) => `/uploads/${file.filename}`);
    const [result] = await pool.query(
        "INSERT INTO sections (title, description, path, timestamp, images) VALUES (?, ?, ?, ?, ?)",
        [title, description, path, timestamp, JSON.stringify(images)]
    );
    
    res.status(201).json({ id: result.insertId, ...req.body });
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));