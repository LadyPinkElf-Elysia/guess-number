const { createApp: myApp } = Vue
myApp({
    data() {
        return {
            classicMap: {
                'easy': { 'name': '经典-简单', 'len': '4', 'repeat': '0', 'purple': '0', 'max': '10', },
                'hard': { 'name': '经典-困难', 'len': '6', 'repeat': '0', 'purple': '0', 'max': '10', },
                'hell': { 'name': '经典-地狱', 'len': '8', 'repeat': '0', 'purple': '0', 'max': '10', },
            },
            customMap: { 'len': '4', 'repeat': '0', 'purple': '0', 'max': '10', },
            baseMap: {
                4: { false: 35, true: 40 },
                6: { false: 50, true: 60 },
                8: { false: 65, true: 80 },
                10: { false: 80, true: 100 },
            },
            scoreMap: {
                4: { 'score': 0, 'rate': 0.30 },
                5: { 'score': 0, 'rate': 0.25 },
                6: { 'score': 0, 'rate': 0.20 },
                7: { 'score': 0, 'rate': 0.15 },
                8: { 'score': 0, 'rate': 0.10 },
                9: { 'score': 0, 'rate': 0.05 },
                10: { 'score': 0, 'rate': 0.00 },
            },
            purpleRate: 0.2,
            game: {
                'Mode': 'classic',
                'Level': '',
                'Name': '',

                'Len': 4,
                'Repeat': false,
                'Purple': false,
                'Max': 10,

                'Input': '',
                'Target': '',
                'Attempts': 0,
                'List': [],
                'Color': [],
                'Msg': '',
                'Win': false,
                'Lost': false,
            },
            hint: {
                'pos': '0',
                'used': 0,
                'max': 2,
                'result': [],
            },
            scores: {
                'base': 0,
                'repeat': 0,
                'purple': 0,
                'attempt': 0,
                'ratio': 0,
                'final': 0,
            },
            AudioSrc: {
                '1': { 'name': '蝶恋花', 'src': "./music/蝶恋花.ogg" },
                '2': { 'name': '世末歌者', 'src': "./music/世末歌者.ogg" },
                '3': { 'name': '千本樱', 'src': "./music/千本樱.ogg" },
                '4': { 'name': '大荒寻梦录', 'src': "./music/大荒寻梦录（高配）.ogg" },
                '5': { 'name': '群青', 'src': "./music/群青.ogg" },
                '6': { 'name': '浴火重生', 'src': "./music/浴火重生.ogg" },
                '7': { 'name': '英雄出征', 'src': "./music/英雄出征.ogg" },
            },
            Music: {
                'index': '1',
                'isPlaying': false,
                'src': "./music/蝶恋花.ogg",
            },
            panel: {
                'mode': false,
                'game': false,
                'score': false,
                'replay': false,
                'settings': false,
                'loading': true,
            },
            history: {
                'recent': [],   //历史战绩
                'replay': {}     //回放对局
            },
            settingMap: {
                'dynamic': '1',
                'historyMax': 10,
            },
            cheatHandler: null,

        }//

    },

    created() {
        this.loadRecord();
        this.computeScore();
    },

    methods: {

        clearGameMode: function () {          //清空模式
            this.game['Mode'] = 'classic';
            this.game['Level'] = '';
            this.game['Name'] = '';
        },

        clearGameData: function () {        //清空数据
            this.game['Len'] = 4;
            this.game['Repeat'] = false;
            this.game['Purple'] = false;
            this.game['Max'] = 10;
        },

        clearGameState: function () {       //清空状态
            this.game['Input'] = '';
            this.game['Target'] = '';
            this.game['Attempts'] = 0;
            this.game['List'] = [];
            this.game['Color'] = [];
            this.game['Msg'] = '';
            this.game['Win'] = false;
            this.game['Lost'] = false;
        },

        clearHint: function () {            //清空提示
            this.hint['pos'] = '0';
            this.hint['used'] = 0;
            this.hint['result'] = [];
        },

        clearGame: function () {               //重置游戏
            this.clearGameMode();
            this.clearGameData();
            this.clearGameState();
            this.clearHint();
        },

        clearRecord: function () {          //清空战绩
            if (!confirm('确定清空战绩？该操作不可逆❗')) {
                return;
            }
            this.history['recent'] = this.history['recent'].filter(i => i.locked);
            this.saveRecord();
        },

        chooseMode: function (modeName) {
            this.clearGame();
            this.game['Mode'] = modeName;

            if (modeName === 'classic') {
                this.setGameClassic('easy');//默认值
            }
            if (modeName === 'custom') {
                this.setGameCustom();
                this.game['Name'] = '自定义4位';
            }
        },

        setGameClassic: function (level) {
            let classic = this.classicMap[level];
            this.game['Level'] = level;
            this.game['Name'] = classic['name'];
            this.game['Len'] = Number(classic['len']);           //字符串0/1转数字
            this.game['Repeat'] = (classic['repeat'] === '1');   //字符串0/1转布尔值
            this.game['Purple'] = (classic['purple'] === '1');
            this.game['Max'] = Number(classic['max']);
            this.computeScore();
        },

        setGameCustom: function () {
            let custom = this.customMap;
            this.game['Name'] = `自定义${custom['len']}位`;
            this.game['Len'] = Number(custom['len']);
            this.game['Repeat'] = (custom['repeat'] === '1');
            this.game['Purple'] = (custom['purple'] === '1');
            this.game['Max'] = Number(custom['max']);
            this.computeScore();
        },

        computeScore: function () {
            let len = this.game['Len'];
            let rep = this.game['Repeat'];
            let pur = this.game['Purple'];
            let max = this.game['Max'];
            let base = this.baseMap[len][rep];

            this.scores['base'] = base;
            this.scores['repeat'] = this.baseMap[len][true] - this.baseMap[len][false];
            this.scores['purple'] = Math.round(base * this.purpleRate);
            let purScore = pur ? 0 : this.scores['purple'];

            let keys = Object.keys(this.scoreMap);  //获得一个字典里的所有键组成的数组

            //let key of keys是循环遍历对象的值，let key in keys是循环遍历对象的序号
            //例如：let key of keys，得到的是数组的值，let key in keys，得到的是数组的下标
            for (let key of keys) {
                this.scoreMap[key]['score'] = Math.round(base * this.scoreMap[key]['rate']);
            }

            this.scores['attempt'] = this.scoreMap[max]['score'];
            this.scores['ratio'] = purScore + this.scores['attempt'];
            this.scores['final'] = base + this.scores['ratio'];
        },

        play: function () {
            let audio = this.$refs.bgm;
            let i = this.Music['index'];
            let src = this.AudioSrc[i]['src'];

            if (!audio.paused) {    //判断是否已经暂停
                audio.pause();      //暂停当前音频或视频
                this.Music['isPlaying'] = false;
            } else {
                audio.src = src;
                audio.load();       //重新加载音频或视频
                audio.play();       //开始播放音频或视频
                this.Music['isPlaying'] = true;
            }
        },

        startGame: function () {
            this.clearGameState();  //保留当前模式和数据，仅清除对局状态和提示重开一把
            this.clearHint();

            this.game['Target'] = this.getTarget();
            this.game['Msg'] = '新局开始';

            if (!this.cheatHandler) {
                this.cheatKey();
            }

            this.showPanel('game');
        },

        showPanel: function (name) {
            for (let key in this.panel) {
                this.panel[key] = false;
            }
            this.panel[name] = true;
        },

        showAnswer: function () {
            alert((this.game['Target'] !== '') ? `答案是：${this.game['Target']} ✅` : " 还没开始游戏 ❗");
        },

        showPosHint: function () {
            if (this.game['Win'] || this.game['Lost']) {
                this.game['Msg'] = '游戏已结束';
                return;
            }
            if (this.game['Target'] === '') {
                this.game['Msg'] = '请先开始游戏';
                return;
            }

            let pos = Number(this.hint['pos']);
            let num = this.game['Target'][pos];
            let f = `第 ${pos + 1} 位数字是：${num}`;

            if (this.hint['result'].includes(f)) {
                this.game['Msg'] = '该位置已提示过，不可重复提示';
                return;
            }

            this.hint['result'].push(f);    //push()方法是往数组后加东西，unshift()方法是往数组前加东西
            this.hint['used']++;
        },

        cheatKey: function () {
            if (this.cheatHandler) {
                document.removeEventListener("keydown", this.cheatHandler);
            }
            this.cheatHandler = (e) => {
                if (e.key === "s") {
                    e.preventDefault();
                    this.showAnswer();
                }
            };
            document.addEventListener("keydown", this.cheatHandler);

        },

        removeCheatKey: function () {
            if (this.cheatHandler) {
                document.removeEventListener("keydown", this.cheatHandler);
                this.cheatHandler = null;
            }
        },

        getTarget: function () {
            let s = '';
            let arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            let len = this.game['Len'];
            let rep = (!this.game['Repeat']);
            for (let k = 0; k < len; k++) {
                let i = Math.floor(Math.random() * arr.length);
                s += arr[i];
                if (rep) {
                    arr.splice(i, 1);
                }
            }
            return s;
        },

        onInput: function () {
            this.game['Input'] = this.game['Input'].replace(/[^\d]/g, '');
            this.settingMap['historyMax'] = this.settingMap['historyMax'].replace(/\D/g, '').replace(/^0+/, '').slice(0, 2);
            //  /**/：正则表达式包裹符 \d：代表任意数字 0-9 [^\d]：^ 在方括号里 = 取反 → 意思：不是数字的所有字符 
            //  g：全局匹配（global）→ 不止删第一个，全文全部删掉
            //  replace(匹配内容, 替换内容) 匹配：所有非数字 替换成：空字符串 '' = 直接删除
        },

        guess: function () {
            let input = this.game['Input'];
            let target = this.game['Target'];
            let res = this.getResult(input, target);//获得颜色数组
            this.game['List'].push({
                digits: input.split(''),    //对应数字，split('')把字符串切成一个个字符
                colors: res,                 //对应颜色
            });                             //创建键值对

            this.game['Attempts']++;

            if (input === target) {
                this.game['Win'] = true;
                this.game['Msg'] = `恭喜猜对，答案是${this.game['Target']}`;
                this.addRecord();
                this.removeCheatKey();
            } else if (this.game['Attempts'] >= this.game['Max']) {
                this.game['Lost'] = true;
                this.game['Msg'] = `游戏结束，答案是${this.game['Target']}`;
                this.addRecord();
                this.removeCheatKey();
            }

            this.game['Input'] = '';
        },



        getResult: function (userInput, target) {
            let u = userInput.split('');
            let t = target.split('');
            let len = userInput.length;     //length方法，求长度
            let result = [];
            let isDynamic = (this.settingMap['dynamic'] === '1');
            let count = {};

            if (isDynamic) {
                for (let num of t) {
                    count[num] = (count[num] || 0) + 1;
                }
            }

            for (let i = 0; i < len; i++) {
                if (u[i] === t[i]) {
                    result[i] = 'green';
                    if (isDynamic) {
                        count[u[i]]--;
                    }
                } else {
                    result[i] = '';
                }
            }

            if (!this.game['Purple']) {
                this.fillClassic(u, t, result, count, isDynamic);
            } else {
                this.fillPurple(u, t, result, count, isDynamic);
            }
            return result;
        },

        fillClassic: function (u, t, result, count, isDynamic) {
            let len = u.length;
            for (let i = 0; i < len; i++) {
                if (result[i] !== '') continue;

                if (!isDynamic) {
                    result[i] = (t.includes(u[i])) ? 'yellow' : 'red';
                } else {

                    if (count[u[i]] > 0) {
                        result[i] = 'yellow';
                        count[u[i]]--;
                    } else {
                        result[i] = 'red';
                    }

                }
                //
            }
        },

        fillPurple: function (u, t, result, count, isDynamic) {
            let len = u.length;
            for (let i = 0; i < len; i++) {
                if (result[i] !== '') continue;

                if (!isDynamic) {
                    let pos = t.indexOf(u[i]);

                    if (pos !== -1) {
                        result[i] = (pos < i) ? 'yellow' : 'purple';
                    } else {
                        result[i] = 'red';
                    }

                } else {

                    if (count[u[i]] > 0) {
                        let pos = t.indexOf(u[i]);
                        result[i] = (pos < i) ? 'yellow' : 'purple';
                        count[u[i]]--;
                    } else {
                        result[i] = 'red';
                    }

                }
                //
            }
        },

        confirm: function () {
            if (this.game['Win'] || this.game['Lost']) {
                return true;
            }

            return (this.game['Input'].length == this.game['Len']) ? false : true;
        },

        addRecord: function () {
            this.history['recent'].unshift({
                'gameName': this.game['Name'],
                'attempt': this.game['Attempts'],
                'max': this.game['Max'],
                'score': (this.game['Win']) ? this.scores['final'] : 0,
                'win': this.game['Win'],
                'list': this.game['List'],
                'locked': false,
            });

            let maxCount = Number(this.settingMap['historyMax']);
            let locked = this.history['recent'].filter(i => i.locked);
            let unlocked = this.history['recent'].filter(i => !i.locked);

            if (unlocked.length > maxCount) {
                unlocked.splice(maxCount);
                //修改数组（删除、添加、替换），splice(1, 1) // 从下标 1 删 1 个，splice(8) // 保留前 8 个，splice(1, 0, 99) // 在下标1插入99
            }

            this.history['recent'] = [...locked, ...unlocked];

            this.saveRecord();
        },

        saveRecord: function () {
            localStorage.setItem('RecentGames', JSON.stringify(this.history['recent']));
        },

        loadRecord: function () {
            let r = localStorage.getItem('RecentGames');
            if (r) {
                this.history['recent'] = JSON.parse(r).map(record => {
                    record['locked'] = record['locked'] ?? false;
                    return record;
                });
            }
        },

        openReplay: function (record) {
            this.history['replay'] = record;
            this.showPanel('replay');
        },

        switchLock: function (index) {
            let record = this.history['recent'][index];
            record['locked'] = !record['locked'];
            this.saveRecord();
        },

    }
}).mount('#app')
