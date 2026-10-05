class HorrorAudio {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.ambientNode = null;
        this.speechSynth = window.speechSynthesis;
        this.pendingSpeech = null;
        this.init();
        if (this.speechSynth) {
            this.speechSynth.getVoices();
            this.speechSynth.onvoiceschanged = () => { this.speechSynth.getVoices(); };
        }
    }
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }
    createAmbient() {
        if (!this.ctx || this.ambientNode) return;
        const bufferSize = 2 * this.ctx.sampleRate,
            buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate),
            data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.06;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 350;
        filter.Q.value = 0.5;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.12;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
        this.ambientNode = { noise, filter, gain };
    }
    stopAmbient() {
        if (this.ambientNode) {
            this.ambientNode.noise.stop();
            this.ambientNode = null;
        }
    }
    playJumpScare() {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator(),
            gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.55);
        const osc2 = this.ctx.createOscillator(),
            gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(120, this.ctx.currentTime);
        gain2.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start();
        osc2.stop(this.ctx.currentTime + 0.6);
    }
    playClick() {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator(),
            gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    speak(text, options = {}) {
        if (!this.speechSynth || !this.enabled) return;
        if (this.pendingSpeech) { this.speechSynth.cancel(); }
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = options.lang || 'zh-CN';
        utter.rate = options.rate || 0.3;
        utter.pitch = options.pitch || 0.12;
        utter.volume = options.volume || 1;
        const voices = this.speechSynth.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('zh') && v.name.includes('Female')) || voices[0];
        if (preferredVoice) utter.voice = preferredVoice;
        this.pendingSpeech = utter;
        utter.onend = () => { this.pendingSpeech = null; };
        this.speechSynth.speak(utter);
    }
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAmbient();
            if (this.ctx) this.ctx.suspend();
            if (this.speechSynth) this.speechSynth.cancel();
        } else {
            if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
            if (game.getHorrorActive()) this.createAmbient();
        }
        document.getElementById('soundToggle').classList.toggle('muted', !this.enabled);
        document.getElementById('soundToggle').textContent = this.enabled ? '🔊 音效' : '🔇 静音';
    }
}

