<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'school_management';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass);
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $data = [];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SELECT * FROM `$t`");
        $data[$t] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    file_put_contents(__DIR__ . '/db_dump.json', json_encode($data, JSON_PRETTY_PRINT));
    echo "DUMP_SUCCESS";
} catch (Exception $e) {
    echo "DUMP_ERROR: " . $e->getMessage();
}
