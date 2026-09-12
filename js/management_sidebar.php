<aside class="sidebar">
    <div style="margin-bottom: 2.5rem; text-align: center;">
        <div style="width: 50px; height: 50px; background: var(--accent); border-radius: 12px; margin: 0 auto 0.5rem; display: flex; align-items: center; justify-content: center; font-weight: 800;">KA</div>
        <h3 style="font-size: 0.9rem; letter-spacing: 1px;">MANAGEMENT</h3>
    </div>

    <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
        <?php
        $navItems = [
            ['url' => 'dashboard.php', 'label' => '📊 Dashboard'],
            ['url' => 'announcements.php', 'label' => '📢 Announcements'],
            ['url' => 'students.php', 'label' => '👥 Students & Parents'],
            ['url' => 'teachers.php', 'label' => '👨‍🏫 Teachers'],
            ['url' => 'results.php', 'label' => '🎓 Results Manager'],
            ['url' => 'finance.php', 'label' => '💰 Finance Manager'],
            ['url' => 'promotion.php', 'label' => '📈 Promotion'],
            ['url' => 'messages.php', 'label' => '💬 Messages'],
        ];

        $current = basename($_SERVER['PHP_SELF']);
        foreach ($navItems as $item):
            $active = ($current == $item['url']) ? 'background: var(--primary); color: white;' : 'color: #94a3b8;';
        ?>
            <a href="<?= $item['url'] ?>" style="text-decoration: none; padding: 0.8rem 1rem; border-radius: 8px; font-size: 0.9rem; transition: 0.2s; <?= $active ?>">
                <?= $item['label'] ?>
            </a>
        <?php endforeach; ?>
    </nav>

    <div style="margin-top: auto; padding-top: 2rem;">
        <form action="../logout.php" method="POST">
            <button type="submit" class="btn btn-primary" style="width: 100%; background: #ef4444;">🚪 Logout</button>
        </form>
    </div>
</aside>