<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
    exit();
}

$action = $data->action;
$teacher_id = $data->teacherId ?? '';

if ($action === 'get_classes') {
    // Get unique classes from students for selection
    try {
        $stmt = $pdo->query("SELECT DISTINCT class_name FROM students ORDER BY class_name");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll(PDO::FETCH_COLUMN)]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_timetable') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM timetables WHERE teacher_id = :tid");
        $stmt->execute([':tid' => $teacher_id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_roster') {
    try {
        $stmt = $pdo->prepare("SELECT id, name FROM students WHERE class_name = :cls ORDER BY name");
        $stmt->execute([':cls' => $data->className]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_morning_roster') {
    try {
        $date = date('Y-m-d');
        $stmt = $pdo->prepare("
            SELECT s.id, s.name, a.created_at as arrival_time
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.type = 'morning' AND a.date = :date
            WHERE s.class_name = :cls
            ORDER BY s.name
        ");
        $stmt->execute([':cls' => $data->className, ':date' => $date]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'submit_lesson_attendance') {
    try {
        $pdo->beginTransaction();
        $date = date('Y-m-d');
        
        // Mark teacher present
        $stmt0 = $pdo->prepare("INSERT INTO teacher_attendance (teacher_id, class_name, subject, date) VALUES (:tid, :cls, :sub, :date)");
        $stmt0->execute([
            ':tid' => $teacher_id,
            ':cls' => $data->className,
            ':sub' => $data->subject,
            ':date' => $date
        ]);

        // Mark students
        $stmt1 = $pdo->prepare("INSERT INTO attendance (student_id, type, subject, teacher_id, is_present, date) VALUES (:sid, 'lesson', :sub, :tid, :present, :date)");
        
        foreach($data->students as $student) {
            $stmt1->execute([
                ':sid' => $student->id,
                ':sub' => $data->subject,
                ':tid' => $teacher_id,
                ':present' => $student->isPresent ? 1 : 0,
                ':date' => $date
            ]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'submit_morning_attendance') {
    try {
        $date = date('Y-m-d');
        // Mark student as arrived
        $stmt1 = $pdo->prepare("INSERT INTO attendance (student_id, type, teacher_id, is_present, date) VALUES (:sid, 'morning', :tid, 1, :date)");
        
        $stmt1->execute([
            ':sid' => $data->studentId,
            ':tid' => $teacher_id,
            ':date' => $date
        ]);
        
        // For simulation, we'd fire an SMS gateway here. We fetch phone to return it to UI
        $phoneStmt = $pdo->prepare("SELECT u.phone FROM users u JOIN students_parents sp ON u.id = sp.parent_id WHERE sp.student_id = :sid LIMIT 1");
        $phoneStmt->execute([':sid' => $data->studentId]);
        $phone = $phoneStmt->fetchColumn();

        echo json_encode(["status" => "success", "parentPhone" => $phone]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'create_assignment') {
    try {
        $id = 'ASS' . mt_rand(1000, 9999);
        $stmt = $pdo->prepare("INSERT INTO assignments (id, teacher_id, title, class_name, subject, due_date, external_link) VALUES (:id, :tid, :title, :cls, :sub, :due, :link)");
        $stmt->execute([
            ':id' => $id,
            ':tid' => $teacher_id,
            ':title' => $data->title,
            ':cls' => $data->className,
            ':sub' => $data->subject,
            ':due' => $data->dueDate,
            ':link' => empty($data->link) ? null : $data->link
        ]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_my_assignments') {
    try {
        $stmt = $pdo->prepare("SELECT * FROM assignments WHERE teacher_id = :tid ORDER BY created_at DESC");
        $stmt->execute([':tid' => $teacher_id]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_assignment') {
    try {
        $stmt = $pdo->prepare("DELETE FROM assignments WHERE id = :id AND teacher_id = :tid");
        $stmt->execute([':id' => $data->id, ':tid' => $teacher_id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
