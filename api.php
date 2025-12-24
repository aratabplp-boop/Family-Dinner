<?php


// api.php の一番上の方に追加
file_put_contents('debug.txt', print_r($_POST, true), FILE_APPEND);

// api.php データの保存や取得を一手に引き受ける裏方

const DB_FILE = "shokutaku.db";

// １．データベース接続
try{
$db = new PDO("sqlite:" . DB_FILE);
$db ->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}catch(PDOException $e){
    die(json_encode(["error" => $e->getMessage()]));
}


// ２. jQueryから送られてきた「命令（action)」を受け取る
$action = $_REQUEST['action']??'';


// ３. 命令に応じた処理の振り分け
if ($action === 'post_vote') {
    $user_id = $_POST['user_id'];
    $menu_id = $_POST['menu_id'];
    // PHPバージョン問わず動く書き方
    $content = isset($_POST['content']) ? $_POST['content'] : '';

    // 押しなおし対応
    // まず、このユーザーが持ってる投票を削除する
    $stmt_del = $db->prepare("DELETE FROM actions WHERE user_id =? AND type ='VOTE'");
    $stmt_del ->execute([$user_id]);

    // その後、新しく選ばれたメニューに投票をいれる
    $stmt = $db->prepare("INSERT INTO actions (user_id, type, target_id, content) VALUES (?, 'VOTE', ?, ?)");
    $stmt->execute([$user_id, $menu_id, $content]);

    // JSが期待している「message」という項目を入れて返します
    echo json_encode([
        "status" => "success", 
        "message" => "投票を受け付けました"
    ]);
    exit;
}

// --- モード切替（管理者コンソールからの命令） ---
if ($action === 'update_mode') {
    // PHPでは変数は $ を使用
    $new_status = $_POST['status'] ?? 'WAITING';
    
    // SQL文も変数 ($sql) に格納
    $sql = "UPDATE current_session SET status = :status WHERE id = 1";
    $stmt = $db->prepare($sql);
    $stmt->bindValue(':status', $new_status, PDO::PARAM_STR);
    $stmt->execute();

    // 以前の get_todays_menus 等のレスポンス形式に
    echo json_encode([
        "status" => "success",
        "message" => "モードを " . $new_status . " に切り替えました",
        "session_status" => $new_status
    ]);
    exit;
}
// --- セッションのリスタート（一括クリア） ---
if ($action === 'restart_session') {
    // 1. 投票データを削除
    $db->exec("DELETE FROM actions");
    // 2. 今日のお品書きを削除
    $db->exec("DELETE FROM todays_menus");
    // 3. ステータスを待機中に戻す
    $db->exec("UPDATE current_session SET status = 'WAITING' WHERE id = 1");

    echo json_encode([
        "status" => "success",
        "message" => "すべてクリアして待機モードに戻しました",
        "session_status" => "WAITING"
    ]);
    exit;
}



// --- マスター削除 ---
if ($action === 'delete_master_menu') {
    $id = $_POST['id'];
    $stmt = $db->prepare("DELETE FROM master_menus WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['status' => 'success', 'message' => '削除しました']);
    exit;
}

// --- マスター名前変更 ---
if ($action === 'update_master_menu') {
    $id = $_POST['id'];
    $new_name = $_POST['new_name'];
    $stmt = $db->prepare("UPDATE master_menus SET menu_name = ? WHERE id = ?");
    $stmt->execute([$new_name, $id]);
    echo json_encode(['status' => 'success', 'message' => '変更しました']);
    exit;
}


// --- マスター新規追加 ---
if ($action === 'add_master_menu') {
    $menu_name = $_POST['menu_name'];
    $stmt = $db->prepare("INSERT INTO master_menus (menu_name) VALUES (?)");
    $stmt->execute([$menu_name]);
    echo json_encode(['status' => 'success', 'message' => '追加しました']);
    exit;
}
// --- api.php 追加分 ---

// A. マスターメニュー（よく作る料理）の一覧を取得
if ($action === 'get_master_menus') {
    $stmt = $db->query("SELECT * FROM master_menus");
    $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $menus]);
    exit;
}

