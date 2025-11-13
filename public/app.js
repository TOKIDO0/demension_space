// 全新的JavaScript文件
console.log('app.js 加载成功');

const API_BASE = '';
const PREVIEW_MODE = location.hostname === 'localhost' && location.port === '3000';

// 创建加载动画样式
function createLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .loading-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-indicator p {
            margin: 0;
            color: #333;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// 创建加载指示器元素
function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>加载中...</p>
    `;
    indicator.style.position = 'fixed';
    indicator.style.top = '50%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.zIndex = '9999';
    indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    indicator.style.padding = '20px 40px';
    indicator.style.borderRadius = '8px';
    indicator.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    indicator.style.display = 'flex';
    indicator.style.flexDirection = 'column';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.display = 'none';
    return indicator;
}

// 全局加载指示器
let loadingIndicator = null;

// 显示加载指示器
function showLoadingIndicator() {
    if (!loadingIndicator) {
        createLoadingStyles();
        loadingIndicator = createLoadingIndicator();
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';
}

// 隐藏加载指示器
function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 全局变量存储用户信息
let currentUser = null;

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function animateScrollTo(targetY, duration = 500) {
    try {
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) { window.scrollTo(0, targetY); return; }
        const startY = window.pageYOffset;
        const delta = targetY - startY;
        const start = performance.now();
        function step(now) {
            const elapsed = Math.min((now - start) / duration, 1);
            const eased = easeInOutCubic(elapsed);
            window.scrollTo(0, Math.round(startY + delta * eased));
            if (elapsed < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    } catch (error) {
        window.scrollTo(0, targetY);
    }
}
function smoothScrollTo(elementId, offset = 0) {
    try {
        const element = document.getElementById(elementId);
        if (!element) { console.warn(`目标元素 #${elementId} 未找到`); return; }
        const elementTop = element.getBoundingClientRect().top;
        let target = elementTop + window.pageYOffset - offset;
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (target > max) target = max;
        if (target < 0) target = 0;
        animateScrollTo(target, 500);
    } catch (error) { console.error('平滑滚动出错:', error); }
}

// 显示模态框函数
function showModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`模态框 #${modalId} 未找到`);
            return;
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('显示模态框出错:', error);
    }
}

// 隐藏模态框函数
function hideModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`模态框 #${modalId} 未找到`);
            return;
        }
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (modalId === 'auth-modal' && authLiquid) { authLiquid.destroy(); authLiquid = null; }
    } catch (error) {
        console.error('隐藏模态框出错:', error);
    }
}

function smoothStep(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
}
function length(x, y) { return Math.sqrt(x * x + y * y); }
function roundedRectSDF(x, y, w, h, r) {
    const qx = Math.abs(x) - w + r;
    const qy = Math.abs(y) - h + r;
    return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
function texture(x, y) { return { type: 't', x, y }; }

class LiquidGlass {
    constructor(opts) {
        this.el = opts.element;
        this.id = 'liquid-glass-' + Math.random().toString(36).substr(2, 9);
        this.canvasDPI = 1;
        this.mouse = { x: 0, y: 0 };
        this.width = Math.round(this.el.clientWidth);
        this.height = Math.round(this.el.clientHeight);
        this.create();
        this.bind();
        this.updateShader();
        this.apply();
    }
    create() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        this.svg.setAttribute('width', '0');
        this.svg.setAttribute('height', '0');
        this.svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9998;';
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', `${this.id}_filter`);
        filter.setAttribute('filterUnits', 'userSpaceOnUse');
        filter.setAttribute('colorInterpolationFilters', 'sRGB');
        filter.setAttribute('x', '0');
        filter.setAttribute('y', '0');
        filter.setAttribute('width', this.width.toString());
        filter.setAttribute('height', this.height.toString());
        this.feImage = document.createElementNS('http://www.w3.org/2000/svg', 'feImage');
        this.feImage.setAttribute('id', `${this.id}_map`);
        this.feImage.setAttribute('width', this.width.toString());
        this.feImage.setAttribute('height', this.height.toString());
        this.feDisp = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
        this.feDisp.setAttribute('in', 'SourceGraphic');
        this.feDisp.setAttribute('in2', `${this.id}_map`);
        this.feDisp.setAttribute('xChannelSelector', 'R');
        this.feDisp.setAttribute('yChannelSelector', 'G');
        defs.appendChild(filter);
        filter.appendChild(this.feImage);
        filter.appendChild(this.feDisp);
        this.svg.appendChild(defs);
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width * this.canvasDPI;
        this.canvas.height = this.height * this.canvasDPI;
        this.canvas.style.display = 'none';
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.svg);
    }
    bind() {
        this.mm = (e) => {
            const rect = this.el.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) / rect.width;
            this.mouse.y = (e.clientY - rect.top) / rect.height;
            this.updateShader();
        };
        document.addEventListener('mousemove', this.mm);
        this.rs = () => {
            this.width = Math.round(this.el.clientWidth);
            this.height = Math.round(this.el.clientHeight);
            this.canvas.width = this.width * this.canvasDPI;
            this.canvas.height = this.height * this.canvasDPI;
            const f = this.svg.querySelector(`#${this.id}_filter`);
            if (f) { f.setAttribute('width', this.width.toString()); f.setAttribute('height', this.height.toString()); }
            this.feImage.setAttribute('width', this.width.toString());
            this.feImage.setAttribute('height', this.height.toString());
            this.updateShader();
        };
        window.addEventListener('resize', this.rs);
    }
    apply() {
        const s = `url(#${this.id}_filter) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)`;
        this.el.style.backdropFilter = s;
        this.el.style.webkitBackdropFilter = s;
    }
    updateShader() {
        const w = this.width * this.canvasDPI;
        const h = this.height * this.canvasDPI;
        const data = new Uint8ClampedArray(w * h * 4);
        let maxScale = 0;
        const raw = [];
        const mouseProxy = new Proxy(this.mouse, { get: (t, p) => t[p] });
        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % w;
            const y = Math.floor(i / 4 / w);
            const uv = { x: x / w, y: y / h };
            const ix = uv.x - 0.5;
            const iy = uv.y - 0.5;
            const d = roundedRectSDF(ix, iy, 0.3, 0.2, 0.6);
            const disp = smoothStep(0.8, 0, d - 0.15);
            const scaled = smoothStep(0, 1, disp);
            const pos = texture(ix * scaled + 0.5, iy * scaled + 0.5, mouseProxy);
            const dx = pos.x * w - x;
            const dy = pos.y * h - y;
            maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
            raw.push(dx, dy);
        }
        maxScale *= 0.5;
        let idx = 0;
        for (let i = 0; i < data.length; i += 4) {
            const r = raw[idx++] / maxScale + 0.5;
            const g = raw[idx++] / maxScale + 0.5;
            data[i] = r * 255;
            data[i + 1] = g * 255;
            data[i + 2] = 0;
            data[i + 3] = 255;
        }
        this.ctx.putImageData(new ImageData(data, w, h), 0, 0);
        this.feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', this.canvas.toDataURL());
        this.feDisp.setAttribute('scale', (maxScale / this.canvasDPI).toString());
    }
    destroy() {
        document.removeEventListener('mousemove', this.mm);
        window.removeEventListener('resize', this.rs);
        if (this.svg) this.svg.remove();
        if (this.canvas) this.canvas.remove();
        this.el.style.backdropFilter = '';
        this.el.style.webkitBackdropFilter = '';
    }
}

let authLiquid = null;
function attachLiquidGlassToAuthModal() {
    const el = document.querySelector('#auth-modal .modal-content');
    if (!el) return;
    if (authLiquid) { authLiquid.destroy(); authLiquid = null; }
    authLiquid = new LiquidGlass({ element: el });
}

