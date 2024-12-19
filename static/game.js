class Player {
    constructor(name, gender, strength, weakness, hobby, dislike) {
        this.name = name;
        this.gender = gender;
        this.strength = strength;
        this.weakness = weakness;
        this.hobby = hobby;
        this.dislike = dislike;
        this.health = 100;
        this.skills = this.generateSkills();
    }

    generateSkills() {
        const skills = [];
        
        // 基于优点生成攻击技能
        skills.push({
            name: `${this.strength}之力`,
            type: 'attack',
            damage: 15,
            description: `使用${this.strength}的力量进行攻击`
        });

        // 基于爱好生成攻击技能
        skills.push({
            name: `${this.hobby}专精`,
            type: 'attack',
            damage: 20,
            description: `用${this.hobby}的特殊技能造成伤害`
        });

        // 基于性别生成防御技能
        skills.push({
            name: this.gender === '男' ? '刚强护盾' : '坚韧护盾',
            type: 'defense',
            defense: 15,
            description: '提升防御力'
        });

        // 基于缺点生成特殊技能
        skills.push({
            name: `${this.weakness}逆转`,
            type: 'special',
            effect: 'random',
            description: `将${this.weakness}转化为力量`
        });

        return skills;
    }
}

class Game {
    constructor() {
        this.currentTurn = 1;
        this.player1 = null;
        this.player2 = null;
        this.currentPlayer = null;
        this.opponent = null;
        this.gameOver = false;
        this.soundEnabled = true;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('start-battle').addEventListener('click', () => this.startBattle());
        document.getElementById('restart-game').addEventListener('click', () => this.restartGame());
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
        });
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        
        const sound = document.getElementById(`${type}-sound`);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    showEffect(playerNum, type) {
        const effectContainer = document.getElementById(`p${playerNum}-effect`);
        const effect = document.createElement('img');
        effect.src = `/static/images/${type}_effect.png`;
        effect.className = 'effect-animation';
        effectContainer.appendChild(effect);
        
        // 动画结束后移除效果
        effect.addEventListener('animationend', () => {
            effect.remove();
        });
    }

    updateAvatar(playerNum) {
        const gender = document.getElementById(`gender${playerNum}`).value;
        const avatarImg = document.getElementById(`avatar${playerNum}`);
        avatarImg.src = `/static/images/${gender === '男' ? 'male' : 'female'}_avatar.png`;
    }

    startBattle() {
        // 获取玩家输入
        const p1Data = {
            name: document.getElementById('name1').value,
            gender: document.getElementById('gender1').value,
            strength: document.getElementById('strength1').value,
            weakness: document.getElementById('weakness1').value,
            hobby: document.getElementById('hobby1').value,
            dislike: document.getElementById('dislike1').value
        };

        const p2Data = {
            name: document.getElementById('name2').value,
            gender: document.getElementById('gender2').value,
            strength: document.getElementById('strength2').value,
            weakness: document.getElementById('weakness2').value,
            hobby: document.getElementById('hobby2').value,
            dislike: document.getElementById('dislike2').value
        };

        // 验证输入
        if (!this.validateInputs(p1Data) || !this.validateInputs(p2Data)) {
            alert('请填写所有信息！');
            return;
        }

        // 创建玩家对象
        this.player1 = new Player(p1Data.name, p1Data.gender, p1Data.strength, p1Data.weakness, p1Data.hobby, p1Data.dislike);
        this.player2 = new Player(p2Data.name, p2Data.gender, p2Data.strength, p2Data.weakness, p2Data.hobby, p2Data.dislike);

        // 设置初始玩家
        this.currentPlayer = this.player1;
        this.opponent = this.player2;

        // 设置角色头像
        document.getElementById('p1-avatar').src = `/static/images/${p1Data.gender === '男' ? 'male' : 'female'}_avatar.png`;
        document.getElementById('p2-avatar').src = `/static/images/${p2Data.gender === '男' ? 'male' : 'female'}_avatar.png`;

        // 切换到战斗界面
        document.getElementById('input-phase').classList.remove('active');
        document.getElementById('input-phase').classList.add('hidden');
        document.getElementById('battle-phase').classList.remove('hidden');

        // 更新界面
        this.updateBattleUI();
    }

    validateInputs(data) {
        return Object.values(data).every(value => value.trim() !== '');
    }

    updateBattleUI() {
        // 更新玩家名称
        document.getElementById('p1-name').textContent = this.player1.name;
        document.getElementById('p2-name').textContent = this.player2.name;

        // 更新血量条
        this.updateHealthBar(1, this.player1.health);
        this.updateHealthBar(2, this.player2.health);

        // 更新技能按钮
        this.updateSkillButtons();

        // 添加回合信息
        this.addBattleMessage(`回合 ${this.currentTurn}: ${this.currentPlayer.name} 的回合`);
    }

    updateHealthBar(playerNum, health) {
        const healthBar = document.getElementById(`p${playerNum}-health-bar`);
        const healthText = document.getElementById(`p${playerNum}-health-text`);
        healthBar.style.width = `${health}%`;
        healthText.textContent = `${health}/100`;
    }

    updateSkillButtons() {
        const skillsContainer = document.getElementById(`p${this.currentPlayer === this.player1 ? '1' : '2'}-skills`);
        skillsContainer.innerHTML = '';

        this.currentPlayer.skills.forEach((skill, index) => {
            const button = document.createElement('button');
            button.className = 'skill-button';
            button.textContent = skill.name;
            button.addEventListener('click', () => this.useSkill(index));
            skillsContainer.appendChild(button);
        });

        // 禁用对手的技能按钮
        const opponentSkillsContainer = document.getElementById(`p${this.currentPlayer === this.player1 ? '2' : '1'}-skills`);
        opponentSkillsContainer.innerHTML = '';
        this.opponent.skills.forEach(skill => {
            const button = document.createElement('button');
            button.className = 'skill-button disabled';
            button.textContent = skill.name;
            opponentSkillsContainer.appendChild(button);
        });
    }

    useSkill(skillIndex) {
        const skill = this.currentPlayer.skills[skillIndex];
        let damage = 0;
        let message = '';
        const currentPlayerNum = this.currentPlayer === this.player1 ? '1' : '2';
        const opponentNum = this.opponent === this.player1 ? '1' : '2';

        switch (skill.type) {
            case 'attack':
                damage = skill.damage;
                this.opponent.health = Math.max(0, this.opponent.health - damage);
                message = `${this.currentPlayer.name} 使用 ${skill.name} 对 ${this.opponent.name} 造成了 ${damage} 点伤害！`;
                this.playSound('attack');
                this.showEffect(opponentNum, 'attack');
                document.getElementById(`p${opponentNum}-avatar`).classList.add('attack-animation');
                setTimeout(() => {
                    document.getElementById(`p${opponentNum}-avatar`).classList.remove('attack-animation');
                }, 600);
                break;

            case 'defense':
                this.currentPlayer.health = Math.min(100, this.currentPlayer.health + skill.defense);
                message = `${this.currentPlayer.name} 使用 ${skill.name} 恢复了 ${skill.defense} 点生命值！`;
                this.playSound('defense');
                this.showEffect(currentPlayerNum, 'defense');
                document.getElementById(`p${currentPlayerNum}-avatar`).classList.add('defense-animation');
                setTimeout(() => {
                    document.getElementById(`p${currentPlayerNum}-avatar`).classList.remove('defense-animation');
                }, 1000);
                break;

            case 'special':
                damage = Math.floor(Math.random() * 25) + 10;
                this.opponent.health = Math.max(0, this.opponent.health - damage);
                message = `${this.currentPlayer.name} 使用 ${skill.name} 造成了 ${damage} 点不稳定伤害！`;
                this.playSound('special');
                this.showEffect(opponentNum, 'special');
                break;
        }

        this.addBattleMessage(message);
        this.updateHealthBar(this.opponent === this.player1 ? 1 : 2, this.opponent.health);
        this.updateHealthBar(this.currentPlayer === this.player1 ? 1 : 2, this.currentPlayer.health);

        // 检查游戏是否结束
        if (this.opponent.health <= 0) {
            this.endGame();
            return;
        }

        // 切换回合
        this.switchTurn();
    }

    switchTurn() {
        [this.currentPlayer, this.opponent] = [this.opponent, this.currentPlayer];
        this.currentTurn++;
        this.updateBattleUI();
    }

    addBattleMessage(message) {
        const battleLog = document.getElementById('battle-messages');
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        battleLog.appendChild(messageElement);
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    endGame() {
        this.playSound('victory');
        document.getElementById('battle-phase').classList.add('hidden');
        document.getElementById('result-phase').classList.remove('hidden');
        
        const winnerAvatar = document.getElementById('winner-avatar');
        winnerAvatar.src = `/static/images/${this.currentPlayer.gender === '男' ? 'male' : 'female'}_avatar.png`;
        document.getElementById('winner-text').textContent = `${this.currentPlayer.name} 获得了胜利！`;
    }

    restartGame() {
        // 重置游戏状态
        this.currentTurn = 1;
        this.player1 = null;
        this.player2 = null;
        this.currentPlayer = null;
        this.opponent = null;
        this.gameOver = false;

        // 清空输入框
        document.querySelectorAll('input').forEach(input => input.value = '');
        document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);

        // 重置头像
        document.querySelectorAll('.avatar-preview img').forEach(img => {
            img.src = '/static/images/male_avatar.png';
        });

        // 清空战斗日志
        document.getElementById('battle-messages').innerHTML = '';

        // 切换回输入界面
        document.getElementById('result-phase').classList.add('hidden');
        document.getElementById('input-phase').classList.remove('hidden');
        document.getElementById('input-phase').classList.add('active');
    }
}

// 初始化游戏
const game = new Game();

// 添加性别选择时更新头像的事件监听
function updateAvatar(playerNum) {
    game.updateAvatar(playerNum);
}