// B. 今日のお品書きを確定・保存する
if ($action === 'set_todays_menus') {
    $menu_names = $_POST['menu_names']; // 配列で届く想定
    $message = $_POST['message'] ?? '';

    // 一旦、今日のお品書きをクリア
    $db->exec("DELETE FROM todays_menus");

    // 届いたメニューを1つずつ保存
    $stmt = $db->prepare("INSERT INTO todays_menus (menu_name) VALUES (?)");
    foreach ($menu_names as $name) {
        $stmt->execute([$name]);
    }

    // セッション状態を更新（お品書き開示！）
    $stmt = $db->prepare("UPDATE current_session SET status = 'VOTING' WHERE id = 1");
    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "お品書きを公開しました！"]);   
       exit;
}
//    C.今日のお品書き(選ばれたメニュー)をすべて取得する
if($action === 'get_todays_menus'){
    // 1.今日のメニューを取得
    $stmt = $db->query("SELECT * FROM todays_menus");
    $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2.投票データを取得（誰がどのメニューに投票したか）
    // actionsテーブルから「VOTE」タイプのデータをすべて取得
   
      $stmt_votes = $db->query("
         SELECT user_id, target_id, content
         FROM actions 
         WHERE type = 'VOTE'
    ");
    $votes =$stmt_votes->fetchAll(PDO::FETCH_ASSOC);


    // 3.現在のセッション状態（status）も一緒に取得（表示の切り替えに便利）
    $stmt_status = $db->query("SELECT status FROM current_session WHERE id =1");
    $current_status = $stmt_status->fetchColumn();

    // 結果を返す
    echo json_encode([
         "status" =>"success",
         "data" => $menus,
         "votes" =>$votes,
         "session_status" => $current_status
    ]);
    exit;

}
// --- 実食投稿の保存（本来の設計：daily_meals を使用） ---
if ($action === 'save_admin_post') {
    $menu_set_name = $_POST['menus'] ?? '';      // 献立詳細
    // $image_path    = $_POST['photo'] ?? '';      // 写真URL
    $admin_message = $_POST['comment'] ?? '';    // 一言コメント

// 決定プロセス：ファイルがあればそれを、なければテキストURLを採用
    $photo_url = $_POST['photo_url'] ?? ''; 
    $final_path = $photo_url;

    // ファイルが届いている場合の処理
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) { mkdir($upload_dir, 0777, true); }
        
        $filename = date('Ymd_His') . '_' . basename($_FILES['image_file']['name']);
        $destination = $upload_dir . $filename;

        if (move_uploaded_file($_FILES['image_file']['tmp_name'], $destination)) {
            $final_path = $destination; 
        }
    }

    try {
        // 1. daily_meals テーブルに新しい「本日の記録」を作成
        $stmt = $db->prepare("
            INSERT INTO daily_meals (menu_set_name, image_path, admin_message) 
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$menu_set_name, $final_path, $admin_message]);
        
        // 2. 作成した記録の ID を取得
        $meal_id = $db->lastInsertId();

        // 3. current_session を「FEEDBACK」モードにし、今作った meal_id と紐付ける
        $stmt_session = $db->prepare("
            UPDATE current_session 
            SET status = 'FEEDBACK', 
                active_meal_id = ? 
            WHERE id = 1
        ");
        $stmt_session->execute([$meal_id]);

        echo json_encode([
            "status" => "success", 
            "message" => "実食情報を公開しました！",
            "active_meal_id" => (int)$meal_id,
            "debug_path" => $final_path
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "DB保存失敗: " . $e->getMessage()]);
    }
    exit;
}
// --- 実食情報を1件取得する ---
if ($action === 'get_latest_meal') {
    // 1. まず司令塔から「表示していい料理ID」を確実に取得する
    $stmt_status = $db->query("SELECT active_meal_id FROM current_session WHERE id = 1");
    $active_id = $stmt_status->fetchColumn(); // ここで「3」が取れるはず

    // 2. IDが存在する場合のみ、その中身を抜き出す
    if ($active_id && $active_id > 0) {
        $stmt_meal = $db->prepare("SELECT * FROM daily_meals WHERE id = ?");
        $stmt_meal->execute([$active_id]);
        $meal = $stmt_meal->fetch(PDO::FETCH_ASSOC);

        if ($meal) {
            // 3. データが見つかったらJSへ送る
            echo json_encode(["status" => "success", "meal" => $meal]);
        } else {
            echo json_encode(["status" => "error", "message" => "指定された料理データが見つかりません"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "公開中の料理はありません"]);
    }
    exit;
}

// --- スタンプのカウントを加算する物語 ---
if ($action === 'post_stamp') {
    // 1. JSから送られてきた「どの料理に(meal_id)」「どのボタン(num)」かを受け取る
    $meal_id = $_POST['meal_id'] ?? 0;
    $num     = $_POST['num'] ?? 0;

    // 2. 正当なデータ（料理IDが存在し、ボタンが1〜10番）であることを確認
    if ($meal_id > 0 && $num >= 1 && $num <= 10) {
        // 3. データベースの更新：daily_mealsの「stampX_count」を1つ増やす
        // 文字列を結合して、更新すべきカラム名（例：stamp1_count）を特定
        $col = "stamp" . (int)$num . "_count";
        
        // 4. SQL実行：現在の数値に +1 する
        $stmt = $db->prepare("UPDATE daily_meals SET $col = $col + 1 WHERE id = ?");
        $stmt->execute([$meal_id]);
        
        // 5. 完了の合図をJSへ返す
        echo json_encode(["status" => "success", "message" => "スタンプを刻みました"]);
    } else {
        echo json_encode(["status" => "error", "message" => "不適切なデータです"]);
    }
    exit;
}

// --- 家族のコメントを保存する物語 ---
if ($action === 'post_comment') {
    $meal_id = $_POST['meal_id'] ?? 0;
    $content = $_POST['content'] ?? '';
    $user_id = $_POST['user_id'] ?? 0; // 誰が書いたか

    if ($meal_id > 0 && !empty($content)) {
        // 1. meal_comments テーブルに新しい声を保存
        $stmt = $db->prepare("INSERT INTO meal_comments (meal_id, user_id, content) VALUES (?, ?, ?)");
        $stmt->execute([$meal_id, $user_id, $content]);
        
        echo json_encode(["status" => "success", "message" => "コメントを届けました"]);
    }
    exit;
}

// --- 特定の料理のコメント一覧を取得する物語 ---
if ($action === 'get_comments') {
    $meal_id = $_GET['meal_id'] ?? 0;

    if ($meal_id > 0) {
        // 2. この料理に紐づくコメントを、新しい順に取得
        $stmt = $db->prepare("SELECT * FROM meal_comments WHERE meal_id = ? ORDER BY created_at DESC");
        $stmt->execute([$meal_id]);
        $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["status" => "success", "data" => $comments]);
    }
    exit;
}