// 初始化认证相关功能
function initAuth() {
    try {
        // 设置表单切换功能
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authModalTitle = document.getElementById('auth-modal-title');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const closeAuthModal = document.getElementById('close-auth-modal');
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        const registerSubmitBtn = document.getElementById('register-submit-btn');
        
        if (switchToRegister && switchToLogin && loginForm && registerForm && authModalTitle) {
            // 切换到注册表单
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                authModalTitle.textContent = '创建新账号';
                clearAuthError();
            });
            
            // 切换到登录表单
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                authModalTitle.textContent = '欢迎回来';
                clearAuthError();
            });
        }
        
        // 关闭模态框
        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', function() {
                hideModal('auth-modal');
                clearAuthForms();
                clearAuthError();
                if (authLiquid) { authLiquid.destroy(); authLiquid = null; }
            });
        }
        
        if (loginSubmitBtn) {
            const newLoginSubmitBtn = loginSubmitBtn.cloneNode(true);
            loginSubmitBtn.parentNode.replaceChild(newLoginSubmitBtn, loginSubmitBtn);
            newLoginSubmitBtn.addEventListener('click', function(e) { e.preventDefault(); handleLogin(); });
        }
        if (registerSubmitBtn) {
            const newRegisterSubmitBtn = registerSubmitBtn.cloneNode(true);
            registerSubmitBtn.parentNode.replaceChild(newRegisterSubmitBtn, registerSubmitBtn);
            newRegisterSubmitBtn.addEventListener('click', function(e) { e.preventDefault(); handleRegister(); });
        }
        
    } catch (error) {
        console.error('初始化认证功能出错:', error);
    }
}

