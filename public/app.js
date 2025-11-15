// 鍏ㄦ柊鐨凧avaScript鏂囦欢
console.log('app.js 鍔犺浇鎴愬姛');

const API_BASE = '';
const SUPABASE_URL = 'https://afrasbvtsucsmddcdusi.supabase.co';
let SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmcmFzYnZ0c3Vjc21kZGNkdXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTkzMDgsImV4cCI6MjA3ODM3NTMwOH0.CBeNwfTUNs1gPwhgiDDvP1N1B1_Lzya8fnYJzDSwbdM';
function getSupabaseClient(){ try { const url = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : SUPABASE_URL; if (!window.supabase || !url || !SUPABASE_ANON_KEY) return null; return window.supabase.createClient(url, SUPABASE_ANON_KEY); } catch(_) { return null; } }
const PREVIEW_MODE = false;
const FRONTEND_ONLY = !API_BASE;

// 鍒涘缓鍔犺浇鍔ㄧ敾鏍峰紡
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

// 鍒涘缓鍔犺浇鎸囩ず鍣ㄥ厓绱?function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>鍔犺浇涓?..</p>
    `;
    indicator.style.position = 'fixed';
    indicator.style.top = '50%';
    indicator.style.left = '50%';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.zIndex = '9999';
    indicator.style.backgroundColor = 'rgba(10, 10, 20, 0.6)';
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

// 鍏ㄥ眬鍔犺浇鎸囩ず鍣?let loadingIndicator = null;

// 鏄剧ず鍔犺浇鎸囩ず鍣?function showLoadingIndicator() {
    if (!loadingIndicator) {
        createLoadingStyles();
        loadingIndicator = createLoadingIndicator();
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'flex';
}

// 闅愯棌鍔犺浇鎸囩ず鍣?function hideLoadingIndicator() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 鍏ㄥ眬鍙橀噺瀛樺偍鐢ㄦ埛淇℃伅
let currentUser = null;

function loadUsers() { return {}; }
function saveUsers(u) { }
function saveSession(u) { }
function loadSession() { return null; }

function highlightSection(sectionId, duration = 1500) {
    const el = document.getElementById(sectionId);
    if (!el) return;
    el.classList.add('section-highlight');
    setTimeout(() => { el.classList.remove('section-highlight'); }, duration);
}

function validatePhone(phone) {
    return /^1\d{10}$/.test(String(phone).trim());
}

function validateNickname(nick) {
    const s = String(nick).trim();
    return s.length >= 2 && s.length <= 20;
}

async function updateUserProfile(patch) {
    const payload = Object.assign({}, patch);
    if (!currentUser || !currentUser.username) throw new Error('鏈櫥褰?);
    payload.username = currentUser.username;
    if (currentUser.id) payload.id = currentUser.id;
    payload.email = currentUser.email;
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb) {
            const u = await sb.auth.getUser();
            if (u.error) throw new Error('鏈櫥褰?);
            const data = { nick_name: payload.nickName ?? currentUser.nickName, phone: payload.phone ?? currentUser.phone, avatar_url: payload.avatar ?? currentUser.avatar };
            const r = await sb.auth.updateUser({ data });
            if (r.error) throw new Error(r.error.message || '淇濆瓨澶辫触');
            const u2 = r.data.user;
            const m2 = u2.user_metadata || {};
            currentUser = { id: u2.id, email: u2.email, username: u2.email.split('@')[0], avatar: m2.avatar_url || currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u2.email.split('@')[0])}&background=random`, nickName: m2.nick_name || currentUser?.nickName || u2.email.split('@')[0], phone: m2.phone || currentUser?.phone || '' };
            updateUIForLoggedInState();
            return { code: '0', msg: '鎴愬姛' };
        } else {
            throw new Error('鍚庣鏈厤缃?);
        }
    } finally {
        hideLoadingIndicator();
    }
}

async function changeUserPassword(oldPwd, newPwd) {
    if (!currentUser || !currentUser.username) throw new Error('鏈櫥褰?);
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb) {
            const re = await sb.auth.signInWithPassword({ email: currentUser.email, password: oldPwd });
            if (re.error) throw new Error('瀵嗙爜閿欒');
            const r = await sb.auth.updateUser({ password: newPwd });
            if (r.error) throw new Error(r.error.message || '淇敼瀵嗙爜澶辫触');
            return { code: '0', msg: '鎴愬姛' };
        } else {
            throw new Error('鍚庣鏈厤缃?);
        }
    } finally {
        hideLoadingIndicator();
    }
}

function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function compressImage(file, maxW = 512, maxH = 512, quality = 0.8) {
    const img = await fileToImage(file);
    const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
    });
}

async function uploadAvatarAndSave(file) {
    const blob = await compressImage(file);
    showLoadingIndicator();
    try {
        const sb = getSupabaseClient();
        if (sb) {
            const u = await sb.auth.getUser();
            if (u.error) throw new Error('鏈櫥褰?);
            const name = `${u.data.user.id}/${Date.now()}.jpg`;
            const up = await sb.storage.from('avatars').upload(name, blob, { upsert: true });
            if (up.error) {
                const reader = new FileReader();
                const urlData = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
                await updateUserProfile({ avatar: urlData });
                const userAvatarImg = document.querySelector('#user-avatar img');
                if (userAvatarImg) userAvatarImg.src = urlData;
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) profileAvatar.src = urlData;
                currentUser.avatar = urlData;
                return urlData;
            }
            const signed = await sb.storage.from('avatars').createSignedUrl(name, 60*60*24);
            const url = signed.data?.signedUrl || '';
            await updateUserProfile({ avatar: url });
            const userAvatarImg = document.querySelector('#user-avatar img');
            if (userAvatarImg) userAvatarImg.src = url;
            const profileAvatar = document.getElementById('profile-avatar');
            if (profileAvatar) profileAvatar.src = url;
            currentUser.avatar = url;
            return url;
        } else {
            throw new Error('鍚庣鏈厤缃?);
        }
    } finally {
        hideLoadingIndicator();
    }
}

function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function animateScrollTo(targetY, duration = 500, onComplete = null) {
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
            if (elapsed < 1) {
                requestAnimationFrame(step);
            } else {
                if (typeof onComplete === 'function') {
                    try { onComplete(); } catch(_) {}
                }
            }
        }
        requestAnimationFrame(step);
    } catch (error) {
        window.scrollTo(0, targetY);
        if (typeof onComplete === 'function') {
            try { onComplete(); } catch(_) {}
        }
    }
}
function smoothScrollTo(elementId, offset = 0, onComplete = null) {
    try {
        const element = document.getElementById(elementId);
        if (!element) { console.warn(`鐩爣鍏冪礌 #${elementId} 鏈壘鍒癭); return; }
        const elementTop = element.getBoundingClientRect().top;
        let target = elementTop + window.pageYOffset - offset;
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (target > max) target = max;
        if (target < 0) target = 0;
        animateScrollTo(target, 500, onComplete);
    } catch (error) { console.error('骞虫粦婊氬姩鍑洪敊:', error); }
}

// 鏄剧ず妯℃€佹鍑芥暟
function showModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`妯℃€佹 #${modalId} 鏈壘鍒癭);
            return;
        }
        modal.classList.add('active');
        if (modalId !== 'work-detail-modal') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    } catch (error) {
        console.error('鏄剧ず妯℃€佹鍑洪敊:', error);
    }
}

// 闅愯棌妯℃€佹鍑芥暟
function hideModal(modalId) {
    try {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.warn(`妯℃€佹 #${modalId} 鏈壘鍒癭);
            return;
        }
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (modalId === 'auth-modal' && authLiquid) { authLiquid.destroy(); authLiquid = null; }
    } catch (error) {
        console.error('闅愯棌妯℃€佹鍑洪敊:', error);
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

// 鍒濆鍖栬璇佺浉鍏冲姛鑳?function initAuth() {
    try {
        // 璁剧疆琛ㄥ崟鍒囨崲鍔熻兘
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authModalTitle = document.getElementById('auth-modal-title');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const closeAuthModal = document.getElementById('close-auth-modal');
        const loginSubmitBtn = document.getElementById('login-submit-btn');
        const registerSubmitBtn = document.getElementById('register-submit-btn');
        
        if (switchToRegister && switchToLogin && loginForm && registerForm && authModalTitle) {
            // 鍒囨崲鍒版敞鍐岃〃鍗?            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                authModalTitle.textContent = '鍒涘缓鏂拌处鍙?;
                clearAuthError();
            });
            
            // 鍒囨崲鍒扮櫥褰曡〃鍗?            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                authModalTitle.textContent = '娆㈣繋鍥炴潵';
                clearAuthError();
            });
        }
        
        // 鍏抽棴妯℃€佹
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
        console.error('鍒濆鍖栬璇佸姛鑳藉嚭閿?', error);
    }
}

// 鏄剧ず璁よ瘉閿欒淇℃伅
function showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// 娓呴櫎璁よ瘉閿欒淇℃伅
function clearAuthError() {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// 娓呴櫎璁よ瘉琛ㄥ崟
function clearAuthForms() {
    // 娓呴櫎鐧诲綍琛ㄥ崟
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    if (loginEmail) loginEmail.value = '';
    if (loginPassword) loginPassword.value = '';
    
    // 娓呴櫎娉ㄥ唽琛ㄥ崟
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

// 琛ㄥ崟楠岃瘉鍑芥暟
function setupFormValidation() {
    try {
        // 鐧诲綍琛ㄥ崟楠岃瘉 - 褰撶敤鎴疯緭鍏ユ椂杩涜楠岃瘉
        const loginEmail = document.getElementById('login-email');
        const loginPassword = document.getElementById('login-password');
        
        if (loginEmail) {
            loginEmail.addEventListener('input', function() {
                if (!isValidEmail(loginEmail.value) && loginEmail.value.trim()) {
                    showAuthError('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃');
                } else {
                    clearAuthError();
                }
            });
        }
        
        // 娉ㄥ唽琛ㄥ崟楠岃瘉
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        
        if (registerUsername) {
            registerUsername.addEventListener('input', function() {
                if (registerUsername.value.length < 3 && registerUsername.value.trim()) {
                    showAuthError('鐢ㄦ埛鍚嶈嚦灏戦渶瑕?涓瓧绗?);
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerEmail) {
            registerEmail.addEventListener('input', function() {
                if (!isValidEmail(registerEmail.value) && registerEmail.value.trim()) {
                    showAuthError('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃');
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerPassword) {
            registerPassword.addEventListener('input', function() {
                if (registerPassword.value.length < 8 && registerPassword.value.trim()) {
                    showAuthError('瀵嗙爜鑷冲皯闇€瑕?涓瓧绗?);
                } else {
                    clearAuthError();
                }
            });
        }
        
        if (registerConfirmPassword) {
            registerConfirmPassword.addEventListener('input', function() {
                if (registerPassword && registerConfirmPassword.value !== registerPassword.value) {
                    showAuthError('涓ゆ杈撳叆鐨勫瘑鐮佷笉涓€鑷?);
                } else {
                    clearAuthError();
                }
            });
        }
        
    } catch (error) {
        console.error('璁剧疆琛ㄥ崟楠岃瘉鍑洪敊:', error);
    }
}

// 閭楠岃瘉鍑芥暟
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 澶勭悊鐢ㄦ埛娉ㄥ唽
async function handleRegister() {
    try {
        const registerUsername = document.getElementById('register-username');
        const registerEmail = document.getElementById('register-email');
        const registerPhone = document.getElementById('register-phone');
        const registerPassword = document.getElementById('register-password');
        const registerConfirmPassword = document.getElementById('register-confirm-password');
        const authErrorElement = document.getElementById('auth-error');
        if (!registerUsername || !registerEmail || !registerPassword || !registerConfirmPassword) {
            showAuthError('琛ㄥ崟鍒濆鍖栧け璐ワ紝璇峰埛鏂伴〉闈㈤噸璇?);
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
        if (!username) { showFieldError(registerUsername, '璇疯緭鍏ョ敤鎴峰悕'); showAuthError('璇疯緭鍏ョ敤鎴峰悕'); return; }
        if (username.length < 3) { showFieldError(registerUsername, '鐢ㄦ埛鍚嶈嚦灏戦渶瑕?涓瓧绗?); showAuthError('鐢ㄦ埛鍚嶈嚦灏戦渶瑕?涓瓧绗?); return; }
        if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(username)) { showFieldError(registerUsername, '鐢ㄦ埛鍚嶅彧鑳藉寘鍚瓧姣嶃€佹暟瀛椼€佷笅鍒掔嚎鍜屼腑鏂?); showAuthError('鐢ㄦ埛鍚嶅彧鑳藉寘鍚瓧姣嶃€佹暟瀛椼€佷笅鍒掔嚎鍜屼腑鏂?); return; }
        if (!email || !isValidEmail(email)) { showFieldError(registerEmail, '璇疯緭鍏ユ湁鏁堢殑閭鍦板潃'); showAuthError('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃'); return; }
        if (!password) { showFieldError(registerPassword, '璇疯緭鍏ュ瘑鐮?); showAuthError('璇疯緭鍏ュ瘑鐮?); return; }
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { showFieldError(registerPassword, '鑷冲皯8浣嶏紝鍚ぇ灏忓啓鍜屾暟瀛?); showAuthError('鑷冲皯8浣嶏紝鍚ぇ灏忓啓鍜屾暟瀛?); return; }
        if (!confirmPassword || password !== confirmPassword) { showFieldError(registerConfirmPassword, '涓ゆ杈撳叆鐨勫瘑鐮佷笉涓€鑷?); showAuthError('涓ゆ杈撳叆鐨勫瘑鐮佷笉涓€鑷?); return; }
        clearAuthError();
        showLoadingIndicator();
        const sb = getSupabaseClient();
        if (sb) {
            const r = await sb.auth.signUp({ email, password, options: { data: { nick_name: username, phone }, emailRedirectTo: location.origin } });
            if (r.error) { showAuthError(r.error.message || '娉ㄥ唽澶辫触'); return; }
        } else if (FRONTEND_ONLY || PREVIEW_MODE) {
            const users = loadUsers();
            if (users[email]) { showFieldError(registerEmail, '璇ラ偖绠卞凡琚敞鍐?); showAuthError('璇ラ偖绠卞凡琚敞鍐?); hideLoadingIndicator(); return; }
            const hash = await bcrypt.hash(password, 10);
            users[email] = { id: Date.now(), username, email, phone, passwordHash: hash, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random` };
            saveUsers(users);
        } else {
            showAuthError('鍚庣鏈厤缃?); return;
        }
        if (authErrorElement) { authErrorElement.textContent = '娉ㄥ唽鎴愬姛锛佽浣跨敤璐﹀彿鐧诲綍'; authErrorElement.className = 'success-message'; authErrorElement.style.display = 'block'; }
        setTimeout(() => {
            const registerForm = document.getElementById('register-form');
            const loginForm = document.getElementById('login-form');
            const authModalTitle = document.getElementById('auth-modal-title');
            const loginEmail = document.getElementById('login-email');
            if (registerForm && loginForm && authModalTitle) {
                registerForm.style.display = 'none';
                loginForm.style.display = 'block';
                authModalTitle.textContent = '娆㈣繋鍥炴潵';
            }
            clearAuthForms();
            if (loginEmail) loginEmail.value = email;
        }, 1000);
    } catch (error) {
        showAuthError('娉ㄥ唽杩囩▼鍑洪敊锛岃绋嶅悗閲嶈瘯');
    } finally {
        hideLoadingIndicator();
    }
}

// 鏄剧ず瀛楁绾ч敊璇?function showFieldError(inputElement, message) {
    // 娣诲姞閿欒鏍峰紡
    inputElement.classList.add('error');
    inputElement.style.borderColor = '#f44336';
    
    // 绉婚櫎宸插瓨鍦ㄧ殑閿欒淇℃伅
    const existingError = inputElement.nextElementSibling;
    if (existingError && existingError.classList.contains('error-message')) {
        existingError.remove();
    }
    
    // 鍒涘缓鏂扮殑閿欒淇℃伅鍏冪礌
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.color = '#f44336';
    errorElement.style.fontSize = '12px';
    errorElement.style.marginTop = '5px';
    
    // 鎻掑叆鍒拌緭鍏ユ鍚庨潰
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
}

