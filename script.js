// 游戏状态
const gameState = {
    words: [], // 单词表 [{english: '...', chinese: '...'}]
    confusionWords: [], // 混淆表
    currentRound: 0,
    currentWord: null,
    wordIndex: {
        left: 0,
        right: 0
    },
    wordSequence: {
        left: [],
        right: []
    },
    options: {
        left: [],
        right: []
    },
    correctOption: {
        left: null,
        right: null
    },
    timeLimit: 10, // 默认10秒
    timer: {
        left: null,
        right: null
    },
    timeLeft: {
        left: 0,
        right: 0
    },
    gameMode: 'en2zh', // 默认显示英文，选择中文
    optionsCount: 4, // 默认4个选项
    isGameRunning: false,
    isPaused: false,
    scores: {
        left: 0,
        right: 0
    },
    mistakes: {
        left: [],
        right: []
    },
    roundComplete: {
        left: false,
        right: false
    },
    waitingForOpponent: {
        left: false,
        right: false
    },
    teamFinished: {
        left: false,
        right: false
    },
    allWordsCompleted: false,
    gameSpeed: 'competitive', // 'competitive'(竞技) 或 'tournament'(比赛)
    wordOrder: 'sequential', // 'sequential'(顺序), 'singleRandom'(单乱序), 'doubleRandom'(双乱序)
};

