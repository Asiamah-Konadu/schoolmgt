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

// ── MESSAGES ─────────────────────────────────────────────────────────────
elseif ($action === 'get_messages') {
    try {
        $uid = $data->userId ?? '';
        $stmt = $pdo->prepare("SELECT * FROM messages WHERE recipient_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => $uid]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_sent_messages') {
    try {
        $uid = $data->userId ?? '';
        $stmt = $pdo->prepare("SELECT * FROM messages WHERE sender_id = :uid ORDER BY created_at DESC");
        $stmt->execute([':uid' => $uid]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_recipients') {
    try {
        // Parent sends to teachers
        $stmt = $pdo->query("SELECT id, name, role FROM users WHERE role = 'teacher' ORDER BY name");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'send_message') {
    try {
        $id = 'MSG' . mt_rand(10000, 99999);
        $sStmt = $pdo->prepare("SELECT name, role FROM users WHERE id = :uid");
        $sStmt->execute([':uid' => $data->senderId]);
        $sender = $sStmt->fetch() ?: ['name' => 'Parent', 'role' => 'parent'];

        $rStmt = $pdo->prepare("SELECT name, role FROM users WHERE id = :uid");
        $rStmt->execute([':uid' => $data->recipientId]);
        $recipient = $rStmt->fetch() ?: ['name' => 'Teacher', 'role' => 'teacher'];

        $stmt = $pdo->prepare("
            INSERT INTO messages (id, sender_id, sender_name, sender_role, recipient_id, recipient_name, recipient_role, subject, message)
            VALUES (:id, :sid, :sname, :srole, :rid, :rname, :rrole, :subj, :msg)
        ");
        $stmt->execute([
            ':id' => $id,
            ':sid' => $data->senderId,
            ':sname' => $sender['name'],
            ':srole' => $sender['role'],
            ':rid' => $data->recipientId,
            ':rname' => $recipient['name'],
            ':rrole' => $recipient['role'],
            ':subj' => $data->subject,
            ':msg' => $data->message
        ]);
        echo json_encode(["status" => "success", "id" => $id]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'mark_message_read') {
    try {
        $msgId = $data->messageId ?? $data->id;
        $stmt = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE id = :id");
        $stmt->execute([':id' => $msgId]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>