// 澶勭悊鐢ㄦ埛鐧诲綍
async function handleLogin() {
    try {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // 琛ㄥ崟楠岃瘉
        if (!email || !isValidEmail(email)) {
            showAuthError('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃');
            return;
        }
        
        if (!password) {
            showAuthError('璇疯緭鍏ュ瘑鐮?);
            return;
        }
        
        const sb = getSupabaseClient();
        if (sb) {
            showLoadingIndicator();
            const r = await sb.auth.signInWithPassword({ email, password });
            if (r.error) {
                const msg = String(r.error.message||'');
                if (msg.toLowerCase().includes('email not confirmed')) {
                    try { await sb.auth.resend({ type: 'signup', email }); } catch(_) {}
                    showAuthError('閭鏈獙璇侊紝宸查噸鏂板彂閫侀獙璇侀偖浠讹紝璇峰畬鎴愰獙璇佸悗鍐嶇櫥褰?);
                } else if (msg.includes('Invalid login')) {
                    showAuthError('瀵嗙爜閿欒');
                } else {
                    showAuthError(r.error.message);
                }
                return;
            }
            const u = r.data.user;
            const m = u.user_metadata || {};
            currentUser = { id: u.id, email: u.email, username: u.email.split('@')[0], avatar: m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.email.split('@')[0])}&background=random`, nickName: m.nick_name || u.email.split('@')[0], phone: m.phone || '' };
            updateUIForLoggedInState();
            hideModal('auth-modal');
            clearAuthForms();
            clearAuthError();
            document.body.style.overflow = '';
            showUserSettingsModal();
            return;
        }
        if (PREVIEW_MODE || FRONTEND_ONLY) {
            const users = loadUsers();
            const u = users[email];
            if (!u) { showAuthError('璐﹀彿鏈敞鍐岋紝璇峰厛娉ㄥ唽'); return; }
            const ok = await bcrypt.compare(password, u.passwordHash);
            if (!ok) { showAuthError('瀵嗙爜閿欒'); return; }
            currentUser = { id: u.id, email: u.email, username: u.username || email.split('@')[0], avatar: u.avatar, phone: u.phone, nickName: u.username };
            saveSession(currentUser);
            updateUIForLoggedInState();
            hideModal('auth-modal');
            clearAuthForms();
            clearAuthError();
            showUserSettingsModal();
            return;
        }
        showAuthError('鍚庣鏈厤缃?);
    } catch (error) {
        console.error('鐧诲綍杩囩▼鍑洪敊:', error);
        showAuthError(`鐧诲綍杩囩▼鍑洪敊: ${error.message || '鏈煡閿欒'}`);
    } finally {
        // 闅愯棌鍔犺浇鐘舵€佹寚绀哄櫒
        hideLoadingIndicator();
    }
}

// 琛ㄥ崟楠岃瘉鍑芥暟宸插湪鍓嶉潰瀹氫箟锛屼娇鐢ㄨ緭鍏ユ椂楠岃瘉鑰岄潪鎻愪氦鏃堕獙璇?
// 鏄剧ず閿欒淇℃伅
function showError(inputElement, message) {
    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        inputElement.classList.add('error');
    }
}

// 闅愯棌閿欒淇℃伅
function hideError(inputElement) {
    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        inputElement.classList.remove('error');
    }
}

// 鏇存柊鐧诲綍鐘舵€乁I鍑芥暟
function updateUIForLoggedInState() {
    try {
        const loginBtn = document.getElementById('login-btn');
        const userAvatar = document.getElementById('user-avatar');
        const userDetailsLink = document.getElementById('user-details-link');
        const logoutLink = document.getElementById('logout-link');
        const userAvatarImg = userAvatar?.querySelector('img');
        
        if (loginBtn && userAvatar) {
            if (currentUser) {
                // 鏄剧ず鐢ㄦ埛澶村儚锛岄殣钘忕櫥褰曟寜閽?                loginBtn.style.display = 'none';
                userAvatar.style.display = 'block';
                
                // 鏇存柊澶村儚鍜岀敤鎴峰悕
                if (userAvatarImg) {
                    userAvatarImg.src = currentUser.avatar;
                    userAvatarImg.alt = `${currentUser.username}鐨勫ご鍍廯;
                    userAvatarImg.title = currentUser.username;
                }
                
                // 娣诲姞璐︽埛璇︽儏閾炬帴鐨勭偣鍑讳簨浠?                if (userDetailsLink) {
                    userDetailsLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        showUserSettingsModal();
                    });
                }
                
                // 娣诲姞鐧诲嚭閾炬帴鐨勭偣鍑讳簨浠?                if (logoutLink) {
                    logoutLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        logoutUser();
                    });
                }
            } else {
                // 闅愯棌鐢ㄦ埛澶村儚锛屾樉绀虹櫥褰曟寜閽?                loginBtn.style.display = 'block';
                userAvatar.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('鏇存柊鐧诲綍鐘舵€乁I鍑洪敊:', error);
    }
}

// 鐧诲嚭鐢ㄦ埛鍑芥暟
function logoutUser() {
    try {
        const sb = getSupabaseClient();
        if (sb) { (async () => { try { await sb.auth.signOut(); } catch(_) {} })(); }
        currentUser = null;
        updateUIForLoggedInState();
        showModal('auth-modal');
    } catch (error) {
        console.error('鐧诲嚭鐢ㄦ埛鍑洪敊:', error);
    }
}

