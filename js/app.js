$(function(){
    


const loadLatestMealDetail = () => {
    console.log("--- 実食情報の詳細を取得開始 ---");
    $.post('api.php', { action: 'get_latest_meal' }, (response) => {
        console.log("APIからの応答:", response); // ここで中身が見えるはず

        if (response.status === 'success') {
            const meal = response.meal;
            // 料理人画面から送った「menus」は「menu_set_name」に保存
            $("#display-menu-names").html(meal.menu_set_name.replace(/\n/g, '<br>'));
            $("#display-admin-comment").text(meal.admin_message);
            
            if (meal.image_path) {
                $("#display-final-img").attr("src", meal.image_path).attr("data-meal-id", meal.id).show();
            } else {
                $("#display-final-img").hide();
                
            }
            // 【追加】この一行で、DBにある最新のスタンプ数を画面に反映
            refreshStampCounts(meal.id);
            refreshComments(meal.id);
            
        }
    }, 'json');
};

// 現在のモードに応じて、画面内の「表示エリア」を切り替える関数
// モードに応じて「表」と「裏」を同時に切り替える司令塔
const updateViewByMode = (mode) => {
    console.log("--- モード同期実行: " + mode + " ---");

    // 1. 表（参加者）画面の制御
    $("#section-voting, #section-feedback").hide();
    if (mode === 'VOTING') {
        $("#status-label").text("本日のリクエスト受付中！");
        $("#section-voting").fadeIn();
    } else if (mode === 'FEEDBACK') {
        console.log("--- FEEDBACK分岐内に入りました ---");
        $("#status-label").text("実食＆感想Time");
        $("#section-feedback").fadeIn();
        // 確実にこの一行を執行させる
        loadLatestMealDetail();
    }



    // 2. 裏（料理人）画面内のツール制御
    $(".admin-tool-panel").hide();
    if (mode === 'VOTING') {
        $("#admin-tool-voting").show();
    } else if (mode === 'FEEDBACK') {
        $("#admin-tool-feedback").show();
    }

    $("#current-status-display").text(mode);
};

// 【スイッチ】料理人モードへの入り口
$(document).on("click", "#btn-enter-admin", function() {
    console.log("料理人ルームへ移動");
    $("#player-view").hide();
    $("#admin-view").fadeIn();
    loadMasterMenus(); // 管理用データの読み込み
});

// 【スイッチ】食卓への戻り
$(document).on("click", "#btn-exit-admin", function() {
    console.log("食卓へ戻る");
    $("#admin-view").hide();
    $("#player-view").fadeIn();
    loadTodaysMenus(); // 最新の表画面をロード
});

// ユーザー選択（ role判定によるパネル表示を削除したクリーン版 ）
$(document).on("click", ".user-select-btn", function() {
    const userID = $(this).data("user-id");
    $("#selected-user-id").val(userID);
    $(".user-select-btn").removeClass("active");
    $(this).addClass("active");
    console.log("ユーザー確定 ID:" + userID);
});


    // ユーザー（家族）を選択したとき処理
    $(".user-select-btn").on("click",function(){
        // 1.選択されたユーザーのIDを取得
        const userID = $(this).data("user-id");
        const userName = $(this).text();

        console.log("---ユーザー選択---")
        console.log("選択されたユーザー:",userName,"(ID:", userID, ")");

        // 2.見えないメモ帳(hidden input)にIDを書き込む
        $("#selected-user-id").val(userID);
        
        // 3.見た目のフィードバック　ボタンの変化
        $(".user-select-btn").removeClass("active");
        $(this).addClass("active");

        console.log("メモ帳にIDを保存しました:",$("#selected-user-id").val());


        // 管理者パネルに制御スタート
        // const role =$(this).data("role");
        // console.log("ロール",role);

        // 管理者ならパネル表示、そうでなければ隠す
        // if(role ==="admin"){
        //     $("#admin-panel").fadeIn();
        //     loadMasterMenus();
        // }else{
        //     $("#admin-panel").fadeOut();
        // }
    });
    // 
const loadMasterMenus = () => {
    console.log("マスターメニューを取得します...");
    $.post('api.php', { action: 'get_master_menus' }, (response) => {
        const menus = response.data;
        let html = "";
        if(menus){
            menus.forEach(menu => {
                // チェックボックスの横に「編集・削除」ボタンを配置
                html += `
                    <div class="d-flex align-items-center mb-2 p-2 border-bottom">
                        <div class="form-check flex-grow-1">
                            <input class="form-check-input menu-checkbox" type="checkbox" value="${menu.menu_name}" id="m-${menu.id}">
                            <label class="form-check-label" for="m-${menu.id}">${menu.menu_name}</label>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary me-1 btn-edit-master" data-id="${menu.id}" data-name="${menu.menu_name}">名変</button>
                        <button class="btn btn-sm btn-outline-danger btn-delete-master" data-id="${menu.id}">消去</button>
                    </div>`;
            });
        }
        $("#master-menu-list").html(html);
        console.log("マスターメニュー（管理用）を更新しました");
    }, 'json');
};

// --- マスターメニューの【新規追加】 ---
$(document).on("click", "#btn-add-master", function() {
    const newMenuName = prompt("新しいメニューの名前を入力してください：");
    
    if (newMenuName) {
        console.log("新規メニュー追加開始:", newMenuName);
        $.post('api.php', { 
            action: 'add_master_menu', 
            menu_name: newMenuName 
        }, (response) => {
            console.log("サーバー応答:", response);
            loadMasterMenus(); // 一覧を再読み込み
        }, 'json');
    }
});

// --- マスターメニューの【名前変更】 ---
$(document).on("click", ".btn-edit-master", function() {
    const id = $(this).data("id");
    const oldName = $(this).data("name");
    const newName = prompt("新しい名前を入力してください：", oldName);

    if (newName && newName !== oldName) {
        console.log("メニュー名変更実行 ID:", id, "新名称:", newName);
        $.post('api.php', { 
            action: 'update_master_menu', 
            id: id, 
            new_name: newName 
        }, (response) => {
            console.log("サーバー応答:", response);
            loadMasterMenus();
        }, 'json');
    }
});

// --- マスターメニューの【削除】 ---
$(document).on("click", ".btn-delete-master", function() {
    const id = $(this).data("id");
    if (confirm("本当にこのメニューを削除してもいいですか？")) {
        console.log("メニュー削除実行 ID:", id);
        $.post('api.php', { 
            action: 'delete_master_menu', 
            id: id 
        }, (response) => {
            console.log("サーバー応答:", response);
            loadMasterMenus();
        }, 'json');
    }
});

// --- C. 今日のお品書き取得（家族用）  ---
const loadTodaysMenus = () => {
    console.log("---今日のお品書き読み込み開始---");
    $.getJSON('api.php', { action: 'get_todays_menus' })
    .done((response) => {
        console.log("届いたお品書きデータ:", response);
        const menus = response.data;
        const votes = response.votes;
        const sessionStatus = response.session_status;
        const $container = $("#menu-container");

       // 1. まず「ガワ」を切り替える（VOTINGかFEEDBACKか）
        updateViewByMode(sessionStatus);

        // 2. もしFEEDBACKモードなら、最新の実食情報を「今すぐ」読みに行く
        if (sessionStatus === 'FEEDBACK') {
            loadLatestMealDetail(); 
        }
        // 家族のIDと名前・色の対応表
        const userMap = {
            1: { name: "あらた", color: "#3498db" },
            2: { name: "えいこ", color: "#e74c3c" },
            3: { name: "あさこ", color: "#f1c40f" },
            4: { name: "かつた", color: "#2ecc71" },
            5: { name: "ゆうと", color: "#9b59b6" }
        };

       // 【重要】実食モードなら、これ以上この関数（投票エリアの構築）は何もせず終了する
        if (sessionStatus === 'FEEDBACK') {
            console.log("実食モードのため、お品書き構築をスキップします");
            return; 
        }

        // 準備中（VOTINGでもFEEDBACKでもない）の場合
        if (sessionStatus !== 'VOTING') {
            $container.empty().append('<p class="text-center">まだお品書きが公開されていません。お楽しみに！</p>');
            return;
        }



        // 表示エリアをリセット
        $container.empty();

        
        // 1. 通常メニューのループでカード作成
        $.each(menus, (index, menu) => {
            const currentVotes = votes.filter(v => v.target_id == menu.id);
            console.log(`${menu.menu_name}への投票者数:`, currentVotes.length);
            
            let voterHtml = "";
            currentVotes.forEach(vote => {
                const user = userMap[vote.user_id] || { name: "ゲスト", color: "#ccc" };
                voterHtml += `<span class="badge rounded-pill family-badge" style="background-color:${user.color};">${user.name}</span>`;
            });

            const cardHtml = `
                <div class="col-md-4 mb-4">
                    <div class="card vote-card h-100 shadow-sm" data-menu-id="${menu.id}">
                        <div class="card-body d-flex flex-column text-center">
                            <h5 class="card-title fw-bold text-dark">${menu.menu_name}</h5>
                            <div class="voter-area mt-auto mb-3">
                                ${voterHtml}
                            </div>
                            <button class="btn btn-outline-primary btn-vote">これ食べたい！</button>
                        </div>
                    </div>
                </div>`;
            $container.append(cardHtml);
        });

        // 2. リクエスト枠（999）の投票者を計算
        let requestVoterHtml = ""; 
        const requestVotes = votes.filter(v => v.target_id == 999);
        console.log("リクエスト詳細ログ:", requestVotes);
        
        requestVotes.forEach(vote => {
            const user = userMap[vote.user_id] || { name: "ゲスト", color: "#ccc" };
            const displayContent = vote.content ? ` : ${vote.content}` : "";
            const badgeHTML = `<span class="badge rounded-pill family-badge" style="background-color:${user.color};">${user.name}${displayContent}</span>`;
            requestVoterHtml += badgeHTML;
        });

        // 3. リクエスト用のカードを追加（ここで用意した requestVoterHtml を使う）
        const requestCard = `
            <div class="col-md-4 mb-4">
                <div class="card vote-card border-dashed h-100" data-menu-id="999">
                    <div class="card-body text-center">
                        <h5 class="card-title fw-bold">リクエスト</h5>
                        <div class="voter-area my-2">${requestVoterHtml}</div>
                        <input type="text" id="custom-menu-name" class="form-control mb-2" placeholder="何が食べたい？">
                        <button class="btn btn-outline-secondary btn-vote">これをリクエスト</button>
                    </div>
                </div>
            </div>`;
        $container.append(requestCard);

        console.log("お品書きの表示が完了しました");
    })
    .fail((error) => {
        console.error("お品書きの取得に失敗しました:", error);
    });
};

    // ページ読み込み時に実行（関数の外で呼ぶ）
    loadTodaysMenus();



// --- D. 投票ボタン処理（最強の耳：document.on に変更） ---
    $(document).on("click", ".btn-vote", function() {
        // １．誰が投票したか、どのメニューかを取得
        const selectedUser = $("#selected-user-id").val();
        // ★修正ポイント：動的に作った要素からも確実にIDを取れるように closest を使用
        const menuID = $(this).closest(".vote-card").data("menu-id");
        let customContent = "";

        // 自由記述用
        if (menuID === 999) {
            customContent = $("#custom-menu-name").val();
            if (!customContent) {
                alert("リクエスト内容を書いてくださいね。");
                return;
            }
            console.log("自由記述リクエスト:", customContent);
        }

        console.log("---投票処理開始---");
        console.log("投票者ID:", selectedUser, "メニューID:", menuID);

        // ２．バリデーション
        if (!selectedUser) {
            alert("まずは、上にある自分の名前を選んでくださいね");
            return;
        } 

        // ３．APIへ送信
        $.ajax({
            url: 'api.php',
            type: 'POST',
            data: {
                action: 'post_vote',
                user_id: selectedUser,
                menu_id: menuID,
                content: customContent 
            },
            dataType: 'json'
        })
        .done((response) => {
            console.log("サーバーからの返事:", response);
            alert(response.message);
          loadTodaysMenus(); // データだけ再取得して、UIを更新
        })
        .fail((error) => {
            console.log("通信エラーが発生しました:", error);
        });
    });
   
// --- app.js お品書き公開ボタンの処理（検証ログ強化版） ---

// ボタンがクリックされたことを確実に捕まえる
$(document).on("click", "#btn-publish-menu", function() {
    // 1. まずクリックされたことをログで出す
    console.log("--- 公開ボタンが押されました ---");

    // 2. チェックされたメニューを取得
    const selectedMenus = [];
    $(".menu-checkbox:checked").each(function() {
        selectedMenus.push($(this).val());
    });

    // 3. メッセージを取得
    const adminMsg = $("#admin-message").val();

    console.log("選択されたメニュー:", selectedMenus);
    console.log("入力されたメッセージ:", adminMsg);

    // バリデーション
    if (selectedMenus.length === 0) {
        alert("今日のお品書きを1つ以上選んでください！");
        return;
    }

    // 4. APIへ送信
    console.log("api.phpへ送信を開始します...");
    $.ajax({
        url: 'api.php',
        type: 'POST',
        data: {
            action: 'set_todays_menus',
            menu_names: selectedMenus,
            message: adminMsg
        },
        dataType: 'json'
    })
    .done((response) => {
        // 成功ログ
        console.log("サーバーからの成功レスポンス:", response);
        alert(response.message);
        loadTodaysMenus(); // データだけ再取得して、UIを更新
    })
    .fail((error) => {
        // 失敗ログ
        console.error("通信エラー:", error);
        // PHPがエラーを吐いている場合、responseTextにヒントがある
        console.log("エラー詳細:", error.responseText);
    });
});

// --- 【追加】ここから管理者専用：モード切替の処理 ---
    
console.log("管理者コンソール: 初期化実行");

    // モード切替ボタンのクリックイベント
    $(".mode-switch-btn").on("click", function() {
        // 1. 選択されたモード（data-mode属性）を取得
        const nextMode = $(this).data("mode");
        console.log("モード切替要求を発火:", nextMode);

        // 2. サーバー（api.php）へモード更新命令を飛ばす
        $.ajax({
            url: "api.php",
            type: "POST",
            data: {
                action: "update_mode",
                status: nextMode
            },
            dataType: "json",
            success: function(response) {
            console.log("サーバーレスポンス受領:", response);
    
            // 【修正】location.reload() を介さず、関数を直接呼ぶ
            updateViewByMode(response.session_status);
    
            console.log("画面表示を「" + response.session_status + "」に切り替えました");
           },
            error: function(err) {
                // エラー時のログ
                console.error("モード切替通信中にエラーが発生しました", err);
            }
        });
    });
    // リスタートボタンのクリックイベント
   $(document).on("click", "#btn-restart", function() {
     if (!confirm("投票データとお品書きをすべて削除して、最初からやり直しますか？")) return;

     console.log("--- セッションリスタート実行 ---");
      $.post('api.php', { action: 'restart_session' }, (response) => {
        console.log("サーバー応答:", response);
        
        // 1. 画面の表示エリアを切り替える（関数を再利用！）
        updateViewByMode(response.session_status);
        
        // 2. お品書きエリアを空にする
        loadTodaysMenus();

        // 【追加】表示されている実食情報を真っ白にする
        $("#display-menu-names").text("準備中...");
        $("#display-admin-comment").text("");
        $("#display-final-img").hide();

        
        alert(response.message);
    }, 'json');
});

// --- 1. 写真選択の起動スイッチ ---
$(document).on("click", "#btn-trigger-upload", function(e) {
    e.preventDefault(); // フォーム送信を防ぐお守り
    console.log("--- 📸 写真選択ボタンがクリックされました ---");
    
    // 隠してある本物の「ファイル選択」を強制的にクリックさせる
    $("#photo-upload-file").click(); 
});

// --- 2. ファイルが選ばれた瞬間 ---
$(document).on("change", "#photo-upload-file", function() {
    const file = this.files[0];
    if (file) {
        console.log("選択されたファイル:", file.name);
        // テキストボックスに「選んだよ」という証拠を表示
        $("#admin-input-photo").val("📸 選択済み: " + file.name);
    } else {
        console.log("ファイル選択がキャンセルされました");
    }
});




// --- 料理人の実食投稿ボタンを動かす ---
$(document).on("click", "#btn-save-admin-post", function() {
    console.log("--- 実食投稿ボタンがクリックされました ---");

    // 1. 【情報の器】ファイルも運べる「FormData（封筒）」を作成
    const formData = new FormData();
    
    // 2. 【情報の詰め込み】封筒にデータを一つずつ入れる
    formData.append('action', 'save_admin_post'); // 処理の名前
    formData.append('menus', $("#admin-input-menus").val()); // 献立内容
    formData.append('comment', $("#admin-input-comment").val()); // 一言コメント
    formData.append('photo_url', $("#admin-input-photo").val()); // 手入力分

    // 3. 【写真の判定】隠しファイル選択にデータがあるか確認
    const photoFile = $("#photo-upload-file")[0].files[0];
    if (photoFile) {
        // ファイルがある場合、その「実体」を封筒に入れる
        formData.append('image_file', photoFile);
        console.log("写真ファイルを封筒に入れました:", photoFile.name);
    }

    // 4. 【バリデーション】
    if (!$("#admin-input-menus").val() || !$("#admin-input-comment").val()) {
        alert("献立内容とコメントを入力してください。");
        return;
    }

    // 5. 【API送信】封筒(formData)をそのままサーバーへ送る
    $.ajax({
        url: 'api.php',
        type: 'POST',
        data: formData,           // 封筒そのものを指定
        processData: false,       // 必須：jQueryに中身を加工させない
        contentType: false,       // 必須：jQueryに「文字データ」だと思い込ませない
        dataType: 'json'
    })
    .done((response) => {
        console.log("配信成功:", response);
        alert("実食情報を公開しました！");
        loadTodaysMenus();
        loadLatestMealDetail();
        
        // 送信が終わったらファイル選択をリセット（次の投稿のため）
        $("#photo-upload-file").val(""); 
    })
    .fail((error) => {
        console.error("配信エラー:", error.responseText);
        alert("保存に失敗しました。PHP側の設定を確認してください。");
    });
});



// --- スタンプボタンが押された時の物語（修正版） ---
$(document).on("click", ".btn-stamp", function() {
    const num = $(this).data("num"); 
    
    // エラーの元だった変数を使わず、画像要素から直接IDを取り出します
    const mealId = $("#display-final-img").attr("data-meal-id");

    console.log("スタンプ送信開始。対象ID:", mealId, "番号:", num);

    if (!mealId) {
        console.log("エラー: 料理IDが取得できません。画像が読み込まれるまでお待ちください。");
        return;
    }

    $.ajax({
        url: 'api.php',
        type: 'POST',
        data: {
            action: 'post_stamp',
            meal_id: mealId,
            num: num
        },
        dataType: 'json'
    })
    .done((res) => {
        console.log("DB更新完了:", res);
        // 独立した更新関数を呼び出す
        refreshStampCounts(mealId); 
    });
});

// --- スタンプの数値だけをDBから取ってきて書き換える物語 ---
const refreshStampCounts = (mealId) => {
    console.log("最新のスタンプ数を取得します。ID:", mealId);

    $.get("api.php", { 
        action: "get_latest_meal" 
    }, (res) => {
        if (res.status === "success") {
            const meal = res.meal;
            // 1〜10番のボタンをループで巡回
            for (let i = 1; i <= 10; i++) {
                const countValue = meal[`stamp${i}_count`] || 0;
                // ボタンの中の .count クラスだけを狙って数字を上書き
                $(`.btn-stamp[data-num="${i}"] .count`).text(countValue);
            }
            console.log("スタンプ表示を同期しました");
        }
    }, "json");
};
// --- 感想タイムラインを最新にする物語 ---
const refreshComments = (mealId) => {
    console.log("タイムライン更新中... 料理ID:", mealId);

    $.getJSON("api.php", { 
        action: "get_comments", 
        meal_id: mealId 
    }, (res) => {
        if (res.status === "success") {
            const $list = $("#timeline-list");
            $list.empty(); // 一旦、今ある表示をさら地にする

            // 家族のIDと名前の対応表（お品書きの定義を流用）
            const userMap = { 1: "あらた", 2: "えいこ", 3: "あさこ", 4: "かつた", 5: "ゆうと" };

            res.data.forEach(comment => {
                const userName = userMap[comment.user_id] || "ゲスト";
                // リスト項目（吹き出し）を作成
                const html = `
                <div class="list-group-item shadow-sm">
                   <div class="timeline-header">
                    <span class="fw-bold text-primary" style="font-size:1rem;">${userName}</span>
                    <span class="text-muted" style="font-size:0.7rem;">${comment.created_at}</span>
                   </div>
                  <div class="timeline-body">
                    <p class="mb-0" style="font-size:1rem; line-height:1.4; color:#333;">${comment.content}</p>
                 </div>
                </div>`;
                $list.append(html);
            });
            console.log(res.data.length + "件の感想を表示しました");
        }
    });
};

// --- 「帳面に記す」ボタンが押された時の物語 ---
$(document).on("click", "#btn-feedback-submit", function() {
    const content = $("#feedback-comment").val();
    const userId = $("#selected-user-id").val();
    const mealId = $("#display-final-img").attr("data-meal-id");

    console.log("コメント送信開始:", { userId, mealId, content });

    // バリデーション：誰が何を書くか決まっていないと送れない
    if (!userId) { alert("まずは、上にある自分の名前を選んでくださいね"); return; }
    if (!content) { alert("感想が空欄ですよ"); return; }
    if (!mealId) { return; }

    $.post("api.php", {
        action: "post_comment",
        meal_id: mealId,
        user_id: userId,
        content: content
    }, (res) => {
        console.log("送信成功:", res);
        $("#feedback-comment").val(""); // 入力欄を空っぽにする
        refreshComments(mealId);        // タイムラインだけを更新！
    }, "json");
});

})