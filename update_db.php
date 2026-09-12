<?php
// update_db.php - Run once to update the financials table schema
require_once 'api/db.php';

try {
    $sql = "ALTER TABLE financials 
            ADD COLUMN IF NOT EXISTS term VARCHAR(50) AFTER amount_paid,
            ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) AFTER term";
    
    $pdo->exec($sql);
    echo json_encode(["status" => "success", "message" => "Database schema updated successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Update Failed: " . $e->getMessage()]);
}
?>
