<?php

// db_init.php
const DB_FILE = "shokutaku.db";

try {
    $db = new PDO("sqlite:" . DB_FILE);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 開発中のため、一度テーブルを削除して最新構造を反映
    $db->exec("DROP TABLE IF EXISTS current_session");
    $db->exec("DROP TABLE IF EXISTS todays_menus");
    $db->exec("DROP TABLE IF EXISTS master_menus");
    $db->exec("DROP TABLE IF EXISTS actions");
    $db->exec("DROP TABLE IF EXISTS daily_meals");
    $db->exec("DROP TABLE IF EXISTS meal_comments");

    // 1. セッション管理テーブル（司令塔）
    $db->exec("CREATE TABLE current_session(
        id INTEGER PRIMARY KEY,
        status TEXT,           -- WAITING, VOTING, FEEDBACK
        active_meal_id INTEGER -- 現在の感想戦対象の daily_meals.id
    )");

    // 2. ①投票モード用：今日のお品書き
    $db->exec("CREATE TABLE todays_menus(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_name TEXT NOT NULL
    )");

    // 3. 辞書：マスターメニュー
    $db->exec("CREATE TABLE master_menus(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_name TEXT NOT NULL
    )");
    $db->exec("INSERT INTO master_menus(menu_name) VALUES('深川めし'),('天ぷら'),('湯豆腐'),('軍鶏鍋')");

    // 4. ①投票モード用：投票ログ
    $db->exec("CREATE TABLE actions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        target_id INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 5. ③感想戦・④アーカイブ：思い出の本体
    // スタンプ10種を個別のカラムで管理（集計を高速化）
    $db->exec("CREATE TABLE daily_meals(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_date DATE DEFAULT CURRENT_DATE,
        menu_set_name TEXT,
        admin_message TEXT,
        image_path TEXT,
        stamp1_count INTEGER DEFAULT 0,
        stamp2_count INTEGER DEFAULT 0,
        stamp3_count INTEGER DEFAULT 0,
        stamp4_count INTEGER DEFAULT 0,
        stamp5_count INTEGER DEFAULT 0,
        stamp6_count INTEGER DEFAULT 0,
        stamp7_count INTEGER DEFAULT 0,
        stamp8_count INTEGER DEFAULT 0,
        stamp9_count INTEGER DEFAULT 0,
        stamp10_count INTEGER DEFAULT 0,
        is_archived INTEGER DEFAULT 0
    )");

    // 6. ③感想戦：家族からのコメント
    $db->exec("CREATE TABLE meal_comments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER, -- daily_meals.id と紐付け
        user_id INTEGER,
        content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 初期状態：待機モード
    $db->exec("INSERT INTO current_session(id, status, active_meal_id) VALUES(1, 'WAITING', 0)");
    
    echo "データベースの再構築が完了しました。A方式（ID固定）の準備が整いました。";

} catch (PDOException $e) {
    echo "エラー:" . $e->getMessage();
}


