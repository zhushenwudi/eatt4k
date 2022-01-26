let isDesktop = navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i) ? false : true;
let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
document.write('<style type="text/css">' +
    'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
    (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
        '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
    '</style>');
let map = { 'd': 1, 'f': 2, 'j': 3, 'k': 4 };
let key = ['0'];
let len = key.length;
let __Time = 20;

function isplaying() {
    return document.getElementById('welcome').style.display == 'none' &&
        document.getElementById('GameScoreLayer').style.display == 'none' &&
        document.getElementById("setting").style.display == 'none';
}

if (isDesktop) {
    document.write('<div id="gameBody">');
    document.onkeydown = function (e) {
        let key = e.key.toLowerCase();
        if (Object.keys(map).indexOf(key) !== -1 && isplaying()) {
            click(map[key]);
        }
    }
}

let body, blockSize, GameLayer = [],
    GameLayerBG, touchArea = [],
    GameTimeLayer;
let transform, transitionDuration;

function init() {
    showWelcomeLayer();
    body = document.getElementById('gameBody') || document.body;
    body.style.height = window.innerHeight + 'px';
    transform = typeof (body.style.webkitTransform) != 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !=
        'undefined' ? 'msTransform' : 'transform');
    transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');
    GameTimeLayer = document.getElementById('GameTimeLayer');
    GameLayer.push(document.getElementById('GameLayer1'));
    GameLayer[0].children = GameLayer[0].querySelectorAll('div');
    GameLayer.push(document.getElementById('GameLayer2'));
    GameLayer[1].children = GameLayer[1].querySelectorAll('div');
    GameLayerBG = document.getElementById('GameLayerBG');
    if (GameLayerBG.ontouchstart === null) {
        GameLayerBG.ontouchstart = gameTapEvent;
    } else {
        GameLayerBG.onmousedown = gameTapEvent;
    }
    gameInit();
    initSetting(1);
    window.addEventListener('resize', refreshSize, false);
    let btn = document.getElementById('ready-btn');
    btn.className = 'btn btn-primary btn-lg';
    btn.onclick = function () {
        closeWelcomeLayer();
    }
}

function winOpen() {
    window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
    let opened = window.open('about:blank', '_self');
    opened.opener = null;
    opened.close();
}
let refreshSizeTime;

function refreshSize() {
    clearTimeout(refreshSizeTime);
    refreshSizeTime = setTimeout(_refreshSize, 200);
}

function _refreshSize() {
    countBlockSize();
    for (let i = 0; i < GameLayer.length; i++) {
        let box = GameLayer[i];
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j],
                rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
        }
    }
    let f, a;
    if (GameLayer[0].y > GameLayer[1].y) {
        f = GameLayer[0];
        a = GameLayer[1];
    } else {
        f = GameLayer[1];
        a = GameLayer[0];
    }
    let y = ((_gameBBListIndex) % 10) * blockSize;
    f.y = y;
    f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
    a.y = -blockSize * Math.floor(f.children.length / 4) + y;
    a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
}

function countBlockSize() {
    blockSize = body.offsetWidth / 4;
    body.style.height = window.innerHeight + 'px';
    GameLayerBG.style.height = window.innerHeight + 'px';
    touchArea[0] = window.innerHeight - blockSize * 0;
    touchArea[1] = window.innerHeight - blockSize * 3;
}
let _gameBBList = [],
    _gameBBListIndex = 0,
    _gameOver = false,
    _gameStart = false,
    _gameTime, _gameTimeNum, _gameScore, _date1, deviation_time;

function gameInit() {
    createjs.Sound.registerSound({
        src: "./static/music/err.mp3",
        id: "err"
    });
    createjs.Sound.registerSound({
        src: "./static/music/end.mp3",
        id: "end"
    });
    createjs.Sound.registerSound({
        src: "./static/music/tap.mp3",
        id: "tap"
    });
    gameRestart();
}

let last = 0, lkey = 0;

function gameRestart() {
    last = 0;
    lkey = 0;
    _gameBBList = [];
    _gameBBListIndex = 0;
    _gameScore = 0;
    _gameOver = false;
    _gameStart = false;
    _gameTimeNum = __Time;
    GameTimeLayer.innerHTML = creatTimeText(_gameTimeNum);
    countBlockSize();
    refreshGameLayer(GameLayer[0]);
    refreshGameLayer(GameLayer[1], 1);
}

function gameStart() {
    _date1 = new Date();
    _gameStart = true;
    _gameTimeNum = __Time;
    _gameTime = setInterval(gameTime, 1000);
}

function gameOver() {
    _gameOver = true;
    clearInterval(_gameTime);
    setTimeout(function () {
        GameLayerBG.className = '';
        showGameScoreLayer();
    }, 1500);
}

