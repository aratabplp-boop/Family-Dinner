<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>夕食イベントアプリ</title>
    <link rel="stylesheet" href="style.css">
</head>


<body>
<div id="admin-view" style="display:none; background:#f0f0f0; padding:20px; border-bottom:5px solid #d9534f;">
    <button id="btn-exit-admin" class="btn btn-secondary mb-3">← 食卓（参加者画面）に戻る</button>
    
    <div id="admin-console" class="admin-panel shadow-sm p-3 mb-3 bg-white">
        <h3 class="admin-title">🛠 料理人操作盤</h3>
        <div class="button-group">
            <button class="mode-switch-btn btn btn-outline-dark" data-mode="VOTING">① 投票開始</button>
            <button class="mode-switch-btn btn btn-outline-dark" data-mode="FEEDBACK">③ 実食・感想戦</button>
            <button id="btn-restart" class="btn btn-danger btn-sm">全リセット</button>
        </div>
        <p class="mt-2">現在の状態: <strong id="current-status-display">確認中...</strong></p>
    </div>

    <div id="admin-tool-voting" class="admin-tool-panel p-3 bg-white shadow-sm" style="display:none;">
        <h4>【投票準備】お品書き作成</h4>
        <div id="master-menu-list" class="mb-3"></div>
        <button id="btn-add-master" class="btn btn-sm btn-primary mb-2">+ メニュー追加</button>
        <textarea id="admin-message" class="form-control mb-2" placeholder="家族への伝言"></textarea>
        <button id="btn-publish-menu" class="btn btn-danger w-100">お品書きを公開する</button>
    </div>

    <div id="admin-tool-feedback" class="admin-tool-panel p-3 bg-white shadow-sm" style="display:none;">
        <h4>【実食配信】本日の献立披露</h4>
        <textarea id="admin-input-menus" class="form-control mb-2" rows="4" placeholder="献立詳細（5〜10行想定）"></textarea>
        <input type="text" id="admin-input-photo" class="form-control mb-2" placeholder="写真URL">
        <input type="file" id="photo-upload-file" style="display:none;" accept="image/*" capture="environment">
        <button type="button" id="btn-trigger-upload" class="btn btn-outline-secondary btn-sm mb-2">📸 写真を撮影/選択</button>
        <textarea id="admin-input-comment" class="form-control mb-2" placeholder="一言コメント"></textarea>
        <button id="btn-save-admin-post" class="btn btn-success w-100">実食情報を公開する</button>
    </div>
</div>

<div id="player-view">
    <div id="app-container">
        <div class="date-header text-center">
            <h2 id="display-date">わくわくディナータイム♪</h2>
        </div>
        

        <main id="main-scene" class="container">
            <h1 id="status-label" class="text-center mt-3">今日何食べる？</h1>
        <header id="family-selector" class="p-3 text-center bg-light">
            <button class="user-select-btn" data-user-id="1">あらた</button>
            <button class="user-select-btn" data-user-id="2">えいこ</button>
            <button class="user-select-btn" data-user-id="3">あさこ</button>
            <button class="user-select-btn" data-user-id="4">かつた</button>
            <button class="user-select-btn" data-user-id="5">ゆうと</button>
            <button id="btn-enter-admin" class="btn btn-dark ml-2">🍳 料理人</button>
            <input type="hidden" id="selected-user-id" value="">
        </header>

            <section id="section-voting" class="phase-section mt-4">
                <div id="menu-container" class="row justify-content-center"></div>
            </section>

            <section id="section-feedback" class="phase-section" style="display:none;">
                <div id="admin-post-display" class="post-display-container border p-3 mb-4 bg-white">
                    <h3 id="display-menu-names" class="menu-names-title text-center">（料理名が並びます）</h3>
                    <div id="final-dish-photo" class="text-center my-3">
                        <img id="display-final-img" src="" alt="本日の食卓">
                    </div>
                    <p id="display-admin-comment" class="text-center italic">管理者からのコメント...</p>
                </div>

        <div class="stamp-grid"> 
          <div class="stamp-button-container"> <button class="btn-stamp" data-num="1">😋 絶品<span class="count">0</span></button>
          <button class="btn-stamp" data-num="2">💖 好き<span class="count">0</span></button>
          <button class="btn-stamp" data-num="3">💯 完璧<span class="count">0</span></button>
          <button class="btn-stamp" data-num="4">✨ 豪華<span class="count">0</span></button>
          <button class="btn-stamp" data-num="5">🍚 おかわり<span class="count">0</span></button>
          <button class="btn-stamp" data-num="6">🍺 酒進む<span class="count">0</span></button>
          <button class="btn-stamp" data-num="7">🥗 ヘルシー<span class="count">0</span></button>
          <button class="btn-stamp" data-num="8">🔥 アツアツ<span class="count">0</span></button>
          <button class="btn-stamp" data-num="9">💌 感謝<span class="count">0</span></button>
          <button class="btn-stamp" data-num="10">🙏 完食<span class="count">0</span></button>
          </div>
        </div>

                <div id="feedback-post-area" class="user-input-area mb-5">
                    <textarea id="feedback-comment" class="form-control mb-2" placeholder="感想をどうぞ"></textarea>
                    <button id="btn-feedback-submit" class="btn btn-primary w-100">帳面に記す</button>
                </div>

                <div id="feedback-timeline">
                    <h5>みんなの感想</h5>
                    <div id="timeline-list" class="list-group"></div>
                </div>
            </section>
        </main>

        <footer id="archive-section" class="mt-5 p-4 bg-light">
            <h2>Yamamoto Family @2026</h2>
            <div id="history-list"></div>
        </footer>
    </div>
</div>



    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>