// 显示认证错误信息
function showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// 清除认证错误信息
function clearAuthError() {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// 清除认证表单
function clearAuthForms() {
    // 清除登录表单
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    // 清除注册表单
    const registerUsername = document.getElementById('register-username');
    const registerEmail = document.getElementById('register-email');
    const registerPhone = document.getElementById('register-phone');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');
    if (registerUsername) registerUsername.value = '';
    if (registerEmail) registerEmail.value = '';
    if (registerPhone) registerPhone.value = '';
    if (registerPassword) registerPassword.value = '';
    if (registerConfirmPassword) registerConfirmPassword.value = '';
}

// 表单验证函数
function setupFormValidation() {
    try {
        // 登录表单验证 - 当用户输入时进行验证
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        
        if (loginEmail) {
            loginEmail.addEventListener('input', function() {
                if (!isValidEmail(loginEmail.value) && loginEmail.value.trim()) {
                    showAuthError('请输入有效的邮箱地址');
                } else {
                    clearAuthError();
                }
            });
        }
        
        // 注册表单验证
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        
        if (registerUsername) {
            registerUsername.addEventListener('input', function() {
                if (registerUsername.value.length < 3 && registerUsername.value.trim()) {
                    showAuthError('用户名至少需要3个字符');
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerEmail) {
            registerEmail.addEventListener('input', function() {
                if (!isValidEmail(registerEmail.value) && registerEmail.value.trim()) {
                    showAuthError('请输入有效的邮箱地址');
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerPassword) {
            registerPassword.addEventListener('input', function() {
                if (registerPassword.value.length < 8 && registerPassword.value.trim()) {
                    showAuthError('密码至少需要8个字符');
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerConfirmPassword) {
            registerConfirmPassword.addEventListener('input', function() {
                if (registerPassword && registerConfirmPassword.value !== registerPassword.value) {
                    showAuthError('两次输入的密码不一致');
                } else {
                    clearAuthError();
                }
            });
        }
        
    } catch (error) {
        console.error('设置表单验证出错:', error);
    }
}

// 邮箱验证函数
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 处理用户注册
async function handleRegister() {
    try {
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPhone = document.getElementById('register-phone');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        const authErrorElement = document.getElementById('auth-error');
        if (!registerUsername || !registerEmail || !registerPassword || !registerConfirmPassword) {
            showAuthError('表单初始化失败，请刷新页面重试');
            return;
        }
        const username = registerUsername.value.trim();
        const email = registerEmail.value.trim();
        const phone = registerPhone ? registerPhone.value.trim() : '';
        const password = registerPassword.value;
        const confirmPassword = registerConfirmPassword.value;
        [registerUsername, registerEmail, registerPassword, registerConfirmPassword].forEach(input => {
            input.classList.remove('error');
            const errEl = input.nextElementSibling;
            if (errEl && errEl.classList.contains('error-message')) errEl.remove();
        });
        if (!username) { showFieldError(registerUsername, '请输入用户名'); showAuthError('请输入用户名'); return; }
        if (username.length < 3) { showFieldError(registerUsername, '用户名至少需要3个字符'); showAuthError('用户名至少需要3个字符'); return; }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) { showFieldError(registerUsername, '用户名只能包含字母、数字、下划线和中文'); showAuthError('用户名只能包含字母、数字、下划线和中文'); return; }
        if (!email || !isValidEmail(email)) { showFieldError(registerEmail, '请输入有效的邮箱地址'); showAuthError('请输入有效的邮箱地址'); return; }
        if (!password) { showFieldError(registerPassword, '请输入密码'); showAuthError('请输入密码'); return; }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { showFieldError(registerPassword, '至少8位，含大小写和数字'); showAuthError('至少8位，含大小写和数字'); return; }
        if (!confirmPassword || password !== confirmPassword) { showFieldError(registerConfirmPassword, '两次输入的密码不一致'); showAuthError('两次输入的密码不一致'); return; }
        clearAuthError();
        showLoadingIndicator();
        const resp = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, username, phone })
        });
        const json = await resp.json();
        if (!resp.ok) {
            if (json && json.error === 'user_already_exists') { showFieldError(registerEmail, '该邮箱已被注册'); showAuthError('该邮箱已被注册'); }
            else { showAuthError('注册失败，请稍后重试'); }
            return;
        }
        if (authErrorElement) { authErrorElement.textContent = '注册成功！请使用账号登录'; authErrorElement.className = 'success-message'; authErrorElement.style.display = 'block'; }
        setTimeout(() => {
            const registerForm = document.getElementById('register-form');
            const loginForm = document.getElementById('login-form');
            const authModalTitle = document.getElementById('auth-modal-title');
            const loginEmail = document.getElementById('login-email');
            if (registerForm && loginForm && authModalTitle) {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                authModalTitle.textContent = '欢迎回来';
            }
            clearAuthForms();
            if (loginEmail) loginEmail.value = email;
        }, 1000);
    } catch (error) {
        showAuthError('注册过程出错，请稍后重试');
    } finally {
        hideLoadingIndicator();
    }
}

// 显示字段级错误
function showFieldError(inputElement, message) {
    // 添加错误样式
    inputElement.classList.add('error');
    inputElement.style.borderColor = '#f44336';
    
    // 移除已存在的错误信息
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.remove();
    }
    
    // 创建新的错误信息元素
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = '#f44336';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '5px';
    
    // 插入到输入框后面
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
}

// 处理用户登录
async function handleLogin() {
    try {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // 表单验证
        if (!email || !isValidEmail(email)) {
            showAuthError('请输入有效的邮箱地址');
            return;
        }
        
        if (!password) {
            showAuthError('请输入密码');
            return;
        }
        
        if (PREVIEW_MODE) {
            currentUser = { id: 'local', email, username: email.split('@')[0], avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random` };
            updateUIForLoggedInState();
            hideModal('auth-modal');
            clearAuthForms();
            clearAuthError();
            return;
        }
        showLoadingIndicator();
        let resp = await fetch(`${API_BASE}/api/auth/login/start`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (resp.status === 404) { showAuthError('账号未注册，请先注册'); return; }
        resp = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const json = await resp.json();
        if (!resp.ok) { showAuthError('密码错误'); return; }
        currentUser = { id: json.user.id, email: json.user.email, username: json.user.email.split('@')[0], avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(json.user.email.split('@')[0])}&background=random` };
        updateUIForLoggedInState();
        hideModal('auth-modal');
        clearAuthForms();
        clearAuthError();
        showUserProfileModal();
    } catch (error) {
        console.error('登录过程出错:', error);
        showAuthError(`登录过程出错: ${error.message || '未知错误'}`);
    } finally {
        // 隐藏加载状态指示器
        hideLoadingIndicator();
    }
}

// 表单验证函数已在前面定义，使用输入时验证而非提交时验证

// 显示错误信息
function showError(inputElement, message) {
    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
    }
}

// 隐藏错误信息
function hideError(inputElement) {
    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
    }
}

// 更新登录状态UI函数
function updateUIForLoggedInState() {
    try {
        const loginBtn = document.getElementById('login-btn');
        const userAvatar = document.getElementById('user-avatar');
        const userDetailsLink = document.getElementById('user-details-link');
        const logoutLink = document.getElementById('logout-link');
        const userAvatarImg = userAvatar?.querySelector('img');
        
        if (loginBtn && userAvatar) {
            if (currentUser) {
                // 显示用户头像，隐藏登录按钮
                loginBtn.style.display = 'none';
                userAvatar.style.display = 'block';
                
                // 更新头像和用户名
                if (userAvatarImg) {
                    userAvatarImg.src = currentUser.avatar;
                    userAvatarImg.alt = `${currentUser.username}的头像`;
                    userAvatarImg.title = currentUser.username;
                }
                
                // 添加账户详情链接的点击事件
                if (userDetailsLink) {
                    userDetailsLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showUserProfileModal();
                    });
                }
                
                // 添加登出链接的点击事件
                if (logoutLink) {
                    logoutLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        logoutUser();
                    });
                }
            } else {
                // 隐藏用户头像，显示登录按钮
                loginBtn.style.display = 'block';
                userAvatar.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('更新登录状态UI出错:', error);
    }
}

// 登出用户函数
function logoutUser() {
    try {
        currentUser = null;
        updateUIForLoggedInState();
        alert('已成功登出！');
    } catch (error) {
        console.error('登出用户出错:', error);
    }
}

// 显示用户资料模态框
function showUserProfileModal() {
    try {
        // 检查是否已存在
        if (!document.getElementById('user-profile-modal')) {
            const modalHTML = `
            <div id="user-profile-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h3>账户详情</h3>
                    <div class="user-profile-content">
                        <div class="profile-header">
                            <img id="profile-avatar" src="https://picsum.photos/seed/default/100/100" alt="用户头像" class="profile-avatar">
                            <div class="profile-info">
                                <h4 id="profile-username">用户名</h4>
                                <p id="profile-email">邮箱</p>
                            </div>
                        </div>
                        <div class="profile-section">
                            <h5>我的权限</h5>
                            <ul>
                                <li>浏览所有设计作品</li>
                                <li>预约设计咨询</li>
                                <li>保存喜欢的设计方案</li>
                                <li>查看设计进度</li>
                            </ul>
                        </div>
                        <div class="profile-section">
                            <h5>我的服务</h5>
                            <a href="#" class="service-link">我的预约</a>
                            <a href="#" class="service-link">我的收藏</a>
                            <a href="#" class="service-link">修改资料</a>
                        </div>
                    </div>
                    <button id="close-profile-modal" class="close-modal-btn glass-button">关闭</button>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 添加关闭模态框事件
            const closeProfileModal = document.getElementById('close-profile-modal');
            if (closeProfileModal) {
                closeProfileModal.addEventListener('click', function() {
                    hideModal('user-profile-modal');
                });
            }
        }
        
        // 更新用户资料
        if (currentUser) {
            const profileAvatar = document.getElementById('profile-avatar');
            const profileUsername = document.getElementById('profile-username');
            const profileEmail = document.getElementById('profile-email');
            
            if (profileAvatar) profileAvatar.src = currentUser.avatar;
            if (profileUsername) profileUsername.textContent = currentUser.username;
            if (profileEmail) profileEmail.textContent = currentUser.email;
        }
        
        // 显示模态框
        showModal('user-profile-modal');
    } catch (error) {
        console.error('显示用户资料模态框出错:', error);
    }
}

// 检查用户是否已登录的工具函数
function isUserLoggedIn() {
    return !!currentUser;
}

// 基于用户认证状态的权限控制函数
function checkUserPermission(requiredPermission) {
    // 如果需要登录但用户未登录
    if (requiredPermission === 'logged_in' && !isUserLoggedIn()) {
        return false;
    }
    // 这里可以扩展更多权限检查，如管理员权限等
    return true;
}

// 格式化日期
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('日期格式化出错:', error);
        return '未知';
    }
}

// 创建作品详情模态框
function createWorkDetailModal() {
    try {
        // 检查是否已存在
        if (!document.getElementById('work-detail-modal')) {
            const modalHTML = `
            <div id="work-detail-modal" class="modal" style="display: none;" aria-hidden="true" role="dialog" aria-labelledby="work-detail-title">
                <div class="modal-content work-detail-content">
                    <div class="modal-header">
                        <h3 id="work-detail-title" class="modal-title">作品详情</h3>
                        <button id="close-work-modal-x" class="close-modal-x" aria-label="关闭">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="work-detail-wrapper">
                            <div class="work-detail-image">
                                <img id="work-detail-img" src="" alt="作品图片" loading="lazy">
                            </div>
                            <div class="work-detail-info">
                                <div class="work-detail-description-container">
                                    <h4>作品描述</h4>
                                    <p id="work-detail-description" class="description-text">作品描述</p>
                                </div>
                                <div class="work-detail-meta">
                                    <div class="meta-item">
                                        <span class="meta-label">设计师:</span>
                                        <span id="work-detail-designer" class="meta-value">未知</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">创建时间:</span>
                                        <span id="work-detail-date" class="meta-value">未知</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">设计风格:</span>
                                        <span id="work-detail-style" class="meta-value">未知</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">空间类型:</span>
                                        <span id="work-detail-category" class="meta-value">未知</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">状态:</span>
                                        <span id="work-detail-status" class="meta-value status-badge status-public">公开</span>
                                    </div>
                                </div>
                                <!-- 操作按钮区域，根据用户权限显示 -->
                                <div id="work-actions" class="work-actions">
                                    <button id="edit-work-btn" class="work-action-btn edit-btn glass-button" style="display: none;">
                                        <span class="btn-icon">✏️</span> 编辑作品
                                    </button>
                                    <button id="delete-work-btn" class="work-action-btn delete-btn glass-button" style="display: none;">
                                        <span class="btn-icon">🗑️</span> 删除作品
                                    </button>
                                    <button id="toggle-visibility-btn" class="work-action-btn toggle-btn glass-button" style="display: none;">
                                        <span class="btn-icon">👁️</span> 隐藏作品
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="close-work-modal" class="close-modal-btn glass-button">关闭</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        return document.getElementById('work-detail-modal');
    } catch (error) {
        console.error('创建作品详情模态框出错:', error);
        return null;
    }
}

// 根据ID获取作品详情
async function getWorkById(workId) {
    try {
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const foundSaved = saved.find(w => w.id === workId);
        if (foundSaved) return foundSaved;
        const mockWorks = getMockWorks();
        return mockWorks.find(work => work.id === workId) || null;
    } catch (error) {
        console.error('获取作品详情失败:', error);
        
        // 使用模拟数据作为备份
        const mockWorks = getMockWorks();
        return mockWorks.find(work => work.id === workId) || null;
    }
}

// 显示作品详情
async function showWorkDetails(workId, workData = null) {
    try {
        // 创建或获取模态框
        const modal = createWorkDetailModal();
        if (!modal) return;
        
        // 获取模态框元素
        const titleElement = document.getElementById('work-detail-title');
        const imgElement = document.getElementById('work-detail-img');
        const descElement = document.getElementById('work-detail-description');
        const designerElement = document.getElementById('work-detail-designer');
        const dateElement = document.getElementById('work-detail-date');
        const styleElement = document.getElementById('work-detail-style');
        const categoryElement = document.getElementById('work-detail-category');
        const statusElement = document.getElementById('work-detail-status');
        
        // 显示加载状态
        titleElement.textContent = '加载中...';
        descElement.textContent = '正在加载作品信息，请稍候...';
        imgElement.src = '';
        
        // 如果没有提供workData，则异步获取
        if (!workData) {
            workData = await getWorkById(workId);
            
            if (!workData) {
                titleElement.textContent = '错误';
                descElement.textContent = '作品不存在或已被删除';
                showModal('work-detail-modal');
                return;
            }
        }
        
        // 填充作品数据
        titleElement.textContent = workData.title || '作品详情';
        imgElement.src = workData.image_url || workData.image || 'https://picsum.photos/seed/default/800/600';
        descElement.textContent = workData.description || '暂无描述';
        designerElement.textContent = workData.designer || 'Dimension Space 设计团队';
        dateElement.textContent = workData.created_at ? formatDate(workData.created_at) : (workData.date || new Date().toLocaleDateString());
        styleElement.textContent = workData.style || '现代风格';
        categoryElement.textContent = workData.category || '未知类型';
        
        // 更新状态显示
        const isHidden = workData.is_hidden || workData.isHidden;
        statusElement.textContent = isHidden ? '已隐藏' : '公开';
        statusElement.className = isHidden ? 'meta-value status-badge status-hidden' : 'meta-value status-badge status-public';
        
        // 根据用户权限显示操作按钮
        const editBtn = document.getElementById('edit-work-btn');
        const deleteBtn = document.getElementById('delete-work-btn');
        const toggleBtn = document.getElementById('toggle-visibility-btn');
        
        const canManage = isUserLoggedIn() && (!workData.user_id || checkUserPermission(workData.user_id));
        
        if (canManage) {
            // 有权限的用户可以看到操作按钮
            if (editBtn) editBtn.style.display = 'inline-block';
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
            if (toggleBtn) {
                toggleBtn.style.display = 'inline-block';
                toggleBtn.textContent = isHidden ? '👁️ 显示作品' : '👁️ 隐藏作品';
            }
        } else {
            // 无权限的用户隐藏操作按钮
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'none';
        }
        
        // 添加操作按钮事件监听
        if (editBtn && canManage) {
            editBtn.onclick = function() {
                openEditWorkModal(workId, workData);
            };
        }
        
        if (deleteBtn && canManage) {
            deleteBtn.onclick = function() {
                if (confirm('确定要删除这个作品吗？此操作不可撤销。')) {
                    deleteWork(workId).then(() => {
                        hideModal('work-detail-modal');
                        // 实际实现时，这里应该刷新作品列表
                    });
                }
            };
        }
        
        if (toggleBtn && canManage) {
            toggleBtn.onclick = function() {
                const newHiddenState = !isHidden;
                toggleWorkVisibility(workId, newHiddenState).then(() => {
                    // 更新UI状态
                    workData.is_hidden = newHiddenState;
                    workData.isHidden = newHiddenState;
                    statusElement.textContent = newHiddenState ? '已隐藏' : '公开';
                    statusElement.className = newHiddenState ? 'meta-value status-badge status-hidden' : 'meta-value status-badge status-public';
                    toggleBtn.textContent = newHiddenState ? '👁️ 显示作品' : '👁️ 隐藏作品';
                });
            };
        }
        
        // 显示模态框
        showModal('work-detail-modal');
        
        // 关闭按钮事件
        const closeModalBtn = document.getElementById('close-work-modal');
        const closeModalXBtn = document.getElementById('close-work-modal-x');
        
        if (closeModalBtn) {
            closeModalBtn.onclick = function() {
                hideModal('work-detail-modal');
            };
        }
        
        if (closeModalXBtn) {
            closeModalXBtn.onclick = function() {
                hideModal('work-detail-modal');
            };
        }
        
        // 添加ESC键关闭功能
        function handleEscKey(event) {
            if (event.key === 'Escape') {
                hideModal('work-detail-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        document.addEventListener('keydown', handleEscKey);
        
        // 点击模态框外部关闭
        modal.onclick = function(event) {
            if (event.target === modal) {
                hideModal('work-detail-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        };
    } catch (error) {
        console.error('显示作品详情出错:', error);
    }
}

// 创建编辑作品模态框
function createEditWorkModal() {
    try {
        // 检查是否已存在
        if (!document.getElementById('edit-work-modal')) {
            const modalHTML = `
            <div id="edit-work-modal" class="modal" style="display: none;" aria-hidden="true" role="dialog" aria-labelledby="edit-work-title">
                <div class="modal-content edit-work-content">
                    <div class="modal-header">
                        <h3 id="edit-work-title" class="modal-title">编辑作品</h3>
                        <button id="close-edit-modal-x" class="close-modal-x" aria-label="关闭">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-work-form" class="work-form">
                            <input type="hidden" id="edit-work-id" value="">
                            <div class="form-group">
                                <label for="edit-work-title-input" class="required-field">作品标题</label>
                                <input type="text" id="edit-work-title-input" class="form-control" required placeholder="请输入作品标题">
                                <div class="error-message" id="edit-work-title-error"></div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-work-style" class="required-field">设计风格</label>
                                    <select id="edit-work-style" class="form-control" required>
                                        <option value="">请选择设计风格</option>
                                        <option value="极简主义">极简主义</option>
                                        <option value="装饰风格">装饰风格</option>
                                        <option value="工业风">工业风</option>
                                        <option value="北欧风格">北欧风格</option>
                                        <option value="中式风格">中式风格</option>
                                        <option value="日式风格">日式风格</option>
                                        <option value="现代风格">现代风格</option>
                                        <option value="轻奢风格">轻奢风格</option>
                                    </select>
                                    <div class="error-message" id="edit-work-style-error"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-work-category" class="required-field">空间类型</label>
                                    <select id="edit-work-category" class="form-control" required>
                                        <option value="">请选择空间类型</option>
                                        <option value="客厅">客厅</option>
                                        <option value="卧室">卧室</option>
                                        <option value="厨房">厨房</option>
                                        <option value="浴室">浴室</option>
                                        <option value="书房">书房</option>
                                        <option value="餐厅">餐厅</option>
                                        <option value="儿童房">儿童房</option>
                                        <option value="办公室">办公室</option>
                                    </select>
                                    <div class="error-message" id="edit-work-category-error"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-work-description">作品描述</label>
                                <textarea id="edit-work-description" class="form-control" rows="4" placeholder="请输入作品描述"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-edit-btn" class="glass-button">取消</button>
                        <button id="save-edit-btn" class="glass-button primary-button">保存修改</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 添加表单验证
            const form = document.getElementById('edit-work-form');
            if (form) {
                form.addEventListener('input', function(e) {
                    if (e.target.hasAttribute('required')) {
                        const errorElement = document.getElementById(`${e.target.id}-error`);
                        if (errorElement) {
                            if (e.target.value.trim() === '') {
                                errorElement.textContent = '此字段为必填项';
                            } else {
                                errorElement.textContent = '';
                            }
                        }
                    }
                });
            }
        }
        
        return document.getElementById('edit-work-modal');
    } catch (error) {
        console.error('创建编辑作品模态框出错:', error);
        return null;
    }
}

// 打开编辑作品模态框
function openEditWorkModal(workId, workData) {
    try {
        // 创建或获取编辑模态框
        const editModal = createEditWorkModal();
        if (!editModal) return;
        
        // 获取表单元素
        const form = document.getElementById('edit-work-form');
        const workIdInput = document.getElementById('edit-work-id');
        const titleInput = document.getElementById('edit-work-title-input');
        const styleSelect = document.getElementById('edit-work-style');
        const categorySelect = document.getElementById('edit-work-category');
        const descriptionTextarea = document.getElementById('edit-work-description');
        
        // 清空错误信息
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');
        
        // 填充表单数据
        if (workIdInput) workIdInput.value = workId;
        if (titleInput) titleInput.value = workData.title || '';
        if (styleSelect) styleSelect.value = workData.style || '';
        if (categorySelect) categorySelect.value = workData.category || '';
        if (descriptionTextarea) descriptionTextarea.value = workData.description || '';
        
        // 显示编辑模态框
        showModal('edit-work-modal');
        
        // 取消按钮事件
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                hideModal('edit-work-modal');
            };
        }
        
        // 关闭按钮事件
        const closeModalXBtn = document.getElementById('close-edit-modal-x');
        if (closeModalXBtn) {
            closeModalXBtn.onclick = function() {
                hideModal('edit-work-modal');
            };
        }
        
        // 保存按钮事件
        const saveBtn = document.getElementById('save-edit-btn');
        if (saveBtn) {
            saveBtn.onclick = async function() {
                // 表单验证
                let isValid = true;
                
                // 验证必填字段
                if (titleInput && titleInput.value.trim() === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-title-input-error');
                    if (errorElement) errorElement.textContent = '请输入作品标题';
                }
                
                if (styleSelect && styleSelect.value === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-style-error');
                    if (errorElement) errorElement.textContent = '请选择设计风格';
                }
                
                if (categorySelect && categorySelect.value === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-category-error');
                    if (errorElement) errorElement.textContent = '请选择空间类型';
                }
                
                if (!isValid) return;
                
                // 收集表单数据
                const updatedData = {
                    title: titleInput ? titleInput.value.trim() : '',
                    style: styleSelect ? styleSelect.value : '',
                    category: categorySelect ? categorySelect.value : '',
                    description: descriptionTextarea ? descriptionTextarea.value.trim() : ''
                };
                
                try {
                    // 保存修改
                    await updateWork(workId, updatedData);
                    
                    // 隐藏编辑模态框
                    hideModal('edit-work-modal');
                    
                    // 刷新作品详情
                    const detailModal = document.getElementById('work-detail-modal');
                    if (detailModal && detailModal.style.display === 'block') {
                        showWorkDetails(workId);
                    }
                } catch (error) {
                    console.error('保存作品修改失败:', error);
                    alert('保存修改失败，请稍后重试');
                }
            };
        }
        
        // 添加ESC键关闭功能
        function handleEscKey(event) {
            if (event.key === 'Escape') {
                hideModal('edit-work-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        document.addEventListener('keydown', handleEscKey);
        
        // 点击模态框外部关闭
        editModal.onclick = function(event) {
            if (event.target === editModal) {
                hideModal('edit-work-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        };
    } catch (error) {
        console.error('打开编辑作品模态框出错:', error);
    }
}

// 为作品项添加点击事件
function setupWorkItemClickEvents() {
    try {
        const workItems = document.querySelectorAll('.work-item');
        
        workItems.forEach((item, index) => {
            // 防止重复添加事件
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', function() {
                // 获取作品数据（这里使用模拟数据，实际应从数据库获取）
                const workImages = [
                    'images/minimalist-livingroom.jpg',
                    'images/decorative-livingroom.jpg', 
                    'images/industrial-kitchen.jpg',
                    'images/scandinavian-bedroom.jpg'
                ];
                
                const workTitles = [
                    '极简主义客厅',
                    '装饰风格客厅',
                    '工业风厨房',
                    '北欧风格卧室'
                ];
                
                const workDescriptions = [
                    '简约而不简单的设计理念，通过线条、色彩和空间的巧妙运用，打造出舒适宜人的生活环境。留白的艺术在这里得到了完美诠释，让每一件家具都成为空间的焦点。',
                    '华丽的装饰元素与精致的细节，营造优雅高贵的空间氛围。金色线条、雕花装饰和质感十足的面料共同打造出一个充满艺术气息的生活空间。',
                    '粗犷与精致的碰撞，打造独特个性的烹饪空间。裸露的金属管道与实木橱柜形成鲜明对比，既保留了工业风格的原始感，又不失实用性和美观度。',
                    '轻盈通透的设计，自然光线与简约家具的完美结合。浅色木质地板、白色墙面和浅灰色家具共同营造出一个干净、明亮、舒适的睡眠环境。'
                ];
                
                const workData = {
                    id: `work-${index + 1}`,
                    title: workTitles[index] || '设计作品',
                    description: workDescriptions[index] || '暂无详细描述',
                    image: workImages[index] || 'https://picsum.photos/seed/default/800/600',
                    designer: 'Dimension Space 设计团队',
                    date: '2024-01-15',
                    style: ['极简主义', '装饰风格', '工业风', '北欧风格'][index] || '现代风格',
                    isHidden: false
                };
                
                showWorkDetails(workData.id, workData);
            });
        });
    } catch (error) {
        console.error('设置作品项点击事件出错:', error);
    }
}

// 数据库表结构设计 - 作品管理相关
/******************************************************************
 * 以下是建议的数据库表结构（已迁移到本地SQLite）

 ******************************************************************/

/*
-- 创建作品表
CREATE TABLE works (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    style VARCHAR(100),
    designer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_hidden BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(100)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_works_user_id ON works(user_id);
CREATE INDEX idx_works_is_hidden ON works(is_hidden);
CREATE INDEX idx_works_style ON works(style);

-- 创建权限策略，允许用户只操作自己的作品
CREATE POLICY "User can view all public works" ON works
    FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "User can view their own works" ON works
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can create works" ON works
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update their own works" ON works
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete their own works" ON works
    FOR DELETE USING (auth.uid() = user_id);

-- 创建评论表
CREATE TABLE work_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建作品收藏表
CREATE TABLE work_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_id, user_id)  -- 确保一个用户只能收藏同一个作品一次
);
*/

// 获取作品数据的函数 - 支持真实和模拟连接
async function fetchWorksFromDatabase() {
    try {
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const mocks = getMockWorks();
        return [...saved, ...mocks];
    } catch {
        return getMockWorks();
    }
}

// 获取模拟作品数据的函数
function getMockWorks() {
    return [
        {
            id: 'work-1',
            title: '极简主义客厅',
            description: '简约而不简单的设计理念，通过线条、色彩和空间的巧妙运用，打造出舒适宜人的生活环境。留白的艺术在这里得到了完美诠释，让每一件家具都成为空间的焦点。',
            image_url: 'images/minimalist-livingroom.jpg',
            thumbnail_url: 'images/minimalist-livingroom.jpg',
            style: '极简主义',
            designer: 'Dimension Space 设计团队',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '客厅'
        },
        {
            id: 'work-2',
            title: '装饰风格客厅',
            description: '华丽的装饰元素与精致的细节，营造优雅高贵的空间氛围。金色线条、雕花装饰和质感十足的面料共同打造出一个充满艺术气息的生活空间。',
            image_url: 'images/decorative-livingroom.jpg',
            thumbnail_url: 'images/decorative-livingroom.jpg',
            style: '装饰风格',
            designer: 'Dimension Space 设计团队',
            created_at: '2024-01-16T00:00:00Z',
            updated_at: '2024-01-16T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '客厅'
        },
        {
            id: 'work-3',
            title: '工业风厨房',
            description: '粗犷与精致的碰撞，打造独特个性的烹饪空间。裸露的金属管道与实木橱柜形成鲜明对比，既保留了工业风格的原始感，又不失实用性和美观度。',
            image_url: 'images/industrial-kitchen.jpg',
            thumbnail_url: 'images/industrial-kitchen.jpg',
            style: '工业风',
            designer: 'Dimension Space 设计团队',
            created_at: '2024-01-17T00:00:00Z',
            updated_at: '2024-01-17T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '厨房'
        },
        {
            id: 'work-4',
            title: '北欧风格卧室',
            description: '轻盈通透的设计，自然光线与简约家具的完美结合。浅色木质地板、白色墙面和浅灰色家具共同营造出一个干净、明亮、舒适的睡眠环境。',
            image_url: 'images/scandinavian-bedroom.jpg',
            thumbnail_url: 'images/scandinavian-bedroom.jpg',
            style: '北欧风格',
            designer: 'Dimension Space 设计团队',
            created_at: '2024-01-18T00:00:00Z',
            updated_at: '2024-01-18T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '卧室'
        }
    ];
}

// 保存作品到数据库的函数（模拟实现）
async function saveWorkToDatabase(workData) {
    try {
        if (!currentUser) {
            return { success: false, error: '用户未登录' };
        }
        
        // 数据验证
        if (!workData.title || !workData.image) {
            return { success: false, error: '标题和图片是必填项' };
        }
        
        // 显示统一的加载状态指示器
        showLoadingIndicator();
        
        try {
            const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
            const newItem = {
                id: 'local-' + Date.now(),
                title: workData.title,
                description: workData.description || '',
                image_url: workData.image,
                thumbnail_url: workData.thumbnail || workData.image,
                style: workData.style || '',
                designer: workData.designer || currentUser.username || currentUser.email,
                is_hidden: !!workData.isHidden,
                user_id: currentUser.id,
                category: workData.category || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            saved.push(newItem);
            localStorage.setItem('user_works', JSON.stringify(saved));
            if (typeof refreshWorksList === 'function') await refreshWorksList();
            return { success: true, data: newItem };
        } finally {
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error('保存作品出错:', error);
        // 确保在错误情况下也隐藏加载指示器
        hideLoadingIndicator();
        return { success: false, error: '系统错误：' + error.message };
    }
}

// 删除作品函数
async function deleteWork(workId) {
    try {
        if (!currentUser) {
            alert('您需要登录才能删除作品');
            return;
        }
        
        if (!confirm(`确定要删除作品 ${workId} 吗？此操作不可撤销。`)) {
            return;
        }
        
        try {
            showLoadingIndicator();
            const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
            const filtered = saved.filter(w => w.id !== workId);
            localStorage.setItem('user_works', JSON.stringify(filtered));
            alert(`作品 ${workId} 已成功删除！`);
        } finally {
            hideLoadingIndicator();
        }
        
        // 刷新作品列表
        if (typeof refreshWorksList === 'function') {
            await refreshWorksList();
        }
    } catch (error) {
        console.error('删除作品出错:', error);
        // 确保在错误情况下也隐藏加载指示器
        hideLoadingIndicator();
        alert('删除作品失败，请稍后重试');
    }
}

// 切换作品可见性函数
async function toggleWorkVisibility(workId, isHidden) {
    try {
        // 添加确认对话框
        if (!confirm(`确定要${isHidden ? '隐藏' : '显示'}该作品吗？`)) {
            return;
        }
        if (!currentUser) {
            alert('您需要登录才能修改作品状态');
            return;
        }
        try {
            showLoadingIndicator();
            const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
            const updated = saved.map(w => w.id === workId ? { ...w, is_hidden: isHidden, updated_at: new Date().toISOString() } : w);
            localStorage.setItem('user_works', JSON.stringify(updated));
            alert(`作品已成功${isHidden ? '隐藏' : '显示'}！`);
            if (typeof refreshWorksList === 'function') await refreshWorksList();
        } finally {
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error('切换作品可见性出错:', error);
        // 确保在错误情况下也隐藏加载指示器
        hideLoadingIndicator();
        alert(`操作失败: ${error.message || '请稍后重试'}`);
    }
}

// 更新作品信息函数
async function updateWork(workId, updatedData) {
    try {
        if (!currentUser) {
            alert('您需要登录才能编辑作品');
            return;
        }
        showLoadingIndicator();
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const updated = saved.map(w => w.id === workId ? { ...w, ...updatedData, updated_at: new Date().toISOString() } : w);
        localStorage.setItem('user_works', JSON.stringify(updated));
        alert(`作品 ${workId} 已更新！`);
        if (typeof refreshWorksList === 'function') await refreshWorksList();
    } catch (error) {
        console.error('更新作品出错:', error);
        alert('更新作品失败，请稍后重试');
    } finally {
        // 隐藏加载状态指示器
        hideLoadingIndicator();
    }
}

// 创建微信二维码气泡（修复版本）
function createWechatQrCodeBubble() {
    try {
        const wechatLink = document.getElementById('wechat-link');
        if (!wechatLink) return;
        let bubble = document.getElementById('wechat-qrcode-bubble');
        if (bubble) bubble.remove();
        bubble = document.createElement('div');
        bubble.id = 'wechat-qrcode-bubble';
        bubble.className = 'qrcode-bubble';
        bubble.innerHTML = "<div class='qrcode-content'><img src=\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' fill='white'/><rect x='8' y='8' width='28' height='28' fill='black'/><rect x='16' y='16' width='12' height='12' fill='white'/><rect x='84' y='8' width='28' height='28' fill='black'/><rect x='92' y='16' width='12' height='12' fill='white'/><rect x='8' y='84' width='28' height='28' fill='black'/><rect x='16' y='92' width='12' height='12' fill='white'/><rect x='44' y='44' width='12' height='12' fill='black'/><rect x='64' y='44' width='8' height='8' fill='black'/><rect x='52' y='64' width='10' height='10' fill='black'/><rect x='72' y='72' width='14' height='14' fill='black'/></svg>\" alt='微信二维码' class='qrcode-image'><p class='qrcode-text'>扫码添加微信</p></div><div class=\"bubble-arrow\"></div>";
        document.body.appendChild(bubble);
        let showTimer = null;
        let hideTimer = null;
        let raf = null;
        let visible = false;
        let pendingPos = null;
        const updatePos = function(x, y) {
            const pad = 12;
            const w = bubble.offsetWidth || 120;
            const h = bubble.offsetHeight || 120;
            let left = x + 16;
            let top = y + 16;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            if (left + w + pad > vw) left = vw - w - pad;
            if (top + h + pad > vh) top = vh - h - pad;
            if (left < pad) left = pad;
            if (top < pad) top = pad;
            bubble.style.left = left + 'px';
            bubble.style.top = top + 'px';
        };
        const onMouseMove = function(e) {
            pendingPos = { x: e.clientX, y: e.clientY };
            if (!raf) {
                raf = requestAnimationFrame(function run() {
                    if (pendingPos) {
                        updatePos(pendingPos.x, pendingPos.y);
                        pendingPos = null;
                    }
                    raf = null;
                });
            }
        };
        const showBubble = function(x, y) {
            bubble.style.display = 'block';
            updatePos(x, y);
            bubble.offsetHeight;
            bubble.classList.add('visible');
            visible = true;
        };
        const hideBubble = function() {
            bubble.classList.remove('visible');
            visible = false;
            hideTimer = setTimeout(function() {
                bubble.style.display = 'none';
            }, 100);
        };
        wechatLink.addEventListener('mouseenter', function(e) {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            if (showTimer) clearTimeout(showTimer);
            showTimer = setTimeout(function() {
                showBubble(e.clientX, e.clientY);
            }, 300);
            document.addEventListener('mousemove', onMouseMove, { passive: true });
        });
        wechatLink.addEventListener('mouseleave', function() {
            if (showTimer) { clearTimeout(showTimer); showTimer = null; }
            document.removeEventListener('mousemove', onMouseMove);
            hideBubble();
        });
        wechatLink.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const t = e.touches && e.touches[0] ? e.touches[0] : null;
            const x = t ? t.clientX : window.innerWidth / 2;
            const y = t ? t.clientY : window.innerHeight / 2;
            if (!visible) {
                showBubble(x, y);
                document.addEventListener('touchmove', function tm(ev) {
                    const tt = ev.touches && ev.touches[0] ? ev.touches[0] : null;
                    if (tt) updatePos(tt.clientX, tt.clientY);
                }, { passive: true, once: true });
            } else {
                hideBubble();
            }
        });
    } catch (error) {
        console.error('创建微信二维码气泡出错:', error);
    }
}

// 创建默认服务模态框（作为备份）
function createDefaultServicesModal() {
    try {
        const modalHTML = `
        <div id="services-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>我们的服务</h3>
                <div class="services-content">
                    <div class="service-item">
                        <h4>室内设计</h4>
                        <p>专业的室内设计团队，为您打造舒适、美观的生活空间。</p>
                    </div>
                    <div class="service-item">
                        <h4>空间规划</h4>
                        <p>科学合理的空间规划，最大化利用每一寸空间。</p>
                    </div>
                    <div class="service-item">
                        <h4>装修施工</h4>
                        <p>严格的施工标准，确保工程质量和进度。</p>
                    </div>
                </div>
                <button id="close-services-modal" class="close-modal-btn glass-button">关闭</button>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 添加关闭事件
        const closeBtn = document.getElementById('close-services-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hideModal('services-modal');
            });
        }
        
        console.log('创建了默认服务模态框');
    } catch (error) {
        console.error('创建默认服务模态框出错:', error);
    }
}

// 导航栏滚动效果
window.addEventListener('scroll', function() {
    try {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 10);
        }
    } catch (error) {
        console.error('导航栏滚动效果出错:', error);
    }
}, { passive: true });

// 处理联系表单提交
async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    // 获取表单数据
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const message = document.getElementById('contact-message').value;
    
    // 简单验证
    if (!name || !phone || !message) {
        alert('请填写所有必填字段');
        return;
    }
    
    // 显示加载状态指示器
    showLoadingIndicator();
    
    try {
        const savedSubmissions = JSON.parse(localStorage.getItem('saved_form_submissions') || '[]');
        savedSubmissions.push({ name, phone, message, created_at: new Date().toISOString() });
        localStorage.setItem('saved_form_submissions', JSON.stringify(savedSubmissions));
        alert('提交成功！我们会尽快联系您');
        event.target.reset();
    } finally {
        // 隐藏加载状态指示器
        hideLoadingIndicator();
    }
}

// 初始化页面
async function initPage() {
    try {
        console.log('开始页面初始化...');
        
        // 显示加载状态指示器
        showLoadingIndicator();
        
        // 初始化认证功能
        initAuth();
        
        // 创建微信二维码气泡（修复版本）
        createWechatQrCodeBubble();
        
        // 初始化用户登录状态UI
        updateUIForLoggedInState();
        
        // 初始化作品管理功能 - 等待完成
        await initWorksManagement();
        
        console.log('页面初始化完成');
        
        // 页面初始化完成后隐藏加载状态指示器
        hideLoadingIndicator();
        
        // 1. 浏览作品按钮 - 平滑滚动到精选作品区域
        const browseWorksBtn = document.getElementById('browse-works-btn');
        if (browseWorksBtn) {
            // 移除可能存在的旧事件监听器
            const newBrowseWorksBtn = browseWorksBtn.cloneNode(true);
            browseWorksBtn.parentNode.replaceChild(newBrowseWorksBtn, browseWorksBtn);
            
            newBrowseWorksBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('点击了浏览作品按钮');
                smoothScrollTo('works', 80); // 80px的偏移量，避免导航栏遮挡
            });
        }
        
        // 2. 了解服务按钮 - 显示服务模态框
        const servicesBtn = document.getElementById('services-btn');
        const closeServicesModal = document.getElementById('close-services-modal');
        
        if (servicesBtn) {
            const newServicesBtn = servicesBtn.cloneNode(true);
            servicesBtn.parentNode.replaceChild(newServicesBtn, servicesBtn);
            
            newServicesBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('点击了了解服务按钮');
                // 确保服务模态框存在
                if (!document.getElementById('services-modal')) {
                    console.warn('服务模态框不存在，创建默认模态框');
                    createDefaultServicesModal();
                }
                showModal('services-modal');
            });
        }
        
        if (closeServicesModal) {
            closeServicesModal.addEventListener('click', function(e) {
                e.stopPropagation();
                hideModal('services-modal');
            });
        }
        
        // 3. 登录按钮 - 显示登录注册模态框
        const loginBtn = document.getElementById('login-btn');
        
        if (loginBtn) {
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            newLoginBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('点击了登录按钮');
                showModal('auth-modal');
                setTimeout(() => attachLiquidGlassToAuthModal(), 0);
            });
        }
        
        // 4. 预约咨询按钮 - 平滑滚动到联系我们区域
        const appointmentBtn = document.getElementById('appointment-btn');
        
        if (appointmentBtn) {
            const newAppointmentBtn = appointmentBtn.cloneNode(true);
            appointmentBtn.parentNode.replaceChild(newAppointmentBtn, appointmentBtn);
            
            newAppointmentBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('点击了预约咨询按钮');
                smoothScrollTo('contact', 80); // 80px的偏移量，避免导航栏遮挡
            });
        }
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === modal && modal.id !== 'auth-modal') {
                    hideModal(modal.id);
                }
            });
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.active');
                if (openModal && openModal.id !== 'auth-modal') {
                    hideModal(openModal.id);
                }
            }
        });
        
    } catch (error) {
        console.error('页面初始化出错:', error);
        // 隐藏加载状态指示器
        hideLoadingIndicator();
        // 显示错误信息
        alert('页面加载失败，请刷新页面重试');
    }
}

