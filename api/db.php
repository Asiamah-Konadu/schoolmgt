<?php
// /api/db.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = 'localhost';
$db_name = 'school_management';
$username = 'root'; // Adjust as per your local XAMPP/WAMP/Laragon setup
$password = '';

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    // Create DB dynamically if it doesn't exist
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name`");
    $pdo->exec("USE `$db_name`");

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Self-healing: Ensure essential tables exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('management', 'teacher', 'parent') NOT NULL,
        phone VARCHAR(50),
        assignedClass VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        class_name VARCHAR(100) NOT NULL,
        parent_id VARCHAR(50),
        promotion_status VARCHAR(50) DEFAULT 'none',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE SET NULL
    )");

    // Add promotion_status column if missing
    try {
        $pdo->exec("ALTER TABLE students ADD COLUMN IF NOT EXISTS promotion_status VARCHAR(50) DEFAULT 'none'");
    } catch (PDOException $e) {}

    $pdo->exec("CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        recipient_id VARCHAR(50) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_role VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Database Connection Failed: " . $e->getMessage()
    ]);
    exit();
}
?>