const game = {
    year: 2013, month: 1, balance: 300.0, reputation: 0.0, ap: 100,
    rdPoints: 0, acPoints: 0, comPoints: 0, totalUsers: 50, lastSubmits: 300, lastSolutions: 0,
    high: 0, medium: 0, low: 0, diskTotal: 20.0, diskUsed: 0.0,
    webCores: 2, webLevel: 1, judgeCores: 1, judgeLevel: 1,
    staff: [], staffLimit: 20,
    features: { difficulty: false, solution: false, discuss: false, team: false, school: false, api: false },
    loans: [], deposits: [], cardBalance: 0.0, userGrowthBoost: 1.0, continuousFailMonths: 0,
    yinQi: 0, yinDe: 50, ghostMoney: 0, ghostRitualCount: 0, talismanUsed: 0, ghostCooperateSuccess: 0, ghostEventCount: 0,
    courses: [
        { id: 'beginner', name: '入门课', level: 0, maxLevel: 3, openCost: { money: 5000, ac: 120 }, upgradeCost: { money: 4000, ac: 120 }, baseIncome: 8000, monthly: 1800, cooldown: 0 },
        { id: 'basic', name: '基础课', level: 0, maxLevel: 3, openCost: { money: 7000, ac: 180 }, upgradeCost: { money: 6000, ac: 170 }, baseIncome: 12000, monthly: 2600, cooldown: 0 },
        { id: 'intermediate', name: '提高课', level: 0, maxLevel: 5, openCost: { money: 12000, ac: 280 }, upgradeCost: { money: 12000, ac: 230 }, baseIncome: 20000, monthly: 3500, cooldown: 0 },
        { id: 'sprint', name: '冲刺班', level: 0, maxLevel: 3, openCost: { money: 24000, ac: 240 }, upgradeCost: { money: 24000, ac: 240 }, baseIncome: 32000, monthly: 4400, cooldown: 0 },
        { id: 'national', name: '国赛班', level: 0, maxLevel: 5, openCost: { money: 48000, ac: 480 }, upgradeCost: { money: 30000, ac: 350 }, baseIncome: 40000, monthly: 5200, cooldown: 0 }
    ],
    transactions: [], logEntries: [],
    achievements: [
        { id: 'a1', name: '起步', desc: '招聘第一个员工', unlocked: false, ghost: false },
        { id: 'a2', name: '借贷', desc: '成功贷款一次', unlocked: false, ghost: false },
        { id: 'a3', name: '储蓄', desc: '存入一笔定期存款', unlocked: false, ghost: false },
        { id: 'a4', name: '用户100', desc: '用户达到100', unlocked: false, ghost: false },
        { id: 'a5', name: '用户500', desc: '用户达到500', unlocked: false, ghost: false },
        { id: 'a6', name: '用户1000', desc: '用户达到1000', unlocked: false, ghost: false },
        { id: 'a7', name: '用户5000', desc: '用户达到5000', unlocked: false, ghost: false },
        { id: 'a8', name: '用户10000', desc: '用户达到10000', unlocked: false, ghost: false },
        { id: 'a9', name: '用户20000', desc: '用户达到20000', unlocked: false, ghost: false },
        { id: 'a10', name: '用户50000', desc: '用户达到50000', unlocked: false, ghost: false },
        { id: 'a11', name: '网校', desc: '解锁网校功能', unlocked: false, ghost: false },
        { id: 'a12', name: '赛事', desc: '举办一次比赛', unlocked: false, ghost: false },
        { id: 'a13', name: '赛事达人', desc: '举办10次比赛', unlocked: false, ghost: false },
        { id: 'a14', name: '题库100', desc: '总题库达到100题', unlocked: false, ghost: false },
        { id: 'a15', name: '题库500', desc: '总题库达到500题', unlocked: false, ghost: false },
        { id: 'a16', name: '题库1000', desc: '总题库达到1000题', unlocked: false, ghost: false },
        { id: 'a17', name: '题库2000', desc: '总题库达到2000题', unlocked: false, ghost: false },
        { id: 'a18', name: '架构', desc: '进行一次架构升级', unlocked: false, ghost: false },
        { id: 'a19', name: '架构大师', desc: '进行5次架构升级', unlocked: false, ghost: false },
        { id: 'a20', name: '信誉1', desc: '信誉达到1.0', unlocked: false, ghost: false },
        { id: 'a21', name: '信誉1.5', desc: '信誉达到1.5', unlocked: false, ghost: false },
        { id: 'a22', name: '信誉1.8', desc: '信誉达到1.8', unlocked: false, ghost: false },
        { id: 'a23', name: '开课', desc: '开设一门网课', unlocked: false, ghost: false },
        { id: 'a24', name: '课程大师', desc: '所有网课均开课', unlocked: false, ghost: false },
        { id: 'a25', name: '课程满级', desc: '任意网课升满级', unlocked: false, ghost: false },
        { id: 'a26', name: 'API', desc: '解锁评测API', unlocked: false, ghost: false },
        { id: 'a27', name: '团队壮大', desc: '拥有15名员工', unlocked: false, ghost: false },
        { id: 'a28', name: '研发团队', desc: '研发员工达到5人(需≥15员工)', unlocked: false, ghost: false },
        { id: 'a29', name: '学术团队', desc: '学术员工达到5人(需≥15员工)', unlocked: false, ghost: false },
        { id: 'a30', name: '社区团队', desc: '社区员工达到5人(需≥15员工)', unlocked: false, ghost: false },
        { id: 'a31', name: '硬盘100', desc: '硬盘总容量100GB', unlocked: false, ghost: false },
        { id: 'a32', name: '硬盘500', desc: '硬盘总容量500GB', unlocked: false, ghost: false },
        { id: 'a33', name: '硬盘1000', desc: '硬盘总容量1000GB', unlocked: false, ghost: false },
        { id: 'a34', name: '硬盘5000', desc: '硬盘总容量5000GB', unlocked: false, ghost: false },
        { id: 'a35', name: 'Web10核', desc: 'Web核心达到10核', unlocked: false, ghost: false },
        { id: 'a36', name: 'Web20核', desc: 'Web核心达到20核', unlocked: false, ghost: false },
        { id: 'a37', name: '评测10核', desc: '评测核心达到10核', unlocked: false, ghost: false },
        { id: 'a38', name: '评测20核', desc: '评测核心达到20核', unlocked: false, ghost: false },
        { id: 'a39', name: '广告', desc: '投放一次广告', unlocked: false, ghost: false },
        { id: 'a40', name: '广告狂人', desc: '投放10次广告', unlocked: false, ghost: false },
        { id: 'a41', name: '捐款', desc: '号召捐款一次', unlocked: false, ghost: false },
        { id: 'a42', name: '慈善家', desc: '号召捐款10次', unlocked: false, ghost: false },
        { id: 'a43', name: '贷款达人', desc: '贷款总额超50000', unlocked: false, ghost: false },
        { id: 'a44', name: '存款达人', desc: '存款总额超50000', unlocked: false, ghost: false },
        { id: 'a45', name: '连续盈利3', desc: '连续3月净收入为正', unlocked: false, ghost: false },
        { id: 'a46', name: '连续盈利6', desc: '连续6月净收入为正', unlocked: false, ghost: false },
        { id: 'a47', name: '连续盈利12', desc: '连续12月净收入为正', unlocked: false, ghost: false },
        { id: 'a48', name: '知识库', desc: '高质量题库超100', unlocked: false, ghost: false },
        { id: 'a49', name: '水题大王', desc: '低质量题库超500', unlocked: false, ghost: false },
        { id: 'a50', name: '完美运营', desc: '存活至2026年1月', unlocked: false, ghost: false },
        { id: 'a51', name: '初次合作', desc: '成功进行一次合作', unlocked: false, ghost: false },
        { id: 'a52', name: '合作专家', desc: '成功进行5次合作', unlocked: false, ghost: false },
        { id: 'a53', name: '事件初体验', desc: '经历一次随机事件', unlocked: false, ghost: false },
        { id: 'a54', name: '事件收藏家', desc: '经历10种不同事件', unlocked: false, ghost: false },
        { id: 'a55', name: '祸不单行', desc: '连续3月遭遇负面事件', unlocked: false, ghost: false },
        { id: 'a56', name: '好运连连', desc: '连续3月遭遇正面事件', unlocked: false, ghost: false },
        { id: 'a57', name: '大起大落', desc: '单月事件收益>10000或损失>5000', unlocked: false, ghost: false },
        { id: 'a58', name: '幸运儿', desc: '单次事件获得>5000用户', unlocked: false, ghost: false },
        { id: 'a59', name: '倒霉蛋', desc: '单次事件损失>3000资金', unlocked: false, ghost: false },
        { id: 'a60', name: '事件大师', desc: '经历所有20种随机事件', unlocked: false, ghost: false },
        { id: 'a61', name: '科研先锋', desc: '成功进行一次科研合作', unlocked: false, ghost: false },
        { id: 'a62', name: '国际视野', desc: '成功进行一次跨国合作', unlocked: false, ghost: false },
        { id: 'a63', name: '政府信任', desc: '成功进行一次政府项目', unlocked: false, ghost: false },
        { id: 'a64', name: '博士后', desc: '招聘一名博士后', unlocked: false, ghost: false },
        { id: 'a65', name: '市场专家', desc: '招聘市场专员', unlocked: false, ghost: false },
        { id: 'a66', name: '客服之星', desc: '招聘客服专员', unlocked: false, ghost: false },
        { id: 'a67', name: '人才济济', desc: '员工总数达到20人', unlocked: false, ghost: false },
        { id: 'a68', name: '技术突破', desc: '经历技术突破事件', unlocked: false, ghost: false },
        { id: 'a69', name: '市场波动', desc: '经历市场波动事件', unlocked: false, ghost: false },
        { id: 'a70', name: '黑客克星', desc: '成功抵御黑客入侵', unlocked: false, ghost: false },
        { id: 'a71', name: '开源贡献', desc: '经历开源贡献事件', unlocked: false, ghost: false },
        { id: 'a72', name: '用户投诉', desc: '经历用户投诉事件', unlocked: false, ghost: false },
        { id: 'a73', name: '投资注入', desc: '经历投资注入事件', unlocked: false, ghost: false },
        { id: 'a74', name: '关键员工', desc: '经历关键员工离职事件', unlocked: false, ghost: false },
        { id: 'g1', name: '🕯️阴德圆满', desc: '阴德值达到100', unlocked: false, ghost: true },
        { id: 'g2', name: '🪙纸钱万贯', desc: '纸钱超过10000', unlocked: false, ghost: true },
        { id: 'g3', name: '🔮驱鬼大师', desc: '成功驱鬼10次', unlocked: false, ghost: true },
        { id: 'g4', name: '👻与鬼谋皮', desc: '阴间合作成功', unlocked: false, ghost: true },
        { id: 'g5', name: '🌑血月降临', desc: '经历血月事件', unlocked: false, ghost: true },
        { id: 'g6', name: '🪭黄符护体', desc: '使用黄符保护员工', unlocked: false, ghost: true },
        { id: 'g7', name: '💀阴气冲天', desc: '阴气值达到100', unlocked: false, ghost: true },
        { id: 'g8', name: '☀️阳气旺盛', desc: '阴气值归零', unlocked: false, ghost: true },
        { id: 'g9', name: '🏮鬼市交易', desc: '在鬼市成功交易', unlocked: false, ghost: true },
        { id: 'g10', name: '🪦还魂成功', desc: '召回被吓跑的员工', unlocked: false, ghost: true },
        { id: 'g11', name: '🧟尸变', desc: '员工变成僵尸继续工作', unlocked: false, ghost: true },
        { id: 'g12', name: '💒阴婚', desc: '与阴间达成深度合作', unlocked: false, ghost: true },
        { id: 'g13', name: '📄纸人替身', desc: '用纸人代替离职员工', unlocked: false, ghost: true },
        { id: 'g14', name: '🍵孟婆汤', desc: '重置所有员工满意度', unlocked: false, ghost: true },
        { id: 'g15', name: '👹百鬼夜行', desc: '经历百鬼夜行事件', unlocked: false, ghost: true },
        { id: 'g16', name: '🔒删库跑路', desc: '经历删库跑路事件', unlocked: false, ghost: true },
        { id: 'g17', name: '⛏️服务器挖矿', desc: '服务器被植入挖矿程序', unlocked: false, ghost: true },
        { id: 'g18', name: '📞鬼来电', desc: '接到已故用户的电话', unlocked: false, ghost: true },
        { id: 'g19', name: '🖨️午夜打印', desc: '打印机自动输出诡异内容', unlocked: false, ghost: true },
        { id: 'g20', name: '👁️监控异常', desc: '监控画面中出现不速之客', unlocked: false, ghost: true }
    ],
    contestCount: 0, archUpgradeCount: 0, adCount: 0, donateCount: 0,
    totalLoanAmount: 0.0, totalDepositAmount: 0.0, consecutiveProfit: 0,
    coopSuccessCount: 0, coopResearchSuccess: 0, coopInternationalSuccess: 0, coopGovSuccess: 0,
    eventHistory: [], consecutiveBadEvents: 0, consecutiveGoodEvents: 0,
    lastEventImpact: 0, lastEventUserGain: 0, lastEventMoneyLoss: 0.0, lastEventSuccess: false,
    hasDefendedHack: false, taxManualEnabled: false, pendingTaxData: null,
    jumpScareCooldown: 0, fakeAlertCooldown: 0, horrorWarningShown: false,
    gameOverTriggered: false, fullscreenLocked: false,
    fullscreenMonitorInterval: null, fullscreenRescueInterval: null,
    puzzles: [
        { id: 1, question: "Base64解码：'SGVsbG8gT0o='", answer: "Hello OJ", answered: false },
        { id: 2, question: "凯撒密码(偏移3)：'Khoor Zruog' 解密后是什么？", answer: "Hello World", answered: false },
        { id: 3, question: "斐波那契数列第10项（从0开始）是多少？", answer: "55", answered: false },
        { id: 4, question: "二进制数 101010 对应的十进制是多少？", answer: "42", answered: false },
        { id: 5, question: "程序员最讨厌哪种饮料？(提示：与编译有关)", answer: "咖啡", answered: false },
        { id: 6, question: "纸人借命事件中，纸人背面写着什么？", answer: "用户账号", answered: false, ghostOnly: true },
        { id: 7, question: "冥婚请帖内附的礼物是什么？", answer: "支票", answered: false, ghostOnly: true },
        { id: 8, question: "烧纸驱阴仪式需要消耗多少纸钱？", answer: "100", answered: false, ghostOnly: true },
        { id: 9, question: "黄符护体提升员工多少满意度？", answer: "20", answered: false, ghostOnly: true },
        { id: 10, question: "阴间合作需要阴气值至少达到多少？", answer: "30", answered: false, ghostOnly: true },
        { id: 11, question: "尸变员工的研发能力增加了多少？", answer: "50", answered: false, ghostOnly: true },
        { id: 12, question: "烛龙睁眼事件能降低多少阴气？", answer: "40", answered: false, ghostOnly: true },
        { id: 13, question: "孟婆汤事件将员工满意度重置为多少？", answer: "80", answered: false, ghostOnly: true },
        { id: 14, question: "百鬼夜行事件中网站流失了多少用户(最小范围)？", answer: "800", answered: false, ghostOnly: true },
        { id: 15, question: "血手印出现在哪里？", answer: "服务器硬盘", answered: false, ghostOnly: true }
    ],
    pcThreats: [], desktopOpen: false, currentTool: null, windowOpen: false, sound: null,
    win7ExtraIcons: {
        ie: { label: 'Internet Explorer', desc: '网页浏览器，但这里的网络连接已被监控。' },
        media: { label: 'Windows Media Player', desc: '播放器，但所有媒体文件已被加密。' },
        notepad: { label: '记事本', desc: '一个空白文本文件，似乎记录了奇怪的信息...' },
        calc: { label: '计算器', desc: '计算结果总是返回 404。' }
    },
    random(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    getTotalMonths() { return (this.year - 2013) * 12 + this.month; },
    getHorrorActive() { return document.documentElement.getAttribute('data-theme') === 'horror'; },
    getVisibleAchievements() { return this.achievements.filter(a => this.getHorrorActive() || !a.ghost); },
    getVisiblePuzzles() { return this.puzzles.filter(p => this.getHorrorActive() || !p.ghostOnly); },
    speak(text, options = {}) { if (this.getHorrorActive() && this.sound) { this.sound.speak(text, options); } },
    requestFullscreen() {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    },
    exitFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    },
    isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement); },
    lockFullscreen() {
        if (!this.getHorrorActive() || this.gameOverTriggered) return;
        this.fullscreenLocked = true;
        if (!this.isFullscreen()) this.requestFullscreen();
        this.startFullscreenMonitor();
    },
    unlockFullscreen() {
        this.fullscreenLocked = false;
        this.stopFullscreenMonitor();
        this.stopFullscreenRescue();
        this.exitFullscreen();
    },
    startFullscreenMonitor() {
        this.stopFullscreenMonitor();
        this.fullscreenMonitorInterval = setInterval(() => {
            if (this.fullscreenLocked && !this.gameOverTriggered && this.getHorrorActive()) {
                if (!this.isFullscreen()) { this.requestFullscreen(); }
            } else if (!this.getHorrorActive() || this.gameOverTriggered) {
                this.stopFullscreenMonitor();
            }
        }, 600);
    },
    stopFullscreenMonitor() {
        if (this.fullscreenMonitorInterval) { clearInterval(this.fullscreenMonitorInterval); this.fullscreenMonitorInterval = null; }
    },
    startFullscreenRescue() {
        this.stopFullscreenRescue();
        this.fullscreenRescueInterval = setInterval(() => {
            const overlay = document.getElementById('fsRescueOverlay');
            if (!overlay || !this.fullscreenLocked || this.gameOverTriggered) { this.stopFullscreenRescue(); return; }
            if (this.isFullscreen()) { overlay.remove(); this.stopFullscreenRescue(); return; }
            this.requestFullscreen();
        }, 200);
    },
    stopFullscreenRescue() {
        if (this.fullscreenRescueInterval) { clearInterval(this.fullscreenRescueInterval); this.fullscreenRescueInterval = null; }
    },
    handleFullscreenChange() {
        if (this.getHorrorActive() && this.fullscreenLocked && !this.gameOverTriggered) {
            if (!this.isFullscreen()) {
                this.requestFullscreen();
                setTimeout(() => {
                    if (!this.isFullscreen() && this.fullscreenLocked && !this.gameOverTriggered) {
                        this.showFullscreenRescue();
                    }
                }, 150);
            } else {
                const overlay = document.getElementById('fsRescueOverlay');
                if (overlay) overlay.remove();
                this.stopFullscreenRescue();
            }
        }
    },
    showFullscreenRescue() {
        if (document.getElementById('fsRescueOverlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'fsRescueOverlay';
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.88); z-index: 1000000; display: flex; justify-content: center; align-items: center; flex-direction: column; cursor: pointer;`;
        overlay.innerHTML = `<div style="color:#ff4444; font-size:2rem; font-weight:900; text-align:center; animation:candleFlicker 1.5s infinite; pointer-events:none;">⚠️ 你无法离开 ⚠️</div><div style="color:#a89080; font-size:1rem; margin-top:20px; animation:bloodDrip 2s infinite; pointer-events:none;">请点击下方按钮或屏幕任意位置重新全屏</div><button id="fsRescueBtn" style="margin-top:20px; padding:10px 30px; font-size:1.2rem; background:#8b0000; color:#fff; border:2px solid #ff4444; border-radius:8px; cursor:pointer; z-index:1;">🪟 强制全屏</button><div id="fsRescueError" style="color:#ff4444; margin-top:10px; display:none;">⚠️ 全屏失败，请再次点击按钮或屏幕</div>`;
        document.body.appendChild(overlay);
        const requestFullscreen = () => {
            const el = document.documentElement;
            const promise = el.requestFullscreen ? el.requestFullscreen() : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : el.msRequestFullscreen ? el.msRequestFullscreen() : Promise.reject();
            if (promise && promise.catch) {
                promise.catch(() => {
                    const errorEl = document.getElementById('fsRescueError');
                    if (errorEl) errorEl.style.display = 'block';
                });
            }
        };
        overlay.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') return; requestFullscreen(); });
        document.getElementById('fsRescueBtn').addEventListener('click', (e) => { e.stopPropagation(); requestFullscreen(); });
        this.startFullscreenRescue();
        const checkAndClean = setInterval(() => {
            if (!document.getElementById('fsRescueOverlay') || this.isFullscreen()) {
                clearInterval(checkAndClean);
                const ov = document.getElementById('fsRescueOverlay');
                if (ov) ov.remove();
                this.stopFullscreenRescue();
            }
        }, 300);
        setTimeout(() => clearInterval(checkAndClean), 30000);
    },
    showFakeDialog(title, message, callback, icon = '⚠️') {
        const overlay = document.createElement('div');
        overlay.className = 'fake-dialog-overlay';
        overlay.innerHTML = `<div class="fake-dialog-box"><div class="fake-dialog-titlebar"><span>${icon} ${title}</span><span style="cursor:pointer;font-size:14px;" onclick="this.closest('.fake-dialog-overlay').remove()">✕</span></div><div class="fake-dialog-content"><p>${message}</p></div><div class="fake-dialog-buttons"><button id="fakeDialogOk">确定</button></div></div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#fakeDialogOk').onclick = () => { overlay.remove(); if (callback) callback(); };
        overlay.querySelector('.fake-dialog-titlebar span:last-child').onclick = () => { overlay.remove(); };
    },
    showHorrorConfirmDialog() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fake-dialog-overlay';
            overlay.style.zIndex = '100005';
            overlay.innerHTML = `<div class="fake-dialog-box horror-confirm"><div class="fake-dialog-titlebar"><span>💀 警告：中式恐怖领域</span><span style="cursor:pointer;font-size:14px;color:#ffcccc;" id="horrorCloseX">✕</span></div><div class="fake-dialog-content"><p style="color:#ffcccc;font-size:1.1rem;text-align:center;">你即将进入<strong style="color:#ff4444;">【中式恐怖领域】</strong></p><div class="health-warning">⚠️ 健康警告 ⚠️<br>胆小者 · 心脏病患者 · 癫痫患者<br>高血压 · 孕妇 · 精神脆弱者<br><strong style="font-size:1.2rem;">请 勿 进 入 ！</strong></div><p style="color:#d4c0b4;font-size:0.85rem;">• 全屏模式将被锁定<br>• 游戏期间无法安全退出</p><p style="color:#ff8888;text-align:center;font-weight:bold;">确定要继续吗？</p></div><div class="fake-dialog-buttons"><button class="btn-safe" id="horrorConfirmYes">我已知晓风险，继续</button><button class="btn-danger" id="horrorConfirmNo">退出</button></div></div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#horrorConfirmYes').onclick = () => { overlay.remove(); resolve(true); };
            overlay.querySelector('#horrorConfirmNo').onclick = () => { overlay.remove(); resolve(false); };
            overlay.querySelector('#horrorCloseX').onclick = () => { overlay.remove(); resolve(false); };
        });
    },
    showHorrorWarning() {
        if (this.horrorWarningShown) return;
        this.showFakeDialog('系统警告', '你已进入【中式恐怖领域】。\n\n游戏期间请勿关闭或刷新页面，否则可能触发"文件自毁协议"。\n\n在通关（2026年1月）或失败之前，你将无法安全退出。\n\n全屏模式已锁定。\n\n📌 部分事件参考真实OJ运营案例改编，请谨慎操作。', () => { this.horrorWarningShown = true; this.addLog('🪦 签订生死契...已无法回头', 'ghost'); this.lockFullscreen(); }, '💀');
    },
    simulateFileDeletion() {
        document.querySelectorAll('.fake-dialog-overlay, .fake-cmd-overlay').forEach(e => e.remove());
        const cmd = document.createElement('div');
        cmd.className = 'fake-cmd-overlay';
        cmd.style.display = 'block';
        cmd.innerHTML = '<div style="color:#0f0;">Microsoft Windows [版本 10.0.19045.2486]</div><div style="color:#0f0;">(c) Microsoft Corporation。保留所有权利。</div><div style="color:#0f0;margin-bottom:8px;">C:\\Users\\Administrator></div>';
        document.body.appendChild(cmd);
        const files = ['C:\\Windows\\System32\\drivers\\etc\\hosts','C:\\Windows\\System32\\kernel32.dll','C:\\Windows\\System32\\ntoskrnl.exe','C:\\Program Files\\OJ-Sim\\userdata.db','C:\\OJ\\problems\\problem_*.dat','C:\\OJ\\backups\\backup_2024.sql','C:\\Users\\Ghost\\Documents\\重要文件.docx','D:\\backup\\server_config.ini','System32\\drivers\\tcpip.sys','C:\\Windows\\explorer.exe','C:\\Windows\\System32\\winlogon.exe','C:\\Users\\All Users\\Desktop\\OJ运营数据.xlsx'];
        let index = 0;
        const interval = setInterval(() => {
            if (index < files.length) {
                const line = document.createElement('div');
                line.className = 'fake-cmd-line red';
                line.textContent = `正在删除 ${files[index]} ... [${Math.random() < 0.7 ? '成功' : '权限不足-强制删除'}]`;
                cmd.appendChild(line);
                cmd.scrollTop = cmd.scrollHeight;
                index++;
            } else {
                clearInterval(interval);
                const cl = document.createElement('div');
                cl.className = 'fake-cmd-line yellow';
                cl.textContent = '警告: 系统文件损坏，正在尝试修复...';
                cmd.appendChild(cl);
                const cl2 = document.createElement('div');
                cl2.className = 'fake-cmd-line red';
                cl2.textContent = '修复失败。系统将在 2 秒后崩溃...';
                cmd.appendChild(cl2);
                setTimeout(() => this.showFakeBSOD(), 2500);
            }
        }, 400 + Math.random() * 300);
    },
    showFakeBSOD() {
        document.querySelectorAll('.fake-dialog-overlay, .fake-cmd-overlay').forEach(e => e.remove());
        const bsod = document.createElement('div');
        bsod.className = 'fake-bsod';
        bsod.style.display = 'block';
        bsod.innerHTML = `<h1>Windows</h1><p>A fatal error occurred. The system has been shut down to prevent damage to your computer.</p><p>*** STOP: 0x0000007B (0xF789E2A5, 0xC0000034, 0x00000000, 0x00000000)</p><p>*** INACCESSIBLE_BOOT_DEVICE</p><p style="margin-top:30px;">If this is the first time you've seen this error,<br>restart your computer. If this screen appears again, follow these steps:</p><p>Check for viruses on your computer. Remove any newly installed hard drives or hard drive controllers.</p><p style="margin-top:40px;color:#aaaaaa;">*** 电脑死机 ***</p><p style="color:#888888;">Collecting crash dump... 87%</p>`;
        document.body.appendChild(bsod);
        this.unlockFullscreen();
        setTimeout(() => {
            bsod.querySelector('p:last-child').textContent = 'Collecting crash dump... 100%';
            setTimeout(() => { bsod.style.background = '#000'; bsod.innerHTML = '<p style="color:#888;text-align:center;margin-top:40%;font-size:20px;">没有响应。</p>'; }, 1500);
        }, 3000);
    },
    triggerRandomFakeAlert() {
        if (this.fakeAlertCooldown > 0) return;
        this.fakeAlertCooldown = 3;
        const alerts = [
            { title: 'Windows 错误', msg: '系统内存不足，请关闭部分程序。\n\n可用内存: 128MB / 4096MB', icon: '⚠️' },
            { title: '安全警告', msg: '检测到未经授权的远程访问！\n来源IP: 198.51.100.15\n端口: 445 (SMB)', icon: '🔒' },
            { title: '磁盘错误', msg: '磁盘 C: 上发现损坏扇区。\n\n扇区: 0x1A3F8B2\n状态: 无法修复', icon: '💾' },
            { title: 'Windows Defender', msg: '检测到威胁: Trojan:Win32/WannaCry\n\n文件: C:\\Windows\\Temp\\mssecsvc.exe\n操作: 隔离失败', icon: '🛡️' },
            { title: '系统通知', msg: 'Windows 更新遇到问题。\n\n错误代码: 0x80070002\n已回滚更改。', icon: '📢' },
            { title: '任务管理器警告', msg: '进程 "oj_server.exe" 内存使用异常。\n当前使用: 3.2GB\n建议: 立即终止', icon: '⚠️' },
            { title: '远程桌面', msg: '检测到来自未知设备的远程桌面连接请求。\n设备名: GHOST-PC\n是否允许？', icon: '🖥️' },
        ];
        const rand = alerts[Math.floor(Math.random() * alerts.length)];
        this.showFakeDialog(rand.title, rand.msg, null, rand.icon);
    },
    triggerJumpScare(type) {
        if (this.jumpScareCooldown > 0 || !this.getHorrorActive()) return;
        const overlay = document.getElementById('jumpScareOverlay'),
            bg = document.getElementById('jumpScareBg'),
            content = document.getElementById('jumpScareContent');
        if (!overlay || !bg || !content) return;
        const scares = [
            { text: '👁️ 你背后有人 👁️', bgClass: 'flash-red', fontSize: '2.5rem' },
            { text: '🩸 血 血 血 🩸', bgClass: 'blood-bg', fontSize: '3.5rem' },
            { text: '💀 还 我 命 来 💀', bgClass: 'flash-red', fontSize: '2.8rem' },
            { text: '👻 嘻 嘻 嘻 👻', bgClass: 'flash-dark', fontSize: '3rem' },
            { text: '🕯️ 烛 灭 了 🕯️', bgClass: 'flash-dark', fontSize: '3.2rem' },
            { text: '📄 纸人笑了 📄', bgClass: 'blood-bg', fontSize: '2.6rem' },
            { text: '🪦 该上路了 🪦', bgClass: 'flash-red', fontSize: '3rem' },
            { text: '👹 我看见你了 👹', bgClass: 'flash-dark', fontSize: '2.4rem' },
            { text: '🫀 你的时间到了 🫀', bgClass: 'blood-bg', fontSize: '2.9rem' },
            { text: '🔪 嘿嘿嘿... 🔪', bgClass: 'flash-red', fontSize: '3.3rem' },
            { text: '📞 有电话找你 📞', bgClass: 'flash-dark', fontSize: '2.7rem' },
            { text: '🖨️ 打印机在响 🖨️', bgClass: 'blood-bg', fontSize: '2.4rem' },
        ];
        const scare = scares[Math.floor(Math.random() * scares.length)];
        content.textContent = scare.text;
        content.style.fontSize = scare.fontSize;
        bg.className = scare.bgClass;
        overlay.classList.add('active');
        document.body.style.animation = 'screenShake 0.5s ease-in-out';
        this.jumpScareCooldown = 5;
        if (this.sound) {
            this.sound.playJumpScare();
            const phrases = ['嘿嘿嘿...', '看见了...', '在这里...', '你跑不掉的...', '来找你了...', '别回头...', '我在你身后...'];
            this.speak(phrases[Math.floor(Math.random() * phrases.length)]);
        }
        setTimeout(() => { overlay.classList.remove('active'); document.body.style.animation = ''; bg.className = ''; content.textContent = ''; }, 1100);
    },
    addLog(msg, type = 'info') {
        if (!this.getHorrorActive() && type === 'ghost') type = 'info';
        this.logEntries.push({ time: `${this.year}.${this.month}`, message: msg, type: type });
        this.renderLog();
    },
    renderLog() {
        const c = document.getElementById('logContainer');
        if (c) c.innerHTML = this.logEntries.slice(-80).map(e => `<div class="log-entry ${e.type}">[${e.time}] ${e.message}</div>`).join('');
    },
    exportLog() {
        let content = 'OJ运营模拟器 日志\n';
        this.logEntries.forEach(e => content += `[${e.time}] ${e.message}\n`);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `oj_log_${this.year}_${this.month}.txt`;
        a.click();
    },
    addTransaction(desc, amount) {
        this.transactions.push({ desc, amount: parseFloat(amount.toFixed(3)) });
        this.renderLedger();
    },
    renderLedger() {
        const c = document.getElementById('ledgerContent');
        if (!c) return;
        let h = '', inc = 0, exp = 0;
        this.transactions.forEach(t => {
            h += `<div class="ledger-row"><span>${t.desc}</span><span class="${t.amount > 0 ? 'ledger-income' : 'ledger-expense'}">${t.amount > 0 ? '+' : ''}$${t.amount.toFixed(3)}</span></div>`;
            if (t.amount > 0) inc += t.amount; else exp += Math.abs(t.amount);
        });
        h += `<div class="ledger-total">总收入:$${inc.toFixed(3)} 支出:$${exp.toFixed(3)} 净:$${(inc - exp).toFixed(3)}</div>`;
        c.innerHTML = h;
    },
    exportLedger() {
        let content = `本月账簿 (${this.year}.${this.month})\n`;
        this.transactions.forEach(t => content += `${t.desc}: ${t.amount > 0 ? '+' : ''}$${t.amount.toFixed(3)}\n`);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `ledger_${this.year}_${this.month}.txt`;
        a.click();
    },
    showNotify(msg, type = 'info') {
        const n = document.getElementById('notification');
        document.getElementById('notifyMsg').innerText = msg;
        n.className = `notification ${type} show`;
        setTimeout(() => n.classList.remove('show'), 3000);
        this.addLog(msg, type);
    },
    toggleTaxMode() {
        this.taxManualEnabled = !this.taxManualEnabled;
        document.getElementById('taxModeDesc').innerText = this.taxManualEnabled ? '开启 (手动核税，+$200/月)' : '关闭 (自动扣税22%)';
        document.getElementById('toggleTaxBtn').innerText = this.taxManualEnabled ? '关闭' : '开启';
        this.addLog(this.taxManualEnabled ? '💀 精算纳税已开启' : '精算纳税已关闭', 'info');
    },
    performRitual() {
        if (!this.getHorrorActive()) return;
        if (this.ghostMoney < 100) return this.showNotify('纸钱不足100', 'warning');
        this.ghostMoney -= 100;
        this.ghostRitualCount++;
        this.yinQi = Math.max(0, this.yinQi - this.random(15, 35));
        this.yinDe = Math.min(100, this.yinDe + this.random(5, 15));
        const reward = this.random(100, 2000);
        this.balance += reward;
        this.addLog(`🕯️烧纸驱阴！阴气降低，阴德上升，获$${reward.toFixed(3)}`, 'ghost');
        this.showNotify(`仪式完成！阴气降低，获得$${reward.toFixed(3)}`, 'success');
        this.speak('急急如律令...散！');
        if (this.yinQi < 30) {
            document.getElementById('cornerGhost')?.classList.remove('visible');
            document.getElementById('edgeHandprint')?.classList.remove('visible');
        }
        this.checkAchievements();
        this.updateUI();
    },
    useTalisman() {
        if (!this.getHorrorActive()) return;
        if (this.ghostMoney < 200) return this.showNotify('纸钱不足200', 'warning');
        this.ghostMoney -= 200;
        this.talismanUsed++;
        this.staff.forEach(e => e.satisfaction = Math.min(100, e.satisfaction + 20));
        this.yinDe = Math.min(100, this.yinDe + 10);
        this.addLog('🪭 黄符护体！全体员工满意度+20', 'ghost');
        this.showNotify('黄符生效！员工满意度大幅提升', 'success');
        this.speak('黄符护体...诸邪退散...');
        this.checkAchievements();
        this.updateUI();
    },
    ghostCooperate() {
        if (!this.getHorrorActive()) return;
        if (this.ghostMoney < 500 || this.yinQi < 30) return this.showNotify('需要500纸钱+阴气>30', 'warning');
        if (this.ap < 10) return this.showNotify('AP不足', 'warning');
        this.ghostMoney -= 500;
        this.ap -= 10;
        this.yinQi += this.random(5, 15);
        this.ghostEventCount++;
        if (Math.random() < 0.4) {
            const gain = this.random(20000, 60000);
            this.balance += gain;
            this.ghostCooperateSuccess++;
            this.yinDe = Math.max(0, this.yinDe - this.random(10, 25));
            this.lastEventImpact = gain;
            this.addLog(`👻阴间合作大成功！获得$${gain.toFixed(3)}`, 'ghost');
            this.showNotify(`阴间合作成功！+$${gain.toFixed(3)}`, 'success');
            this.speak('合作...成了...');
        } else {
            const loss = this.random(5000, 18000);
            this.balance -= loss;
            this.reputation = Math.max(-2, this.reputation - 0.1);
            this.lastEventImpact = -loss;
            this.lastEventMoneyLoss = loss;
            this.addLog(`👻阴间合作失败...损失$${loss.toFixed(3)}`, 'warning');
            this.showNotify('阴间合作失败！', 'warning');
            this.speak('愚蠢的凡人...');
            if (Math.random() < 0.6) this.triggerJumpScare('coopFail');
        }
        this.checkAchievements();
        this.updateUI();
    },
    showWin7ConfirmDialog(title, message, icon = '⚠️') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'fake-dialog-overlay'; overlay.style.zIndex = '10010';
            overlay.innerHTML = `<div class="fake-dialog-box" style="min-width:350px; border-radius:6px; border:1px solid #0078d7; background:#f0f0f0; box-shadow:0 0 20px rgba(0,0,0,0.5); font-family:'Segoe UI',Tahoma,sans-serif;"><div class="fake-dialog-titlebar" style="background:linear-gradient(180deg,#0078d7 0%,#005ba1 100%);"><span>${icon} ${title}</span><span style="cursor:pointer;font-size:14px;color:white;" onclick="this.closest('.fake-dialog-overlay').remove(); resolve(false);">✕</span></div><div class="fake-dialog-content" style="padding:20px; background:white;"><p style="margin:8px 0; font-size:14px; color:#000;">${message}</p></div><div class="fake-dialog-buttons" style="padding:10px; text-align:right; background:#f0f0f0;"><button id="win7ConfirmYes" style="margin-left:8px; padding:4px 20px; background:#e1e1e1; border:1px solid #adadad;">是(Y)</button><button id="win7ConfirmNo" style="margin-left:8px; padding:4px 20px; background:#e1e1e1; border:1px solid #adadad;">否(N)</button></div></div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#win7ConfirmYes').onclick = () => { overlay.remove(); resolve(true); };
            overlay.querySelector('#win7ConfirmNo').onclick = () => { overlay.remove(); resolve(false); };
        });
    },
    showWin7InfoDialog(title, message) {
        const overlay = document.createElement('div');
        overlay.className = 'fake-dialog-overlay'; overlay.style.zIndex = '10010';
        overlay.innerHTML = `<div class="fake-dialog-box" style="min-width:350px; border-radius:6px; border:1px solid #0078d7; background:#f0f0f0;"><div class="fake-dialog-titlebar" style="background:linear-gradient(180deg,#0078d7 0%,#005ba1 100%);"><span>ℹ️ ${title}</span><span style="cursor:pointer;font-size:14px;color:white;" onclick="this.closest('.fake-dialog-overlay').remove()">✕</span></div><div class="fake-dialog-content" style="padding:20px; background:white;"><p style="margin:8px 0; font-size:14px; color:#000; white-space:pre-line;">${message}</p></div><div class="fake-dialog-buttons" style="padding:10px; text-align:right; background:#f0f0f0;"><button onclick="this.closest('.fake-dialog-overlay').remove()" style="padding:4px 20px; background:#e1e1e1; border:1px solid #adadad;">确定</button></div></div>`;
        document.body.appendChild(overlay);
    },
    openVirtualDesktop() {
        if (this.ap < 5) return this.showNotify('AP不足5，无法启动虚拟桌面', 'warning');
        if (this.desktopOpen) return;
        this.desktopOpen = true;
        const desktop = document.getElementById('win7Desktop');
        desktop.classList.add('open');
        this.updateTrayTime();
        this.updateTaskbar();
        this.addLog('💻 虚拟靶场已启动 (Windows 7)', 'info');
        document.querySelectorAll('.win7-icon').forEach(el => {
            el.onclick = (e) => {
                const tool = el.dataset.tool;
                this.openToolWindow(tool);
            };
        });
        desktop.addEventListener('click', (e) => {
            if (e.target === desktop || e.target.classList.contains('win7-icons')) {
                this.closeStartMenu();
            }
        });
    },
    closeVirtualDesktop() {
        this.closeWindow();
        this.closeStartMenu();
        document.getElementById('win7Desktop').classList.remove('open');
        this.desktopOpen = false;
        this.addLog('💻 虚拟靶场已关闭', 'info');
        this.updateUI();
    },
    updateTrayTime() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('trayTime').textContent = `${h}:${m}`;
        if (this.desktopOpen) setTimeout(() => this.updateTrayTime(), 30000);
    },
    updateTaskbar() {
        const container = document.getElementById('taskbarItems');
        container.innerHTML = '';
        if (this.currentTool && this.windowOpen) {
            const item = document.createElement('div');
            item.className = 'win7-taskbar-item active';
            item.textContent = this.getToolLabel(this.currentTool);
            item.onclick = () => this.openToolWindow(this.currentTool);
            container.appendChild(item);
        }
    },
    getToolLabel(tool) {
        const map = { firewall:'防火墙', antivirus:'杀毒软件', terminal:'终端', taskmgr:'任务管理器', recovery:'数据恢复', decompile:'反编译', backup:'备份', problems:'电脑问题', ie:'Internet Explorer', media:'Windows Media Player', notepad:'记事本', calc:'计算器' };
        return map[tool] || tool;
    },
    getToolDesc(tool) {
        const map = { firewall:'🛡️ 检测并拦截黑客入侵威胁（消耗12 AP）', antivirus:'🛡️ 清除挖矿程序和恶意软件（消耗10 AP）', terminal:'💻 修复系统异常进程和威胁（消耗15 AP）', taskmgr:'📊 结束异常进程，恢复系统性能（消耗8 AP，AP+5）', recovery:'💾 恢复被删除的数据，找回部分题库（消耗20 AP）', decompile:'🧩 反编译加密文件，获取研发点（消耗18 AP）', backup:'📦 备份重要数据，提升信誉（消耗14 AP）' };
        return map[tool] || '执行安全操作';
    },
    async openToolWindow(tool) {
        if (tool === 'computer') {
            const wCap = this.webCores * this.webLevel * 150;
            const jCap = this.judgeCores * this.judgeLevel * 150;
            const wLoad = Math.floor(this.totalUsers * 0.65 + this.lastSubmits * 0.06);
            const jLoad = Math.floor(this.lastSubmits * 0.35);
            const info = `系统信息:\n- 操作系统: Windows 7 旗舰版 (OJ服务器)\n- Web服务器: ${this.webCores}核 Lv.${this.webLevel} | 负载: ${wLoad}/${wCap}\n- 评测服务器: ${this.judgeCores}核 Lv.${this.judgeLevel} | 负载: ${jLoad}/${jCap}\n- 硬盘容量: ${this.diskUsed.toFixed(1)} / ${this.diskTotal.toFixed(1)} GB\n- 总用户数: ${this.totalUsers}\n- 资金: $${this.balance.toFixed(2)}\n${this.features.school ? '- 网校系统: 已启用\n' : ''}${this.features.api ? '- 评测API: 已开放\n' : ''}`;
            this.showWin7InfoDialog('计算机', info);
            return;
        }
        if (tool === 'recycle') {
            const confirmed = await this.showWin7ConfirmDialog('回收站', '确实要清空回收站吗？');
            if (confirmed) { this.showNotify('回收站已清空（模拟）', 'success'); this.addLog('🗑️ 回收站已清空', 'info'); }
            else { this.showNotify('已取消', 'info'); }
            return;
        }
        if (tool === 'network') {
            const info = `当前连接: OJ在线服务\n- IPv4: 192.168.1.101 (内网)\n- 活跃用户: ${this.totalUsers}\n- 上月提交: ${this.lastSubmits}\n- 上月题解: ${this.lastSolutions}\n- 信誉: ${this.reputation.toFixed(3)}\n- 连续盈利月: ${this.consecutiveProfit || 0}\n${this.getHorrorActive() ? `- 阴气值: ${this.yinQi} (阴德:${this.yinDe})` : ''}`;
            this.showWin7InfoDialog('网络', info);
            return;
        }
        if (tool === 'ie') {
            if (Math.random() < 0.3) { this.addThreat('malware', 'IE浏览器下载了恶意软件'); this.showNotify('⚠️ IE 浏览器意外下载了恶意软件！', 'warning'); }
            else { this.totalUsers += this.random(5, 15); this.showNotify('🌐 浏览网页增加了少量用户', 'success'); }
            this.showWin7InfoDialog('Internet Explorer', '正在浏览网页...\n\n' + (this.pcThreats.some(t=>t.type==='malware') ? '警告：检测到可疑下载！' : '当前页面安全。'));
            this.updateUI();
            return;
        }
        if (tool === 'media') {
            const costAP = 2;
            if (this.ap < costAP) { this.showNotify('AP不足，无法启动播放器', 'warning'); return; }
            this.ap -= costAP;
            this.staff.forEach(e => e.satisfaction = Math.min(100, e.satisfaction + 3));
            this.addLog('🎵 播放音乐缓解了员工压力，满意度小幅提升', 'info');
            this.showWin7InfoDialog('Windows Media Player', '正在播放: 白噪音\n员工满意度 +3');
            this.updateUI();
            return;
        }
        if (tool === 'notepad') {
            const rnd = Math.random();
            if (rnd < 0.4) { this.rdPoints += 5; this.showWin7InfoDialog('记事本', '你发现了一段遗留的代码片段。\n研发点 +5'); }
            else if (rnd < 0.7) { this.acPoints += 5; this.showWin7InfoDialog('记事本', '你找到了一份竞赛题解。\n学术点 +5'); }
            else { this.comPoints += 5; this.showWin7InfoDialog('记事本', '你看到了一条社区公告。\n社区点 +5'); }
            this.addLog('📄 在记事本中发现了有用信息', 'success');
            this.checkAchievements();
            this.updateUI();
            return;
        }
        if (tool === 'calc') {
            if (this.taxManualEnabled) {
                const data = this.calculateIncomeData();
                const totalIncome = data.baseIncome + data.userInc + data.apiInc + data.courseInc + data.depositBack + 200;
                const totalExpense = data.salary + data.maint + data.repay;
                const net = totalIncome - totalExpense;
                const tax = net > 0 ? parseFloat((net * 0.22).toFixed(3)) : 0;
                this.showWin7InfoDialog('计算器', `税务核算结果:\n预计应纳税额: $${tax.toFixed(3)}\n\n提示：可在下个月使用此数据。`);
            } else {
                const strangeNum = this.random(1000, 9999);
                this.showWin7InfoDialog('计算器', `计算结果: ${strangeNum}\n\n你感到一阵不安...`);
                if (this.getHorrorActive() && Math.random() < 0.2) { this.yinQi = Math.min(100, this.yinQi + 5); this.showNotify('👻 计算器上出现了不吉利的数字', 'warning'); }
            }
            this.updateUI();
            return;
        }
        if (tool === 'problems') {
            this.currentTool = tool;
            this.windowOpen = true;
            const win = document.getElementById('win7Window');
            document.getElementById('winTitle').textContent = '电脑问题';
            document.getElementById('winDefaultContent').style.display = 'none';
            document.getElementById('winProblemsContent').style.display = 'block';
            const threats = this.pcThreats;
            if (threats.length === 0) {
                document.getElementById('winProblemsList').innerHTML = '<div style="padding:10px; color:green;">✅ 系统安全，未检测到威胁。</div>';
            } else {
                document.getElementById('winProblemsList').innerHTML = threats.map(t => {
                    const icons = { hack:'🛡️', miner:'⛏️', malware:'🦠', delete:'🗑️', encrypt:'🔐' };
                    return `<div style="padding:8px; border-bottom:1px solid #ccc; font-size:0.9rem;"><span style="font-size:1.2rem;">${icons[t.type]||'⚠️'}</span><strong>${t.text}</strong><div style="color:#666; font-size:0.8rem;">威胁类型: ${t.type}</div></div>`;
                }).join('');
            }
            win.classList.add('open');
            this.updateTaskbar();
            return;
        }
        this.currentTool = tool;
        this.windowOpen = true;
        const win = document.getElementById('win7Window');
        document.getElementById('winTitle').textContent = this.getToolLabel(tool);
        document.getElementById('winDesc').textContent = this.getToolDesc(tool);
        document.getElementById('winResult').style.display = 'none';
        document.getElementById('winActionBtn').disabled = false;
        document.getElementById('winDefaultContent').style.display = 'block';
        document.getElementById('winProblemsContent').style.display = 'none';
        win.classList.add('open');
        this.updateTaskbar();
    },
    closeWindow() {
        document.getElementById('win7Window').classList.remove('open');
        document.getElementById('winDefaultContent').style.display = 'block';
        document.getElementById('winProblemsContent').style.display = 'none';
        this.windowOpen = false;
        this.currentTool = null;
        this.updateTaskbar();
    },
    minimizeWindow() { this.closeWindow(); },
    executeTool() {
        if (!this.currentTool) return;
        const tool = this.currentTool;
        const resultEl = document.getElementById('winResult');
        if (!this.virtualAction(tool)) return;
        resultEl.style.display = 'block';
        resultEl.textContent = `✅ 操作已执行，请查看日志和状态。`;
        document.getElementById('winActionBtn').disabled = true;
        setTimeout(() => { document.getElementById('winActionBtn').disabled = false; }, 1500);
        this.updateTaskbar();
        this.updateUI();
    },
    virtualAction(type) {
        let cost = 0, msg = '', success = false;
        switch (type) {
            case 'firewall': cost = 12; if(this.pcThreats.some(t => t.type === 'hack')){ this.pcThreats = this.pcThreats.filter(t => t.type !== 'hack'); this.balance += 800; msg = '🔥 防火墙已部署，黑客威胁解除，+$800'; success = true; } else { msg = '🛡️ 当前无黑客威胁，无需操作。'; return true; } break;
            case 'antivirus': cost = 10; if(this.pcThreats.some(t => t.type === 'miner' || t.type === 'malware')){ this.pcThreats = this.pcThreats.filter(t => t.type !== 'miner' && t.type !== 'malware'); this.balance += 500; msg = '🛡️ 杀毒完成，挖矿/恶意软件清除，+$500'; success = true; } else { msg = '🔍 未发现病毒，系统安全。'; return true; } break;
            case 'terminal': cost = 15; if(this.pcThreats.length > 0){ const resolved = this.pcThreats.length; this.pcThreats = []; this.balance += resolved * 600; msg = `💻 终端修复了${resolved}个问题，+$${resolved*600}`; success = true; } else { msg = '💻 系统正常，无需修复。'; return true; } break;
            case 'taskmgr': cost = 8; this.pcThreats = this.pcThreats.filter(t => t.type !== 'process'); this.ap += 5; msg = '📊 任务管理器结束异常进程，AP+5'; success = true; break;
            case 'recovery': cost = 20; if(this.pcThreats.some(t => t.type === 'delete')){ this.pcThreats = this.pcThreats.filter(t => t.type !== 'delete'); this.high += 2; msg = '💾 数据恢复成功，+2高质量题库'; success = true; } else { msg = '💾 无数据丢失，无需恢复。'; return true; } break;
            case 'decompile': cost = 18; if(this.pcThreats.some(t => t.type === 'encrypt')){ this.pcThreats = this.pcThreats.filter(t => t.type !== 'encrypt'); this.rdPoints += 40; msg = '🧩 反编译成功，+40研发点'; success = true; } else { msg = '🧩 无可反编译的加密文件。'; return true; } break;
            case 'backup': cost = 14; if(this.pcThreats.some(t => t.type === 'delete' || t.type === 'hack')){ this.pcThreats = this.pcThreats.filter(t => t.type !== 'delete' && t.type !== 'hack'); this.reputation = Math.min(2, this.reputation + 0.03); msg = '📦 备份完成，信誉+0.03，威胁消除'; success = true; } else { msg = '📦 系统安全，备份已完成。'; this.reputation = Math.min(2, this.reputation + 0.01); success = true; } break;
            default: msg = '未知操作'; return true;
        }
        if (this.ap < cost) { this.showNotify(`AP不足，需要${cost}AP`, 'warning'); return false; }
        this.ap -= cost;
        if (success) { this.addLog(`💻 虚拟靶场: ${msg}`, 'success'); this.showNotify(msg, 'success'); }
        else { this.addLog(`💻 虚拟靶场: ${msg}`, 'info'); this.showNotify(msg, 'info'); }
        if (this.pcThreats.length === 0 && this.getHorrorActive() && success) { this.yinDe = Math.min(100, this.yinDe + 2); this.addLog('☀️ 虚拟靶场清空威胁，阴德+2', 'ghost'); }
        this.updateUI();
        return true;
    },
    addThreat(type, text) {
        if (!this.pcThreats.some(t => t.type === type)) {
            this.pcThreats.push({ type, text });
            if (this.desktopOpen) { this.showNotify(`⚠️ 新威胁: ${text}`, 'warning'); }
        }
    },
    toggleStartMenu() { const menu = document.getElementById('winStartMenu'); menu.classList.toggle('open'); },
    closeStartMenu() { document.getElementById('winStartMenu').classList.remove('open'); },
    startMenuAction(action) {
        this.closeStartMenu();
        if (action === 'shutdown' || action === 'restart') { this.showNotify(`⚠️ 模拟${action}，虚拟机关闭`, 'warning'); this.closeVirtualDesktop(); }
        else if (action === 'tools') { this.showNotify('安全工具已在桌面', 'info'); }
        else if (action === 'about') { this.showNotify('Windows 7 企业版 · OJ运营模拟器 虚拟靶场', 'info'); }
    },
    nextMonth() {
        if (this.jumpScareCooldown > 0) this.jumpScareCooldown--;
        if (this.fakeAlertCooldown > 0) this.fakeAlertCooldown--;
        if (this.taxManualEnabled) {
            const data = this.calculateIncomeData();
            this.pendingTaxData = data;
            document.getElementById('taxSummary').innerHTML = `<div class="tax-detail"><span>基础收入</span><span class="amount">+$${data.baseIncome.toFixed(3)}</span><span>用户贡献</span><span class="amount">+$${data.userInc.toFixed(3)}</span><span>API收入</span><span class="amount">+$${data.apiInc.toFixed(3)}</span><span>网校收入</span><span class="amount">+$${data.courseInc.toFixed(3)}</span><span>精算补贴</span><span class="amount">+$200.000</span><span style="color:var(--danger)">工资</span><span class="amount" style="color:var(--danger)">-$${data.salary.toFixed(3)}</span><span style="color:var(--danger)">维护</span><span class="amount" style="color:var(--danger)">-$${data.maint.toFixed(3)}</span><span style="color:var(--danger)">还贷</span><span class="amount" style="color:var(--danger)">-$${data.repay.toFixed(3)}</span><span style="color:var(--success)">存款到期</span><span class="amount" style="color:var(--success)">+$${data.depositBack.toFixed(3)}</span></div><p style="color:var(--text2);">请核算应纳税额（净利润×22%）</p>`;
            document.getElementById('taxPaymentInput').value = '';
            document.getElementById('taxErrorMessage').innerText = '';
            document.getElementById('taxModal').style.display = 'flex';
            document.getElementById('confirmTaxBtn').onclick = () => this.confirmTax();
            return;
        }
        this.proceedNextMonth(false, 0);
    },
    calculateIncomeData() {
        const salary = this.staff.reduce((s, e) => s + e.salary, 0);
        const maint = this.getTotalMonths() > 6 ? (this.webCores * this.webLevel + this.judgeCores * this.judgeLevel) * 220 : 0;
        let repay = 0;
        this.loans.forEach(l => { if (l.dueMonth <= this.month) repay += parseFloat((l.amount * 1.04).toFixed(3)); });
        let depositBack = 0;
        this.deposits.forEach(d => { if (d.dueMonth <= this.month) depositBack += parseFloat((d.amount + d.interest).toFixed(3)); });
        const baseIncome = 350;
        const userInc = Math.floor(this.totalUsers * 0.35);
        const apiInc = this.features.api ? Math.floor(this.totalUsers * 1.8 + 700) : 0;
        const courseInc = this.courses.reduce((s, c) => s + (c.level > 0 ? c.level * c.monthly : 0), 0);
        return { baseIncome, userInc, apiInc, courseInc, salary, maint, repay, depositBack };
    },
    confirmTax() {
        const input = parseFloat(document.getElementById('taxPaymentInput').value);
        if (isNaN(input) || input < 0) { document.getElementById('taxErrorMessage').innerText = '请输入有效金额'; return; }
        const data = this.pendingTaxData;
        const totalIncome = data.baseIncome + data.userInc + data.apiInc + data.courseInc + data.depositBack + 200;
        const totalExpense = data.salary + data.maint + data.repay;
        const net = totalIncome - totalExpense;
        const actualTax = net > 0 ? parseFloat((net * 0.22).toFixed(3)) : 0;
        let taxToPay = 0;
        if (input < actualTax) {
            const penalty = parseFloat(((actualTax - input) * 0.6).toFixed(3));
            taxToPay = parseFloat((actualTax + penalty).toFixed(3));
            this.reputation = Math.max(-2, this.reputation - 0.06);
            this.addLog(`💀少缴税款！应缴${actualTax.toFixed(3)}，罚款${penalty.toFixed(3)}`, 'warning');
        } else {
            taxToPay = parseFloat(input.toFixed(3));
            this.addLog(`📜已缴纳税款${taxToPay.toFixed(3)}`, 'info');
        }
        document.getElementById('taxModal').style.display = 'none';
        this.proceedNextMonth(true, taxToPay);
    },
    proceedNextMonth(isManualTax, taxPayment) {
        this.transactions = [];
        this.lastEventImpact = 0; this.lastEventUserGain = 0; this.lastEventMoneyLoss = 0; this.lastEventSuccess = false;
        let repay = 0;
        this.loans = this.loans.filter(l => { if (l.dueMonth <= this.month) { repay += parseFloat((l.amount * 1.04).toFixed(3)); return false; } return true; });
        if (repay > 0) { this.balance -= repay; this.addTransaction('还贷(含4%利息)', -repay); }
        this.deposits = this.deposits.filter(d => { if (d.dueMonth <= this.month) { const t = parseFloat((d.amount + d.interest).toFixed(3)); this.balance += t; this.addTransaction('定期存款到期', t); return false; } return true; });
        if (this.cardBalance > 0) { const ci = parseFloat((this.cardBalance * 0.015).toFixed(3)); this.cardBalance = parseFloat((this.cardBalance + ci).toFixed(3)); }
        let rP = 0, aP = 0, cP = 0;
        this.staff.forEach(e => { rP += e.produceRd || 0; aP += e.produceAc || 0; cP += e.produceCom || 0; });
        this.rdPoints += rP; this.acPoints += aP; this.comPoints += cP;
        const salary = this.staff.reduce((s, e) => s + e.salary, 0);
        const maint = this.getTotalMonths() > 6 ? (this.webCores * this.webLevel + this.judgeCores * this.judgeLevel) * 220 : 0;
        this.balance -= (salary + maint);
        if (salary > 0) this.addTransaction('员工工资', -salary);
        if (maint > 0) this.addTransaction('服务器维护费', -maint);
        let rdD = 0, acD = 0, comD = 0;
        if (this.features.school) rdD += 100;
        if (this.features.api) rdD += 120;
        if (this.features.solution) acD += 25;
        if (this.features.discuss) comD += 50;
        if (this.features.team) comD += 70;
        if (this.rdPoints < rdD || this.acPoints < acD || this.comPoints < comD) { this.reputation = Math.max(-2, this.reputation - 0.18); }
        this.rdPoints = Math.max(0, this.rdPoints - rdD); this.acPoints = Math.max(0, this.acPoints - acD); this.comPoints = Math.max(0, this.comPoints - comD);
        let courseInc = 0;
        this.courses.forEach(c => { if (c.level > 0) courseInc += c.level * c.monthly; if (c.cooldown > 0) c.cooldown--; });
        if (courseInc > 0) { this.balance += courseInc; this.addTransaction('网校收入', courseInc); }
        const { submits, solutions } = this.calculateActivity();
        this.lastSubmits = submits; this.lastSolutions = solutions;
        const qD = this.high * 0.06 + this.medium * 0.025 + this.low * 0.012;
        const uD = this.totalUsers * 0.001;
        const sD = submits * 0.0002;
        const soD = solutions * 0.0005;
        this.diskUsed = parseFloat((qD + uD + sD + soD).toFixed(3));
        const wC = this.webCores * this.webLevel * 150;
        const jC = this.judgeCores * this.judgeLevel * 150;
        const wL = Math.floor(this.totalUsers * 0.65 + submits * 0.06);
        const jL = Math.floor(submits * 0.35);
        if (wL > wC || jL > jC) {
            this.continuousFailMonths++;
            this.reputation = Math.max(-2, this.reputation - 0.06);
        } else {
            this.continuousFailMonths = 0;
        }
        const overload = (wL > wC || jL > jC) ? 0.65 : 1.0;
        const apiInc = this.features.api ? Math.floor(this.totalUsers * 1.8 + 700) : 0;
        const userInc = Math.floor(this.totalUsers * 0.35);
        const submitInc = Math.floor(submits * 0.008 * Math.max(0, this.reputation));
        const income = 350 + userInc + apiInc + submitInc;
        const netBeforeTax = income + courseInc - salary - maint;
        let taxToDeduct = 0;
        if (isManualTax) { taxToDeduct = taxPayment; this.addTransaction('税款', -taxToDeduct); } else { const actualTax = netBeforeTax > 0 ? parseFloat((netBeforeTax * 0.22).toFixed(3)) : 0; taxToDeduct = actualTax; if (actualTax > 0) this.addTransaction('税款(22%自动)', -actualTax); }
        this.balance = parseFloat((this.balance - taxToDeduct + income).toFixed(3));
        this.addTransaction('运营收入', income);
        if (isManualTax) this.balance += 200;
        const gB = Math.max(0, this.reputation) * 0.18 + (this.high * 0.08 + this.medium * 0.04 + this.low * 0.008) / 1000;
        const nU = Math.floor(this.totalUsers * (gB + 0.008) * this.userGrowthBoost * overload);
        this.totalUsers += Math.max(0, nU);
        if (wL > wC || jL > jC) this.reputation = Math.max(-2, this.reputation - 0.04);
        else this.reputation = Math.min(2, this.reputation + 0.0008);
        for (let i = this.staff.length - 1; i >= 0; i--) {
            let e = this.staff[i];
            e.satisfaction = Math.min(100, Math.max(0, e.satisfaction + this.random(-10, 2) - Math.floor(this.yinQi / 18)));
            if (e.satisfaction < 18 && Math.random() < 0.45) {
                const name = e.name;
                this.staff.splice(i, 1);
                this.addLog(`👻 ${name}被阴气吓跑...`, 'ghost');
                this.speak('不要走...留下来...');
                if (Math.random() < 0.4 && this.getHorrorActive()) this.triggerJumpScare('staffFlee');
            }
        }
        const net = netBeforeTax - taxToDeduct;
        this.consecutiveProfit = net > 0 ? (this.consecutiveProfit || 0) + 1 : 0;
        if (this.getHorrorActive()) {
            this.yinQi = Math.min(100, Math.max(0, this.yinQi + this.random(-10, 14)));
            this.ghostMoney += Math.floor(this.yinQi * 0.45) + this.random(0, 18);
        } else {
            this.yinQi = Math.max(0, this.yinQi - 5); this.ghostMoney = 0;
        }
        this.randomEvent();
        if (this.getHorrorActive() && this.yinQi > 25 && Math.random() < 0.3) {
            const threatTypes = [
                { type: 'hack', text: '黑客入侵' }, { type: 'miner', text: '挖矿程序' },
                { type: 'malware', text: '恶意软件' }, { type: 'delete', text: '数据删除威胁' }, { type: 'encrypt', text: '文件加密勒索' }
            ];
            const t = threatTypes[Math.floor(Math.random() * threatTypes.length)];
            if (!this.pcThreats.some(p => p.type === t.type)) { this.pcThreats.push(t); this.addLog(`💻 虚拟靶场检测到威胁: ${t.text}`, 'warning'); }
        }
        this.ap = 100; this.userGrowthBoost = 1.0;
        this.month++; if (this.month > 12) { this.month = 1; this.year++; }
        if (this.continuousFailMonths >= 5) this.gameOver('连续5个月过载，服务器崩溃');
        if (this.balance < -8000) this.gameOver('破产，阴债缠身');
        if (this.reputation <= -2) this.gameOver('信誉破产');
        if (this.year >= 2026) this.gameOver('恭喜！你撑到了2026年！', true);
        if (this.getHorrorActive()) {
            if (this.yinQi > 30) document.getElementById('cornerGhost')?.classList.add('visible');
            else document.getElementById('cornerGhost')?.classList.remove('visible');
            if (this.yinQi > 45) document.getElementById('edgeHandprint')?.classList.add('visible');
            else document.getElementById('edgeHandprint')?.classList.remove('visible');
            if (this.yinQi > 40 && Math.random() < 0.25) setTimeout(() => this.triggerJumpScare('yinHigh'), this.random(300, 1200));
            if (this.yinQi > 70 && Math.random() < 0.4) setTimeout(() => this.triggerJumpScare('yinVeryHigh'), this.random(200, 800));
            if (this.yinQi > 45 && Math.random() < 0.3 && this.fakeAlertCooldown <= 0) setTimeout(() => this.triggerRandomFakeAlert(), this.random(800, 2500));
            else if (this.yinQi > 20 && Math.random() < 0.12 && this.fakeAlertCooldown <= 0) setTimeout(() => this.triggerRandomFakeAlert(), this.random(1500, 4000));
        } else {
            document.getElementById('cornerGhost')?.classList.remove('visible');
            document.getElementById('edgeHandprint')?.classList.remove('visible');
        }
        this.checkAchievements();
        this.updateUI();
    },
    randomEvent() {
        this.lastEventImpact = 0; this.lastEventUserGain = 0; this.lastEventMoneyLoss = 0; this.lastEventSuccess = false;
        const isHorror = this.getHorrorActive(); const maxR = isHorror ? 65 : 20; const r = this.random(1, maxR);
        let type = '', good = false, bad = false; let spoken = false;
        const speakIf = (text) => { if (!spoken && isHorror) { this.speak(text); spoken = true; } };
        if (r <= 2) { let g = this.random(150, 400); this.totalUsers += g; this.lastEventUserGain = g; this.lastEventImpact = g * 0.5; type = '流量高峰'; good = true; speakIf('流量...暴涨...'); }
        else if (r <= 4) { let l = this.random(120, 350); this.totalUsers = Math.max(0, this.totalUsers - l); this.reputation = Math.max(-2, this.reputation - 0.12); this.lastEventUserGain = -l; this.lastEventImpact = -l * 0.5; type = 'DDoS攻击'; bad = true; speakIf('服务器...遭到攻击...'); this.addThreat('hack', 'DDoS攻击'); }
        else if (r <= 6) { let g = this.random(18, 45); this.rdPoints += g; this.lastEventImpact = g; type = '研发创新'; good = true; speakIf('新的...算法...诞生了...'); }
        else if (r <= 8) { let g = this.random(25, 55); this.comPoints += g; this.lastEventImpact = g; type = '社区活跃'; good = true; }
        else if (r <= 10) { let l = this.random(600, 1800); this.balance -= l; this.lastEventMoneyLoss = l; this.lastEventImpact = -l; type = '服务器故障'; bad = true; speakIf('硬件...在哀鸣...'); this.addThreat('malware', '服务器故障'); }
        else if (r <= 12) { this.reputation = Math.min(2, this.reputation + 0.015); this.lastEventImpact = 800; type = '行业新闻'; good = true; }
        else if (r <= 14) { let tax = Math.floor(this.balance * 0.06); this.balance -= tax; this.lastEventMoneyLoss = tax; this.lastEventImpact = -tax; type = '政策变化'; bad = true; }
        else if (r <= 16) { let g = this.random(80, 250); this.totalUsers += g; this.lastEventUserGain = g; this.lastEventImpact = g * 0.8; type = '病毒式传播'; good = true; speakIf('传播...停不下来...'); }
        else if (r <= 18) { let l = this.random(60, 180); this.totalUsers = Math.max(0, this.totalUsers - l); this.lastEventUserGain = -l; this.lastEventImpact = -l * 0.6; type = '竞争对手打压'; bad = true; }
        else if (r === 19) { this.staff.forEach(e => e.satisfaction = Math.min(100, e.satisfaction + 8)); this.lastEventImpact = 400; type = '员工福利日'; good = true; }
        else if (r === 20) {
            const r2 = this.random(1, 8);
            if (r2 === 1) { let g = this.random(25, 70); this.rdPoints += g; this.lastEventImpact = g; type = '技术突破'; good = true; speakIf('技术...突破了...'); }
            else if (r2 === 2 || r2 === 8) { if (this.staff.length) { let idx = Math.floor(Math.random() * this.staff.length); this.staff.splice(idx, 1); this.lastEventImpact = -600; type = '关键员工离职'; bad = true; speakIf('他走了...带着秘密...'); } }
            else if (r2 === 3) { let ch = Math.floor(this.totalUsers * (this.random(-8, 8) / 100)); this.totalUsers = Math.max(0, this.totalUsers + ch); this.lastEventUserGain = ch; this.lastEventImpact = Math.abs(ch) * 0.4; type = '市场波动'; if (ch >= 0) good = true; else bad = true; }
            else if (r2 === 4) { let def = this.webCores * this.webLevel * 8 + this.judgeCores * this.judgeLevel * 8; if (Math.random() < 0.45 + def / 1200) { type = '黑客入侵（成功防御）'; this.lastEventSuccess = true; this.hasDefendedHack = true; this.lastEventImpact = 1500; good = true; speakIf('入侵...被挡住了...'); } else { let loss = Math.floor(this.balance * 0.12); this.balance -= loss; this.reputation = Math.max(-2, this.reputation - 0.12); this.lastEventMoneyLoss = loss; this.lastEventImpact = -loss; type = '黑客入侵'; bad = true; speakIf('数据...泄露了...'); this.addThreat('hack', '黑客入侵'); } }
            else if (r2 === 5) { let g = this.random(40, 120); this.rdPoints += g; this.lastEventImpact = g; type = '开源贡献'; good = true; }
            else if (r2 === 6) { let l = this.random(250, 600); this.totalUsers = Math.max(0, this.totalUsers - l); this.reputation = Math.max(-2, this.reputation - 0.12); this.lastEventUserGain = -l; this.lastEventImpact = -l * 0.5; type = '用户投诉'; bad = true; speakIf('投诉...越来越多...'); }
            else if (r2 === 7) { let g = this.random(4000, 12000); this.balance += g; this.lastEventImpact = g; type = '投资注入'; good = true; speakIf('资本...涌入...'); }
        }
        else if (isHorror && r <= 28) {
            const hr = this.random(1, 12);
            if (hr === 1) { this.yinQi = Math.min(100, this.yinQi + 30); this.yinDe = Math.max(0, this.yinDe - 15); type = '🌑血月降临'; bad = true; speakIf('血月...升起了...'); this.triggerJumpScare('bloodMoon'); }
            else if (hr === 2) { let g = this.random(500, 2000); this.balance += g; this.ghostMoney += 200; type = '🏮鬼市交易'; good = true; speakIf('鬼市...开门了...'); }
            else if (hr === 3) { if (this.staff.length > 0) { const e = this.staff[Math.floor(Math.random() * this.staff.length)]; e.satisfaction = 100; type = '🧟尸变'; good = true; speakIf('他...站起来了...'); if (Math.random() < 0.5) this.triggerJumpScare('zombie'); } }
            else if (hr === 4) { this.yinDe = Math.min(100, this.yinDe + 20); this.ghostMoney += 300; type = '💒阴婚'; good = true; speakIf('请帖...送到了...'); }
            else if (hr === 5) { if (this.staff.length > 0) { const e = this.staff[Math.floor(Math.random() * this.staff.length)]; this.staff.push({ name: '纸人-' + e.name, salary: e.salary * 0.5, produceRd: e.produceRd, produceAc: e.produceAc, produceCom: e.produceCom, satisfaction: 70 }); type = '📄纸人替身'; good = true; speakIf('纸人...活了...'); } }
            else if (hr === 6) { this.staff.forEach(e => e.satisfaction = 80); type = '🍵孟婆汤'; good = true; speakIf('喝下...就忘了...'); }
            else if (hr === 7) { let l = this.random(800, 2500); this.totalUsers = Math.max(0, this.totalUsers - l); this.yinQi = Math.min(100, this.yinQi + 25); type = '👹百鬼夜行'; bad = true; speakIf('它们...来了...'); this.triggerJumpScare('hyakki'); }
            else if (hr === 8) { let l = Math.floor(this.balance * 0.2); this.balance -= l; this.lastEventMoneyLoss = l; type = '🔒删库跑路'; bad = true; speakIf('数据库...正在消失...'); this.addThreat('delete', '删库跑路'); }
            else if (hr === 9) { this.balance -= this.random(3000, 8000); this.ap = Math.max(0, this.ap - 20); type = '⛏️服务器挖矿'; bad = true; this.addThreat('miner', '服务器挖矿'); }
            else if (hr === 10) { this.yinQi = Math.min(100, this.yinQi + 20); this.ghostMoney += 150; type = '📞鬼来电'; bad = true; speakIf('电话...响了...'); if (Math.random() < 0.5) this.triggerJumpScare('phoneCall'); }
            else if (hr === 11) { this.ghostMoney += 80; this.yinQi = Math.min(100, this.yinQi + 15); type = '🖨️午夜打印'; bad = true; speakIf('打印机...自己在动...'); }
            else if (hr === 12) { this.yinQi = Math.min(100, this.yinQi + 18); type = '👁️监控异常'; bad = true; speakIf('监控里...有人...'); if (Math.random() < 0.4) this.triggerJumpScare('camera'); }
        }
        else if (isHorror && r <= 40) {
            const hr = this.random(1, 6);
            if (hr === 1) { this.yinQi = Math.max(0, this.yinQi - 40); this.yinDe = Math.min(100, this.yinDe + 10); type = '☀️烛龙睁眼'; good = true; speakIf('烛龙...睁眼了...'); }
            else if (hr === 2) { if (this.staff.length > 0 && Math.random() < 0.35) { const e = this.staff[Math.floor(Math.random() * this.staff.length)]; e.produceRd += 50; type = '🧟尸变(增强)'; good = true; speakIf('它...更强了...'); } }
            else if (hr === 3) { if (this.staff.length > 0 && this.staff.some(e => e.satisfaction < 30)) { const idx = this.staff.findIndex(e => e.satisfaction < 30); if (idx >= 0) { this.staff[idx].satisfaction = 70; type = '🪦还魂'; good = true; speakIf('魂魄...归来了...'); } } }
            else if (hr === 4) { let g = this.random(10000, 30000); this.balance += g; this.yinDe = Math.max(0, this.yinDe - 20); type = '💒阴婚(大额)'; good = true; speakIf('彩礼...很丰厚...'); }
            else if (hr === 5) { this.totalUsers = Math.max(0, this.totalUsers - this.random(300, 600)); this.reputation = Math.max(-2, this.reputation - 0.1); type = '👹百鬼夜行(轻度)'; bad = true; }
            else if (hr === 6) { this.balance -= this.random(2000, 6000); type = '⛏️挖矿(轻度)'; bad = true; this.addThreat('miner', '挖矿程序'); }
        }
        if (type && !type.includes('无员工')) {
            this.eventHistory.push(type);
            if (good) { this.consecutiveGoodEvents++; this.consecutiveBadEvents = 0; } else if (bad) { this.consecutiveBadEvents++; this.consecutiveGoodEvents = 0; }
            if (isHorror && (r > 20)) this.ghostEventCount++;
            this.addLog(`📅事件:${type}`, (good ? 'success' : (bad ? 'warning' : 'info')));
        }
    },
    calculateActivity() {
        const wC = this.webCores * this.webLevel * 150;
        const jC = this.judgeCores * this.judgeLevel * 150;
        const tC = wC + jC;
        const cF = Math.min(1, tC / (this.totalUsers || 1));
        const rF = (this.reputation + 2) / 4;
        const aR = 0.35 + cF * 0.28 + rF * 0.28;
        const aU = Math.floor(this.totalUsers * aR);
        const s = aU * this.random(7, 22);
        const so = this.features.solution ? Math.floor(s * (0.08 + rF * 0.18)) : 0;
        return { submits: s, solutions: so, activeUsers: aU };
    },
    checkAchievements() {
        let u = 0;
        const visibleAchievements = this.getVisibleAchievements();
        const totalAch = visibleAchievements.length;
        this.achievements.forEach(a => {
            if (a.unlocked) { u++; return; }
            if (!this.getHorrorActive() && a.ghost) return;
            let l = false;
            switch (a.id) {
                case 'a1': l = this.staff.length > 0; break; case 'a2': l = this.totalLoanAmount > 0; break; case 'a3': l = this.deposits.length > 0 || this.totalDepositAmount > 0; break;
                case 'a4': l = this.totalUsers >= 100; break; case 'a5': l = this.totalUsers >= 500; break; case 'a6': l = this.totalUsers >= 1000; break;
                case 'a7': l = this.totalUsers >= 5000; break; case 'a8': l = this.totalUsers >= 10000; break; case 'a9': l = this.totalUsers >= 20000; break;
                case 'a10': l = this.totalUsers >= 50000; break; case 'a11': l = this.features.school; break; case 'a12': l = this.contestCount > 0; break;
                case 'a13': l = this.contestCount >= 10; break; case 'a14': l = (this.high + this.medium + this.low) >= 100; break; case 'a15': l = (this.high + this.medium + this.low) >= 500; break;
                case 'a16': l = (this.high + this.medium + this.low) >= 1000; break; case 'a17': l = (this.high + this.medium + this.low) >= 2000; break;
                case 'a18': l = this.archUpgradeCount >= 1; break; case 'a19': l = this.archUpgradeCount >= 5; break; case 'a20': l = this.reputation >= 1.0; break;
                case 'a21': l = this.reputation >= 1.5; break; case 'a22': l = this.reputation >= 1.8; break; case 'a23': l = this.courses.some(c => c.level > 0); break;
                case 'a24': l = this.courses.every(c => c.level > 0); break; case 'a25': l = this.courses.some(c => c.level >= c.maxLevel); break; case 'a26': l = this.features.api; break;
                case 'a27': l = this.staff.length >= 15; break; case 'a28': l = this.staff.length >= 15 && this.staff.filter(e => e.produceRd > 0).length >= 5; break;
                case 'a29': l = this.staff.length >= 15 && this.staff.filter(e => e.produceAc > 0).length >= 5; break; case 'a30': l = this.staff.length >= 15 && this.staff.filter(e => e.produceCom > 0).length >= 5; break;
                case 'a31': l = this.diskTotal >= 100; break; case 'a32': l = this.diskTotal >= 500; break; case 'a33': l = this.diskTotal >= 1000; break; case 'a34': l = this.diskTotal >= 5000; break;
                case 'a35': l = this.webCores >= 10; break; case 'a36': l = this.webCores >= 20; break; case 'a37': l = this.judgeCores >= 10; break; case 'a38': l = this.judgeCores >= 20; break;
                case 'a39': l = this.adCount > 0; break; case 'a40': l = this.adCount >= 10; break; case 'a41': l = this.donateCount > 0; break; case 'a42': l = this.donateCount >= 10; break;
                case 'a43': l = this.totalLoanAmount >= 50000; break; case 'a44': l = this.totalDepositAmount >= 50000; break; case 'a45': l = this.consecutiveProfit >= 3; break;
                case 'a46': l = this.consecutiveProfit >= 6; break; case 'a47': l = this.consecutiveProfit >= 12; break; case 'a48': l = this.high >= 100; break; case 'a49': l = this.low >= 500; break;
                case 'a50': l = this.year >= 2026; break; case 'a51': l = this.coopSuccessCount >= 1; break; case 'a52': l = this.coopSuccessCount >= 5; break;
                case 'a53': l = this.eventHistory.length > 0; break; case 'a54': l = new Set(this.eventHistory).size >= 10; break; case 'a55': l = this.consecutiveBadEvents >= 3; break;
                case 'a56': l = this.consecutiveGoodEvents >= 3; break; case 'a57': l = this.lastEventImpact >= 10000 || this.lastEventImpact <= -5000; break;
                case 'a58': l = this.lastEventUserGain >= 5000; break; case 'a59': l = this.lastEventMoneyLoss >= 3000; break; case 'a60': l = new Set(this.eventHistory).size >= 20; break;
                case 'a61': l = this.coopResearchSuccess > 0; break; case 'a62': l = this.coopInternationalSuccess > 0; break; case 'a63': l = this.coopGovSuccess > 0; break;
                case 'a64': l = this.staff.length >= 15 && this.staff.some(e => e.name && e.name.includes('博士后')); break; case 'a65': l = this.staff.length >= 15 && this.staff.some(e => e.name && e.name.includes('市场专员')); break;
                case 'a66': l = this.staff.length >= 15 && this.staff.some(e => e.name && e.name.includes('客服专员')); break; case 'a67': l = this.staff.length >= 20; break;
                case 'a68': l = this.eventHistory.includes('技术突破'); break; case 'a69': l = this.eventHistory.includes('市场波动'); break;
                case 'a70': l = this.hasDefendedHack || (this.eventHistory.some(e => e.includes('黑客入侵') && e.includes('成功防御'))); break;
                case 'a71': l = this.eventHistory.includes('开源贡献'); break; case 'a72': l = this.eventHistory.includes('用户投诉'); break;
                case 'a73': l = this.eventHistory.includes('投资注入'); break; case 'a74': l = this.eventHistory.some(e => e.includes('关键员工离职')); break;
                case 'g1': l = this.yinDe >= 100; break; case 'g2': l = this.ghostMoney >= 10000; break; case 'g3': l = this.ghostRitualCount >= 10; break;
                case 'g4': l = this.ghostCooperateSuccess >= 1; break; case 'g5': l = this.eventHistory.includes('🌑血月降临'); break; case 'g6': l = this.talismanUsed >= 1; break;
                case 'g7': l = this.yinQi >= 100; break; case 'g8': l = this.yinQi <= 0 && this.getTotalMonths() > 1; break; case 'g9': l = this.eventHistory.includes('🏮鬼市交易'); break;
                case 'g10': l = this.eventHistory.includes('🪦还魂'); break; case 'g11': l = this.eventHistory.includes('🧟尸变'); break; case 'g12': l = this.eventHistory.includes('💒阴婚'); break;
                case 'g13': l = this.eventHistory.includes('📄纸人替身'); break; case 'g14': l = this.eventHistory.includes('🍵孟婆汤'); break; case 'g15': l = this.eventHistory.includes('👹百鬼夜行'); break;
                case 'g16': l = this.eventHistory.includes('🔒删库跑路'); break; case 'g17': l = this.eventHistory.includes('⛏️服务器挖矿'); break; case 'g18': l = this.eventHistory.includes('📞鬼来电'); break;
                case 'g19': l = this.eventHistory.includes('🖨️午夜打印'); break; case 'g20': l = this.eventHistory.includes('👁️监控异常'); break;
            }
            if (l) { a.unlocked = true; u++; this.addLog(`🏆成就解锁: ${a.name}`, a.ghost ? 'ghost' : 'success'); this.giveReward(); if (a.ghost && Math.random() < 0.3 && this.getHorrorActive()) this.triggerJumpScare('achievementGhost'); }
        });
        document.getElementById('achievementSummary').innerText = `${u}/${totalAch}`;
        document.getElementById('achievementProgressBar').style.width = (u / totalAch * 100) + '%';
        this.renderAchievements();
    },
    giveReward() {
        const r = this.random(1, 6);
        if (r === 1) { const a = this.random(500, 5000); this.balance += a; this.addTransaction('成就奖励', a); }
        else if (r === 2) this.rdPoints += this.random(20, 200); else if (r === 3) this.acPoints += this.random(20, 200);
        else if (r === 4) this.comPoints += this.random(20, 200); else if (r === 5) this.ghostMoney += this.random(50, 300);
        else this.reputation = Math.min(2, this.reputation + 0.01);
    },
    renderAchievements() {
        const c = document.getElementById('achievementsList');
        const visible = this.getVisibleAchievements();
        if (c) c.innerHTML = visible.map(a => `<div class="achievement-card ${a.unlocked ? (a.ghost ? 'ghost-unlock' : 'unlocked') : ''}"><div class="achievement-name">${a.name}<span class="achievement-status">${a.unlocked ? '✅已解锁' : '🔒未解锁'}</span></div><div class="achievement-desc">${a.desc}</div></div>`).join('');
    },
    renderPuzzles() {
        const c = document.getElementById('puzzleList');
        if (!c) return;
        const visible = this.getVisiblePuzzles();
        c.innerHTML = visible.map(p => `<div class="puzzle-card"><div class="puzzle-title">谜题#${p.id} ${p.answered ? '✅' : ''}</div><div class="puzzle-desc">${p.question}</div>${!p.answered ? `<div class="bank-input-group"><input type="text" id="puzzleAnswer${p.id}" class="bank-input" placeholder="输入答案"><button class="btn-small" onclick="game.solvePuzzle(${p.id})">提交</button></div>` : '<div class="action-desc" style="color:var(--success);">已解答</div>'}</div>`).join('');
    },
    solvePuzzle(id) {
        const p = this.puzzles.find(p => p.id === id);
        if (!p || p.answered) return;
        if (!this.getHorrorActive() && p.ghostOnly) return this.showNotify('此谜题仅在恐怖模式下可用', 'warning');
        const input = document.getElementById(`puzzleAnswer${id}`).value.trim();
        if (input === p.answer) {
            p.answered = true;
            const m = this.random(200, 2000);
            const pts = this.random(20, 50);
            const r = this.random(1, 3);
            if (r === 1) this.rdPoints += pts; else if (r === 2) this.acPoints += pts; else this.comPoints += pts;
            this.balance += m;
            this.addLog(`解密成功！获$${m}+${pts}资源点`, 'success');
            this.showNotify(`✅谜题#${id}正确！`, 'success');
            this.renderPuzzles();
            this.updateUI();
        } else { this.showNotify('❌答案错误', 'warning'); }
    },
    unlockFeature(f) {
        if (this.features[f]) return this.showNotify('已解锁', 'warning');
        const cost = { difficulty: { m: 1200, rd: 120 }, solution: { m: 1200, rd: 120 }, discuss: { m: 6000, rd: 350 }, team: { m: 12000, rd: 600 }, school: { m: 24000, rd: 1000 }, api: { m: 35000, rd: 1800 } }[f];
        if (this.balance < cost.m || this.rdPoints < cost.rd) return this.showNotify('资源不足', 'warning');
        this.balance -= cost.m; this.rdPoints -= cost.rd; this.features[f] = true;
        if (f === 'school') document.getElementById('schoolTabBtn').disabled = false;
        this.addLog(`功能解锁:${f}`, 'success'); this.showNotify(`功能${f}解锁！`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    addProblems(type) {
        const costAc = 25;
        let gain = 0, space = 0, repGain = 0;
        if (type === 'high') { gain = 3; space = 0.18; repGain = 0.0015; } else if (type === 'medium') { gain = 10; space = 0.25; } else { gain = 20; space = 0.25; }
        if (this.acPoints < costAc) return this.showNotify('学术点不足', 'warning');
        if (this.diskUsed + space > this.diskTotal) return this.showNotify('硬盘空间不足', 'warning');
        this.acPoints -= costAc;
        if (type === 'high') this.high += gain; else if (type === 'medium') this.medium += gain; else this.low += gain;
        this.diskUsed += space;
        const u = this.random(8, 40); this.totalUsers += u;
        if (repGain) this.reputation = Math.min(2, this.reputation + repGain);
        this.addLog(`题库扩充+${gain}题,用户+${u}`, 'success'); this.showNotify(`题库扩充+${u}用户`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    advertise(type) {
        const m = { flyer: [250, 5, 1.08], social: [600, 10, 1.18], video: [1400, 15, 1.3], kol: [3500, 20, 1.45], tv: [9000, 30, 1.7] }[type];
        if (this.balance < m[0] || this.ap < m[1]) return this.showNotify('资源不足', 'warning');
        this.balance -= m[0]; this.ap -= m[1]; this.adCount++;
        this.userGrowthBoost = Math.max(this.userGrowthBoost, m[2]);
        this.addLog(`广告:${type}`, 'success'); this.showNotify('广告投放成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    hireEmployee(type) {
        if (this.ap < 10) return this.showNotify('AP不足', 'warning');
        if (this.staff.length >= this.staffLimit) return this.showNotify('员工已满', 'warning');
        const def = {
            rd_highschool: ['高中生', 900, 1800, 18, 0, 0], rd_college: ['大学生', 2800, 5500, 65, 0, 0],
            rd_pro: ['全职大牛', 6500, 13000, 110, 0, 0], rd_postdoc: ['博士后', 13000, 28000, 180, 0, 0],
            ac_player: ['现役选手', 350, 600, 0, 45, 0], ac_coach: ['全职教练', 8500, 16000, 0, 350, 0],
            com_mod: ['兼职版主', 350, 600, 0, 0, 45], com_op: ['全职运营', 4500, 8000, 0, 0, 350],
            com_marketing: ['市场专员', 5500, 11000, 0, 0, 130], com_service: ['客服专员', 2200, 3500, 0, 0, 70]
        }[type];
        if (this.balance < def[2]) return this.showNotify('资金不足', 'warning');
        const surname = '赵钱孙李周吴郑王冯陈褚卫'[Math.floor(Math.random() * 12)];
        const name = surname + def[0];
        this.staff.push({ name, salary: def[1], produceRd: def[3], produceAc: def[4], produceCom: def[5], satisfaction: 75 });
        this.balance -= def[2]; this.ap -= 10;
        this.addLog(`招聘:${name}`, 'success'); this.showNotify(`招聘:${name}`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    fireEmployee() {
        if (!this.staff.length) return;
        const e = this.staff.pop();
        this.reputation = Math.max(-2, this.reputation - 0.25);
        this.addLog(`开除:${e.name},信誉-0.250`, 'warning'); this.showNotify(`开除${e.name}`, 'info');
        this.checkAchievements(); this.updateUI();
    },
    donate() {
        if (this.ap < 50 || this.reputation < -1) return this.showNotify('无法捐款', 'warning');
        this.ap -= 50;
        const d = Math.floor(this.totalUsers * (this.reputation + 1) * 4);
        this.balance += d; this.donateCount++;
        this.reputation = Math.max(-2, this.reputation - 0.12);
        this.addLog(`捐款+$${d.toFixed(3)}`, 'success'); this.showNotify(`募捐$${d.toFixed(3)}`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    holdContest(type) {
        const c = { yuan: [600, 45, 0, 4, 0, 1.04, 0], shui: [1200, 45, 6, 0, 0, 1.12, 0], putong: [3500, 90, 0, 4, 0, 1.08, 0], excellent: [9000, 220, 0, 0, 3, 1.08, 0.04] }[type];
        if (this.balance < c[0] || this.acPoints < c[1]) return this.showNotify('资源不足', 'warning');
        this.balance -= c[0]; this.acPoints -= c[1]; this.contestCount++;
        this.low += c[2]; this.medium += c[3]; this.high += c[4];
        this.userGrowthBoost = Math.max(this.userGrowthBoost, c[5]);
        if (c[6]) this.reputation = Math.min(2, this.reputation + c[6]);
        this.addLog(`举办${type}赛`, 'success'); this.showNotify('比赛举办成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    convertAP() {
        if (this.ap < 10) return;
        const t = document.getElementById('convertTypeTop').value;
        this.ap -= 10;
        if (t === 'rd') this.rdPoints += 10; else if (t === 'ac') this.acPoints += 10; else this.comPoints += 10;
        this.addLog(`转换10AP为${t}`, 'info'); this.showNotify('转换成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    takeLoan() {
        const a = parseFloat(document.getElementById('loanAmount').value);
        if (isNaN(a) || a < 1000 || this.reputation < -1) return this.showNotify('无法贷款', 'warning');
        this.balance += a; this.loans.push({ amount: a, dueMonth: this.month + 1 }); this.totalLoanAmount += a;
        this.addLog(`贷款$${a.toFixed(3)}`, 'info'); this.showNotify(`贷款$${a.toFixed(3)}`, 'info');
        this.checkAchievements(); this.updateUI();
    },
    makeDeposit() {
        const a = parseFloat(document.getElementById('depositAmount').value);
        if (isNaN(a) || a < 100 || this.balance < a) return;
        const t = parseInt(document.getElementById('depositTerm').value);
        const r = { 6: 0.20, 12: 0.50, 24: 1.40, 36: 3.00, 48: 5.20, 60: 8.00 }[t];
        const i = a * r;
        this.balance -= a; this.deposits.push({ amount: a, interest: i, dueMonth: this.month + t }); this.totalDepositAmount += a;
        this.addLog(`定期存款$${a.toFixed(3)},${t}月后本息${(a + i).toFixed(3)}`, 'success'); this.showNotify('存款成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    cardDeposit() {
        const a = parseFloat(document.getElementById('cardAmount').value);
        if (isNaN(a) || a <= 0) return;
        if (this.balance < a) return this.showNotify('资金不足', 'warning');
        this.balance -= a; this.cardBalance += a;
        this.addLog(`银行卡存入$${a.toFixed(3)}`, 'info'); this.showNotify(`存入$${a.toFixed(3)}`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    cardWithdraw() {
        const a = parseFloat(document.getElementById('cardAmount').value);
        if (isNaN(a) || a <= 0) return;
        if (this.cardBalance < a) return this.showNotify('余额不足', 'warning');
        this.cardBalance -= a; this.balance += a;
        this.addLog(`银行卡取出$${a.toFixed(3)}`, 'info'); this.showNotify(`取出$${a.toFixed(3)}`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    buyCore(type, num) {
        const c = 450 * num;
        if (this.balance < c) return this.showNotify('资金不足', 'warning');
        this.balance -= c;
        if (type === 'web') this.webCores += num; else this.judgeCores += num;
        this.addLog(`购买${type}核心+${num}`, 'success'); this.showNotify(`核心+${num}`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    buyDisk(gb) {
        const c = gb === 40 ? 180 : (gb === 500 ? 3500 : Math.ceil(gb / 40) * 180);
        if (this.balance < c) return this.showNotify('资金不足', 'warning');
        this.balance -= c; this.diskTotal += gb;
        this.addLog(`硬盘扩容+${gb}GB`, 'success'); this.showNotify(`硬盘+${gb}GB`, 'success');
        this.checkAchievements(); this.updateUI();
    },
    upgradeArch(type) {
        if (this.balance < 12000 || this.rdPoints < 120) return this.showNotify('资源不足', 'warning');
        if ((type === 'web' && this.webLevel >= 3) || (type === 'judge' && this.judgeLevel >= 3)) return this.showNotify('已满级', 'warning');
        this.balance -= 12000; this.rdPoints -= 120; this.archUpgradeCount++;
        if (type === 'web') this.webLevel++; else this.judgeLevel++;
        this.addLog(`${type}架构升级至Lv.${type === 'web' ? this.webLevel : this.judgeLevel}`, 'success'); this.showNotify('架构升级成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    cooperate(type) {
        if (this.ap < 10) return this.showNotify('AP不足', 'warning');
        let s = false, msg = '';
        const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
        switch (type) {
            case 'business': if (this.balance < 25000) return; this.balance -= 25000; this.ap -= 10; if (Math.random() < 0.38) { let g = randInt(45000, 75000); this.balance += g; s = true; msg = `成功+$${g.toFixed(3)}`; } else msg = '失败'; break;
            case 'tech': if (this.balance < 18000 || this.rdPoints < 350) return; this.balance -= 18000; this.rdPoints -= 350; this.ap -= 10; if (Math.random() < 0.48) { let g = randInt(25000, 45000), r = randInt(450, 900); this.balance += g; this.rdPoints += r; s = true; msg = `成功+$${g.toFixed(3)}`; } else msg = '失败'; break;
            case 'market': if (this.balance < 30000 || this.ap < 55) return; this.balance -= 30000; this.ap -= 55; if (Math.random() < 0.42) { let u = randInt(1800, 4500); this.totalUsers += u; this.comPoints += 180; s = true; msg = `成功+${u}用户`; } else msg = '失败'; break;
            case 'research': if (this.balance < 35000 || this.acPoints < 240) return; this.balance -= 35000; this.acPoints -= 240; this.ap -= 10; if (Math.random() < 0.52) { let g = randInt(35000, 65000); this.balance += g; this.acPoints += randInt(350, 700); s = true; this.coopResearchSuccess++; msg = `成功+$${g.toFixed(3)}`; } else msg = '失败'; break;
            case 'international': if (this.balance < 60000) return; this.balance -= 60000; this.ap -= 10; if (Math.random() < 0.35) { let g = randInt(70000, 110000); this.balance += g; this.totalUsers += randInt(800, 1800); this.reputation = Math.min(2, this.reputation + 0.04); s = true; this.coopInternationalSuccess++; msg = `成功+$${g.toFixed(3)}`; } else msg = '失败'; break;
            case 'gov': if (this.balance < 90000 || this.rdPoints < 600) return; this.balance -= 90000; this.rdPoints -= 600; this.ap -= 10; if (Math.random() < 0.25) { let g = randInt(130000, 180000); this.balance += g; this.reputation = Math.min(2, this.reputation + 0.08); s = true; this.coopGovSuccess++; msg = `大成功+$${g.toFixed(3)}`; } else msg = '失败'; break;
        }
        if (s) this.coopSuccessCount++;
        this.addLog(`合作(${type}):${msg}`, 'info'); this.showNotify(msg, s ? 'success' : 'warning');
        this.checkAchievements(); this.updateUI();
    },
    openCourse(id) {
        if (!this.features.school) return;
        const c = this.courses.find(c => c.id === id);
        if (!c || c.level > 0 || c.cooldown > 0) return;
        if (this.balance < c.openCost.money || this.acPoints < c.openCost.ac) return this.showNotify('资源不足', 'warning');
        this.balance -= c.openCost.money; this.acPoints -= c.openCost.ac;
        c.level = 1; c.cooldown = 3; this.balance += c.baseIncome;
        this.addLog(`开课:${c.name}`, 'success'); this.showNotify('开课成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    upgradeCourse(id) {
        const c = this.courses.find(c => c.id === id);
        if (!c || c.level === 0 || c.level >= c.maxLevel || c.cooldown > 0) return;
        if (this.balance < c.upgradeCost.money || this.acPoints < c.upgradeCost.ac) return this.showNotify('资源不足', 'warning');
        this.balance -= c.upgradeCost.money; this.acPoints -= c.upgradeCost.ac;
        c.level++; c.cooldown = 3;
        this.addLog(`升级课程:${c.name}至Lv.${c.level}`, 'success'); this.showNotify('升级成功', 'success');
        this.checkAchievements(); this.updateUI();
    },
    renderStaticContent() {
        const rdFeatures = [{ id: 'difficulty', name: '难度分级', desc: '高/中/低难度标签', cost: '$1,200 + 120研发', m: 1200, rd: 120 }, { id: 'solution', name: '题解系统', desc: '用户可发布题解', cost: '$1,200 + 120研发', m: 1200, rd: 120 }, { id: 'discuss', name: '讨论区', desc: '社区讨论板块', cost: '$6,000 + 350研发', m: 6000, rd: 350 }, { id: 'team', name: '团队模式', desc: '组队参赛功能', cost: '$12,000 + 600研发', m: 12000, rd: 600 }, { id: 'school', name: '网校系统', desc: '在线课程平台', cost: '$24,000 + 1000研发', m: 24000, rd: 1000 }, { id: 'api', name: '评测API', desc: '对外开放API', cost: '$35,000 + 1800研发', m: 35000, rd: 1800 }];
        document.getElementById('rdGrid').innerHTML = rdFeatures.map(f => `<div class="action-card"><div class="action-title">${f.name}</div><div class="action-desc">${f.desc}</div><div class="action-cost">${f.cost}</div><button class="action-btn" onclick="game.unlockFeature('${f.id}')" ${this.features[f.id] ? 'disabled' : ''}>${this.features[f.id] ? '已解锁' : '研发'}</button></div>`).join('');
        document.getElementById('problemGrid').innerHTML = [{ type: 'high', name: '高质量题目', desc: '+3题，占用0.18GB', cost: '25学术点' }, { type: 'medium', name: '中等题目', desc: '+10题，占用0.25GB', cost: '25学术点' }, { type: 'low', name: '低质量题目', desc: '+20题，占用0.25GB', cost: '25学术点' }].map(p => `<div class="action-card"><div class="action-title">${p.name}</div><div class="action-desc">${p.desc}</div><div class="action-cost">${p.cost}</div><button class="action-btn" onclick="game.addProblems('${p.type}')">扩充</button></div>`).join('');
        document.getElementById('contestGrid').innerHTML = [{ type: 'yuan', name: '院级友谊赛', desc: '小型比赛+4中档题', cost: '$600+45学术' }, { type: 'shui', name: '水题欢乐赛', desc: '+6低档题', cost: '$1,200+45学术' }, { type: 'putong', name: '普通公开赛', desc: '+4中档题', cost: '$3,500+90学术' }, { type: 'excellent', name: '精品挑战赛', desc: '+3高档题，信誉+0.04', cost: '$9,000+220学术' }].map(c => `<div class="action-card"><div class="action-title">${c.name}</div><div class="action-desc">${c.desc}</div><div class="action-cost">${c.cost}</div><button class="action-btn" onclick="game.holdContest('${c.type}')">举办</button></div>`).join('');
        document.getElementById('adGrid').innerHTML = [{ type: 'flyer', name: '传单', desc: '小范围宣传', cost: '$250+5AP', boost: '1.08x' }, { type: 'social', name: '社交媒体', desc: '中等覆盖', cost: '$600+10AP', boost: '1.18x' }, { type: 'video', name: '视频广告', desc: '广泛传播', cost: '$1,400+15AP', boost: '1.30x' }, { type: 'kol', name: 'KOL推广', desc: '精准投放', cost: '$3,500+20AP', boost: '1.45x' }, { type: 'tv', name: '电视广告', desc: '大众媒体', cost: '$9,000+30AP', boost: '1.70x' }].map(a => `<div class="action-card"><div class="action-title">${a.name}</div><div class="action-desc">${a.desc}</div><div class="action-cost">${a.cost} (${a.boost})</div><button class="action-btn" onclick="game.advertise('${a.type}')">投放</button></div>`).join('');
        document.getElementById('coopGrid').innerHTML = [{ type: 'business', name: '商业合作', desc: '$25,000+10AP，成功率38%', cost: '$25,000' }, { type: 'tech', name: '技术联盟', desc: '$18,000+350研发+10AP，成功率48%', cost: '$18,000' }, { type: 'market', name: '市场推广', desc: '$30,000+55AP，成功率42%', cost: '$30,000' }, { type: 'research', name: '科研合作', desc: '$35,000+240学术+10AP，成功率52%', cost: '$35,000' }, { type: 'international', name: '跨国合作', desc: '$60,000+10AP，成功率35%', cost: '$60,000' }, { type: 'gov', name: '政府项目', desc: '$90,000+600研发+10AP，成功率25%', cost: '$90,000' }].map(c => `<div class="action-card"><div class="action-title">${c.name}</div><div class="action-desc">${c.desc}</div><div class="action-cost">${c.cost}</div><button class="action-btn" onclick="game.cooperate('${c.type}')">合作</button></div>`).join('');
        document.getElementById('infraGrid').innerHTML = `<div class="action-card"><div class="action-title">Web核心+1</div><div class="action-desc">提升Web处理能力</div><div class="action-cost">$450</div><button class="action-btn" onclick="game.buyCore('web',1)">购买</button></div><div class="action-card"><div class="action-title">评测核心+1</div><div class="action-desc">提升评测能力</div><div class="action-cost">$450</div><button class="action-btn" onclick="game.buyCore('judge',1)">购买</button></div><div class="action-card"><div class="action-title">硬盘扩容40GB</div><div class="action-desc">存储更多数据</div><div class="action-cost">$180</div><button class="action-btn" onclick="game.buyDisk(40)">扩容</button></div><div class="action-card"><div class="action-title">硬盘扩容500GB</div><div class="action-desc">大量存储</div><div class="action-cost">$3,500</div><button class="action-btn" onclick="game.buyDisk(500)">扩容</button></div><div class="action-card"><div class="action-title">Web架构升级</div><div class="action-desc">升级Web服务器架构(最高Lv3)</div><div class="action-cost">$12,000+120研发</div><button class="action-btn" onclick="game.upgradeArch('web')">升级</button></div><div class="action-card"><div class="action-title">评测架构升级</div><div class="action-desc">升级评测架构(最高Lv3)</div><div class="action-cost">$12,000+120研发</div><button class="action-btn" onclick="game.upgradeArch('judge')">升级</button></div>`;
        document.getElementById('hrGrid').innerHTML = [{ type: 'rd_highschool', name: '高中生(研发)', desc: '研发+18，薪$900', cost: '$1,800' }, { type: 'rd_college', name: '大学生(研发)', desc: '研发+65，薪$2,800', cost: '$5,500' }, { type: 'rd_pro', name: '全职大牛(研发)', desc: '研发+110，薪$6,500', cost: '$13,000' }, { type: 'rd_postdoc', name: '博士后(研发)', desc: '研发+180，薪$13,000', cost: '$28,000' }, { type: 'ac_player', name: '现役选手(学术)', desc: '学术+45，薪$350', cost: '$600' }, { type: 'ac_coach', name: '全职教练(学术)', desc: '学术+350，薪$8,500', cost: '$16,000' }, { type: 'com_mod', name: '兼职版主(社区)', desc: '社区+45，薪$350', cost: '$600' }, { type: 'com_op', name: '全职运营(社区)', desc: '社区+350，薪$4,500', cost: '$8,000' }, { type: 'com_marketing', name: '市场专员(社区)', desc: '社区+130，薪$5,500', cost: '$11,000' }, { type: 'com_service', name: '客服专员(社区)', desc: '社区+70，薪$2,200', cost: '$3,500' }].map(h => `<div class="action-card"><div class="action-title">${h.name}</div><div class="action-desc">${h.desc}</div><div class="action-cost">${h.cost}</div><button class="action-btn" onclick="game.hireEmployee('${h.type}')">招募</button></div>`).join('');
    },
    updateUI() {
        document.getElementById('monthDisplay').innerText = `第${this.month}个月 (${this.year}.${this.month})`;
        document.getElementById('display_money').innerText = this.balance.toFixed(3);
        document.getElementById('display_ap').innerText = this.ap;
        if (document.getElementById('display_yin')) document.getElementById('display_yin').innerText = this.yinQi;
        if (document.getElementById('yin_bar')) document.getElementById('yin_bar').style.width = (this.yinQi / 100 * 100) + '%';
        if (document.getElementById('display_yinde')) document.getElementById('display_yinde').innerText = this.yinDe;
        if (document.getElementById('display_ghostMoney')) document.getElementById('display_ghostMoney').innerText = this.ghostMoney;
        document.getElementById('display_users').innerText = this.totalUsers;
        document.getElementById('last_submit').innerText = this.lastSubmits;
        document.getElementById('last_solution').innerText = this.lastSolutions;
        document.getElementById('display_rep').innerText = this.reputation.toFixed(3);
        document.getElementById('rep_bar').style.width = ((this.reputation + 2) / 4 * 100) + '%';
        document.getElementById('rd_pts').innerText = this.rdPoints;
        document.getElementById('ac_pts').innerText = this.acPoints;
        document.getElementById('com_pts').innerText = this.comPoints;
        document.getElementById('high_q').innerText = this.high;
        document.getElementById('mid_q').innerText = this.medium;
        document.getElementById('low_q').innerText = this.low;
        document.getElementById('disk_used').innerText = this.diskUsed.toFixed(3);
        document.getElementById('disk_total').innerText = this.diskTotal.toFixed(3);
        const wC = this.webCores * this.webLevel * 150;
        const jC = this.judgeCores * this.judgeLevel * 150;
        const wL = Math.floor(this.totalUsers * 0.65 + this.lastSubmits * 0.06);
        const jL = Math.floor(this.lastSubmits * 0.35);
        document.getElementById('web_load').innerText = wL;
        document.getElementById('web_cap').innerText = wC;
        document.getElementById('judge_load').innerText = jL;
        document.getElementById('judge_cap').innerText = jC;
        document.getElementById('web_core').innerText = this.webCores;
        document.getElementById('web_lv').innerText = this.webLevel;
        document.getElementById('judge_core').innerText = this.judgeCores;
        document.getElementById('judge_lv').innerText = this.judgeLevel;
        const s = this.staff.reduce((s, e) => s + e.salary, 0);
        const nM = (this.getTotalMonths() + 1 > 6) ? (this.webCores * this.webLevel + this.judgeCores * this.judgeLevel) * 220 : 0;
        const fi = 350 + Math.floor(this.totalUsers * 0.35) + (this.features.api ? Math.floor(this.totalUsers * 1.8 + 700) : 0) + this.courses.reduce((s, c) => s + (c.level * c.monthly), 0);
        document.getElementById('forecast_income').innerText = fi.toFixed(3);
        document.getElementById('forecast_salary').innerText = s.toFixed(3);
        document.getElementById('forecast_maintain').innerText = nM.toFixed(3);
        document.getElementById('forecast_net').innerText = (fi - s - nM).toFixed(3);
        document.getElementById('staffList').innerHTML = this.staff.length ? this.staff.map(st => `<div class="staff-item">${st.name} 薪${st.salary} 满意${st.satisfaction}%</div>`).join('') : '暂无员工';
        document.getElementById('staffCount').innerText = `当前员工:${this.staff.length}/${this.staffLimit}`;
        if (this.features.school) {
            document.getElementById('schoolLockedMessage').style.display = 'none';
            document.getElementById('schoolContent').style.display = 'block';
            document.getElementById('courseGrid').innerHTML = this.courses.map(c => `<div class="course-card"><div class="course-title">${c.name}</div><div class="course-level">${c.level > 0 ? `Lv.${c.level}/${c.maxLevel}` : '未开课'}</div>${c.cooldown > 0 ? `<div class="course-cooldown">冷却:${c.cooldown}月</div>` : ''}${c.level === 0 ? `<button class="action-btn" onclick="game.openCourse('${c.id}')">开课$${c.openCost.money.toFixed(3)}</button>` : c.level < c.maxLevel ? `<button class="action-btn" onclick="game.upgradeCourse('${c.id}')">升级$${c.upgradeCost.money.toFixed(3)}</button>` : '<div class="action-desc" style="color:var(--success);">已满级</div>'}</div>`).join('');
        } else {
            document.getElementById('schoolLockedMessage').style.display = 'block';
            document.getElementById('schoolContent').style.display = 'none';
        }
        document.getElementById('schoolTabBtn').disabled = !this.features.school;
        document.getElementById('loanList').innerHTML = this.loans.length ? this.loans.map(l => `<div class="bank-row"><span>贷款</span><span>$${l.amount.toFixed(3)}</span><span>4%</span><span>第${l.dueMonth}月</span></div>`).join('') : '<div class="bank-row">无贷款</div>';
        document.getElementById('depositList').innerHTML = this.deposits.length ? this.deposits.map(d => `<div class="bank-row"><span>定期</span><span>$${d.amount.toFixed(3)}</span><span>+$${d.interest.toFixed(3)}</span><span>第${d.dueMonth}月</span></div>`).join('') : '<div class="bank-row">无存款</div>';
        document.getElementById('cardBalanceDisplay').innerText = `$${this.cardBalance.toFixed(3)}`;
        this.renderLedger();
        this.updateIssues(wL, wC, jL, jC);
        document.getElementById('bankruptWarning').style.display = (this.balance < 300 && this.balance - s - nM < 0) ? 'block' : 'none';
        if (document.getElementById('ritualBtn')) document.getElementById('ritualBtn').innerText = `🔮 烧纸驱阴 (100纸钱) [${this.ghostMoney}]`;
        if (document.getElementById('ritualDesc')) document.getElementById('ritualDesc').innerText = this.yinQi > 50 ? `⚠️阴气浓重(${this.yinQi})！建议立即仪式` : `消耗纸钱进行仪式，当前纸钱:${this.ghostMoney}`;
        this.updateThemeVisibility();
        this.renderAchievements();
        this.renderPuzzles();
    },
    updateIssues(wL, wC, jL, jC) {
        const issues = [];
        if (wL >= wC) issues.push({ text: '⚠️Web过载', type: 'web', cost: 450, desc: 'Web核心+1' });
        if (jL >= jC) issues.push({ text: '⚠️评测过载', type: 'judge', cost: 450, desc: '评测核心+1' });
        if (this.diskUsed >= this.diskTotal * 0.95) issues.push({ text: '⚠️硬盘不足', type: 'disk', cost: 180, desc: '硬盘扩容40GB' });
        if (this.balance < 400) issues.push({ text: '💰资金紧张' });
        if (this.reputation < 0) issues.push({ text: '📉信誉过低' });
        if (this.getHorrorActive()) {
            if (this.yinQi > 55) issues.push({ text: '👻阴气浓重！需烧纸驱阴', type: 'ritual', cost: 0, desc: '烧纸驱阴' });
            if (this.yinDe < 18) issues.push({ text: '💀阴德亏损，恐遭报应', type: 'ritual', cost: 0, desc: '烧纸驱阴' });
        }
        document.getElementById('issueList').innerHTML = issues.map(i => `<div class="issue-item warning"><span class="issue-icon">⚠️</span><span class="issue-text">${i.text}</span>${i.type && i.type !== 'ritual' ? `<button class="issue-solve-btn" onclick="game.solveIssue('${i.type}',${i.cost},'${i.desc}')">一键解决</button>` : (i.type === 'ritual' ? `<button class="issue-solve-btn btn-ritual" onclick="game.performRitual()">烧纸</button>` : '')}</div>`).join('') || '<div class="issue-item">✅一切正常</div>';
    },
    solveIssue(type, cost, desc) {
        if (this.balance < cost) { this.showNotify('❌资金不足', 'warning'); return; }
        if (type === 'web') this.buyCore('web', 1); else if (type === 'judge') this.buyCore('judge', 1); else if (type === 'disk') this.buyDisk(40);
        this.addLog(`✅一键解决:${desc}`, 'success'); this.showNotify(`✅已自动${desc}`, 'success');
    },
    gameOver(reason, win = false) {
        this.gameOverTriggered = true;
        this.unlockFullscreen();
        document.getElementById('gameOverTitle').innerText = win ? '🎉胜利' : '💀结束';
        document.getElementById('gameOverReason').innerText = reason;
        document.getElementById('gameOverModal').style.display = 'flex';
        if (!win&&this.simulateFileDeletion) { setTimeout(() => this.simulateFileDeletion(), 2000); }
    },
    updateThemeVisibility() {
        const theme = document.documentElement.getAttribute('data-theme');
        const yinEls = document.querySelectorAll('.yin-element');
        const display = theme === 'horror' ? 'block' : 'none';
        yinEls.forEach(el => el.style.display = display);
        const cornerGhost = document.getElementById('cornerGhost');
        const edgeHandprint = document.getElementById('edgeHandprint');
        if (theme === 'horror') {
            if (this.yinQi > 40 && cornerGhost) cornerGhost.classList.add('visible');
            if (this.yinQi > 55 && edgeHandprint) edgeHandprint.classList.add('visible');
            if (this.sound) this.sound.createAmbient();
        } else {
            if (cornerGhost) cornerGhost.classList.remove('visible');
            if (edgeHandprint) edgeHandprint.classList.remove('visible');
            if (this.sound) this.sound.stopAmbient();
        }
        this.renderAchievements();
        this.renderPuzzles();
    },
    toggleSound() { if (this.sound) this.sound.toggle(); },
    init() {
        this.sound = new HorrorAudio();
        this.renderStaticContent();
        this.updateUI();
        this.renderLog();
        this.renderPuzzles();
        document.getElementById('exportLogBtn').onclick = () => this.exportLog();
        document.getElementById('nextMonthBtn').onclick = () => this.nextMonth();
        document.getElementById('donateBtn').onclick = () => this.donate();
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('msfullscreenchange', () => this.handleFullscreenChange());
        window.addEventListener('beforeunload', (e) => {
            if (this.getHorrorActive() && !this.gameOverTriggered && this.year < 2026) {
                e.preventDefault();
                e.returnValue = '你确定要离开吗？所有数据将被删除。系统文件已受损！';
                return e.returnValue;
            }
        });
        document.addEventListener('keydown', (e) => {
            if (this.getHorrorActive() && !this.gameOverTriggered) {
                if (e.key === 'Escape' || e.key === 'F11' || (e.ctrlKey && e.key === 'w') || (e.altKey && e.key === 'F4')) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.key === 'Escape' || e.key === 'F11') this.lockFullscreen();
                    return false;
                }
            }
        });
        document.addEventListener('contextmenu', (e) => {
            if (this.getHorrorActive() && !this.gameOverTriggered) { e.preventDefault(); return false; }
        });
        document.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('.btn, .btn-small, .action-btn')) {
                if (this.sound) this.sound.playClick();
            }
        });
        localStorage.removeItem('oj-theme');
        localStorage.removeItem('oj-horror-locked');
        document.documentElement.setAttribute('data-theme', 'chinese');
        document.getElementById('themeSelect').value = 'chinese';
        document.getElementById('themeSelect').disabled = false;
        this.updateThemeVisibility();
        document.getElementById('achievementSummary').innerText = '0/74';
    }
};

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(e => e.classList.remove('active'));
    const target = document.getElementById(tab);
    if (target) target.classList.add('active');
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => {
        const onclick = b.getAttribute('onclick');
        if (onclick && onclick.includes(`'${tab}'`)) b.classList.add('active');
    });
    if (tab === 'school' && !game.features.school) game.showNotify('请先在研发中心解锁网校功能', 'info');
}

async function switchTheme(t) {
    if (t === 'horror') {
        const confirmed = await game.showHorrorConfirmDialog();
        if (!confirmed) {
            document.getElementById('themeSelect').value = 'chinese';
            document.documentElement.setAttribute('data-theme', 'chinese');
            game.updateThemeVisibility(); game.updateUI();
            return;
        }
        localStorage.setItem('oj-horror-locked', 'true');
        localStorage.setItem('oj-theme', 'horror');
        document.getElementById('themeSelect').disabled = true;
        document.documentElement.setAttribute('data-theme', t);
        game.updateThemeVisibility(); game.updateUI();
        game.requestFullscreen(); game.lockFullscreen();
        if (!game.horrorWarningShown) {
            setTimeout(() => { game.showHorrorWarning(); game.speak('你逃不掉了...'); }, 500);
        }
    } else {
        localStorage.removeItem('oj-horror-locked');
        localStorage.setItem('oj-theme', t);
        document.getElementById('themeSelect').disabled = false;
        document.documentElement.setAttribute('data-theme', t);
        game.updateThemeVisibility(); game.updateUI();
        game.unlockFullscreen();
    }
}

function restartGame() {
    localStorage.removeItem('oj-horror-locked');
    localStorage.setItem('oj-theme', 'chinese');
    location.reload();
}

window.game = game;
game.init();