// 初始化作品管理功能
async function initWorksManagement() {
    try {
        // 创建作品详情模态框
        createWorkDetailModal();
        
        // 创建编辑作品模态框
        createEditWorkModal();
        
        // 加载并显示作品
        await loadAndDisplayWorks();
        
    } catch (error) {
        console.error('初始化作品管理功能出错:', error);
    }
}

// 加载并显示作品
async function loadAndDisplayWorks() {
    try {
        console.log('开始加载作品...');
        
        // 显示加载指示器
        showLoadingIndicator();
        
        let works = [];
        
        // 尝试从数据库获取作品
        try {
            works = await fetchWorksFromDatabase();
        } catch (dbError) {
            console.warn('数据库加载失败，使用模拟数据:', dbError);
            works = getMockWorks();
        }
        
        console.log('获取到的作品数量:', works.length);
        
        // 显示精选作品（公开的作品）
        displayFeaturedWorks(works);
        
        // 如果用户已登录，显示用户的所有作品（包括隐藏的）
        if (isUserLoggedIn()) {
            displayUserWorks(works);
        }
        
        // 设置作品项的点击事件
        setupWorkItemClickEvents();
        
    } catch (error) {
        console.error('加载作品出错:', error);
        alert('加载作品失败，请稍后重试');
    } finally {
        // 隐藏加载指示器
        hideLoadingIndicator();
    }
}