// DOM元素
const elements = {
    settingsBtn: document.getElementById('settingsBtn'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    settingsModal: document.getElementById('settingsModal'),
    resultModal: document.getElementById('resultModal'),
    mistakesModal: document.getElementById('mistakesModal'),
    closeMistakesBtn: document.getElementById('closeMistakesBtn'),
    showMistakesBtn: document.getElementById('showMistakesBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    leftFinalScore: document.getElementById('leftFinalScore'),
    rightFinalScore: document.getElementById('rightFinalScore'),
    winnerAnnouncement: document.getElementById('winnerAnnouncement'),
    resultTitle: document.getElementById('resultTitle'),
    leftMistakesList: document.getElementById('leftMistakesList'),
    rightMistakesList: document.getElementById('rightMistakesList'),
    closeModalBtn: document.querySelector('.close'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    wordFile: document.getElementById('wordFile'),
    wordFileName: document.getElementById('wordFileName'),
    confusionFile: document.getElementById('confusionFile'),
    confusionFileName: document.getElementById('confusionFileName'),
    gameMode: document.getElementById('gameMode'),
    timeLimit: document.getElementById('timeLimit'),
    optionsCount: document.getElementById('optionsCount'),
    competitiveMode: document.getElementById('competitiveMode'),
    tournamentMode: document.getElementById('tournamentMode'),
    sequentialOrder: document.getElementById('sequentialOrder'),
    singleRandomOrder: document.getElementById('singleRandomOrder'),
    doubleRandomOrder: document.getElementById('doubleRandomOrder'),
    leftWordDisplay: document.getElementById('leftWordDisplay'),
    rightWordDisplay: document.getElementById('rightWordDisplay'),
    leftCurrentWord: document.getElementById('leftCurrentWord'),
    rightCurrentWord: document.getElementById('rightCurrentWord'),
    leftOptionsContainer: document.getElementById('leftOptionsContainer'),
    rightOptionsContainer: document.getElementById('rightOptionsContainer'),
    leftTimerBar: document.getElementById('leftTimerBar'),
    rightTimerBar: document.getElementById('rightTimerBar'),
    leftTimerText: document.getElementById('leftTimerText'),
    rightTimerText: document.getElementById('rightTimerText'),
    leftScore: document.getElementById('leftScore'),
    rightScore: document.getElementById('rightScore')
};

// 添加自动字体大小调整和处理长单词的函数
function adjustWordDisplay(team, text) {
    const currentWordElement = team === 'left' ? elements.leftCurrentWord : elements.rightCurrentWord;
    const containerElement = team === 'left' ? elements.leftWordDisplay : elements.rightWordDisplay;
    
    // 重置样式以便测量
    currentWordElement.style.fontSize = '';
    currentWordElement.style.lineHeight = '1.3';
    currentWordElement.style.whiteSpace = 'normal';
    
    // 设置内容
    currentWordElement.textContent = text;
    
    const containerWidth = containerElement.offsetWidth - 30; // 减去padding
    const containerHeight = containerElement.offsetHeight - 50; // 减去padding和计时器高度
    
    // 如果是超长文本（超过40个字符）
    if (text.length > 40) {
        // 默认字体大小较小
        let fontSize = Math.min(3.5, 2.8 - (text.length - 40) * 0.03);
        fontSize = Math.max(fontSize, 1.8); // 不要小于1.8rem
        currentWordElement.style.fontSize = `${fontSize}rem`;
    } 
    // 如果包含空格（可能是短语）
    else if (text.includes(' ') && text.length > 15) {
        // 调整为稍小的字体大小
        currentWordElement.style.fontSize = '2.2rem';
    }
    
    // 检查是否溢出
    if (currentWordElement.scrollWidth > containerWidth || 
        currentWordElement.scrollHeight > containerHeight) {
        
        // 迭代减小字体直到适合
        let currentSize = parseFloat(window.getComputedStyle(currentWordElement).fontSize);
        const step = 1; // 每次减少1px
        
        while ((currentWordElement.scrollWidth > containerWidth || 
                currentWordElement.scrollHeight > containerHeight) && 
               currentSize > 12) { // 不要小于12px
            currentSize -= step;
            currentWordElement.style.fontSize = `${currentSize}px`;
        }
    }
}

// 确保两边的游戏内容区域高度一致
function equalizeGameContentHeight() {
    // 获取左右两边的容器高度
    const leftHeight = elements.leftWordDisplay.offsetHeight;
    const rightHeight = elements.rightWordDisplay.offsetHeight;
    
    // 如果高度不一致，将两者设为最大值
    if (leftHeight !== rightHeight) {
        const maxHeight = Math.max(leftHeight, rightHeight);
        elements.leftWordDisplay.style.minHeight = `${maxHeight}px`;
        elements.rightWordDisplay.style.minHeight = `${maxHeight}px`;
    }
    
    // 同样处理选项容器
    const leftOptionsHeight = elements.leftOptionsContainer.offsetHeight;
    const rightOptionsHeight = elements.rightOptionsContainer.offsetHeight;
    
    if (leftOptionsHeight !== rightOptionsHeight) {
        const maxOptionsHeight = Math.max(leftOptionsHeight, rightOptionsHeight);
        elements.leftOptionsContainer.style.minHeight = `${maxOptionsHeight}px`;
        elements.rightOptionsContainer.style.minHeight = `${maxOptionsHeight}px`;
    }
}

// 在窗口大小变化时调整布局
window.addEventListener('resize', function() {
    if (gameState.isGameRunning) {
        // 获取当前显示的单词
        const leftWord = elements.leftCurrentWord.textContent;
        const rightWord = elements.rightCurrentWord.textContent;
        
        // 重新调整单词显示
        if (leftWord !== '准备开始...' && !gameState.teamFinished.left) {
            adjustWordDisplay('left', leftWord);
        }
        
        if (rightWord !== '准备开始...' && !gameState.teamFinished.right) {
            adjustWordDisplay('right', rightWord);
        }
        
        // 确保两边高度一致
        equalizeGameContentHeight();
    }
});

// 修改generateQuestionForTeam函数，加入字体大小调整逻辑
function generateQuestionForTeam(team) {
    // 检查是否已经做完所有单词
    if (gameState.wordIndex[team] >= gameState.wordSequence[team].length) {
        gameState.teamFinished[team] = true;
        showTeamCompleteScreen(team);
        return;
    }
    
    // 获取该队的下一个单词索引
    const wordIndex = gameState.wordSequence[team][gameState.wordIndex[team]];
    const word = gameState.words[wordIndex];
    
    // 显示单词，并自动调整字体大小
    const displayText = gameState.gameMode === 'en2zh' ? word.english : word.chinese;
    adjustWordDisplay(team, displayText);
    
    // 生成选项
    generateOptions(team, word);
    
    // 增加单词索引
    gameState.wordIndex[team]++;
    
    // 确保两边高度一致
    setTimeout(equalizeGameContentHeight, 100);
}

// 修改generateOptions函数，为选项也添加自动调整
function generateOptions(team, word) {
    // 清空选项容器
    const optionsContainer = team === 'left' ? elements.leftOptionsContainer : elements.rightOptionsContainer;
    optionsContainer.innerHTML = '';
    
    // 确定正确选项的位置
    const correctIndex = Math.floor(Math.random() * gameState.optionsCount);
    
    // 生成选项
    const options = [];
    
    // 添加正确选项
    if (gameState.gameMode === 'en2zh') {
        options[correctIndex] = word.chinese;
        gameState.correctOption[team] = word.chinese;
    } else {
        options[correctIndex] = word.english;
        gameState.correctOption[team] = word.english;
    }
    
    // 添加混淆选项
    let availableConfusionWords = [];
    
    // 如果有混淆表，优先使用混淆表
    if (gameState.confusionWords.length > 0) {
        availableConfusionWords = gameState.confusionWords.slice();
    } else {
        // 否则使用单词表中的其他单词
        availableConfusionWords = gameState.words.filter(w => 
            w !== word
        );
    }
    
    // 打乱混淆单词顺序
    shuffleArray(availableConfusionWords);
    
    // 填充其他选项
    let confusionIndex = 0;
    for (let i = 0; i < gameState.optionsCount; i++) {
        if (i !== correctIndex) {
            let confusionOption;
            
            if (gameState.gameMode === 'en2zh') {
                confusionOption = availableConfusionWords[confusionIndex].chinese;
            } else {
                confusionOption = availableConfusionWords[confusionIndex].english;
            }
            
            // 确保混淆选项不重复且不等于正确选项
            while (options.includes(confusionOption) || confusionOption === gameState.correctOption[team]) {
                confusionIndex++;
                if (confusionIndex >= availableConfusionWords.length) {
                    // 如果混淆单词不够，生成随机字符串
                    confusionOption = gameState.gameMode === 'en2zh' 
                        ? `混淆选项${i}` 
                        : `Confusion${i}`;
                    break;
                }
                
                if (gameState.gameMode === 'en2zh') {
                    confusionOption = availableConfusionWords[confusionIndex].chinese;
                } else {
                    confusionOption = availableConfusionWords[confusionIndex].english;
                }
            }
            
            options[i] = confusionOption;
            confusionIndex++;
        }
    }
    
    // 创建选项元素
    options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        // 调整选项文本大小
        if (option.length > 20) {
            const fontSize = Math.max(1, 1.4 - (option.length - 20) * 0.02);
            optionElement.style.fontSize = `${fontSize}rem`;
        }
        
        optionElement.addEventListener('click', () => handleOptionClick(option, team));
        
        optionsContainer.appendChild(optionElement);
    });
    
    gameState.options[team] = options;
}

// 修改showTeamCompleteScreen函数，以保持区域一致性
function showTeamCompleteScreen(team) {
    const currentWordElement = team === 'left' ? elements.leftCurrentWord : elements.rightCurrentWord;
    const optionsContainer = team === 'left' ? elements.leftOptionsContainer : elements.rightOptionsContainer;
    const score = gameState.scores[team];
    
    // 重置字体样式
    currentWordElement.style.fontSize = '';
    currentWordElement.style.lineHeight = '';
    
    currentWordElement.textContent = "所有单词已完成！";
    optionsContainer.innerHTML = `<div class="game-end-message">恭喜完成！最终得分: ${score}分</div><div class="wait-message">请等待另一队完成...</div>`;
    
    // 确保两边高度一致
    setTimeout(equalizeGameContentHeight, 100);
    
    // 检查是否两队都已完成
    if (gameState.teamFinished.left && gameState.teamFinished.right) {
        gameState.allWordsCompleted = true;
        showResultModal();
    }
}

// 修改forceEndRound函数，增加高度一致性
function forceEndRound(team) {
    // 停止计时器
    if (gameState.timer[team]) {
        clearInterval(gameState.timer[team]);
        gameState.timer[team] = null;
    }
    
    // 标记该队本轮已完成
    gameState.roundComplete[team] = true;
    
    // 禁用所有选项
    const optionsContainer = team === 'left' ? elements.leftOptionsContainer : elements.rightOptionsContainer;
    const optionElements = optionsContainer.querySelectorAll('.option');
    
    optionElements.forEach(el => {
        el.style.pointerEvents = 'none';
        
        // 标记正确的选项
        if (el.textContent === gameState.correctOption[team]) {
            el.classList.add('correct');
        }
    });
    
    // 添加提示消息
    const forceMessage = document.createElement('div');
    forceMessage.className = 'waiting-message';
    forceMessage.innerHTML = '<span class="material-icons">running_with_errors</span> 对手已完成作答，自动进入下一题...';
    optionsContainer.appendChild(forceMessage);
    
    // 确保两边高度一致
    setTimeout(equalizeGameContentHeight, 100);
}

// 初始化
function init() {
    // 绑定事件
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeModalBtn.addEventListener('click', closeSettings);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.resetBtn.addEventListener('click', resetGame);
    elements.wordFile.addEventListener('change', handleWordFileUpload);
    elements.confusionFile.addEventListener('change', handleConfusionFileUpload);
    elements.showMistakesBtn.addEventListener('click', showMistakesModal);
    elements.closeMistakesBtn.addEventListener('click', hideMistakesModal);
    elements.playAgainBtn.addEventListener('click', resetAndStartGame);
    
    // 文件名显示
    elements.wordFile.addEventListener('change', function(e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : '未选择文件';
        elements.wordFileName.textContent = fileName;
    });
    
    elements.confusionFile.addEventListener('change', function(e) {
        const fileName = e.target.files[0] ? e.target.files[0].name : '未选择文件';
        elements.confusionFileName.textContent = fileName;
    });
    
    // 窗口点击事件，点击模态框外部关闭模态框
    window.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
        if (e.target === elements.mistakesModal) {
            hideMistakesModal();
        }
    });
    
    // 禁用开始按钮和暂停按钮，直到上传单词表
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = true;
    
    // 注意：触控事件处理已移至touch-handler.js
    // 以下代码保留作为备用，但实际由touch-handler.js处理
    /*
    // 禁用浏览器默认的触摸行为
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault(); // 禁止多点触控（如缩放）
        }
    }, { passive: false });
    
    // 禁用双击缩放
    document.addEventListener('dblclick', function(e) {
        e.preventDefault();
    });
    */
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // 禁用键盘快捷键
    document.addEventListener('keydown', function(e) {
        // 禁用Ctrl+加号/减号缩放
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
            e.preventDefault();
        }
    });
    
    // 初始确保两边区域高度一致
    setTimeout(equalizeGameContentHeight, 500);
}

