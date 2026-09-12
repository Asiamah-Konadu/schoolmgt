<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
    exit();
}

$action = $data->action;
$studentId = $data->studentId ?? '';

if ($action === 'get_wards') {
    try {
        $stmt = $pdo->prepare("SELECT id, name, class_name FROM students WHERE parent_id = :pid");
        $stmt->execute([':pid' => $data->parentId]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_financials') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM financials WHERE student_id = :sid ORDER BY created_at DESC");
        $stmt->execute([':sid' => $studentId]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_student_attendance') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM attendance WHERE student_id = :sid ORDER BY created_at DESC");
        $stmt->execute([':sid' => $studentId]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_teacher_attendance') {
    // Parent wants to see if the teachers for their ward's class are present
    try {
        $stmt = $pdo->prepare("
            SELECT ta.*, u.name as teacherName 
            FROM teacher_attendance ta
            JOIN users u ON ta.teacher_id = u.id
            WHERE ta.class_name = :cls
            ORDER BY ta.created_at DESC
        ");
        $stmt->execute([':cls' => $data->className]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_timetable') {
    try {
        $stmt = $pdo->prepare("
            SELECT t.*, u.name as teacherName 
            FROM timetables t
            JOIN users u ON t.teacher_id = u.id
            WHERE t.class_name = :cls
        ");
        $stmt->execute([':cls' => $data->className]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_assignments') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM assignments WHERE class_name = :cls ORDER BY due_date ASC");
        $stmt->execute([':cls' => $data->className]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