function gameTime() {
    _gameTimeNum--;
    if (_gameTimeNum <= 0) {
        GameTimeLayer.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;时间到！';
        gameOver();
        GameLayerBG.className += ' flash';
        createjs.Sound.play("end");
    } else {
        GameTimeLayer.innerHTML = creatTimeText(_gameTimeNum);
    }
}

function creatTimeText(n) {
    return '&nbsp;剩余时间:' + n;
}

let _ttreg = / t{1,2}(\d+)/,
    _clearttClsReg = / t{1,2}\d+| bad/;

function refreshGameLayer(box, loop, offset) {
    let i = 0;
    if (key[last] == '0') {
        i = Math.floor(Math.random() * 1000) % 4;
        let pos = last - 1;
        if (pos == -1) {
            pos = len - 1;
        }
        if (key[pos] == '5') {
            if (i == lkey) {
                i++;
                if (i == 4) {
                    i = 0;
                }
            }
        }
    }
    else if (key[last] == '5') {
        i = Math.floor(Math.random() * 1000) % 4;
        let pos = last + 1;
        if (pos == len) {
            pos = 0;
        }
        if (key[pos] >= '1' && key[pos] <= '4') {
            if (i == parseInt(key[pos]) - 1) {
                i++;
                if (i == 4) {
                    i = 0;
                }
            }
        }
        if (i == lkey) {
            i++;
            if (i == 4) {
                i = 0;
            }
        }
    }
    else if (key[last] == '6') {
        i = lkey;
    }
    else {
        i = parseInt(key[last]) - 1;
    }
    lkey = i;
    i += (loop ? 0 : 4);
    last++;
    if (last == len) {
        last = 0;
    }
    for (let j = 0; j < box.children.length; j++) {
        let r = box.children[j],
            rstyle = r.style;
        rstyle.left = (j % 4) * blockSize + 'px';
        rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
        rstyle.width = blockSize + 'px';
        rstyle.height = blockSize + 'px';
        r.className = r.className.replace(_clearttClsReg, '');
        if (i == j) {
            _gameBBList.push({
                cell: i % 4,
                id: r.id
            });
            r.className += ' t' + (Math.floor(Math.random() * 1000) % 5 + 1);
            r.notEmpty = true;
            if (j < box.children.length - 4) {
                i = 0;
                if (key[last] == '0') {
                    i = Math.floor(Math.random() * 1000) % 4;
                    let pos = last - 1;
                    if (pos == -1) {
                        pos = len - 1;
                    }
                    if (key[pos] == '5') {
                        if (i == lkey) {
                            i++;
                            if (i == 4) {
                                i = 0;
                            }
                        }
                    }
                }
                else if (key[last] == '5') {
                    i = Math.floor(Math.random() * 1000) % 4;
                    let pos = last + 1;
                    if (pos == len) {
                        pos = 0;
                    }
                    if (key[pos] >= '1' && key[pos] <= '4') {
                        if (i == parseInt(key[pos]) - 1) {
                            i++;
                            if (i == 4) {
                                i = 0;
                            }
                        }
                    }
                    if (i == lkey) {
                        i++;
                        if (i == 4) {
                            i = 0;
                        }
                    }
                }
                else if (key[last] == '6') {
                    i = lkey;
                }
                else {
                    i = parseInt(key[last]) - 1;
                }
                lkey = i;
                i += (Math.floor(j / 4) + 1) * 4;
                last++;
                if (last == len) {
                    last = 0;
                }
            }
        } else {
            r.notEmpty = false;
        }
    }
    if (loop) {
        box.style.webkitTransitionDuration = '0ms';
        box.style.display = 'none';
        box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
        setTimeout(function () {
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
            setTimeout(function () {
                box.style.display = 'block';
            }, 100);
        }, 200);
    } else {
        box.y = 0;
        box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
    }
    box.style[transitionDuration] = '150ms';
}

function gameLayerMoveNextRow() {
    for (let i = 0; i < GameLayer.length; i++) {
        let g = GameLayer[i];
        g.y += blockSize;
        if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
            refreshGameLayer(g, 1, -1);
        } else {
            g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
        }
    }
}

function gameTapEvent(e) {
    if (_gameOver) {
        return false;
    }
    let tar = e.target;
    let y = e.clientY || e.targetTouches[0].clientY,
        x = (e.clientX || e.targetTouches[0].clientX) - body.offsetLeft,
        p = _gameBBList[_gameBBListIndex];
    if (y > touchArea[0] || y < touchArea[1]) {
        return false;
    }
    if ((p.id == tar.id && tar.notEmpty) || (p.cell == 0 && x < blockSize) || (p.cell == 1 && x > blockSize && x < 2 *
        blockSize) || (p.cell == 2 && x > 2 * blockSize && x < 3 * blockSize) || (p.cell == 3 && x > 3 * blockSize)) {
        if (!_gameStart) {
            gameStart();
        }
        createjs.Sound.play("tap");
        tar = document.getElementById(p.id);
        tar.className = tar.className.replace(_ttreg, ' tt$1');
        _gameBBListIndex++;
        _gameScore++;
        gameLayerMoveNextRow();
    } else if (_gameStart && !tar.notEmpty) {
        createjs.Sound.play("err");
        gameOver();
        tar.className += ' bad';
    }
    return false;
}

