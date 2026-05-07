const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log('Connecting to database...');
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
            ssl: { rejectUnauthorized: false },
            multipleStatements: true // This is crucial for running the whole schema file
        });

        console.log('Connected! Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing SQL...');
        await connection.query(sql);

        console.log('✅ Success! All tables and default data have been created in your Aiven database.');
        await connection.end();
    } catch (error) {
        console.error('❌ Error setting up database:', error.message);
    }
}

setupDatabase();