// 显示精选作品（公开状态的作品）
function displayFeaturedWorks(works) {
    try {
        // 筛选公开状态的作品
        const publicWorks = works.filter(work => !work.is_hidden);
        console.log('筛选出的公开作品数量:', publicWorks.length);
        
        // 获取精选作品容器
        const featuredWorksContainer = document.querySelector('#works .works-grid');
        if (!featuredWorksContainer) {
            console.warn('精选作品容器不存在');
            return;
        }
        
        // 清空容器内容
        featuredWorksContainer.innerHTML = '';
        
        // 如果没有公开作品，显示提示信息
        if (publicWorks.length === 0) {
            featuredWorksContainer.innerHTML = `
                <div class="no-works-message">
                    <p>当前暂无精选作品</p>
                    <p>敬请期待更多精彩内容！</p>
                </div>
            `;
            return;
        }
        
        // 创建并添加作品项
        publicWorks.forEach(work => {
            const workItem = createWorkItem(work);
            featuredWorksContainer.appendChild(workItem);
        });
        
    } catch (error) {
        console.error('显示精选作品出错:', error);
    }
}

// 显示用户作品（包括隐藏的）
function displayUserWorks(works) {
    try {
        // 检查用户作品容器是否存在，如果不存在则创建
        let userWorksSection = document.getElementById('user-works');
        if (!userWorksSection) {
            // 创建用户作品区域
            userWorksSection = document.createElement('section');
            userWorksSection.id = 'user-works';
            userWorksSection.className = 'works-section user-works-section';
            
            userWorksSection.innerHTML = `
                <h2 class="section-title">我的作品</h2>
                <div class="works-grid works-list"></div>
            `;
            
            // 插入到精选作品区域之后
            const worksSection = document.getElementById('works');
            if (worksSection) {
                worksSection.after(userWorksSection);
            }
        }
        
        // 筛选当前用户的作品
        const userWorks = works.filter(work => work.user_id === currentUser.id);
        console.log('用户作品数量:', userWorks.length);
        
        // 更新容器标题
        const userWorksTitle = userWorksSection.querySelector('.section-title');
        if (userWorksTitle) {
            userWorksTitle.textContent = `我的作品 (${userWorks.length})`;
        }
        
        // 获取作品列表容器
        const worksListContainer = userWorksSection.querySelector('.works-list');
        if (!worksListContainer) {
            console.warn('作品列表容器不存在');
            return;
        }
        
        // 清空容器内容
        worksListContainer.innerHTML = '';
        
        // 如果没有作品，显示提示信息
        if (userWorks.length === 0) {
            worksListContainer.innerHTML = `
                <div class="no-works-message">
                    <p>您还没有创建任何作品</p>
                    <button class="create-first-work-btn">创建我的第一个作品</button>
                </div>
            `;
            
            // 添加创建作品按钮事件
            const createBtn = worksListContainer.querySelector('.create-first-work-btn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    // 这里可以打开创建作品的模态框
                    alert('创建作品功能即将上线');
                });
            }
            
            return;
        }
        
        // 创建并添加作品项，包括公开和隐藏的
        userWorks.forEach(work => {
            const workItem = createWorkItem(work);
            
            // 为隐藏的作品添加特殊标记
            if (work.is_hidden) {
                const hiddenBadge = document.createElement('span');
                hiddenBadge.className = 'work-hidden-badge';
                hiddenBadge.textContent = '已隐藏';
                hiddenBadge.title = '此作品仅对您可见';
                workItem.appendChild(hiddenBadge);
            }
            
            worksListContainer.appendChild(workItem);
        });
        
    } catch (error) {
        console.error('显示用户作品出错:', error);
    }
}

