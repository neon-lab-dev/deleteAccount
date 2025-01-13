import express from "express";

import cors from "cors";
import mysql from "mysql2";

const app = express();

// cors
app.use(cors({ origin: "https://server.mitraconsultancy.co.in/", credentials: true }));

app.use(express.json());


const db = mysql.createConnection({
    host: '13.202.41.238', 
    user: 'root', // Replace with your username
    password: 'Kasera@prod123', // Replace with your password
    database: 'kaseradb', // Replace with your database name
    port: 3306, // Replace with your port if it's not the default 3306
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the MySQL database');
    }
});

app.get("/", (req, res) => {
    res.send("Welcome to the delete account API");
});

app.get('/users', (req, res) => {
    const phoneNumber = req.query.phone_number; // Pass phone number as query parameter
    const query = `
        SELECT 
            auth_user.*, 
            user.*       
        FROM 
            auth_user
        JOIN 
            user
        ON 
            auth_user.user_name = user.primary_phone_no
        WHERE 
            auth_user.user_name = ?
         AND auth_user.roles != 'ADMIN,USER'     
            ;
    `;

    db.query(query, [phoneNumber], (err, results) => {
        if (err) {
            console.error('Error executing query:', err.message);
            return res.status(500).json({ error: 'Database query failed' });
        }
        res.json(results);
    });
});

app.delete('/delete-users', (req, res) => {
    const phoneNumber = req.query.phone_number;

    // First attempt to delete from the address table (if rows exist)
    const deleteAddressQuery = `
        DELETE FROM address
        WHERE user_id IN (
            SELECT id FROM user
            WHERE primary_phone_no = ?
        );
    `;

    const deleteUserQuery = `
        DELETE auth_user, user
        FROM auth_user
        JOIN user
        ON auth_user.user_name = user.primary_phone_no
        WHERE auth_user.user_name = ? 
        AND auth_user.roles != 'ADMIN,USER';
    `;

    // Try to delete from the address table
    db.query(deleteAddressQuery, [phoneNumber], (err, addressResults) => {
        if (err) {
            console.error('Error deleting from address:', err.message);
            return res.status(500).json({ error: 'Failed to delete from address table' });
        }

        db.query(deleteUserQuery, [phoneNumber], (err, userResults) => {
            if (err) {
                console.error('Error deleting from auth_user and user:', err.message);
                return res.status(500).json({ error: 'User doesnot exist' });
            }

            res.json({
                message: 'We got your delete account request; it will be deleted shortly',
                affectedRows: userResults.affectedRows,
            });
        });
    });
});



app.listen(3000, () => {
    console.log("Server is running on port 3000");
});