// 打开设置模态框
function openSettings() {
    elements.settingsModal.style.display = 'block';
}

// 关闭设置模态框
function closeSettings() {
    elements.settingsModal.style.display = 'none';
}

// 显示错题模态框
function showMistakesModal() {
    updateMistakesLists();
    
    // 先隐藏结果模态框，确保错题模态框可以正确显示在顶部
    elements.resultModal.style.display = 'none';
    
    // 显示错题模态框
    elements.mistakesModal.style.display = 'block';
    
    // 确保错题列表滚动到顶部
    if (elements.leftMistakesList) elements.leftMistakesList.scrollTop = 0;
    if (elements.rightMistakesList) elements.rightMistakesList.scrollTop = 0;
}

// 隐藏错题模态框
function hideMistakesModal() {
    elements.mistakesModal.style.display = 'none';
    
    // 重新显示结果模态框
    elements.resultModal.style.display = 'block';
}

// 更新错题列表显示
function updateMistakesLists() {
    // 清空错题列表
    elements.leftMistakesList.innerHTML = '';
    elements.rightMistakesList.innerHTML = '';
    
    // 左队错题
    if (gameState.mistakes.left.length === 0) {
        elements.leftMistakesList.innerHTML = '<div class="no-mistakes">没有错误，太棒了！</div>';
    } else {
        gameState.mistakes.left.forEach(mistake => {
            const mistakeItem = document.createElement('div');
            mistakeItem.className = 'mistake-item';
            mistakeItem.innerHTML = `
                <div class="mistake-question">${mistake.question}</div>
                <div class="mistake-wrong"><span class="material-icons">close</span> ${mistake.selectedAnswer}</div>
                <div class="mistake-correct"><span class="material-icons">check_circle</span> ${mistake.correctAnswer}</div>
            `;
            elements.leftMistakesList.appendChild(mistakeItem);
        });
    }
    
    // 右队错题
    if (gameState.mistakes.right.length === 0) {
        elements.rightMistakesList.innerHTML = '<div class="no-mistakes">没有错误，太棒了！</div>';
    } else {
        gameState.mistakes.right.forEach(mistake => {
            const mistakeItem = document.createElement('div');
            mistakeItem.className = 'mistake-item';
            mistakeItem.innerHTML = `
                <div class="mistake-question">${mistake.question}</div>
                <div class="mistake-wrong"><span class="material-icons">close</span> ${mistake.selectedAnswer}</div>
                <div class="mistake-correct"><span class="material-icons">check_circle</span> ${mistake.correctAnswer}</div>
            `;
            elements.rightMistakesList.appendChild(mistakeItem);
        });
    }
    
    // 确保错题列表滚动回顶部
    setTimeout(() => {
        if (elements.leftMistakesList) elements.leftMistakesList.scrollTop = 0;
        if (elements.rightMistakesList) elements.rightMistakesList.scrollTop = 0;
    }, 50);
}