function createGameLayer() {
    let html = '<div id="GameLayerBG">';
    for (let i = 1; i <= 2; i++) {
        let id = 'GameLayer' + i;
        html += '<div id="' + id + '" class="GameLayer">';
        for (let j = 0; j < 10; j++) {
            for (let k = 0; k < 4; k++) {
                html += '<div id="' + id + '-' + (k + j * 4) + '" num="' + (k + j * 4) + '" class="block' + (k ? ' bl' : '') +
                    '"></div>';
            }
        }
        html += '</div>';
    }
    html += '</div>';
    html += '<div id="GameTimeLayer"></div>';
    return html;
}

function closeWelcomeLayer() {
    let l = document.getElementById('welcome');
    l.style.display = 'none';
}

function showWelcomeLayer() {
    let l = document.getElementById('welcome');
    l.style.display = 'block';
}

function showGameScoreLayer() {
    let l = document.getElementById('GameScoreLayer');
    let c = document.getElementById(_gameBBList[_gameBBListIndex - 1].id).className.match(_ttreg)[1];
    l.className = l.className.replace(/bgc\d/, 'bgc' + c);
    document.getElementById('GameScoreLayer-text').innerHTML = shareText(_gameScore);
    let score_text = '在 ' + __Time.toString() + ' 秒中，您坚持了 ' + (__Time - _gameTimeNum).toString() + ' 秒哦！<br><br>您的得分为 ';
    score_text += deviation_time < __Time * 1000 + 3000 ? _gameScore : "<span style='color:red;'>" + _gameScore + "</span>";
    score_text += '<br>您平均每秒点击了 ';
    score_text += deviation_time < __Time * 1000 + 3000 ? (_gameScore / (__Time - _gameTimeNum)).toFixed(2) :
        "<span style='color:red;'>" + (_gameScore / (__Time - _gameTimeNum)).toFixed(2);
    score_text += "</span>" + ' 次哦！';
    document.getElementById('GameScoreLayer-score').innerHTML = score_text;
    let bast = cookie('bast-score');
    if (deviation_time < __Time * 1000 + 3000) {
        if (!bast || _gameScore > bast) {
            bast = _gameScore;
            cookie('bast-score', bast, 100);
        }
    }
    document.getElementById('GameScoreLayer-bast').innerHTML = '历史最佳得分 ' + bast;
    let now = '您的自定义键型为：' + key.join('');
    document.getElementById('now').innerHTML = now;
    l.style.display = 'block';
}

function hideGameScoreLayer() {
    let l = document.getElementById('GameScoreLayer');
    l.style.display = 'none';
}

function replayBtn() {
    gameRestart();
    hideGameScoreLayer();
}

function backBtn() {
    gameRestart();
    hideGameScoreLayer();
    showWelcomeLayer();
}

function shareText(score) {
    let date2 = new Date();
    deviation_time = (date2.getTime() - _date1.getTime())
    if (deviation_time > __Time * 1000 + 3000) {
        return '实际时间比设置时间多了' + ((deviation_time / 1000) - __Time).toFixed(2) + "秒，本次成绩作废哦！";
    }
    if (score <= 2.5 * __Time) return '就这？群m都要嘲笑你！';
    if (score <= 5 * __Time) return '一般般，索然无味！';
    if (score <= 7.5 * __Time) return '啊~四可酱性奋了起来~';
    if (score <= 10 * __Time) return '四可酱喵喵叫了起来~';
    return '四可酱露出了心心眼（）';
}

function toStr(obj) {
    if (typeof obj == 'object') {
        return JSON.stringify(obj);
    } else {
        return obj;
    }
}

