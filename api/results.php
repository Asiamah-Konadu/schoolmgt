<?php
require_once 'db.php';

// Auto-create results table if not exists
$pdo->exec("
CREATE TABLE IF NOT EXISTS results (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    teacher_id VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    term VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    exam_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    project_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    group_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    assignment_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    grade VARCHAR(5),
    remarks VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_result (student_id, subject, term, academic_year),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
)
");

$data = json_decode(file_get_contents("php://input"));
if (!isset($data->action)) {
    echo json_encode(["status" => "error", "message" => "No action specified"]);
    exit();
}

$action = $data->action;

// ── Helper: compute grade + remarks ──────────────────────────────────────
function computeGrade($total)
{
    if ($total >= 80)
        return ['grade' => 'A', 'remarks' => 'Excellent'];
    if ($total >= 70)
        return ['grade' => 'B', 'remarks' => 'Very Good'];
    if ($total >= 60)
        return ['grade' => 'C', 'remarks' => 'Good'];
    if ($total >= 50)
        return ['grade' => 'D', 'remarks' => 'Average'];
    if ($total >= 40)
        return ['grade' => 'E', 'remarks' => 'Below Average'];
    return ['grade' => 'F', 'remarks' => 'Fail – Needs Improvement'];
}

// ── Submit / Update Results ───────────────────────────────────────────────
if ($action === 'submit_results') {
    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO results 
                (id, student_id, teacher_id, subject, term, academic_year,
                 exam_score, project_score, group_score, assignment_score,
                 total_score, grade, remarks)
            VALUES
                (:id, :sid, :tid, :sub, :term, :year,
                 :exam, :project, :grp, :assign, :total, :grade, :remarks)
            ON DUPLICATE KEY UPDATE
                exam_score       = VALUES(exam_score),
                project_score    = VALUES(project_score),
                group_score      = VALUES(group_score),
                assignment_score = VALUES(assignment_score),
                total_score      = VALUES(total_score),
                grade            = VALUES(grade),
                remarks          = VALUES(remarks),
                teacher_id       = VALUES(teacher_id)
        ");

        $saved = 0;
        foreach ($data->records as $rec) {
            $exam = floatval($rec->exam_score);
            $proj = floatval($rec->project_score);
            $grp = floatval($rec->group_score);
            $assign = floatval($rec->assignment_score);

            // Weighted total
            $total = ($exam * 0.6) + ($proj * 0.1) + ($grp * 0.1) + ($assign * 0.2);
            $gr = computeGrade($total);

            $id = 'RES' . strtoupper(substr(md5($rec->student_id . $data->subject . $data->term . $data->academic_year), 0, 8));

            $stmt->execute([
                ':id' => $id,
                ':sid' => $rec->student_id,
                ':tid' => $data->teacherId,
                ':sub' => $data->subject,
                ':term' => $data->term,
                ':year' => $data->academic_year,
                ':exam' => $exam,
                ':project' => $proj,
                ':grp' => $grp,
                ':assign' => $assign,
                ':total' => round($total, 2),
                ':grade' => $gr['grade'],
                ':remarks' => $gr['remarks'],
            ]);
            $saved++;
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "saved" => $saved]);
    } catch (PDOException $e) {
        $pdo->rollBack();
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ── Get Results for a Class + Subject (teacher view - to prefill) ─────────
elseif ($action === 'get_class_results') {
    try {
        $stmt = $pdo->prepare("
            SELECT r.*, s.name as student_name
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE s.class_name = :cls
              AND r.subject      = :sub
              AND r.term         = :term
              AND r.academic_year = :year
            ORDER BY s.name
        ");
        $stmt->execute([
            ':cls' => $data->className,
            ':sub' => $data->subject,
            ':term' => $data->term,
            ':year' => $data->academic_year,
        ]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ── Get Full Result Slip for a Student ───────────────────────────────────
elseif ($action === 'get_student_results') {
    try {
        $stmt = $pdo->prepare("
            SELECT r.*, u.name as teacher_name, s.name as student_name, s.class_name
            FROM results r
            JOIN students s ON r.student_id = s.id
            JOIN users    u ON r.teacher_id = u.id
            WHERE r.student_id   = :sid
              AND r.term         = :term
              AND r.academic_year = :year
            ORDER BY r.subject
        ");
        $stmt->execute([
            ':sid' => $data->studentId,
            ':term' => $data->term,
            ':year' => $data->academic_year,
        ]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ── Management: Get All Results Summary (by class + term) ─────────────────
elseif ($action === 'get_all_results') {
    try {
        $stmt = $pdo->prepare("
            SELECT r.student_id, s.name as student_name, s.class_name,
                   r.term, r.academic_year,
                   COUNT(r.id) as subject_count,
                   AVG(r.total_score) as average_score
            FROM results r
            JOIN students s ON r.student_id = s.id
            WHERE r.term = :term AND r.academic_year = :year
            GROUP BY r.student_id, r.term, r.academic_year
            ORDER BY s.class_name, s.name
        ");
        $stmt->execute([':term' => $data->term, ':year' => $data->academic_year]);
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// ── Get distinct terms/years already recorded ─────────────────────────────
elseif ($action === 'get_result_periods') {
    try {
        $stmt = $pdo->query("SELECT DISTINCT term, academic_year FROM results ORDER BY academic_year DESC, term ASC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid action"]);
}
?>