// 创建作品项DOM元素
function createWorkItem(work) {
    const workItem = document.createElement('div');
    workItem.className = 'work-item';
    workItem.dataset.workId = work.id;
    
    // 作品卡片HTML结构
    workItem.innerHTML = `
        <div class="work-image">
            <img src="${work.image_url || work.image || 'https://via.placeholder.com/400x300?text=作品图片'}" 
                 alt="${work.title || '作品图片'}" 
                 class="work-image">
        </div>
        <div class="work-info">
            <h3 class="work-title">${work.title || '未命名作品'}</h3>
            <p class="work-description">${work.description || '暂无描述'}</p>
            <div class="work-meta">
                <span class="work-date">${work.created_at ? formatDate(work.created_at) : (work.date || '')}</span>
                <span class="work-category">${work.category || '未分类'}</span>
            </div>
        </div>
    `;
    
    return workItem;
}

// 刷新作品列表（在作品操作后调用）
async function refreshWorksList() {
    try {
        console.log('刷新作品列表...');
        // 显示加载状态指示器
        showLoadingIndicator();
        await loadAndDisplayWorks();
    } catch (error) {
        console.error('刷新作品列表出错:', error);
        alert('刷新作品列表失败，请稍后重试');
    } finally {
        // 确保隐藏加载状态指示器
        hideLoadingIndicator();
    }
}