// 显示结果模态框
function showResultModal() {
    // 设置最终分数
    elements.leftFinalScore.textContent = gameState.scores.left;
    elements.rightFinalScore.textContent = gameState.scores.right;
    
    // 判断胜负
    if (gameState.scores.left > gameState.scores.right) {
        elements.winnerAnnouncement.textContent = '左队获胜！';
        elements.winnerAnnouncement.style.color = '#3498db';
    } else if (gameState.scores.right > gameState.scores.left) {
        elements.winnerAnnouncement.textContent = '右队获胜！';
        elements.winnerAnnouncement.style.color = '#e74c3c';
    } else {
        elements.winnerAnnouncement.textContent = '平局！';
        elements.winnerAnnouncement.style.color = '#f39c12';
    }
    
    elements.resultModal.style.display = 'block';
}

// 重置并开始新游戏
function resetAndStartGame() {
    resetGame();
    elements.resultModal.style.display = 'none';
    startGame();
}

// 保存设置
function saveSettings() {
    gameState.gameMode = elements.gameMode.value;
    gameState.timeLimit = parseInt(elements.timeLimit.value);
    gameState.optionsCount = parseInt(elements.optionsCount.value);
    gameState.gameSpeed = elements.competitiveMode.checked ? 'competitive' : 'tournament';
    
    // 设置出题顺序
    if (elements.sequentialOrder.checked) {
        gameState.wordOrder = 'sequential';
    } else if (elements.singleRandomOrder.checked) {
        gameState.wordOrder = 'singleRandom';
    } else if (elements.doubleRandomOrder.checked) {
        gameState.wordOrder = 'doubleRandom';
    }
    
    closeSettings();
}

