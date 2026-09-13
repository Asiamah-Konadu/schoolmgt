<?php
require_once 'db.php';

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
    exit();
}

$action = $data->action;

// Ensure students_parents table and financials columns exist
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS students_parents (
        student_id VARCHAR(50) NOT NULL,
        parent_id VARCHAR(50) NOT NULL,
        PRIMARY KEY (student_id, parent_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    
    $pdo->exec("ALTER TABLE financials ADD COLUMN IF NOT EXISTS term VARCHAR(50) AFTER amount_paid");
    $pdo->exec("ALTER TABLE financials ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) AFTER term");
} catch (PDOException $e) {}

if ($action === 'get_stats') {
    try {
        $studentsCount = $pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
        $teachersCount = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'teacher'")->fetchColumn();
        $classesCount = $pdo->query("SELECT COUNT(DISTINCT class_name) FROM students")->fetchColumn();

        echo json_encode([
            "status" => "success",
            "students" => $studentsCount,
            "teachers" => $teachersCount,
            "classes" => $classesCount
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'create_announcement') {
    try {
        $id = 'A' . mt_rand(1000, 9999);
        $stmt = $pdo->prepare("INSERT INTO announcements (id, title, content, target_audience) VALUES (:id, :title, :content, :target)");
        $stmt->execute([
            ':id' => $id,
            ':title' => $data->title,
            ':content' => $data->content,
            ':target' => $data->target
        ]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_announcements') {
    try {
        $stmt = $pdo->query("SELECT * FROM announcements ORDER BY created_at DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_announcement') {
    try {
        $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'create_student_parent') {
    try {
        $pdo->beginTransaction();
        
        $pId = 'PAR' . mt_rand(1000, 9999);
        $stmt1 = $pdo->prepare("INSERT INTO users (id, name, password, role, phone) VALUES (:id, :name, :pass, 'parent', :phone)");
        $stmt1->execute([
            ':id' => $pId,
            ':name' => $data->parentName,
            ':pass' => $data->parentPhone,
            ':phone' => $data->parentPhone
        ]);

        $sId = 'STU' . mt_rand(1000, 9999);
        $stmt2 = $pdo->prepare("INSERT INTO students (id, name, class_name, parent_id, promotion_status) VALUES (:id, :name, :class_name, :pid, 'none')");
        $stmt2->execute([
            ':id' => $sId,
            ':name' => $data->studentName,
            ':class_name' => $data->assignedClass,
            ':pid' => $pId
        ]);

        $stmt3 = $pdo->prepare("INSERT INTO students_parents (student_id, parent_id) VALUES (:sid, :pid)");
        $stmt3->execute([':sid' => $sId, ':pid' => $pId]);

        $pdo->commit();
        echo json_encode(["status" => "success", "parentId" => $pId]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_students') {
    try {
        $stmt = $pdo->query("
            SELECT s.id as id, s.name as name, s.class_name as class, 
                   u.name as parentName, u.id as parentId 
            FROM students s 
            LEFT JOIN users u ON s.parent_id = u.id 
            ORDER BY s.created_at DESC
        ");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_student') {
    try {
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'create_teacher') {
    try {
        $pdo->beginTransaction();
        
        $tId = 'TCH' . mt_rand(1000, 9999);
        $stmt1 = $pdo->prepare("INSERT INTO users (id, name, email, password, role, assignedClass) VALUES (:id, :name, :email, 'password123', 'teacher', :assignedClass)");
        $stmt1->execute([
            ':id' => $tId,
            ':name' => $data->name,
            ':email' => $data->email,
            ':assignedClass' => empty($data->assignedClass) ? null : $data->assignedClass
        ]);

        $stmt2 = $pdo->prepare("INSERT INTO teacher_subjects (teacher_id, subject_name) VALUES (:tid, :sub)");
        foreach($data->subjects as $sub) {
            $stmt2->execute([':tid' => $tId, ':sub' => trim($sub)]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "teacherId" => $tId]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_teachers') {
    try {
        $stmt = $pdo->query("SELECT id, name, email, assignedClass as assignedClass FROM users WHERE role = 'teacher' ORDER BY created_at DESC");
        $teachers = $stmt->fetchAll();
        
        foreach($teachers as &$t) {
            $subStmt = $pdo->prepare("SELECT subject_name FROM teacher_subjects WHERE teacher_id = :tid");
            $subStmt->execute([':tid' => $t['id']]);
            $t['subjects'] = $subStmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        echo json_encode(["status" => "success", "data" => $teachers]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_teacher') {
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'import_timetable') {
    try {
        $rows = $data->rows ?? [];
        $inserted = 0;
        $skipped = 0;

        $checkStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM timetables 
             WHERE class_name = :cls AND day = :day AND time_slot = :slot AND teacher_id = :tid"
        );
        $insertStmt = $pdo->prepare(
            "INSERT INTO timetables (id, class_name, day, time_slot, subject, teacher_id) 
             VALUES (:id, :cls, :day, :slot, :sub, :tid)"
        );

        $pdo->beginTransaction();
        foreach ($rows as $row) {
            $checkStmt->execute([
                ':cls'  => $row->class_name,
                ':day'  => $row->day,
                ':slot' => $row->time_slot,
                ':tid'  => $row->teacher_id
            ]);
            if ($checkStmt->fetchColumn() > 0) {
                $skipped++;
                continue;
            }
            $id = 'TT' . strtoupper(substr(md5(uniqid()), 0, 8));
            $insertStmt->execute([
                ':id'  => $id,
                ':cls' => $row->class_name,
                ':day' => $row->day,
                ':slot'=> $row->time_slot,
                ':sub' => $row->subject,
                ':tid' => $row->teacher_id
            ]);
            $inserted++;
        }
        $pdo->commit();
        echo json_encode(["status" => "success", "inserted" => $inserted, "skipped" => $skipped]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_all_timetables') {
    try {
        $stmt = $pdo->query("
            SELECT t.*, u.name as teacherName, u.email as teacherEmail
            FROM timetables t
            JOIN users u ON t.teacher_id = u.id
            ORDER BY t.class_name, 
                     FIELD(t.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
                     t.time_slot
        ");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_timetable') {
    try {
        $stmt = $pdo->prepare("DELETE FROM timetables WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'get_all_financials') {
    try {
        $stmt = $pdo->prepare("
            SELECT f.*, s.name as student_name, s.class_name
            FROM financials f
            JOIN students s ON f.student_id = s.id
            ORDER BY f.created_at DESC
        ");
        $stmt->execute();
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'add_financial') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO financials 
            (student_id, description, amount_billed, amount_paid, term, academic_year) 
            VALUES (:sid, :desc, :billed, :paid, :term, :year)
        ");
        $stmt->execute([
            ':sid' => $data->studentId,
            ':desc' => $data->description,
            ':billed' => $data->amountBilled ?? 0,
            ':paid' => $data->amountPaid ?? 0,
            ':term' => $data->term,
            ':year' => $data->academicYear
        ]);
        echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'delete_financial') {
    try {
        $stmt = $pdo->prepare("DELETE FROM financials WHERE id = :id");
        $stmt->execute([':id' => $data->id]);
        echo json_encode(["status" => "success"]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ── PROMOTIONS ───────────────────────────────────────────────────────────
elseif ($action === 'get_recommended_promotions') {
    try {
        $stmt = $pdo->query("SELECT id, name, class_name as class FROM students WHERE promotion_status = 'recommended' ORDER BY class_name, name");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

elseif ($action === 'approve_promotion') {
    try {
        $nextClass = $data->nextClass ?? 'Promoted';
        $stmt = $pdo->prepare("UPDATE students SET class_name = :cls, promotion_status = 'promoted' WHERE id = :sid");
        $stmt->execute([':cls' => $nextClass, ':sid' => $data->studentId]);
        echo json_encode(["status" => "success"]);
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
        $stmt = $pdo->query("SELECT id, name, role FROM users ORDER BY role, name");
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
        $sender = $sStmt->fetch() ?: ['name' => $data->senderId, 'role' => 'user'];

        $rStmt = $pdo->prepare("SELECT name, role FROM users WHERE id = :uid");
        $rStmt->execute([':uid' => $data->recipientId]);
        $recipient = $rStmt->fetch() ?: ['name' => $data->recipientId, 'role' => 'user'];

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