// 当DOM加载完成后初始化页面
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM内容加载完成');
    
    var buttons = document.querySelectorAll('button');
    
    
    // 初始化表单验证
    setupFormValidation();
    
    try {
        await initPage();
    } catch (error) {
        console.error('页面初始化失败:', error);
        alert('页面加载时出现错误，请刷新页面重试');
    }
    
    // 为联系表单添加提交事件监听
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactFormSubmit);
    }
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
        const newLink = forgotLink.cloneNode(true);
        forgotLink.parentNode.replaceChild(newLink, forgotLink);
        newLink.addEventListener('click', async function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email')?.value.trim();
            if (!email || !isValidEmail(email)) { showAuthError('请输入有效的邮箱地址'); return; }
            if (PREVIEW_MODE) {
                const el = document.getElementById('auth-error');
                if (el) { el.textContent = '预览环境不支持密码重置'; el.className = 'success-message'; el.style.display = 'block'; }
                return;
            }
            showLoadingIndicator();
            try {
                const resp = await fetch(`${API_BASE}/api/auth/request-reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                if (!resp.ok) { showAuthError('重置请求失败，请稍后重试'); return; }
                const el = document.getElementById('auth-error');
                if (el) { el.textContent = '已发送重置邮件（有效期1小时）'; el.className = 'success-message'; el.style.display = 'block'; }
            } finally { hideLoadingIndicator(); }
        });
    }
});
document.addEventListener('DOMContentLoaded', async function() {
    if (!PREVIEW_MODE) {
        try {
            const resp = await fetch(`${API_BASE}/api/auth/me`, { method: 'GET', credentials: 'include' });
            if (resp.ok) {
                const json = await resp.json();
                currentUser = { id: json.user.id, email: json.user.email, username: json.user.email.split('@')[0], avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(json.user.email.split('@')[0])}&background=random` };
                updateUIForLoggedInState();
            }
        } catch {}
    }
});