// 处理单词表上传
async function handleWordFileUpload(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        const data = await readExcelFile(file);
        if (data && data.length > 0) {
            gameState.words = data.map(row => ({
                english: row[0] || '',
                chinese: row[1] || ''
            })).filter(word => word.english && word.chinese);
            
            console.log('单词表已加载:', gameState.words.length, '个单词');
            
            // 启用开始按钮
            if (gameState.words.length > 0) {
                elements.startBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('读取单词表出错:', error);
        alert('读取单词表出错，请确保文件格式正确');
    }
}

// 处理混淆表上传
async function handleConfusionFileUpload(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;
        
        const data = await readExcelFile(file);
        if (data && data.length > 0) {
            gameState.confusionWords = data.map(row => ({
                english: row[0] || '',
                chinese: row[1] || ''
            })).filter(word => word.english && word.chinese);
            
            console.log('混淆表已加载:', gameState.confusionWords.length, '个单词');
        }
    } catch (error) {
        console.error('读取混淆表出错:', error);
        alert('读取混淆表出错，请确保文件格式正确');
    }
}

// 读取Excel文件
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 过滤掉空行
                const filteredData = jsonData.filter(row => row.length >= 2);
                resolve(filteredData);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function(error) {
            reject(error);
        };
        
        reader.readAsBinaryString(file);
    });
}

