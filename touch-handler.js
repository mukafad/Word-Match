/**
 * 多点触控功能增强 (增强版)
 * 
 * 该文件从重构项目中移植触摸事件处理功能，用于改善触摸设备上的用户体验：
 * 1. 消除300ms点击延迟
 * 2. 完善多点触控支持，确保两队同时点击有效
 * 3. 优化按钮响应
 * 4. 确保设置和错题界面支持滑动和滚动
 */

(function() {
    console.log('触摸事件处理脚本已加载 - 增强版');
    
    // 创建触摸管理器来跟踪多点触控
    const touchManager = {
        // 正在活动的触摸点
        activeTouches: {},
        // 左右队伍选项触摸状态
        lastTouchedOption: {
            left: null,
            right: null
        },
        // 防止处理中的状态标记
        processing: {
            left: false,
            right: false
        },
        // 判断选项属于哪个队伍
        getTeamFromOption(optionElement) {
            if (!optionElement) return null;
            
            // 根据HTML结构判断是左队还是右队的选项
            const container = optionElement.closest('.options-container');
            if (!container) return null;
            
            if (container.id === 'leftOptionsContainer') {
                return 'left';
            } else if (container.id === 'rightOptionsContainer') {
                return 'right';
            }
            return null;
        },
        // 记录触摸开始
        recordTouchStart(touch, option, team) {
            if (!team) team = this.getTeamFromOption(option);
            if (!team || !option) return;
            
            const touchId = touch.identifier;
            
            // 记录这个触摸点
            this.activeTouches[touchId] = {
                team: team,
                option: option,
                startTime: Date.now()
            };
            
            this.lastTouchedOption[team] = option;
            console.log(`${team}队选项触摸开始: ${option.textContent} (ID: ${touchId})`);
            
            // 添加视觉反馈
            option.classList.add('touch-active');
        },
        // 处理触摸结束
        handleTouchEnd(touch) {
            const touchId = touch.identifier;
            const touchInfo = this.activeTouches[touchId];
            
            if (!touchInfo) return;
            
            const { team, option } = touchInfo;
            
            // 清理这个触摸点
            delete this.activeTouches[touchId];
            
            if (!team || !option) return;
            
            console.log(`${team}队选项触摸结束: ${option.textContent} (ID: ${touchId})`);
            
            // 移除视觉反馈
            option.classList.remove('touch-active');
            
            // 触发点击
            this.triggerClick(option, team);
        },
        // 清理触摸状态
        clearTouchState(team) {
            if (team) {
                this.lastTouchedOption[team] = null;
                // 延迟重置处理状态，避免短时间内重复触发
                setTimeout(() => {
                    this.processing[team] = false;
                }, 200);
            } else {
                // 清理所有状态
                this.lastTouchedOption.left = null;
                this.lastTouchedOption.right = null;
                setTimeout(() => {
                    this.processing.left = false;
                    this.processing.right = false;
                }, 200);
            }
        },
        // 触发点击
        triggerClick(option, team) {
            if (!team) team = this.getTeamFromOption(option);
            if (!team) return;
            
            // 检查是否正在处理中
            if (this.processing[team]) {
                console.log(`${team}队选项处理中，忽略触摸`);
                return;
            }
            
            // 设置处理标志
            this.processing[team] = true;
            
            console.log(`${team}队直接触发选项点击: ${option.textContent}`);
            
            // 检查选项是否已回答或禁用
            if (option.dataset.answered === 'true' || option.classList.contains('disabled')) {
                console.log('此选项已回答，忽略');
                this.clearTouchState(team);
                return;
            }
            
            // 直接调用handleOptionClick函数 - 这是主项目中的函数
            if (window.handleOptionClick) {
                try {
                    console.log(`调用主项目handleOptionClick函数，选项:${option.textContent}，队伍:${team}`);
                    window.handleOptionClick(option.textContent, team);
                } catch (error) {
                    console.error('调用handleOptionClick函数时出错', error);
                    // 如果直接调用失败，则触发点击事件
                    this.performClick(option);
                }
            } else {
                // 如果找不到主项目函数，使用普通点击
                this.performClick(option);
            }
            
            // 清理状态
            this.clearTouchState(team);
        },
        // 执行点击
        performClick(option) {
            // 用户干预的实际点击(用户通过UI交互)
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            option.dispatchEvent(clickEvent);
        }
    };
    
    // 在文档加载前就绑定事件
    document.addEventListener('DOMContentLoaded', function() {
        console.log('触摸事件处理脚本开始运行');
        
        // 消除300ms延迟
        function removeClickDelay() {
            const allLinks = document.querySelectorAll('a, button');
            allLinks.forEach(function(link) {
                link.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    e.target.click();
                }, false);
            });
            console.log('已移除点击延迟');
        }
        
        // 修复按钮触摸事件
        function fixButtonTouchEvents() {
            const buttonIds = [
                'settingsBtn', 'startBtn', 'pauseBtn', 'resetBtn',
                'saveSettingsBtn', 'cancelSettingsBtn',
                'uploadWordlistBtn', 'confirmUploadBtn', 'cancelUploadBtn',
                'closeMistakesBtn', 'playAgainBtn', 'showMistakesBtn'
            ];
            
            buttonIds.forEach(function(id) {
                const button = document.getElementById(id);
                if (button) {
                    // 停止事件传播，防止重复触发
                    button.addEventListener('touchend', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log(`触摸修复: ${id} 触摸结束，触发点击`);
                        // 直接调用click方法
                        setTimeout(function() {
                            button.click();
                        }, 0);
                    }, false);
                }
            });
            console.log('已修复按钮触摸事件');
        }
        
        // 直接为选项元素添加事件处理
        function attachDirectTouchHandlers() {
            const optionsContainers = [
                document.getElementById('leftOptionsContainer'),
                document.getElementById('rightOptionsContainer')
            ];
            
            optionsContainers.forEach(container => {
                if (!container) return;
                
                // 为容器添加触摸事件委托
                container.addEventListener('touchstart', function(e) {
                    Array.from(e.changedTouches).forEach(touch => {
                        const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                        if (touchTarget && touchTarget.classList.contains('option')) {
                            const team = touchManager.getTeamFromOption(touchTarget);
                            touchManager.recordTouchStart(touch, touchTarget, team);
                        }
                    });
                }, true);
                
                container.addEventListener('touchend', function(e) {
                    Array.from(e.changedTouches).forEach(touch => {
                        touchManager.handleTouchEnd(touch);
                    });
                    e.preventDefault(); // 防止触发额外的点击
                }, true);
            });
            
            console.log('已为选项容器添加直接触摸事件处理');
        }
        
        // 修复选项元素触摸事件 - 全局处理
        function fixOptionsTouchEvents() {
            // 监听整个文档的触摸事件，确保捕获所有触摸
            document.addEventListener('touchstart', function(e) {
                // 遍历所有触摸点
                Array.from(e.touches).forEach(function(touch) {
                    const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    // 检查是否点击了选项元素
                    if (touchTarget && touchTarget.classList && touchTarget.classList.contains('option')) {
                        const team = touchManager.getTeamFromOption(touchTarget);
                        if (team) {
                            touchManager.recordTouchStart(touch, touchTarget, team);
                        }
                    }
                });
            }, true); // 使用捕获阶段
            
            document.addEventListener('touchend', function(e) {
                // 处理所有结束的触摸点
                Array.from(e.changedTouches).forEach(function(touch) {
                    const touchTarget = document.elementFromPoint(touch.clientX, touch.clientY);
                    
                    // 检查是否点击了选项元素
                    if (touchTarget && touchTarget.classList && touchTarget.classList.contains('option')) {
                        touchManager.handleTouchEnd(touch);
                    }
                });
            }, true); // 使用捕获阶段
        }
        
        // 增强选项点击处理
        function enhanceOptionClickHandling() {
            // 处理所有生成的选项元素
            function processOptions() {
                const options = document.querySelectorAll('.option');
                options.forEach(function(option) {
                    if (option.dataset.touchEnhanced) return; // 已处理过，跳过
                    
                    option.dataset.touchEnhanced = 'true';
                    
                    // 添加触摸事件，确保无延迟响应
                    option.addEventListener('touchstart', function(e) {
                        const team = touchManager.getTeamFromOption(option);
                        if (team) {
                            // 遍历所有触摸点，记录当前触摸
                            Array.from(e.changedTouches).forEach(function(touch) {
                                touchManager.recordTouchStart(touch, option, team);
                            });
                        }
                    }, false);
                    
                    option.addEventListener('touchend', function(e) {
                        // 遍历所有触摸点，处理触摸结束
                        Array.from(e.changedTouches).forEach(function(touch) {
                            touchManager.handleTouchEnd(touch);
                        });
                        e.preventDefault(); // 防止触发额外的点击
                    }, false);
                });
            }
            
            // 初始处理
            processOptions();
            
            // 使用MutationObserver监听DOM变化，处理新添加的选项
            const observer = new MutationObserver(function(mutations) {
                processOptions();
            });
            
            // 监听文档中可能包含选项的区域
            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
        }
        
        // 添加选项的样式
        function addOptionStyles() {
            // 创建一个样式标签
            const styleTag = document.createElement('style');
            styleTag.textContent = `
                .option {
                    transition: transform 0.2s, background-color 0.2s;
                }
                
                .option.touch-active {
                    transform: scale(0.95);
                    background-color: rgba(200, 200, 200, 0.5) !important;
                }
                
                .option.correct {
                    background-color: rgba(46, 204, 113, 0.8) !important;
                }
                
                .option.wrong {
                    background-color: rgba(231, 76, 60, 0.8) !important;
                }
                
                @media (hover: none) {
                    .option:active {
                        transform: scale(0.95);
                    }
                }
            `;
            document.head.appendChild(styleTag);
        }
        
        // 修复触摸行为 - 允许设置和错题界面滚动
        function fixTouchBehavior() {
            // 只在游戏区域内阻止多点触控默认行为
            document.addEventListener('touchstart', function(e) {
                // 检查是否在游戏区域内
                const inGameArea = e.target.closest('.game-area') !== null || 
                                  e.target.closest('.options-container') !== null;
                                  
                // 检查是否在设置或错题界面
                const inSettings = e.target.closest('.settings-modal') !== null ||
                                  e.target.closest('.mistakes-modal') !== null;
                
                // 仅在游戏区域内且不在设置或错题界面时阻止多点触控默认行为
                if (inGameArea && !inSettings && e.touches.length > 1) {
                    e.preventDefault();
                }
                
                // 在设置和错题界面中不阻止默认行为，允许滚动
            }, { passive: false });
            
            // 使设置和错题列表可滚动
            const scrollableElements = [
                '.team-mistakes-list',
                '.settings-content',
                '.mistakes-content'
            ];
            
            scrollableElements.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(element => {
                    if (element) {
                        // 明确设置可滚动属性
                        element.style.overflowY = 'auto';
                        element.style.webkitOverflowScrolling = 'touch';
                        element.style.touchAction = 'pan-y';
                    }
                });
            });
        }
        
        // 运行所有修复
        removeClickDelay();
        fixButtonTouchEvents();
        attachDirectTouchHandlers();
        //fixOptionsTouchEvents(); // 注释掉全局处理，使用更精确的处理方式
        enhanceOptionClickHandling();
        addOptionStyles();
        fixTouchBehavior(); // 新增：修复触摸行为，允许设置和错题界面滚动
        
        console.log('触摸事件处理脚本初始化完成');
    });
})(); 