function cookie(name, value, time) {
    if (name) {
        if (value) {
            if (time) {
                let date = new Date();
                date.setTime(date.getTime() + 864e5 * time), time = date.toGMTString();
            }
            return document.cookie = name + "=" + escape(toStr(value)) + (time ? "; expires=" + time + (arguments[3] ?
                "; domain=" + arguments[3] + (arguments[4] ? "; path=" + arguments[4] + (arguments[5] ? "; secure" : "") : "") :
                "") : ""), !0;
        }
        return value = document.cookie.match("(?:^|;)\\s*" + name.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1") + "=([^;]*)"),
            value = value && "string" == typeof value[1] ? unescape(value[1]) : !1, (/^(\{|\[).+\}|\]$/.test(value) ||
                /^[0-9]+$/g.test(value)) && eval("value=" + value), value;
    }
    let data = {};
    value = document.cookie.replace(/\s/g, "").split(";");
    for (let i = 0; value.length > i; i++) name = value[i].split("="), name[1] && (data[name[0]] = unescape(name[1]));
    return data;
}

document.write(createGameLayer());

function initSetting(flag) {
    if (!flag) {
        return;
    }
    if (cookie("keyboard")) {
        document.getElementById("keyboard").value = cookie("keyboard");
        map = {}
        map[cookie("keyboard").charAt(0).toLowerCase()] = 1;
        map[cookie("keyboard").charAt(1).toLowerCase()] = 2;
        map[cookie("keyboard").charAt(2).toLowerCase()] = 3;
        map[cookie("keyboard").charAt(3).toLowerCase()] = 4;
    }
    if (cookie("limit")) {
        document.getElementById("timeinput").value = cookie("limit");
        __Time = parseInt(cookie("limit"));
        GameTimeLayer.innerHTML = creatTimeText(__Time);
    }
    if (cookie("note")) {
        document.getElementById("note").value = cookie("note");
        key = note.split('');
        len = key.length;
        gameRestart();
    }
}

function show_btn() {
    document.getElementById("tt").style.display = "block";
    document.getElementById("ttt").style.display = "block";
    document.getElementById("btn_group").style.display = "block";
    document.getElementById("btn_group2").style.display = "block";
    document.getElementById("setting").style.display = "none";
}

function show_setting() {
    var str = ['d', 'f', 'j', 'k'];
    for (var ke in map) {
        str[map[ke] - 1] = ke.charAt(0);
    }
    document.getElementById("keyboard").value = str.join('');
    document.getElementById("timeinput").value = __Time.toString();
    document.getElementById("note").value = key.join('');
    document.getElementById("btn_group").style.display = "none";
    document.getElementById("btn_group2").style.display = "none";
    document.getElementById("tt").style.display = "none";
    document.getElementById("ttt").style.display = "none";
    document.getElementById("setting").style.display = "block";
}

function save_cookie() {
    let str = document.getElementById("keyboard").value;
    let Time = document.getElementById("timeinput").value;
    let note = document.getElementById("note").value;
    map = {};
    map[str.charAt(0).toLowerCase()] = 1;
    map[str.charAt(1).toLowerCase()] = 2;
    map[str.charAt(2).toLowerCase()] = 3;
    map[str.charAt(3).toLowerCase()] = 4;
    __Time = parseInt(Time);
    GameTimeLayer.innerHTML = creatTimeText(__Time);
    key = note.split('');
    len = key.length;
    cookie('keyboard', str, 100);
    cookie('limit', Time, 100);
    cookie('note', note, 100);
    initSetting(0);
    gameRestart();
}

function isnull(val) {
    let str = val.replace(/(^\s*)|(\s*$)/g, '');
    if (str == '' || str == undefined || str == null) {
        return true;
    } else {
        return false;
    }
}

function click(index) {
    let p = _gameBBList[_gameBBListIndex];
    let base = parseInt(document.getElementById(p.id).getAttribute("num")) - p.cell;
    let num = base + index - 1;
    let id = p.id.substring(0, 11) + num;

    let fakeEvent = {
        clientX: ((index - 1) * blockSize + index * blockSize) / 2 + body.offsetLeft,
        // Make sure that it is in the area
        clientY: (touchArea[0] + touchArea[1]) / 2,
        target: document.getElementById(id),
    };

    gameTapEvent(fakeEvent)
}

function foreach() {
    var strCookie = document.cookie;
    var arrCookie = strCookie.split("; "); // 将多cookie切割为多个名/值对
    for (var i = 0; i < arrCookie.length; i++) { // 遍历cookie数组，处理每个cookie对
        var arr = arrCookie[i].split("=");
        if (arr.length > 0)
            DelCookie(arr[0]);
    }
}

function GetCookieVal(offset) {
    var endstr = document.cookie.indexOf(";", offset);
    if (endstr == -1)
        endstr = document.cookie.length;
    return decodeURIComponent(document.cookie.substring(offset, endstr));
}
function DelCookie(name) {
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval = GetCookie(name);
    document.cookie = name + "=" + cval + "; expires=" + exp.toGMTString();
}

function GetCookie(name) {
    var arg = name + "=";
    var alen = arg.length;
    var clen = document.cookie.length;
    var i = 0;
    while (i < clen) {
        var j = i + alen;
        if (document.cookie.substring(i, j) == arg)
            return GetCookieVal(j);
        i = document.cookie.indexOf(" ", i) + 1;
        if (i == 0) break;
    }
    return null;
}

function autoset(asss) {
    key = asss.split('');
    len = key.length;
    cookie('note', note, 100);
    gameRestart();
}