// 开始游戏
function startGame() {
    if (gameState.words.length === 0) {
        alert('请先上传单词表');
        return;
    }
    
    if (gameState.isGameRunning && !gameState.isPaused) {
        return;
    }
    
    // 如果是从暂停状态恢复
    if (gameState.isPaused) {
        resumeGame();
        return;
    }
    
    gameState.isGameRunning = true;
    gameState.isPaused = false;
    gameState.currentRound = 0;
    gameState.allWordsCompleted = false;
    gameState.teamFinished.left = false;
    gameState.teamFinished.right = false;
    gameState.waitingForOpponent.left = false;
    gameState.waitingForOpponent.right = false;
    
    // 启用暂停按钮
    elements.pauseBtn.disabled = false;
    
    // 重置分数
    gameState.scores.left = 0;
    gameState.scores.right = 0;
    elements.leftScore.textContent = '0';
    elements.rightScore.textContent = '0';
    
    // 重置错误记录
    gameState.mistakes.left = [];
    gameState.mistakes.right = [];
    
    // 重置轮次完成状态
    gameState.roundComplete.left = false;
    gameState.roundComplete.right = false;
    
    // 根据出题顺序设置单词序列
    prepareWordSequences();
    
    // 开始第一轮
    nextRound();
}

// 准备单词序列
function prepareWordSequences() {
    // 重置单词索引
    gameState.wordIndex.left = 0;
    gameState.wordIndex.right = 0;
    
    // 根据出题顺序设置单词序列
    switch (gameState.wordOrder) {
        case 'sequential':
            // 顺序出题，直接使用单词表索引
            gameState.wordSequence.left = Array.from({ length: gameState.words.length }, (_, i) => i);
            gameState.wordSequence.right = [...gameState.wordSequence.left];
            break;
            
        case 'singleRandom':
            // 单乱序，生成一个随机序列，两队使用相同序列
            gameState.wordSequence.left = Array.from({ length: gameState.words.length }, (_, i) => i);
            shuffleArray(gameState.wordSequence.left);
            gameState.wordSequence.right = [...gameState.wordSequence.left];
            break;
            
        case 'doubleRandom':
            // 双乱序，生成两个不同的随机序列
            gameState.wordSequence.left = Array.from({ length: gameState.words.length }, (_, i) => i);
            gameState.wordSequence.right = Array.from({ length: gameState.words.length }, (_, i) => i);
            shuffleArray(gameState.wordSequence.left);
            shuffleArray(gameState.wordSequence.right);
            break;
    }
}