// 鏄剧ず鐢ㄦ埛璧勬枡妯℃€佹
function showUserProfileModal() {
    try {
        // 妫€鏌ユ槸鍚﹀凡瀛樺湪
        if (!document.getElementById('user-profile-modal')) {
            const modalHTML = `
            <div id="user-profile-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h3>璐︽埛璇︽儏</h3>
                    <div class="user-profile-content">
                        <div class="profile-header">
                            <img id="profile-avatar" src="https://picsum.photos/seed/default/100/100" alt="鐢ㄦ埛澶村儚" class="profile-avatar">
                            <div class="profile-info">
                                <h4 id="profile-username">鐢ㄦ埛鍚?/h4>
                                <p id="profile-email">閭</p>
                            </div>
                        </div>
                        <div class="profile-section">
                            <h5>鎴戠殑鏉冮檺</h5>
                            <ul>
                                <li>娴忚鎵€鏈夎璁′綔鍝?/li>
                                <li>棰勭害璁捐鍜ㄨ</li>
                                <li>淇濆瓨鍠滄鐨勮璁℃柟妗?/li>
                                <li>鏌ョ湅璁捐杩涘害</li>
                            </ul>
                        </div>
                        <div class="profile-section">
                            <h5>鎴戠殑鏈嶅姟</h5>
                            <a href="#" class="service-link">鎴戠殑棰勭害</a>
                            <a href="#" class="service-link">鎴戠殑鏀惰棌</a>
                            <a href="#" class="service-link">淇敼璧勬枡</a>
                        </div>
                    </div>
                    <button id="close-profile-modal" class="close-modal-btn glass-button">鍏抽棴</button>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 娣诲姞鍏抽棴妯℃€佹浜嬩欢
            const closeProfileModal = document.getElementById('close-profile-modal');
            if (closeProfileModal) {
                closeProfileModal.addEventListener('click', function() {
                    hideModal('user-profile-modal');
                });
            }
        }
        
        // 鏇存柊鐢ㄦ埛璧勬枡
        if (currentUser) {
            const profileAvatar = document.getElementById('profile-avatar');
            const profileUsername = document.getElementById('profile-username');
            const profileEmail = document.getElementById('profile-email');
            
            if (profileAvatar) profileAvatar.src = currentUser.avatar;
            if (profileUsername) profileUsername.textContent = currentUser.username;
            if (profileEmail) profileEmail.textContent = currentUser.email;
        }
        
        // 鏄剧ず妯℃€佹
        showModal('user-profile-modal');
    } catch (error) {
        console.error('鏄剧ず鐢ㄦ埛璧勬枡妯℃€佹鍑洪敊:', error);
    }
}

function showUserSettingsModal() {
    try {
        if (!document.getElementById('user-settings-modal')) {
            const modalHTML = `
            <div id="user-settings-modal" class="modal" style="display: none;">
              <div class="modal-content">
                <h3>璐︽埛璁剧疆</h3>
                <div class="user-profile-content">
                  <div class="profile-header">
                    <img id="profile-avatar" src="https://picsum.photos/seed/default/100/100" alt="鐢ㄦ埛澶村儚" class="profile-avatar">
                    <div class="profile-info">
                      <h4 id="profile-username">鐢ㄦ埛鍚?/h4>
                      <p id="profile-email">閭</p>
                    </div>
                  </div>
                  <div class="profile-section">
                    <h5>澶村儚</h5>
                    <input type="file" id="avatar-file" accept="image/*">
                    <div style="margin-top:10px;display:flex;gap:12px;align-items:center;">
                      <img id="avatar-preview" src="" alt="棰勮" style="width:64px;height:64px;border-radius:50%;display:none;border:2px solid rgba(168,85,247,0.5)">
                      <span id="avatar-hint" style="color:rgba(255,255,255,0.7);font-size:0.9rem;">鏀寔 JPG/PNG锛岃嚜鍔ㄥ帇缂?/span>
                    </div>
                  </div>
                  <div class="profile-section">
                    <h5>鍩烘湰淇℃伅</h5>
                    <label>鏄电О</label>
                    <input type="text" id="profile-nickname" placeholder="璇疯緭鍏ユ樀绉?2-20瀛?">
                    <div id="nickname-error" class="error-message"></div>
                    <label style="margin-top:12px;">鎵嬫満鍙?/label>
                    <input type="tel" id="profile-phone" placeholder="璇疯緭鍏ユ墜鏈哄彿">
                    <div id="phone-error" class="error-message"></div>
                  </div>
                  <div class="profile-section">
                    <h5>鏇存敼瀵嗙爜</h5>
                    <label>鍘熷瘑鐮?/label>
                    <input type="password" id="current-password" placeholder="璇疯緭鍏ュ師瀵嗙爜">
                    <label style="margin-top:12px;">鏂板瘑鐮?/label>
                    <input type="password" id="new-password" placeholder="璇疯緭鍏ユ柊瀵嗙爜(鈮?浣?">
                    <label style="margin-top:12px;">纭鏂板瘑鐮?/label>
                    <input type="password" id="confirm-password" placeholder="璇峰啀娆¤緭鍏ユ柊瀵嗙爜">
                    <div id="password-error" class="error-message"></div>
                    <button id="apply-password-btn" class="glass-button" style="margin-top:12px;">淇敼瀵嗙爜</button>
                  </div>
                </div>
                <button id="close-settings-modal" class="close-modal-btn glass-button">鍏抽棴</button>
              </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const closeBtn = document.getElementById('close-settings-modal');
            if (closeBtn) closeBtn.addEventListener('click', () => hideModal('user-settings-modal'));
            const modal = document.getElementById('user-settings-modal');
            if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) hideModal('user-settings-modal'); });
        }

        if (currentUser) {
            const profileAvatar = document.getElementById('profile-avatar');
            const profileUsername = document.getElementById('profile-username');
            const profileEmail = document.getElementById('profile-email');
            if (profileAvatar) profileAvatar.src = currentUser.avatar;
            if (profileUsername) profileUsername.textContent = currentUser.username;
            if (profileEmail) profileEmail.textContent = currentUser.email;
            const nickInput = document.getElementById('profile-nickname');
            const phoneInput = document.getElementById('profile-phone');
            if (nickInput) nickInput.value = currentUser.nickName || '';
            if (phoneInput) phoneInput.value = currentUser.phone || '';
        }

        const avatarFile = document.getElementById('avatar-file');
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarFile) {
            avatarFile.onchange = async (e) => {
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const url = URL.createObjectURL(f);
                avatarPreview.src = url; avatarPreview.style.display = 'block';
                try { await uploadAvatarAndSave(f); } catch (err) { alert(err.message || '澶村儚涓婁紶澶辫触'); }
                URL.revokeObjectURL(url);
            };
        }

        const nickInput = document.getElementById('profile-nickname');
        const nickErr = document.getElementById('nickname-error');
        if (nickInput) {
            let timer = null;
            const handler = async () => {
                const v = nickInput.value;
                if (!validateNickname(v)) { nickErr.textContent = '鏄电О闇€2-20瀛?; return; }
                nickErr.textContent = '';
                try { await updateUserProfile({ nickName: v }); } catch (e) { nickErr.textContent = e.message; }
            };
            nickInput.addEventListener('blur', handler);
            nickInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(handler, 600); });
        }

        const phoneInput = document.getElementById('profile-phone');
        const phoneErr = document.getElementById('phone-error');
        if (phoneInput) {
            let timerP = null;
            const handlerP = async () => {
                const v = phoneInput.value;
                if (!validatePhone(v)) { phoneErr.textContent = '鎵嬫満鍙锋牸寮忎笉姝ｇ‘'; return; }
                phoneErr.textContent = '';
                try { await updateUserProfile({ phone: v }); } catch (e) { phoneErr.textContent = e.message; }
            };
            phoneInput.addEventListener('blur', handlerP);
            phoneInput.addEventListener('input', () => { clearTimeout(timerP); timerP = setTimeout(handlerP, 600); });
        }

        const pwdBtn = document.getElementById('apply-password-btn');
        const pwdErr = document.getElementById('password-error');
        if (pwdBtn) {
            pwdBtn.onclick = async () => {
                const oldPwd = document.getElementById('current-password').value;
                const newPwd = document.getElementById('new-password').value;
                const confirmPwd = document.getElementById('confirm-password').value;
                if (!oldPwd || !newPwd || !confirmPwd) { pwdErr.textContent = '璇峰畬鏁村～鍐欏瘑鐮佸瓧娈?; return; }
                if (newPwd.length < 8) { pwdErr.textContent = '鏂板瘑鐮佽嚦灏?浣?; return; }
                if (newPwd !== confirmPwd) { pwdErr.textContent = '涓ゆ杈撳叆鐨勫瘑鐮佷笉涓€鑷?; return; }
                pwdErr.textContent = '';
                try { await changeUserPassword(oldPwd, newPwd); alert('瀵嗙爜淇敼鎴愬姛'); document.getElementById('current-password').value=''; document.getElementById('new-password').value=''; document.getElementById('confirm-password').value=''; }
                catch (e) { pwdErr.textContent = e.message; }
            };
        }

        showModal('user-settings-modal');
    } catch (error) {
        console.error('鏄剧ず璐︽埛璁剧疆妯℃€佹鍑洪敊:', error);
    }
}

// 妫€鏌ョ敤鎴锋槸鍚﹀凡鐧诲綍鐨勫伐鍏峰嚱鏁?function isUserLoggedIn() {
    return !!currentUser;
}

// 鍩轰簬鐢ㄦ埛璁よ瘉鐘舵€佺殑鏉冮檺鎺у埗鍑芥暟
function checkUserPermission(requiredPermission) {
    // 濡傛灉闇€瑕佺櫥褰曚絾鐢ㄦ埛鏈櫥褰?    if (requiredPermission === 'logged_in' && !isUserLoggedIn()) {
        return false;
    }
    // 杩欓噷鍙互鎵╁睍鏇村鏉冮檺妫€鏌ワ紝濡傜鐞嗗憳鏉冮檺绛?    return true;
}

// 鏍煎紡鍖栨棩鏈?function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('鏃ユ湡鏍煎紡鍖栧嚭閿?', error);
        return '鏈煡';
    }
}

