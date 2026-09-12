<?php 
require_once '../includes/db.php'; 
include 'includes/management_header.php'; 
include 'includes/management_sidebar.php'; 
?>

<main class="main-content">
    <div style="margin-top: 60px;">
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <h1>Results Manager</h1>
            <button class="btn btn-primary">Generate Report</button>
        </header>

        <div class="glass-panel">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <th style="padding: 1rem;">Student Name</th>
                        <th style="padding: 1rem;">Class</th>
                        <th style="padding: 1rem;">Average Score</th>
                        <th style="padding: 1rem;">Status</th>
                    </tr>
                </thead>
                <!-- Populate with PHP Foreach from $pdo query -->
            </table>
        </div>
    </div>
</main>

<?php include 'includes/management_footer.php'; ?>