// 暂停/恢复游戏
function togglePause() {
    if (!gameState.isGameRunning) {
        return;
    }
    
    if (gameState.isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
}

// 暂停游戏
function pauseGame() {
    gameState.isPaused = true;
    elements.pauseBtn.textContent = '继续';
    elements.pauseBtn.classList.add('paused');
    
    // 暂停计时器
    if (gameState.timer.left) {
        clearInterval(gameState.timer.left);
    }
    
    if (gameState.timer.right) {
        clearInterval(gameState.timer.right);
    }
}

// 恢复游戏
function resumeGame() {
    gameState.isPaused = false;
    elements.pauseBtn.textContent = '暂停';
    elements.pauseBtn.classList.remove('paused');
    
    // 恢复计时器
    if (!gameState.roundComplete.left && !gameState.teamFinished.left && !gameState.waitingForOpponent.left) {
        startTimer('left');
    }
    
    if (!gameState.roundComplete.right && !gameState.teamFinished.right && !gameState.waitingForOpponent.right) {
        startTimer('right');
    }
}

// 重置游戏
function resetGame() {
    // 停止计时器
    if (gameState.timer.left) {
        clearInterval(gameState.timer.left);
        gameState.timer.left = null;
    }
    
    if (gameState.timer.right) {
        clearInterval(gameState.timer.right);
        gameState.timer.right = null;
    }
    
    gameState.isGameRunning = false;
    gameState.isPaused = false;
    gameState.currentRound = 0;
    gameState.allWordsCompleted = false;
    gameState.teamFinished.left = false;
    gameState.teamFinished.right = false;
    gameState.waitingForOpponent.left = false;
    gameState.waitingForOpponent.right = false;
    
    // 重置UI
    elements.leftCurrentWord.textContent = '准备开始...';
    elements.rightCurrentWord.textContent = '准备开始...';
    elements.leftOptionsContainer.innerHTML = '';
    elements.rightOptionsContainer.innerHTML = '';
    elements.leftTimerBar.style.width = '100%';
    elements.rightTimerBar.style.width = '100%';
    elements.leftTimerText.textContent = gameState.timeLimit;
    elements.rightTimerText.textContent = gameState.timeLimit;
    elements.pauseBtn.textContent = '暂停';
    elements.pauseBtn.classList.remove('paused');
    elements.pauseBtn.disabled = true;
    
    // 重置分数
    gameState.scores.left = 0;
    gameState.scores.right = 0;
    elements.leftScore.textContent = '0';
    elements.rightScore.textContent = '0';
    
    // 重置错误记录
    gameState.mistakes.left = [];
    gameState.mistakes.right = [];
    
    // 重置轮次完成状态
    gameState.roundComplete.left = false;
    gameState.roundComplete.right = false;
}

// 下一轮
function nextRound() {
    if (!gameState.isGameRunning || gameState.isPaused || gameState.allWordsCompleted) {
        return;
    }
    
    gameState.currentRound++;
    
    // 重置轮次完成状态
    gameState.roundComplete.left = false;
    gameState.roundComplete.right = false;
    gameState.waitingForOpponent.left = false;
    gameState.waitingForOpponent.right = false;
    
    // 为左队和右队分别生成题目
    if (!gameState.teamFinished.left) {
        generateQuestionForTeam('left');
        startTimer('left');
    }
    
    if (!gameState.teamFinished.right) {
        generateQuestionForTeam('right');
        startTimer('right');
    }
    
    // 检查是否两队都已完成所有单词
    if (gameState.teamFinished.left && gameState.teamFinished.right) {
        gameState.allWordsCompleted = true;
        showResultModal();
    }
}

// 开始计时
function startTimer(team) {
    // 如果队伍已完成所有单词或等待对手，不启动计时器
    if (gameState.teamFinished[team] || gameState.waitingForOpponent[team]) {
        return;
    }
    
    // 获取相关元素
    const timerBar = team === 'left' ? elements.leftTimerBar : elements.rightTimerBar;
    const timerText = team === 'left' ? elements.leftTimerText : elements.rightTimerText;
    
    // 重置计时器
    if (gameState.timer[team]) {
        clearInterval(gameState.timer[team]);
    }
    
    gameState.timeLeft[team] = gameState.timeLimit;
    timerText.textContent = gameState.timeLeft[team];
    timerBar.style.width = '100%';
    
    // 启动计时器
    gameState.timer[team] = setInterval(() => {
        if (gameState.isPaused) {
            return;
        }
        
        gameState.timeLeft[team]--;
        timerText.textContent = gameState.timeLeft[team];
        
        // 更新进度条
        const percentage = (gameState.timeLeft[team] / gameState.timeLimit) * 100;
        timerBar.style.width = `${percentage}%`;
        
        // 改变进度条颜色
        if (percentage < 30) {
            timerBar.style.backgroundColor = '#e74c3c';
        } else if (percentage < 60) {
            timerBar.style.backgroundColor = '#f39c12';
        } else {
            if (team === 'left') {
                timerBar.style.backgroundColor = '#3498db';
            } else {
                timerBar.style.backgroundColor = '#e74c3c';
            }
        }
        
        // 时间到
        if (gameState.timeLeft[team] <= 0) {
            clearInterval(gameState.timer[team]);
            
            // 自动选择错误选项
            const wrongOption = gameState.options[team].find(option => option !== gameState.correctOption[team]);
            handleOptionClick(wrongOption, team);
        }
    }, 1000);
}

// 辅助函数：打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 处理选项点击
function handleOptionClick(selectedOption, team) {
    if (!gameState.isGameRunning || gameState.isPaused || gameState.roundComplete[team] || 
        gameState.teamFinished[team] || gameState.waitingForOpponent[team]) {
        return;
    }
    
    // 标记该队本轮已完成
    gameState.roundComplete[team] = true;
    
    // 停止计时器
    if (gameState.timer[team]) {
        clearInterval(gameState.timer[team]);
        gameState.timer[team] = null;
    }
    
    // 获取所有选项元素
    const optionsContainer = team === 'left' ? elements.leftOptionsContainer : elements.rightOptionsContainer;
    const optionElements = optionsContainer.querySelectorAll('.option');
    
    // 禁用所有选项
    optionElements.forEach(el => {
        el.style.pointerEvents = 'none';
        
        // 标记正确和错误的选项
        if (el.textContent === gameState.correctOption[team]) {
            el.classList.add('correct');
        } else if (el.textContent === selectedOption && selectedOption !== gameState.correctOption[team]) {
            el.classList.add('incorrect');
        }
    });
    
    // 判断是否正确
    const isCorrect = selectedOption === gameState.correctOption[team];
    
    // 播放音频
    const audio = new Audio(isCorrect ? 'assets/yes.mp3' : 'assets/no.mp3');
    audio.play();

    // 更新分数
    if (isCorrect) {
        gameState.scores[team] += 100;
        const scoreElement = team === 'left' ? elements.leftScore : elements.rightScore;
        scoreElement.textContent = gameState.scores[team];
    } else {
        // 记录错误
        const currentWordElement = team === 'left' ? elements.leftCurrentWord : elements.rightCurrentWord;
        const mistake = {
            question: currentWordElement.textContent,
            correctAnswer: gameState.correctOption[team],
            selectedAnswer: selectedOption
        };
        gameState.mistakes[team].push(mistake);
    }
    
    // 根据游戏模式决定下一步操作
    const oppositeTeam = team === 'left' ? 'right' : 'left';
    
    if (gameState.gameSpeed === 'competitive') {
        // 竞技模式：一方作答完成立即进入下一题
        setTimeout(() => {
            if (gameState.isGameRunning && !gameState.isPaused && !gameState.teamFinished[team]) {
                generateNewRoundForTeam(team);
            }
        }, 1000);
    } else if (gameState.gameSpeed === 'tournament') {
        // 比赛模式：一方作答完成，另一方立即换题
        if (!isCorrect) {
            // 如果答错了，则显示"本题答错，等待对手作答"
            const waitingMessage = document.createElement('div');
            waitingMessage.className = 'waiting-message';
            waitingMessage.innerHTML = '<span class="material-icons">timer</span> 本题答错，等待对手作答...';
            optionsContainer.appendChild(waitingMessage);
            
            // 标记为等待对手
            gameState.waitingForOpponent[team] = true;
            
            // 检查另一队是否也在等待或已完成，如果是，则两队同时进入下一轮
            if (gameState.waitingForOpponent[oppositeTeam] || gameState.roundComplete[oppositeTeam] || gameState.teamFinished[oppositeTeam]) {
                setTimeout(() => {
                    if (gameState.isGameRunning && !gameState.isPaused) {
                        nextRound();
                    }
                }, 1500);
            }
        } else {
            // 如果答对了，自己进入下一题，同时对手强制进入下一题
            setTimeout(() => {
                if (gameState.isGameRunning && !gameState.isPaused) {
                    // 如果对手还没完成，则强制结束对手本轮
                    if (!gameState.roundComplete[oppositeTeam] && !gameState.teamFinished[oppositeTeam]) {
                        forceEndRound(oppositeTeam);
                    }
                    
                    // 然后两队进入下一轮
                    nextRound();
                }
            }, 1000);
        }
    }
}

// 为单个队伍生成新一轮
function generateNewRoundForTeam(team) {
    // 重置该队本轮完成状态
    gameState.roundComplete[team] = false;
    gameState.waitingForOpponent[team] = false;
    
    // 检查是否已经做完所有单词
    if (gameState.wordIndex[team] >= gameState.wordSequence[team].length) {
        gameState.teamFinished[team] = true;
        showTeamCompleteScreen(team);
        
        // 检查是否两队都已完成所有单词
        if (gameState.teamFinished.left && gameState.teamFinished.right) {
            gameState.allWordsCompleted = true;
            showResultModal();
        }
        return;
    }
    
    // 获取该队的下一个单词索引
    const wordIndex = gameState.wordSequence[team][gameState.wordIndex[team]];
    const word = gameState.words[wordIndex];
    
    // 显示单词
    const wordElement = team === 'left' ? elements.leftCurrentWord : elements.rightCurrentWord;
    if (gameState.gameMode === 'en2zh') {
        wordElement.textContent = word.english;
    } else {
        wordElement.textContent = word.chinese;
    }
    
    // 生成选项
    generateOptions(team, word);
    
    // 增加单词索引
    gameState.wordIndex[team]++;
    
    // 开始计时
    startTimer(team);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 暴露函数到全局作用域，以便触摸处理脚本可以调用
window.handleOptionClick = handleOptionClick; 