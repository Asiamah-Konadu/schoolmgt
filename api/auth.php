<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
    exit();
}

$action = $data->action;

if ($action === 'login') {
    $userId = $data->userId ?? '';
    $password = $data->password ?? '';
    $role = $data->role ?? 'any';

    if (empty($userId) || empty($password)) {
        echo json_encode(["status" => "error", "message" => "Missing credentials"]);
        exit();
    }

    try {
        $query = "SELECT * FROM users WHERE (id = :id OR email = :email) AND password = :password";
        if ($role !== 'any') {
            $query .= " AND role = :role";
        }
        
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->bindParam(':email', $userId);
        $stmt->bindParam(':password', $password);
        if ($role !== 'any') {
            $stmt->bindParam(':role', $role);
        }
        $stmt->execute();
        
        $user = $stmt->fetch();

        if ($user) {
            unset($user['password']); // Don't send password back
            
            // If parent, fetch student IDs
            if ($user['role'] === 'parent') {
                $stStmt = $pdo->prepare("SELECT student_id FROM students_parents WHERE parent_id = :pid");
                $stStmt->execute([':pid' => $user['id']]);
                $studentIds = $stStmt->fetchAll(PDO::FETCH_COLUMN);
                $user['studentIds'] = $studentIds;
            }
            
            // If teacher, fetch subjects
            if ($user['role'] === 'teacher') {
                $subStmt = $pdo->prepare("SELECT subject_name FROM teacher_subjects WHERE teacher_id = :tid");
                $subStmt->execute([':tid' => $user['id']]);
                $user['subjects'] = $subStmt->fetchAll(PDO::FETCH_COLUMN);
            }

            echo json_encode(["status" => "success", "user" => $user]);
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid credentials or role mismatch"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