// 鍒涘缓浣滃搧璇︽儏妯℃€佹
function createWorkDetailModal() {
    try {
        // 妫€鏌ユ槸鍚﹀凡瀛樺湪
        if (!document.getElementById('work-detail-modal')) {
            const modalHTML = `
            <div id="work-detail-modal" class="modal" style="display: none;" aria-hidden="true" role="dialog" aria-labelledby="work-detail-title">
                <div class="modal-content work-detail-content">
                    <div class="modal-header">
                        <h3 id="work-detail-title" class="modal-title">浣滃搧璇︽儏</h3>
                        <button id="close-work-modal-x" class="close-modal-x" aria-label="鍏抽棴">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="work-detail-wrapper">
                            <div class="work-detail-image">
                                <img id="work-detail-img" src="" alt="浣滃搧鍥剧墖" loading="lazy">
                            </div>
                            <div class="work-detail-info">
                                <div class="work-detail-description-container">
                                    <h4>浣滃搧鎻忚堪</h4>
                                    <p id="work-detail-description" class="description-text">浣滃搧鎻忚堪</p>
                                </div>
                                <div class="work-detail-meta">
                                    <div class="meta-item">
                                        <span class="meta-label">璁捐甯?</span>
                                        <span id="work-detail-designer" class="meta-value">鏈煡</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">鍒涘缓鏃堕棿:</span>
                                        <span id="work-detail-date" class="meta-value">鏈煡</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">璁捐椋庢牸:</span>
                                        <span id="work-detail-style" class="meta-value">鏈煡</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">绌洪棿绫诲瀷:</span>
                                        <span id="work-detail-category" class="meta-value">鏈煡</span>
                                    </div>
                                    <div class="meta-item">
                                        <span class="meta-label">鐘舵€?</span>
                                        <span id="work-detail-status" class="meta-value status-badge status-public">鍏紑</span>
                                    </div>
                                </div>
                                <!-- 鎿嶄綔鎸夐挳鍖哄煙锛屾牴鎹敤鎴锋潈闄愭樉绀?-->
                                <div id="work-actions" class="work-actions">
                                    <button id="edit-work-btn" class="work-action-btn edit-btn glass-button" style="display: none;">
                                        <span class="btn-icon">鉁忥笍</span> 缂栬緫浣滃搧
                                    </button>
                                    <button id="delete-work-btn" class="work-action-btn delete-btn glass-button" style="display: none;">
                                        <span class="btn-icon">馃棏锔?/span> 鍒犻櫎浣滃搧
                                    </button>
                                    <button id="toggle-visibility-btn" class="work-action-btn toggle-btn glass-button" style="display: none;">
                                        <span class="btn-icon">馃憗锔?/span> 闅愯棌浣滃搧
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="close-work-modal" class="close-modal-btn glass-button">鍏抽棴</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
        
        return document.getElementById('work-detail-modal');
    } catch (error) {
        console.error('鍒涘缓浣滃搧璇︽儏妯℃€佹鍑洪敊:', error);
        return null;
    }
}

// 鏍规嵁ID鑾峰彇浣滃搧璇︽儏
async function getWorkById(workId) {
    try {
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const foundSaved = saved.find(w => w.id === workId);
        if (foundSaved) return foundSaved;
        const mockWorks = getMockWorks();
        return mockWorks.find(work => work.id === workId) || null;
    } catch (error) {
        console.error('鑾峰彇浣滃搧璇︽儏澶辫触:', error);
        
        // 浣跨敤妯℃嫙鏁版嵁浣滀负澶囦唤
        const mockWorks = getMockWorks();
        return mockWorks.find(work => work.id === workId) || null;
    }
}

// 鏄剧ず浣滃搧璇︽儏
async function showWorkDetails(workId, workData = null) {
    try {
        // 鍒涘缓鎴栬幏鍙栨ā鎬佹
        const modal = createWorkDetailModal();
        if (!modal) return;
        
        // 鑾峰彇妯℃€佹鍏冪礌
        const titleElement = document.getElementById('work-detail-title');
        const imgElement = document.getElementById('work-detail-img');
        const descElement = document.getElementById('work-detail-description');
        const designerElement = document.getElementById('work-detail-designer');
        const dateElement = document.getElementById('work-detail-date');
        const styleElement = document.getElementById('work-detail-style');
        const categoryElement = document.getElementById('work-detail-category');
        const statusElement = document.getElementById('work-detail-status');
        
        // 鏄剧ず鍔犺浇鐘舵€?        titleElement.textContent = '鍔犺浇涓?..';
        descElement.textContent = '姝ｅ湪鍔犺浇浣滃搧淇℃伅锛岃绋嶅€?..';
        imgElement.src = '';
        
        // 濡傛灉娌℃湁鎻愪緵workData锛屽垯寮傛鑾峰彇
        if (!workData) {
            workData = await getWorkById(workId);
            
            if (!workData) {
                titleElement.textContent = '閿欒';
                descElement.textContent = '浣滃搧涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎';
                showModal('work-detail-modal');
                return;
            }
        }
        
        // 濉厖浣滃搧鏁版嵁
        titleElement.textContent = workData.title || '浣滃搧璇︽儏';
        imgElement.src = workData.image_url || workData.image || 'https://picsum.photos/seed/default/800/600';
        descElement.textContent = workData.description || '鏆傛棤鎻忚堪';
        designerElement.textContent = workData.designer || 'Dimension Space 璁捐鍥㈤槦';
        dateElement.textContent = workData.created_at ? formatDate(workData.created_at) : (workData.date || new Date().toLocaleDateString());
        styleElement.textContent = workData.style || '鐜颁唬椋庢牸';
        categoryElement.textContent = workData.category || '鏈煡绫诲瀷';
        
        // 鏇存柊鐘舵€佹樉绀?        const isHidden = workData.is_hidden || workData.isHidden;
        statusElement.textContent = isHidden ? '宸查殣钘? : '鍏紑';
        statusElement.className = isHidden ? 'meta-value status-badge status-hidden' : 'meta-value status-badge status-public';
        
        // 鏍规嵁鐢ㄦ埛鏉冮檺鏄剧ず鎿嶄綔鎸夐挳
        const editBtn = document.getElementById('edit-work-btn');
        const deleteBtn = document.getElementById('delete-work-btn');
        const toggleBtn = document.getElementById('toggle-visibility-btn');
        
        const canManage = isUserLoggedIn() && (!workData.user_id || checkUserPermission(workData.user_id));
        
        if (canManage) {
            // 鏈夋潈闄愮殑鐢ㄦ埛鍙互鐪嬪埌鎿嶄綔鎸夐挳
            if (editBtn) editBtn.style.display = 'inline-block';
            if (deleteBtn) deleteBtn.style.display = 'inline-block';
            if (toggleBtn) {
                toggleBtn.style.display = 'inline-block';
                toggleBtn.textContent = isHidden ? '馃憗锔?鏄剧ず浣滃搧' : '馃憗锔?闅愯棌浣滃搧';
            }
        } else {
            // 鏃犳潈闄愮殑鐢ㄦ埛闅愯棌鎿嶄綔鎸夐挳
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'none';
        }
        
        // 娣诲姞鎿嶄綔鎸夐挳浜嬩欢鐩戝惉
        if (editBtn && canManage) {
            editBtn.onclick = function() {
                openEditWorkModal(workId, workData);
            };
        }
        
        if (deleteBtn && canManage) {
            deleteBtn.onclick = function() {
                if (confirm('纭畾瑕佸垹闄よ繖涓綔鍝佸悧锛熸鎿嶄綔涓嶅彲鎾ら攢銆?)) {
                    deleteWork(workId).then(() => {
                        hideModal('work-detail-modal');
                        // 瀹為檯瀹炵幇鏃讹紝杩欓噷搴旇鍒锋柊浣滃搧鍒楄〃
                    });
                }
            };
        }
        
        if (toggleBtn && canManage) {
            toggleBtn.onclick = function() {
                const newHiddenState = !isHidden;
                toggleWorkVisibility(workId, newHiddenState).then(() => {
                    // 鏇存柊UI鐘舵€?                    workData.is_hidden = newHiddenState;
                    workData.isHidden = newHiddenState;
                    statusElement.textContent = newHiddenState ? '宸查殣钘? : '鍏紑';
                    statusElement.className = newHiddenState ? 'meta-value status-badge status-hidden' : 'meta-value status-badge status-public';
                    toggleBtn.textContent = newHiddenState ? '馃憗锔?鏄剧ず浣滃搧' : '馃憗锔?闅愯棌浣滃搧';
                });
            };
        }
        
        // 鏄剧ず妯℃€佹
        showModal('work-detail-modal');
        
        // 鍏抽棴鎸夐挳浜嬩欢
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
        
        // 娣诲姞ESC閿叧闂姛鑳?        function handleEscKey(event) {
            if (event.key === 'Escape') {
                hideModal('work-detail-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        document.addEventListener('keydown', handleEscKey);
        
        // 鐐瑰嚮妯℃€佹澶栭儴鍏抽棴
        modal.onclick = function(event) {
            if (event.target === modal) {
                hideModal('work-detail-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        };
    } catch (error) {
        console.error('鏄剧ず浣滃搧璇︽儏鍑洪敊:', error);
    }
}

// 鍒涘缓缂栬緫浣滃搧妯℃€佹
function createEditWorkModal() {
    try {
        // 妫€鏌ユ槸鍚﹀凡瀛樺湪
        if (!document.getElementById('edit-work-modal')) {
            const modalHTML = `
            <div id="edit-work-modal" class="modal" style="display: none;" aria-hidden="true" role="dialog" aria-labelledby="edit-work-title">
                <div class="modal-content edit-work-content">
                    <div class="modal-header">
                        <h3 id="edit-work-title" class="modal-title">缂栬緫浣滃搧</h3>
                        <button id="close-edit-modal-x" class="close-modal-x" aria-label="鍏抽棴">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-work-form" class="work-form">
                            <input type="hidden" id="edit-work-id" value="">
                            <div class="form-group">
                                <label for="edit-work-title-input" class="required-field">浣滃搧鏍囬</label>
                                <input type="text" id="edit-work-title-input" class="form-control" required placeholder="璇疯緭鍏ヤ綔鍝佹爣棰?>
                                <div class="error-message" id="edit-work-title-error"></div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="edit-work-style" class="required-field">璁捐椋庢牸</label>
                                    <select id="edit-work-style" class="form-control" required>
                                        <option value="">璇烽€夋嫨璁捐椋庢牸</option>
                                        <option value="鏋佺畝涓讳箟">鏋佺畝涓讳箟</option>
                                        <option value="瑁呴グ椋庢牸">瑁呴グ椋庢牸</option>
                                        <option value="宸ヤ笟椋?>宸ヤ笟椋?/option>
                                        <option value="鍖楁椋庢牸">鍖楁椋庢牸</option>
                                        <option value="涓紡椋庢牸">涓紡椋庢牸</option>
                                        <option value="鏃ュ紡椋庢牸">鏃ュ紡椋庢牸</option>
                                        <option value="鐜颁唬椋庢牸">鐜颁唬椋庢牸</option>
                                        <option value="杞诲ア椋庢牸">杞诲ア椋庢牸</option>
                                    </select>
                                    <div class="error-message" id="edit-work-style-error"></div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="edit-work-category" class="required-field">绌洪棿绫诲瀷</label>
                                    <select id="edit-work-category" class="form-control" required>
                                        <option value="">璇烽€夋嫨绌洪棿绫诲瀷</option>
                                        <option value="瀹㈠巺">瀹㈠巺</option>
                                        <option value="鍗у">鍗у</option>
                                        <option value="鍘ㄦ埧">鍘ㄦ埧</option>
                                        <option value="娴村">娴村</option>
                                        <option value="涔︽埧">涔︽埧</option>
                                        <option value="椁愬巺">椁愬巺</option>
                                        <option value="鍎跨鎴?>鍎跨鎴?/option>
                                        <option value="鍔炲叕瀹?>鍔炲叕瀹?/option>
                                    </select>
                                    <div class="error-message" id="edit-work-category-error"></div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="edit-work-description">浣滃搧鎻忚堪</label>
                                <textarea id="edit-work-description" class="form-control" rows="4" placeholder="璇疯緭鍏ヤ綔鍝佹弿杩?></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-edit-btn" class="glass-button">鍙栨秷</button>
                        <button id="save-edit-btn" class="glass-button primary-button">淇濆瓨淇敼</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // 娣诲姞琛ㄥ崟楠岃瘉
            const form = document.getElementById('edit-work-form');
            if (form) {
                form.addEventListener('input', function(e) {
                    if (e.target.hasAttribute('required')) {
                        const errorElement = document.getElementById(`${e.target.id}-error`);
                        if (errorElement) {
                            if (e.target.value.trim() === '') {
                                errorElement.textContent = '姝ゅ瓧娈典负蹇呭～椤?;
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
        console.error('鍒涘缓缂栬緫浣滃搧妯℃€佹鍑洪敊:', error);
        return null;
    }
}

// 鎵撳紑缂栬緫浣滃搧妯℃€佹
function openEditWorkModal(workId, workData) {
    try {
        // 鍒涘缓鎴栬幏鍙栫紪杈戞ā鎬佹
        const editModal = createEditWorkModal();
        if (!editModal) return;
        
        // 鑾峰彇琛ㄥ崟鍏冪礌
        const form = document.getElementById('edit-work-form');
        const workIdInput = document.getElementById('edit-work-id');
        const titleInput = document.getElementById('edit-work-title-input');
        const styleSelect = document.getElementById('edit-work-style');
        const categorySelect = document.getElementById('edit-work-category');
        const descriptionTextarea = document.getElementById('edit-work-description');
        
        // 娓呯┖閿欒淇℃伅
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(el => el.textContent = '');
        
        // 濉厖琛ㄥ崟鏁版嵁
        if (workIdInput) workIdInput.value = workId;
        if (titleInput) titleInput.value = workData.title || '';
        if (styleSelect) styleSelect.value = workData.style || '';
        if (categorySelect) categorySelect.value = workData.category || '';
        if (descriptionTextarea) descriptionTextarea.value = workData.description || '';
        
        // 鏄剧ず缂栬緫妯℃€佹
        showModal('edit-work-modal');
        
        // 鍙栨秷鎸夐挳浜嬩欢
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.onclick = function() {
                hideModal('edit-work-modal');
            };
        }
        
        // 鍏抽棴鎸夐挳浜嬩欢
        const closeModalXBtn = document.getElementById('close-edit-modal-x');
        if (closeModalXBtn) {
            closeModalXBtn.onclick = function() {
                hideModal('edit-work-modal');
            };
        }
        
        // 淇濆瓨鎸夐挳浜嬩欢
        const saveBtn = document.getElementById('save-edit-btn');
        if (saveBtn) {
            saveBtn.onclick = async function() {
                // 琛ㄥ崟楠岃瘉
                let isValid = true;
                
                // 楠岃瘉蹇呭～瀛楁
                if (titleInput && titleInput.value.trim() === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-title-input-error');
                    if (errorElement) errorElement.textContent = '璇疯緭鍏ヤ綔鍝佹爣棰?;
                }
                
                if (styleSelect && styleSelect.value === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-style-error');
                    if (errorElement) errorElement.textContent = '璇烽€夋嫨璁捐椋庢牸';
                }
                
                if (categorySelect && categorySelect.value === '') {
                    isValid = false;
                    const errorElement = document.getElementById('edit-work-category-error');
                    if (errorElement) errorElement.textContent = '璇烽€夋嫨绌洪棿绫诲瀷';
                }
                
                if (!isValid) return;
                
                // 鏀堕泦琛ㄥ崟鏁版嵁
                const updatedData = {
                    title: titleInput ? titleInput.value.trim() : '',
                    style: styleSelect ? styleSelect.value : '',
                    category: categorySelect ? categorySelect.value : '',
                    description: descriptionTextarea ? descriptionTextarea.value.trim() : ''
                };
                
                try {
                    // 淇濆瓨淇敼
                    await updateWork(workId, updatedData);
                    
                    // 闅愯棌缂栬緫妯℃€佹
                    hideModal('edit-work-modal');
                    
                    // 鍒锋柊浣滃搧璇︽儏
                    const detailModal = document.getElementById('work-detail-modal');
                    if (detailModal && detailModal.style.display === 'block') {
                        showWorkDetails(workId);
                    }
                } catch (error) {
                    console.error('淇濆瓨浣滃搧淇敼澶辫触:', error);
                    alert('淇濆瓨淇敼澶辫触锛岃绋嶅悗閲嶈瘯');
                }
            };
        }
        
        // 娣诲姞ESC閿叧闂姛鑳?        function handleEscKey(event) {
            if (event.key === 'Escape') {
                hideModal('edit-work-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        }
        
        document.addEventListener('keydown', handleEscKey);
        
        // 鐐瑰嚮妯℃€佹澶栭儴鍏抽棴
        editModal.onclick = function(event) {
            if (event.target === editModal) {
                hideModal('edit-work-modal');
                document.removeEventListener('keydown', handleEscKey);
            }
        };
    } catch (error) {
        console.error('鎵撳紑缂栬緫浣滃搧妯℃€佹鍑洪敊:', error);
    }
}

// 涓轰綔鍝侀」娣诲姞鐐瑰嚮浜嬩欢
function setupWorkItemClickEvents() {
    try {
        const workItems = document.querySelectorAll('.work-item');
        
        workItems.forEach((item, index) => {
            // 闃叉閲嶅娣诲姞浜嬩欢
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            newItem.addEventListener('click', function() {
                // 鑾峰彇浣滃搧鏁版嵁锛堣繖閲屼娇鐢ㄦā鎷熸暟鎹紝瀹為檯搴斾粠鏁版嵁搴撹幏鍙栵級
                const workImages = [
                    'images/minimalist-livingroom.jpg',
                    'images/decorative-livingroom.jpg', 
                    'images/industrial-kitchen.jpg',
                    'images/scandinavian-bedroom.jpg'
                ];
                
                const workTitles = [
                    '鏋佺畝涓讳箟瀹㈠巺',
                    '瑁呴グ椋庢牸瀹㈠巺',
                    '宸ヤ笟椋庡帹鎴?,
                    '鍖楁椋庢牸鍗у'
                ];
                
                const workDescriptions = [
                    '绠€绾﹁€屼笉绠€鍗曠殑璁捐鐞嗗康锛岄€氳繃绾挎潯銆佽壊褰╁拰绌洪棿鐨勫阀濡欒繍鐢紝鎵撻€犲嚭鑸掗€傚疁浜虹殑鐢熸椿鐜銆傜暀鐧界殑鑹烘湳鍦ㄨ繖閲屽緱鍒颁簡瀹岀編璇犻噴锛岃姣忎竴浠跺鍏烽兘鎴愪负绌洪棿鐨勭劍鐐广€?,
                    '鍗庝附鐨勮楗板厓绱犱笌绮捐嚧鐨勭粏鑺傦紝钀ラ€犱紭闆呴珮璐电殑绌洪棿姘涘洿銆傞噾鑹茬嚎鏉°€侀洉鑺辫楗板拰璐ㄦ劅鍗佽冻鐨勯潰鏂欏叡鍚屾墦閫犲嚭涓€涓厖婊¤壓鏈皵鎭殑鐢熸椿绌洪棿銆?,
                    '绮楃姺涓庣簿鑷寸殑纰版挒锛屾墦閫犵嫭鐗逛釜鎬х殑鐑归オ绌洪棿銆傝８闇茬殑閲戝睘绠￠亾涓庡疄鏈ㄦ┍鏌滃舰鎴愰矞鏄庡姣旓紝鏃繚鐣欎簡宸ヤ笟椋庢牸鐨勫師濮嬫劅锛屽張涓嶅け瀹炵敤鎬у拰缇庤搴︺€?,
                    '杞荤泩閫氶€忕殑璁捐锛岃嚜鐒跺厜绾夸笌绠€绾﹀鍏风殑瀹岀編缁撳悎銆傛祬鑹叉湪璐ㄥ湴鏉裤€佺櫧鑹插闈㈠拰娴呯伆鑹插鍏峰叡鍚岃惀閫犲嚭涓€涓共鍑€銆佹槑浜€佽垝閫傜殑鐫＄湢鐜銆?
                ];
                
                const workData = {
                    id: `work-${index + 1}`,
                    title: workTitles[index] || '璁捐浣滃搧',
                    description: workDescriptions[index] || '鏆傛棤璇︾粏鎻忚堪',
                    image: workImages[index] || 'https://picsum.photos/seed/default/800/600',
                    designer: 'Dimension Space 璁捐鍥㈤槦',
                    date: '2024-01-15',
                    style: ['鏋佺畝涓讳箟', '瑁呴グ椋庢牸', '宸ヤ笟椋?, '鍖楁椋庢牸'][index] || '鐜颁唬椋庢牸',
                    isHidden: false
                };
                
                showWorkDetails(workData.id, workData);
            });
        });
    } catch (error) {
        console.error('璁剧疆浣滃搧椤圭偣鍑讳簨浠跺嚭閿?', error);
    }
}

// 鏁版嵁搴撹〃缁撴瀯璁捐 - 浣滃搧绠＄悊鐩稿叧
/******************************************************************
 * 浠ヤ笅鏄缓璁殑鏁版嵁搴撹〃缁撴瀯锛堝凡杩佺Щ鍒版湰鍦癝QLite锛?
 ******************************************************************/

/*
-- 鍒涘缓浣滃搧琛?CREATE TABLE works (
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

-- 鍒涘缓绱㈠紩浠ユ彁楂樻煡璇㈡€ц兘
CREATE INDEX idx_works_user_id ON works(user_id);
CREATE INDEX idx_works_is_hidden ON works(is_hidden);
CREATE INDEX idx_works_style ON works(style);

-- 鍒涘缓鏉冮檺绛栫暐锛屽厑璁哥敤鎴峰彧鎿嶄綔鑷繁鐨勪綔鍝?CREATE POLICY "User can view all public works" ON works
    FOR SELECT USING (is_hidden = FALSE);

CREATE POLICY "User can view their own works" ON works
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "User can create works" ON works
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update their own works" ON works
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User can delete their own works" ON works
    FOR DELETE USING (auth.uid() = user_id);

-- 鍒涘缓璇勮琛?CREATE TABLE work_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 鍒涘缓浣滃搧鏀惰棌琛?CREATE TABLE work_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_id UUID REFERENCES works(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(work_id, user_id)  -- 纭繚涓€涓敤鎴峰彧鑳芥敹钘忓悓涓€涓綔鍝佷竴娆?);
*/

// 鑾峰彇浣滃搧鏁版嵁鐨勫嚱鏁?- 鏀寔鐪熷疄鍜屾ā鎷熻繛鎺?async function fetchWorksFromDatabase() {
    try {
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const mocks = getMockWorks();
        return [...saved, ...mocks];
    } catch {
        return getMockWorks();
    }
}

// 鑾峰彇妯℃嫙浣滃搧鏁版嵁鐨勫嚱鏁?function getMockWorks() {
    return [
        {
            id: 'work-1',
            title: '鏋佺畝涓讳箟瀹㈠巺',
            description: '绠€绾﹁€屼笉绠€鍗曠殑璁捐鐞嗗康锛岄€氳繃绾挎潯銆佽壊褰╁拰绌洪棿鐨勫阀濡欒繍鐢紝鎵撻€犲嚭鑸掗€傚疁浜虹殑鐢熸椿鐜銆傜暀鐧界殑鑹烘湳鍦ㄨ繖閲屽緱鍒颁簡瀹岀編璇犻噴锛岃姣忎竴浠跺鍏烽兘鎴愪负绌洪棿鐨勭劍鐐广€?,
            image_url: 'images/minimalist-livingroom.jpg',
            thumbnail_url: 'images/minimalist-livingroom.jpg',
            style: '鏋佺畝涓讳箟',
            designer: 'Dimension Space 璁捐鍥㈤槦',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '瀹㈠巺'
        },
        {
            id: 'work-2',
            title: '瑁呴グ椋庢牸瀹㈠巺',
            description: '鍗庝附鐨勮楗板厓绱犱笌绮捐嚧鐨勭粏鑺傦紝钀ラ€犱紭闆呴珮璐电殑绌洪棿姘涘洿銆傞噾鑹茬嚎鏉°€侀洉鑺辫楗板拰璐ㄦ劅鍗佽冻鐨勯潰鏂欏叡鍚屾墦閫犲嚭涓€涓厖婊¤壓鏈皵鎭殑鐢熸椿绌洪棿銆?,
            image_url: 'images/decorative-livingroom.jpg',
            thumbnail_url: 'images/decorative-livingroom.jpg',
            style: '瑁呴グ椋庢牸',
            designer: 'Dimension Space 璁捐鍥㈤槦',
            created_at: '2024-01-16T00:00:00Z',
            updated_at: '2024-01-16T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '瀹㈠巺'
        },
        {
            id: 'work-3',
            title: '宸ヤ笟椋庡帹鎴?,
            description: '绮楃姺涓庣簿鑷寸殑纰版挒锛屾墦閫犵嫭鐗逛釜鎬х殑鐑归オ绌洪棿銆傝８闇茬殑閲戝睘绠￠亾涓庡疄鏈ㄦ┍鏌滃舰鎴愰矞鏄庡姣旓紝鏃繚鐣欎簡宸ヤ笟椋庢牸鐨勫師濮嬫劅锛屽張涓嶅け瀹炵敤鎬у拰缇庤搴︺€?,
            image_url: 'images/industrial-kitchen.jpg',
            thumbnail_url: 'images/industrial-kitchen.jpg',
            style: '宸ヤ笟椋?,
            designer: 'Dimension Space 璁捐鍥㈤槦',
            created_at: '2024-01-17T00:00:00Z',
            updated_at: '2024-01-17T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '鍘ㄦ埧'
        },
        {
            id: 'work-4',
            title: '鍖楁椋庢牸鍗у',
            description: '杞荤泩閫氶€忕殑璁捐锛岃嚜鐒跺厜绾夸笌绠€绾﹀鍏风殑瀹岀編缁撳悎銆傛祬鑹叉湪璐ㄥ湴鏉裤€佺櫧鑹插闈㈠拰娴呯伆鑹插鍏峰叡鍚岃惀閫犲嚭涓€涓共鍑€銆佹槑浜€佽垝閫傜殑鐫＄湢鐜銆?,
            image_url: 'images/scandinavian-bedroom.jpg',
            thumbnail_url: 'images/scandinavian-bedroom.jpg',
            style: '鍖楁椋庢牸',
            designer: 'Dimension Space 璁捐鍥㈤槦',
            created_at: '2024-01-18T00:00:00Z',
            updated_at: '2024-01-18T00:00:00Z',
            is_hidden: false,
            user_id: null,
            category: '鍗у'
        }
    ];
}

// 淇濆瓨浣滃搧鍒版暟鎹簱鐨勫嚱鏁帮紙妯℃嫙瀹炵幇锛?async function saveWorkToDatabase(workData) {
    try {
        if (!currentUser) {
            return { success: false, error: '鐢ㄦ埛鏈櫥褰? };
        }
        
        // 鏁版嵁楠岃瘉
        if (!workData.title || !workData.image) {
            return { success: false, error: '鏍囬鍜屽浘鐗囨槸蹇呭～椤? };
        }
        
        // 鏄剧ず缁熶竴鐨勫姞杞界姸鎬佹寚绀哄櫒
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
        console.error('淇濆瓨浣滃搧鍑洪敊:', error);
        // 纭繚鍦ㄩ敊璇儏鍐典笅涔熼殣钘忓姞杞芥寚绀哄櫒
        hideLoadingIndicator();
        return { success: false, error: '绯荤粺閿欒锛? + error.message };
    }
}

// 鍒犻櫎浣滃搧鍑芥暟
async function deleteWork(workId) {
    try {
        if (!currentUser) {
            alert('鎮ㄩ渶瑕佺櫥褰曟墠鑳藉垹闄や綔鍝?);
            return;
        }
        
        if (!confirm(`纭畾瑕佸垹闄や綔鍝?${workId} 鍚楋紵姝ゆ搷浣滀笉鍙挙閿€銆俙)) {
            return;
        }
        
        try {
            showLoadingIndicator();
            const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
            const filtered = saved.filter(w => w.id !== workId);
            localStorage.setItem('user_works', JSON.stringify(filtered));
            alert(`浣滃搧 ${workId} 宸叉垚鍔熷垹闄わ紒`);
        } finally {
            hideLoadingIndicator();
        }
        
        // 鍒锋柊浣滃搧鍒楄〃
        if (typeof refreshWorksList === 'function') {
            await refreshWorksList();
        }
    } catch (error) {
        console.error('鍒犻櫎浣滃搧鍑洪敊:', error);
        // 纭繚鍦ㄩ敊璇儏鍐典笅涔熼殣钘忓姞杞芥寚绀哄櫒
        hideLoadingIndicator();
        alert('鍒犻櫎浣滃搧澶辫触锛岃绋嶅悗閲嶈瘯');
    }
}

// 鍒囨崲浣滃搧鍙鎬у嚱鏁?async function toggleWorkVisibility(workId, isHidden) {
    try {
        // 娣诲姞纭瀵硅瘽妗?        if (!confirm(`纭畾瑕?{isHidden ? '闅愯棌' : '鏄剧ず'}璇ヤ綔鍝佸悧锛焋)) {
            return;
        }
        if (!currentUser) {
            alert('鎮ㄩ渶瑕佺櫥褰曟墠鑳戒慨鏀逛綔鍝佺姸鎬?);
            return;
        }
        try {
            showLoadingIndicator();
            const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
            const updated = saved.map(w => w.id === workId ? { ...w, is_hidden: isHidden, updated_at: new Date().toISOString() } : w);
            localStorage.setItem('user_works', JSON.stringify(updated));
            alert(`浣滃搧宸叉垚鍔?{isHidden ? '闅愯棌' : '鏄剧ず'}锛乣);
            if (typeof refreshWorksList === 'function') await refreshWorksList();
        } finally {
            hideLoadingIndicator();
        }
    } catch (error) {
        console.error('鍒囨崲浣滃搧鍙鎬у嚭閿?', error);
        // 纭繚鍦ㄩ敊璇儏鍐典笅涔熼殣钘忓姞杞芥寚绀哄櫒
        hideLoadingIndicator();
        alert(`鎿嶄綔澶辫触: ${error.message || '璇风◢鍚庨噸璇?}`);
    }
}

// 鏇存柊浣滃搧淇℃伅鍑芥暟
async function updateWork(workId, updatedData) {
    try {
        if (!currentUser) {
            alert('鎮ㄩ渶瑕佺櫥褰曟墠鑳界紪杈戜綔鍝?);
            return;
        }
        showLoadingIndicator();
        const saved = JSON.parse(localStorage.getItem('user_works') || '[]');
        const updated = saved.map(w => w.id === workId ? { ...w, ...updatedData, updated_at: new Date().toISOString() } : w);
        localStorage.setItem('user_works', JSON.stringify(updated));
        alert(`浣滃搧 ${workId} 宸叉洿鏂帮紒`);
        if (typeof refreshWorksList === 'function') await refreshWorksList();
    } catch (error) {
        console.error('鏇存柊浣滃搧鍑洪敊:', error);
        alert('鏇存柊浣滃搧澶辫触锛岃绋嶅悗閲嶈瘯');
    } finally {
        // 闅愯棌鍔犺浇鐘舵€佹寚绀哄櫒
        hideLoadingIndicator();
    }
}

// 鍒涘缓寰俊浜岀淮鐮佹皵娉★紙淇鐗堟湰锛?function createWechatQrCodeBubble() {
    try {
        const wechatLink = document.getElementById('wechat-link');
        if (!wechatLink) return;
        let bubble = document.getElementById('wechat-qrcode-bubble');
        if (bubble) bubble.remove();
        bubble = document.createElement('div');
        bubble.id = 'wechat-qrcode-bubble';
        bubble.className = 'qrcode-bubble';
        bubble.innerHTML = "<div class='qrcode-content'><img src=\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' fill='white'/><rect x='8' y='8' width='28' height='28' fill='black'/><rect x='16' y='16' width='12' height='12' fill='white'/><rect x='84' y='8' width='28' height='28' fill='black'/><rect x='92' y='16' width='12' height='12' fill='white'/><rect x='8' y='84' width='28' height='28' fill='black'/><rect x='16' y='92' width='12' height='12' fill='white'/><rect x='44' y='44' width='12' height='12' fill='black'/><rect x='64' y='44' width='8' height='8' fill='black'/><rect x='52' y='64' width='10' height='10' fill='black'/><rect x='72' y='72' width='14' height='14' fill='black'/></svg>\" alt='寰俊浜岀淮鐮? class='qrcode-image'><p class='qrcode-text'>鎵爜娣诲姞寰俊</p></div><div class=\"bubble-arrow\"></div>";
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
        console.error('鍒涘缓寰俊浜岀淮鐮佹皵娉″嚭閿?', error);
    }
}

// 鍒涘缓榛樿鏈嶅姟妯℃€佹锛堜綔涓哄浠斤級
function createDefaultServicesModal() {
    try {
        const modalHTML = `
        <div id="services-modal" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>鎴戜滑鐨勬湇鍔?/h3>
                <div class="services-content">
                    <div class="service-item">
                        <h4>瀹ゅ唴璁捐</h4>
                        <p>涓撲笟鐨勫鍐呰璁″洟闃燂紝涓烘偍鎵撻€犺垝閫傘€佺編瑙傜殑鐢熸椿绌洪棿銆?/p>
                    </div>
                    <div class="service-item">
                        <h4>绌洪棿瑙勫垝</h4>
                        <p>绉戝鍚堢悊鐨勭┖闂磋鍒掞紝鏈€澶у寲鍒╃敤姣忎竴瀵哥┖闂淬€?/p>
                    </div>
                    <div class="service-item">
                        <h4>瑁呬慨鏂藉伐</h4>
                        <p>涓ユ牸鐨勬柦宸ユ爣鍑嗭紝纭繚宸ョ▼璐ㄩ噺鍜岃繘搴︺€?/p>
                    </div>
                </div>
                <button id="close-services-modal" class="close-modal-btn glass-button">鍏抽棴</button>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 娣诲姞鍏抽棴浜嬩欢
        const closeBtn = document.getElementById('close-services-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hideModal('services-modal');
            });
        }
        
        console.log('鍒涘缓浜嗛粯璁ゆ湇鍔℃ā鎬佹');
    } catch (error) {
        console.error('鍒涘缓榛樿鏈嶅姟妯℃€佹鍑洪敊:', error);
    }
}

// 瀵艰埅鏍忔粴鍔ㄦ晥鏋?window.addEventListener('scroll', function() {
    try {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 10);
        }
    } catch (error) {
        console.error('瀵艰埅鏍忔粴鍔ㄦ晥鏋滃嚭閿?', error);
    }
}, { passive: true });

// 澶勭悊鑱旂郴琛ㄥ崟鎻愪氦
async function handleContactFormSubmit(event) {
    event.preventDefault();
    
    // 鑾峰彇琛ㄥ崟鏁版嵁
    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const message = document.getElementById('contact-message').value;
    
    // 绠€鍗曢獙璇?    if (!name || !phone || !message) {
        alert('璇峰～鍐欐墍鏈夊繀濉瓧娈?);
        return;
    }
    
    // 鏄剧ず鍔犺浇鐘舵€佹寚绀哄櫒
    showLoadingIndicator();
    
    try {
        const sb = getSupabaseClient();
        if (!sb) { alert('鏈嶅姟鏆備笉鍙敤锛岃绋嶅悗鍐嶈瘯'); return; }
        const u = await sb.auth.getUser();
        if (u.error || !u.data?.user?.email) { alert('璇峰厛鐧诲綍鍚庡啀鎻愪氦淇℃伅'); return; }
        const resp = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone, message, from: u.data.user.email }) });
        if (!resp.ok) { const j = await resp.json().catch(()=>({})); alert(j?.error || '鍙戦€佸け璐ワ紝璇风◢鍚庨噸璇?); return; }
        alert('宸插彂閫侊紝鎴戜滑浼氬敖蹇仈绯绘偍');
        event.target.reset();
    } finally {
        hideLoadingIndicator();
    }
}

// 鍒濆鍖栭〉闈?async function initPage() {
    showLoadingIndicator();
    try {
        console.log('寮€濮嬮〉闈㈠垵濮嬪寲...');
        
        // 鎭㈠鏈湴浼氳瘽
        const saved = loadSession();
        if (saved) { currentUser = saved; }
        // 鍒濆鍖栬璇佸姛鑳?        initAuth();
        
        // 鍒涘缓寰俊浜岀淮鐮佹皵娉★紙淇鐗堟湰锛?        createWechatQrCodeBubble();
        
        // 鍒濆鍖栫敤鎴风櫥褰曠姸鎬乁I
        updateUIForLoggedInState();
        
        // 鍒濆鍖栦綔鍝佺鐞嗗姛鑳?- 绛夊緟瀹屾垚
        await initWorksManagement();
        
        console.log('椤甸潰鍒濆鍖栧畬鎴?);
        
        // 1. 娴忚浣滃搧鎸夐挳 - 骞虫粦婊氬姩鍒扮簿閫変綔鍝佸尯鍩?        const browseWorksBtn = document.getElementById('browse-works-btn');
        if (browseWorksBtn) {
            // 绉婚櫎鍙兘瀛樺湪鐨勬棫浜嬩欢鐩戝惉鍣?            const newBrowseWorksBtn = browseWorksBtn.cloneNode(true);
            browseWorksBtn.parentNode.replaceChild(newBrowseWorksBtn, browseWorksBtn);
            
            newBrowseWorksBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('鐐瑰嚮浜嗘祻瑙堜綔鍝佹寜閽?);
                smoothScrollTo('works', 80); // 80px鐨勫亸绉婚噺锛岄伩鍏嶅鑸爮閬尅
            });
        }
        
        // 2. 浜嗚В鏈嶅姟鎸夐挳 - 鏄剧ず鏈嶅姟妯℃€佹
        const servicesBtn = document.getElementById('services-btn');
        const closeServicesModal = document.getElementById('close-services-modal');
        
        if (servicesBtn) {
            const newServicesBtn = servicesBtn.cloneNode(true);
            servicesBtn.parentNode.replaceChild(newServicesBtn, servicesBtn);
            
            newServicesBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('鐐瑰嚮浜嗕簡瑙ｆ湇鍔℃寜閽?);
                // 纭繚鏈嶅姟妯℃€佹瀛樺湪
                if (!document.getElementById('services-modal')) {
                    console.warn('鏈嶅姟妯℃€佹涓嶅瓨鍦紝鍒涘缓榛樿妯℃€佹');
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
        
        // 3. 鐧诲綍鎸夐挳 - 鏄剧ず鐧诲綍娉ㄥ唽妯℃€佹
        const loginBtn = document.getElementById('login-btn');
        
        if (loginBtn) {
            const newLoginBtn = loginBtn.cloneNode(true);
            loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
            
            newLoginBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('鐐瑰嚮浜嗙櫥褰曟寜閽?);
                showModal('auth-modal');
                setTimeout(() => attachLiquidGlassToAuthModal(), 0);
            });
        }
        
        // 4. 棰勭害鍜ㄨ鎸夐挳 - 骞虫粦婊氬姩鍒拌仈绯绘垜浠尯鍩?        const appointmentBtn = document.getElementById('appointment-btn');
        
        if (appointmentBtn) {
            const newAppointmentBtn = appointmentBtn.cloneNode(true);
            appointmentBtn.parentNode.replaceChild(newAppointmentBtn, appointmentBtn);
            
            newAppointmentBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('鐐瑰嚮浜嗛绾﹀挩璇㈡寜閽?);
                const nav = document.querySelector('.navbar');
                const offset = nav ? nav.getBoundingClientRect().height + 10 : 80;
                smoothScrollTo('contact', offset, () => highlightSection('contact'));
            });
        }
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            const dropdown = userAvatar.querySelector('.user-dropdown');
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userAvatar.classList.toggle('open');
                if (dropdown) dropdown.style.display = userAvatar.classList.contains('open') ? 'block' : 'none';
            });
            document.addEventListener('click', () => {
                userAvatar.classList.remove('open');
                if (dropdown) dropdown.style.display = 'none';
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
        console.error('椤甸潰鍒濆鍖栧嚭閿?', error);
        // 鏄剧ず閿欒淇℃伅
        alert('椤甸潰鍔犺浇澶辫触锛岃鍒锋柊椤甸潰閲嶈瘯');
    } finally {
        // 纭繚鏃犺鏄惁鍑洪敊閮介殣钘忓姞杞芥寚绀哄櫒锛岄伩鍏嶇櫧灞?        hideLoadingIndicator();
    }
}

// 鍒濆鍖栦綔鍝佺鐞嗗姛鑳?async function initWorksManagement() {
    try {
        // 鍒涘缓浣滃搧璇︽儏妯℃€佹
        createWorkDetailModal();
        
        // 鍒涘缓缂栬緫浣滃搧妯℃€佹
        createEditWorkModal();
        
        // 鍔犺浇骞舵樉绀轰綔鍝?        await loadAndDisplayWorks();
        
    } catch (error) {
        console.error('鍒濆鍖栦綔鍝佺鐞嗗姛鑳藉嚭閿?', error);
    }
}

// 鍔犺浇骞舵樉绀轰綔鍝?async function loadAndDisplayWorks() {
    try {
        console.log('寮€濮嬪姞杞戒綔鍝?..');
        
        // 鏄剧ず鍔犺浇鎸囩ず鍣?        showLoadingIndicator();
        
        let works = [];
        
        // 灏濊瘯浠庢暟鎹簱鑾峰彇浣滃搧
        try {
            works = await fetchWorksFromDatabase();
        } catch (dbError) {
            console.warn('鏁版嵁搴撳姞杞藉け璐ワ紝浣跨敤妯℃嫙鏁版嵁:', dbError);
            works = getMockWorks();
        }
        
        console.log('鑾峰彇鍒扮殑浣滃搧鏁伴噺:', works.length);
        
        // 鏄剧ず绮鹃€変綔鍝侊紙鍏紑鐨勪綔鍝侊級
        displayFeaturedWorks(works);
        
        // 濡傛灉鐢ㄦ埛宸茬櫥褰曪紝鏄剧ず鐢ㄦ埛鐨勬墍鏈変綔鍝侊紙鍖呮嫭闅愯棌鐨勶級
        if (isUserLoggedIn()) {
            displayUserWorks(works);
        }
        
        // 璁剧疆浣滃搧椤圭殑鐐瑰嚮浜嬩欢
        setupWorkItemClickEvents();
        
    } catch (error) {
        console.error('鍔犺浇浣滃搧鍑洪敊:', error);
        alert('鍔犺浇浣滃搧澶辫触锛岃绋嶅悗閲嶈瘯');
    } finally {
        // 闅愯棌鍔犺浇鎸囩ず鍣?        hideLoadingIndicator();
    }
}

// 鏄剧ず绮鹃€変綔鍝侊紙鍏紑鐘舵€佺殑浣滃搧锛?function displayFeaturedWorks(works) {
    try {
        // 绛涢€夊叕寮€鐘舵€佺殑浣滃搧
        const publicWorks = works.filter(work => !work.is_hidden);
        console.log('绛涢€夊嚭鐨勫叕寮€浣滃搧鏁伴噺:', publicWorks.length);
        
        // 鑾峰彇绮鹃€変綔鍝佸鍣?        const featuredWorksContainer = document.querySelector('#works .works-grid');
        if (!featuredWorksContainer) {
            console.warn('绮鹃€変綔鍝佸鍣ㄤ笉瀛樺湪');
            return;
        }
        
        // 娓呯┖瀹瑰櫒鍐呭
        featuredWorksContainer.innerHTML = '';
        
        // 濡傛灉娌℃湁鍏紑浣滃搧锛屾樉绀烘彁绀轰俊鎭?        if (publicWorks.length === 0) {
            featuredWorksContainer.innerHTML = `
                <div class="no-works-message">
                    <p>褰撳墠鏆傛棤绮鹃€変綔鍝?/p>
                    <p>鏁鏈熷緟鏇村绮惧僵鍐呭锛?/p>
                </div>
            `;
            return;
        }
        
        // 鍒涘缓骞舵坊鍔犱綔鍝侀」
        publicWorks.forEach(work => {
            const workItem = createWorkItem(work);
            featuredWorksContainer.appendChild(workItem);
        });
        
    } catch (error) {
        console.error('鏄剧ず绮鹃€変綔鍝佸嚭閿?', error);
    }
}

// 鏄剧ず鐢ㄦ埛浣滃搧锛堝寘鎷殣钘忕殑锛?function displayUserWorks(works) {
    try {
        // 妫€鏌ョ敤鎴蜂綔鍝佸鍣ㄦ槸鍚﹀瓨鍦紝濡傛灉涓嶅瓨鍦ㄥ垯鍒涘缓
        let userWorksSection = document.getElementById('user-works');
        if (!userWorksSection) {
            // 鍒涘缓鐢ㄦ埛浣滃搧鍖哄煙
            userWorksSection = document.createElement('section');
            userWorksSection.id = 'user-works';
            userWorksSection.className = 'works-section user-works-section';
            
            userWorksSection.innerHTML = `
                <h2 class="section-title">鎴戠殑浣滃搧</h2>
                <div class="works-grid works-list"></div>
            `;
            
            // 鎻掑叆鍒扮簿閫変綔鍝佸尯鍩熶箣鍚?            const worksSection = document.getElementById('works');
            if (worksSection) {
                worksSection.after(userWorksSection);
            }
        }
        
        // 绛涢€夊綋鍓嶇敤鎴风殑浣滃搧
        const userWorks = works.filter(work => work.user_id === currentUser.id);
        console.log('鐢ㄦ埛浣滃搧鏁伴噺:', userWorks.length);
        
        // 鏇存柊瀹瑰櫒鏍囬
        const userWorksTitle = userWorksSection.querySelector('.section-title');
        if (userWorksTitle) {
            userWorksTitle.textContent = `鎴戠殑浣滃搧 (${userWorks.length})`;
        }
        
        // 鑾峰彇浣滃搧鍒楄〃瀹瑰櫒
        const worksListContainer = userWorksSection.querySelector('.works-list');
        if (!worksListContainer) {
            console.warn('浣滃搧鍒楄〃瀹瑰櫒涓嶅瓨鍦?);
            return;
        }
        
        // 娓呯┖瀹瑰櫒鍐呭
        worksListContainer.innerHTML = '';
        
        // 濡傛灉娌℃湁浣滃搧锛屾樉绀烘彁绀轰俊鎭?        if (userWorks.length === 0) {
            worksListContainer.innerHTML = `
                <div class="no-works-message">
                    <p>鎮ㄨ繕娌℃湁鍒涘缓浠讳綍浣滃搧</p>
                    <button class="create-first-work-btn">鍒涘缓鎴戠殑绗竴涓綔鍝?/button>
                </div>
            `;
            
            // 娣诲姞鍒涘缓浣滃搧鎸夐挳浜嬩欢
            const createBtn = worksListContainer.querySelector('.create-first-work-btn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    // 杩欓噷鍙互鎵撳紑鍒涘缓浣滃搧鐨勬ā鎬佹
                    alert('鍒涘缓浣滃搧鍔熻兘鍗冲皢涓婄嚎');
                });
            }
            
            return;
        }
        
        // 鍒涘缓骞舵坊鍔犱綔鍝侀」锛屽寘鎷叕寮€鍜岄殣钘忕殑
        userWorks.forEach(work => {
            const workItem = createWorkItem(work);
            
            // 涓洪殣钘忕殑浣滃搧娣诲姞鐗规畩鏍囪
            if (work.is_hidden) {
                const hiddenBadge = document.createElement('span');
                hiddenBadge.className = 'work-hidden-badge';
                hiddenBadge.textContent = '宸查殣钘?;
                hiddenBadge.title = '姝や綔鍝佷粎瀵规偍鍙';
                workItem.appendChild(hiddenBadge);
            }
            
            worksListContainer.appendChild(workItem);
        });
        
    } catch (error) {
        console.error('鏄剧ず鐢ㄦ埛浣滃搧鍑洪敊:', error);
    }
}

// 鍒涘缓浣滃搧椤笵OM鍏冪礌
function createWorkItem(work) {
    const workItem = document.createElement('div');
    workItem.className = 'work-item';
    workItem.dataset.workId = work.id;
    
    // 浣滃搧鍗＄墖HTML缁撴瀯
    workItem.innerHTML = `
        <div class="work-image">
            <img src="${work.image_url || work.image || 'https://via.placeholder.com/400x300?text=浣滃搧鍥剧墖'}" 
                 alt="${work.title || '浣滃搧鍥剧墖'}" 
                 class="work-image">
        </div>
        <div class="work-info">
            <h3 class="work-title">${work.title || '鏈懡鍚嶄綔鍝?}</h3>
            <p class="work-description">${work.description || '鏆傛棤鎻忚堪'}</p>
            <div class="work-meta">
                <span class="work-date">${work.created_at ? formatDate(work.created_at) : (work.date || '')}</span>
                <span class="work-category">${work.category || '鏈垎绫?}</span>
            </div>
        </div>
    `;
    
    return workItem;
}

// 鍒锋柊浣滃搧鍒楄〃锛堝湪浣滃搧鎿嶄綔鍚庤皟鐢級
async function refreshWorksList() {
    try {
        console.log('鍒锋柊浣滃搧鍒楄〃...');
        // 鏄剧ず鍔犺浇鐘舵€佹寚绀哄櫒
        showLoadingIndicator();
        await loadAndDisplayWorks();
    } catch (error) {
        console.error('鍒锋柊浣滃搧鍒楄〃鍑洪敊:', error);
        alert('鍒锋柊浣滃搧鍒楄〃澶辫触锛岃绋嶅悗閲嶈瘯');
    } finally {
        // 纭繚闅愯棌鍔犺浇鐘舵€佹寚绀哄櫒
        hideLoadingIndicator();
    }
}

// 褰揇OM鍔犺浇瀹屾垚鍚庡垵濮嬪寲椤甸潰
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM鍐呭鍔犺浇瀹屾垚');
    
    var buttons = document.querySelectorAll('button');
    
    
    // 鍒濆鍖栬〃鍗曢獙璇?    setupFormValidation();
    
    try {
        await initPage();
    } catch (error) {
        console.error('椤甸潰鍒濆鍖栧け璐?', error);
        alert('椤甸潰鍔犺浇鏃跺嚭鐜伴敊璇紝璇峰埛鏂伴〉闈㈤噸璇?);
    }
    
    // 涓鸿仈绯昏〃鍗曟坊鍔犳彁浜や簨浠剁洃鍚?    const contactForm = document.querySelector('.contact-form');
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
            if (!email || !isValidEmail(email)) { showAuthError('璇疯緭鍏ユ湁鏁堢殑閭鍦板潃'); return; }
            if (PREVIEW_MODE) {
                const el = document.getElementById('auth-error');
                if (el) { el.textContent = '棰勮鐜涓嶆敮鎸佸瘑鐮侀噸缃?; el.className = 'success-message'; el.style.display = 'block'; }
                return;
            }
            showLoadingIndicator();
            try {
                const resp = await fetch(`${API_BASE}/api/auth/request-reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                if (!resp.ok) { showAuthError('閲嶇疆璇锋眰澶辫触锛岃绋嶅悗閲嶈瘯'); return; }
                const el = document.getElementById('auth-error');
                if (el) { el.textContent = '宸插彂閫侀噸缃偖浠讹紙鏈夋晥鏈?灏忔椂锛?; el.className = 'success-message'; el.style.display = 'block'; }
            } finally { hideLoadingIndicator(); }
        });
    }
});
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const resp = await fetch('/api/config');
        if (resp.ok) {
            const cfg = await resp.json();
            if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
                window.SUPABASE_URL = cfg.supabaseUrl;
                SUPABASE_ANON_KEY = cfg.supabaseAnonKey;
            }
        }
    } catch(_) {}
    const sb = getSupabaseClient();
    if (sb) {
        const r = await sb.auth.getUser();
        if (r.data && r.data.user) {
            const u = r.data.user;
            const m = u.user_metadata || {};
            currentUser = { id: u.id, email: u.email, username: u.email.split('@')[0], avatar: m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.email.split('@')[0])}&background=random`, nickName: m.nick_name || u.email.split('@')[0], phone: m.phone || '' };
            updateUIForLoggedInState();
        }
        try { await initWorksImages(sb); } catch(_) {}
    }
});

async function initWorksImages(sbClient) {
    const sb = sbClient || getSupabaseClient();
    if (!sb) return;
    const selectors = Array.from(document.querySelectorAll('.works-grid .work-item img')).slice(0,4);
    const localFiles = [
        'images/AI 璁拌处 APP 鍘熷瀷璁捐 (1).png',
        'images/AI 璁拌处 APP 鍘熷瀷璁捐 (2).png',
        'images/AI 璁拌处 APP 鍘熷瀷璁捐 (3).png',
        'images/AI 璁拌处 APP 鍘熷瀷璁捐.png'
    ];
    for (let i = 0; i < Math.min(selectors.length, localFiles.length); i++) {
        const imgEl = selectors[i];
        const path = localFiles[i];
        try {
            const resp = await fetch(path);
            if (!resp.ok) continue;
            const blob = await resp.blob();
            const name = `works/${Date.now()}-${i}.png`;
            const up = await sb.storage.from('avatars').upload(name, blob, { upsert: true });
            if (up.error) continue;
            const signed = await sb.storage.from('avatars').createSignedUrl(name, 60 * 60 * 24 * 7);
            if (signed?.data?.signedUrl && imgEl) imgEl.src = signed.data.signedUrl;
        } catch (_) { }
    }
}
function runCoreUnitTests() {
    const results = [];
    const assert = (name, ok) => results.push({ name, ok });
    assert('validatePhone 姝ｇ‘', validatePhone('17772297239') === true);
    assert('validatePhone 閿欒', validatePhone('12345') === false);
    assert('validateNickname 杈圭晫', validateNickname('ab') === true && validateNickname('a') === false);
    const contact = document.getElementById('contact');
    if (contact) {
        const startY = window.pageYOffset;
        smoothScrollTo('contact', 0, () => {
            const afterY = window.pageYOffset;
            assert('smoothScrollTo 绉诲姩', Math.abs(afterY - startY) > 0);
        });
    }
    console.log('鍗曞厓娴嬭瘯缁撴灉:', results);
}

if (location.search.includes('runTests')) {
    setTimeout(runCoreUnitTests, 500);
}

try {
    var si = document.createElement('script');
    si.src = '/_vercel/speed-insights/script.js';
    si.defer = true;
    document.body.appendChild(si);
} catch (_) {}
