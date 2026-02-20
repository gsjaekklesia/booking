// GSJA Ekklesia Room Booking System - Application Logic
// Separated from index.html for maintainability

// Easter Egg - Pinata Effect
let easterEggClicks = 0;
let easterEggTimeout;

function easterEggClick() {
    easterEggClicks++;
    
    // Reset counter after 2 seconds of no clicks
    clearTimeout(easterEggTimeout);
    easterEggTimeout = setTimeout(() => {
        easterEggClicks = 0;
    }, 2000);
    
    // Trigger pinata on 3rd click
    if (easterEggClicks === 3) {
        triggerPinata();
        easterEggClicks = 0;
    }
}

function triggerPinata() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
    
    // Create 150 confetti pieces
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            createConfetti(container, colors);
        }, i * 10);
    }
    
    // Show celebration toast
    showToast('🎉 You found the secret! 🎊', 'success', '🥳');
    
    // Clear confetti after 5 seconds
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function createConfetti(container, colors) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const animDuration = 2 + Math.random() * 3;
    const size = 8 + Math.random() * 8;
    const rotation = Math.random() * 360;
    
    confetti.style.position = 'absolute';
    confetti.style.left = left + '%';
    confetti.style.top = '-20px';
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';
    confetti.style.backgroundColor = color;
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    confetti.style.transform = `rotate(${rotation}deg)`;
    confetti.style.animation = `confettiFall ${animDuration}s linear forwards`;
    confetti.style.opacity = '0.8';
    
    container.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
        confetti.remove();
    }, animDuration * 1000);
}

console.log(
'%cRoom Booking System — Built by Vincentius Bramasta Hartono',
'color:#2563eb;font-size:14px;font-weight:600;'
);

// ===== THEME SYSTEM =====
const htmlEl = document.documentElement;

function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
    // Block theme change during night — show locked toast
    if (document.documentElement.getAttribute('data-night-forced')) {
        // Shake the toggle
        const sw = document.getElementById('themeSwitch');
        if (sw) {
            sw.classList.remove('night-locked');
            void sw.offsetWidth; // force reflow to restart animation
            sw.classList.add('night-locked');
            setTimeout(() => sw.classList.remove('night-locked'), 500);
        }
        showToast('Tema terkunci saat malam hari. Akan kembali otomatis setelah pukul 05:00.', 'info', '·');
        return;
    }
    const current = htmlEl.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Init theme immediately (before paint) to avoid flash
(function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
        applyTheme(saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }
})();

// ===== REDIRECT GUARD =====
(function checkAuth() {
    const role = localStorage.getItem('userRole');
    if (!role || (role !== 'guest' && role !== 'admin')) {
        window.location.replace('login.html');
    }
})();

// ===== LOGOUT =====
function logoutToLoginPage() {
    localStorage.removeItem('userRole');
    window.location.replace('login.html');
}

// SUPABASE CONFIG
console.log('Setting up Supabase...');
const SUPABASE_URL = "https://fyjdvqfquzkfoympyhte.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5amR2cWZxdXprZm95bXB5aHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjI2MjYsImV4cCI6MjA4NjUzODYyNn0.MzYfNxZvjNn7h-yIWMWh6tmSrY7zr_evAQe8BOBIuRo";

console.log('Creating Supabase client...');
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
console.log('Supabase client created:', sb);

// GLOBALS
// Admin password - will be loaded from database
let ADMIN_PASSWORD = "admin123"; // Temporary default until loaded from DB
let bookings = [];
let filteredBookings = []; // For search/filter
let currentLanguage = localStorage.getItem('language') || 'id'; // Default Indonesian
let isAdmin = localStorage.getItem('userRole') === 'admin';
let calendar;
let selectedBookingId = null;
let tempStart = null;
let tempEnd = null;
let isAllDay = false;

console.log('Variables initialized');

// TRANSLATIONS
const translations = {
    id: {
        title: 'GSJA Ekklesia Room Booking',
        admin: 'ADMIN',
        menuTitle: 'Menu',
        languageLabel: 'Bahasa',
        searchAndFilter: 'Cari & Filter',
        adminLogin: 'Login Admin',
        changePassword: 'Ubah Password',
        logout: 'Logout',
        about: 'Tentang',
        enableNotifications: 'Aktifkan Notifikasi',
        searchTitle: 'Cari & Filter',
        searchLabel: 'Cari',
        searchPlaceholder: 'Cari aktivitas, divisi, ruangan...',
        filterByDivision: 'Filter berdasarkan Divisi',
        filterByRoom: 'Filter berdasarkan Ruangan',
        allDivisions: 'Semua Divisi',
        allRooms: 'Semua Ruangan',
        clearFilters: 'Hapus Semua',
        applyButton: 'Terapkan',
        instructions: 'Untuk booking beberapa hari: tekan & drag pada baris <b>All-day</b> di bagian atas kalender, bukan di jam. Drag ke kanan untuk menambah hari.',
        createBooking: 'Buat Booking',
        division: 'Divisi',
        room: 'Ruangan',
        activity: 'Aktivitas',
        notes: 'Catatan',
        startTime: 'Jam Mulai (Waktu Indonesia/WIB)',
        endTime: 'Jam Selesai (Waktu Indonesia/WIB)',
        timezoneNote: 'Semua waktu dalam zona waktu Indonesia (WIB/UTC+7)',
        selectDate: 'Untuk membuat booking, pilih tanggal di kalender terlebih dahulu.',
        noTimeSelected: 'Belum ada waktu dipilih',
        loginTitle: 'Login Admin',
        username: 'Username',
        password: 'Password',
        cancel: 'Batal',
        login: 'Login',
        changePasswordTitle: 'Ubah Password',
        currentPassword: 'Password Saat Ini',
        newPassword: 'Password Baru',
        confirmPassword: 'Konfirmasi Password Baru',
        change: 'Ubah'
    },
    en: {
        title: 'GSJA Ekklesia Room Booking',
        admin: 'ADMIN',
        menuTitle: 'Menu',
        languageLabel: 'Language',
        searchAndFilter: 'Search & Filter',
        adminLogin: 'Admin Login',
        changePassword: 'Change Password',
        logout: 'Logout',
        about: 'About',
        searchTitle: 'Search & Filter',
        searchLabel: 'Search',
        searchPlaceholder: 'Search activity, division, room...',
        filterByDivision: 'Filter by Division',
        filterByRoom: 'Filter by Room',
        allDivisions: 'All Divisions',
        allRooms: 'All Rooms',
        clearFilters: 'Clear All',
        applyButton: 'Apply',
        instructions: 'For multi-day bookings: click & drag on the <b>All-day</b> row at the top of the calendar, not on the hours. Drag right to add days.',
        createBooking: 'Create Booking',
        division: 'Division',
        room: 'Room',
        activity: 'Activity',
        notes: 'Notes',
        startTime: 'Start Time (Indonesia Time/WIB)',
        endTime: 'End Time (Indonesia Time/WIB)',
        timezoneNote: 'All times are in Indonesia timezone (WIB/UTC+7)',
        selectDate: 'To create a booking, please select a date on the calendar first.',
        noTimeSelected: 'No time selected',
        loginTitle: 'Admin Login',
        username: 'Username',
        password: 'Password',
        cancel: 'Cancel',
        login: 'Login',
        changePasswordTitle: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm New Password',
        change: 'Change'
    },
    zh: {
        title: 'GSJA Ekklesia 房间预订',
        admin: '管理员',
        menuTitle: '菜单',
        languageLabel: '语言',
        searchAndFilter: '搜索与筛选',
        adminLogin: '管理员登录',
        changePassword: '更改密码',
        logout: '登出',
        about: '关于',
        searchTitle: '搜索与筛选',
        searchLabel: '搜索',
        searchPlaceholder: '搜索活动、部门、房间...',
        filterByDivision: '按部门筛选',
        filterByRoom: '按房间筛选',
        allDivisions: '所有部门',
        allRooms: '所有房间',
        clearFilters: '清除全部',
        applyButton: '应用',
        instructions: '预订多天：点击并拖动日历顶部的 <b>全天</b> 行，而不是小时。向右拖动以添加天数。',
        createBooking: '创建预订',
        division: '部门',
        room: '房间',
        activity: '活动',
        notes: '备注',
        startTime: '开始时间（印尼时间/WIB）',
        endTime: '结束时间（印尼时间/WIB）',
        timezoneNote: '所有时间均为印尼时区 (WIB/UTC+7)',
        selectDate: '要创建预订，请先在日历上选择日期。',
        noTimeSelected: '未选择时间',
        loginTitle: '管理员登录',
        username: '用户名',
        password: '密码',
        cancel: '取消',
        login: '登录',
        changePasswordTitle: '更改密码',
        currentPassword: '当前密码',
        newPassword: '新密码',
        confirmPassword: '确认新密码',
        change: '更改'
    }
};

// TRANSLATION FUNCTIONS
function translate(key) {
    return translations[currentLanguage][key] || key;
}

function updatePageLanguage() {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.getAttribute('data-translate');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translate(key);
        } else {
            const translation = translate(key);
            if (key === 'instructions') {
                el.innerHTML = translation;
            } else {
                el.textContent = translation;
            }
        }
    });
    
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
        const key = el.getAttribute('data-translate-placeholder');
        el.placeholder = translate(key);
    });
}

function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updatePageLanguage();
    renderCalendar(); // Refresh calendar to update button texts
}


// LOAD ADMIN PASSWORD FROM DATABASE
async function loadAdminPassword() {
    console.log('Loading admin password from database...');
    try {
        const { data, error } = await sb
            .from('admin_settings')
            .select('admin_password')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error loading admin password:', error);
            console.log('Using default password');
            return;
        }

        if (data && data.admin_password) {
            ADMIN_PASSWORD = data.admin_password;
            console.log('Admin password loaded from database');
        }
    } catch (err) {
        console.error('Error loading admin password:', err);
        console.log('Using default password');
    }
}

// LOAD BOOKINGS
async function loadBookings() {
    console.log('Loading bookings...');
    try {
        const { data, error } = await sb
            .from('bookings')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error loading bookings:', error);
            alert('Error loading bookings: ' + error.message);
            return;
        }

        console.log('Bookings loaded:', data);
        bookings = data.map(b => ({
            id: b.id,
            division: b.division,
            room: b.room,
            activity: b.activity,
            notes: b.notes,
            start: b.start_time,
            end: b.end_time
        }));

        applyFilters(); // Apply current filters and render calendar
        scheduleReminders(); // Schedule 30-min reminders for upcoming bookings
    } catch (err) {
        console.error('Load error:', err);
        alert('Failed to connect: ' + err.message);
    }
}

// CREATE BOOKING
async function createBookingInDB(booking) {
    console.log('Creating booking:', booking);
    try {
        const { data, error } = await sb
            .from('bookings')
            .insert([{
                division: booking.division,
                room: booking.room,
                activity: booking.activity,
                notes: booking.notes,
                start_time: booking.start,
                end_time: booking.end
            }])
            .select();

        if (error) {
            console.error('Insert error:', error);
            alert('Failed to create: ' + error.message);
            return false;
        }

        console.log('Booking created:', data);
        return true;
    } catch (err) {
        console.error('Create error:', err);
        alert('Error: ' + err.message);
        return false;
    }
}

// UPDATE BOOKING
async function updateBookingInDB(id, updates) {
    try {
        const { error } = await sb
            .from('bookings')
            .update({
                division: updates.division,
                room: updates.room,
                activity: updates.activity,
                notes: updates.notes,
                start_time: updates.start,
                end_time: updates.end
            })
            .eq('id', id);

        if (error) {
            console.error('Update error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Update error:', err);
        return false;
    }
}

// DELETE BOOKING
async function deleteBookingFromDB(id) {
    try {
        const { error } = await sb
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Delete error:', err);
        return false;
    }
}

// FIND OVERLAP
function findOverlap(newBooking, ignoreId = null) {
    return bookings.find((b) => {
        if (b.id === ignoreId) return false;
        if (b.room !== newBooking.room) return false;
        return new Date(newBooking.start) < new Date(b.end) && 
               new Date(newBooking.end) > new Date(b.start);
    });
}

// GET COLOR CLASS FOR DIVISION
function getDivisionColor(division) {
    const colorMap = {
        'Kebaktian': 'color-kebaktian',
        'Sekolah Minggu': 'color-sekolah-minggu',
        '11DG': 'color-11dg',
        'Alive': 'color-alive',
        'Kaum Pria': 'color-kaum-pria',
        'Kaum Wanita': 'color-kaum-wanita',
        'Kaum Lansia': 'color-kaum-lansia',
        'Usher': 'color-usher',
        'Diakonia': 'color-diakonia',
        'Dept Injil': 'color-dept-injil',
        'Dept Misi': 'color-dept-misi',
        'AGBF': 'color-agbf',
        'Kewirausahaan': 'color-kewirausahaan',
        'Publikasi': 'color-publikasi',
        'Tata Graha': 'color-tata-graha',
        'Fasilitas': 'color-fasilitas',
        'Tim Doa': 'color-tim-doa',
        'ESP': 'color-esp'
    };
    return colorMap[division] || 'color-kebaktian';
}

// ROOM ABBREVIATION
function abbreviateRoom(room) {
    const map = {
        'Hall Utama':           'HU',
        'Ruang Kaca Lt2':       'RK2',
        'Ruang SM Spesial':     'SMS',
        'Ruang Teen':           'Teen',
        'Office':               'Off',
        'Studio':               'Std',
        'Ruang Makan Lt2':      'RM2',
        'Rooftop':              'Roof',
        'Kamar Tidur Lt3':      'KT3',
        'Multifungsi Hall Lt1': 'MH1',
        'Ruang Doa':            'RDoa',
        'Ruang Youth Lt1':      'RY1',
    };
    return map[room] || room.split(' ').map(w => w[0]).join('').toUpperCase();
}
const divisionHexColors = {
    'Kebaktian':     '#3b82f6',
    'Sekolah Minggu':'#10b981',
    '11DG':          '#8b5cf6',
    'Alive':         '#f59e0b',
    'Kaum Pria':     '#06b6d4',
    'Kaum Wanita':   '#ec4899',
    'Kaum Lansia':   '#6366f1',
    'Usher':         '#14b8a6',
    'Diakonia':      '#f97316',
    'Dept Injil':    '#84cc16',
    'Dept Misi':     '#a855f7',
    'AGBF':          '#ef4444',
    'Kewirausahaan': '#22c55e',
    'Publikasi':     '#eab308',
    'Tata Graha':    '#06b6d4',
    'Fasilitas':     '#64748b',
    'Tim Doa':       '#f43f5e',
    'ESP':           '#8b5cf6'
};

// BUILD LEGEND
function buildLegend() {
    const grid = document.getElementById('legendGrid');
    if (!grid) return;
    grid.innerHTML = '';
    Object.entries(divisionHexColors).forEach(([name, color], index) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="legend-dot" style="background:${color};animation-delay:${index * 40}ms"></span>
            <span>${name}</span>
        `;
        grid.appendChild(item);
    });
}

// SHOW / HIDE EMPTY STATE
function updateEmptyState() {
    const emptyState  = document.getElementById('emptyState');
    const calendarEl  = document.getElementById('calendar');
    const legendWrap  = document.getElementById('legendWrap');
    const skeleton    = document.getElementById('skeletonLoader');
    if (!emptyState) return;

    // Always hide skeleton once we have data
    if (skeleton) skeleton.style.display = 'none';

    const isEmpty = filteredBookings.length === 0;
    emptyState.style.display  = isEmpty ? 'flex'  : 'none';
    calendarEl.style.display  = isEmpty ? 'none'  : 'block';
    legendWrap.style.display  = isEmpty ? 'none'  : 'block';

    // Force FullCalendar to recalculate size now that it's visible
    if (!isEmpty && calendar) {
        setTimeout(() => calendar.updateSize(), 10);
    }
}

// SEARCH AND FILTER FUNCTIONS
function applyFilters() {
    const searchText = document.getElementById('searchBox').value.toLowerCase();
    const filterDivision = document.getElementById('filterDivision').value;
    const filterRoom = document.getElementById('filterRoom').value;
    
    filteredBookings = bookings.filter(booking => {
        // Search filter
        const matchesSearch = !searchText || 
            booking.activity.toLowerCase().includes(searchText) ||
            booking.division.toLowerCase().includes(searchText) ||
            booking.room.toLowerCase().includes(searchText) ||
            (booking.notes && booking.notes.toLowerCase().includes(searchText));
        
        // Division filter
        const matchesDivision = !filterDivision || booking.division === filterDivision;
        
        // Room filter
        const matchesRoom = !filterRoom || booking.room === filterRoom;
        
        return matchesSearch && matchesDivision && matchesRoom;
    });
    
    console.log(`Filtered: ${filteredBookings.length} of ${bookings.length} bookings`);
    updateFilterResults();
    renderCalendar();
}

function clearFilters() {
    document.getElementById('searchBox').value = '';
    document.getElementById('filterDivision').value = '';
    document.getElementById('filterRoom').value = '';
    applyFilters();
}

// RENDER CALENDAR
function renderCalendar() {
    console.log('Rendering calendar with', bookings.length, 'bookings');
    if (calendar) calendar.destroy();

    calendar = new FullCalendar.Calendar(document.getElementById('calendar'), {
        longPressDelay: 250,
        selectLongPressDelay: 250,
        selectMinDistance: 5,
        initialView: 'dayGridMonth',  // Always start with month view
        selectable: false,
        unselectAuto: false,
        selectMirror: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        nowIndicator: true,
        height: 'auto',
        
        // Show unlimited events in all views
        dayMaxEvents: false, // No limit on month view
        dayMaxEventRows: false, // No limit on day grid
        
        // Time grid (day/week view) settings
        slotEventOverlap: false, // Show side-by-side, not overlapping
        eventMaxStack: 10, // Allow up to 10 events stacked horizontally
        
        // Make events narrower to fit more
        eventMinWidth: 70, // Minimum width in pixels
        
        // Better spacing for multiple events
        slotMinWidth: 50,

        datesSet() {
            // Fade the calendar grid on month navigation
            const el = document.getElementById('calendar');
            if (!el) return;
            el.style.transition = 'none';
            el.style.opacity = '0';
            el.style.transform = 'translateY(6px)';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                });
            });
        },

        eventClick(info) {
            const bookingId = info.event.extendedProps.bookingId;
            const booking = bookings.find(b => b.id === bookingId);
            if (booking) {
                selectedBookingId = bookingId;
                openViewSheet(booking);
            }
        },

        events: filteredBookings.map((b) => ({
            title: `${b.activity || 'Untitled'} · ${abbreviateRoom(b.room)}`,
            start: b.start,
            end: b.end,
            bookingId: b.id,
            className: getDivisionColor(b.division)
        }))
    });

    calendar.render();
    console.log('Calendar rendered with', filteredBookings.length, 'bookings');
    updateEmptyState();
    
    // Update sidebar menu items based on admin status
    updateSidebarMenu();
}

// Update sidebar menu visibility
function updateSidebarMenu() {
    const sidebarAdminBadge = document.getElementById('sidebarAdminBadge');
    const sidebarGuestBadge = document.getElementById('sidebarGuestBadge');
    const menuChangePassword = document.getElementById('menuChangePassword');
    const headerBadge = document.getElementById('headerRoleBadge');

    if (isAdmin) {
        sidebarAdminBadge.style.display = 'block';
        sidebarGuestBadge.style.display = 'none';
        menuChangePassword.style.display = 'flex';
        if (headerBadge) {
            headerBadge.textContent = 'Admin';
            headerBadge.className = 'role-badge admin';
        }
    } else {
        sidebarAdminBadge.style.display = 'none';
        sidebarGuestBadge.style.display = 'block';
        menuChangePassword.style.display = 'none';
        if (headerBadge) {
            headerBadge.textContent = 'Guest';
            headerBadge.className = 'role-badge guest';
        }
    }
}

// SIDEBAR FUNCTIONS
function openSidebar() {
    document.getElementById('sidebarMenu').classList.add('active');
    document.getElementById('sidebarOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    document.getElementById('sidebarMenu').classList.remove('active');
    document.getElementById('sidebarOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ===== PUSH NOTIFICATION FUNCTIONS =====
let pushNotificationsEnabled = false;

async function initPushNotifications() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.log('Browser does not support notifications');
        return;
    }
    
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
        console.log('Browser does not support service workers');
        return;
    }
    
    // Check current permission status
    if (Notification.permission === 'granted') {
        pushNotificationsEnabled = true;
        updateNotificationUI();
        registerServiceWorker();
    } else if (Notification.permission === 'denied') {
        pushNotificationsEnabled = false;
        updateNotificationUI();
    }
}

async function registerServiceWorker() {
    try {
        // Register with explicit scope for GitHub Pages subdirectory
        const registration = await navigator.serviceWorker.register('./sw.js', {
            scope: './'
        });
        console.log('Service Worker registered:', registration);
        console.log('Service Worker scope:', registration.scope);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        console.error('Error details:', error.message);
        return null;
    }
}

async function togglePushNotifications() {
    if (pushNotificationsEnabled) {
        // Disable notifications
        pushNotificationsEnabled = false;
        localStorage.setItem('pushNotificationsEnabled', 'false');
        updateNotificationUI();
        showToast('Notifications disabled', 'info', '·');
        closeSidebar();
    } else {
        // Request permission
        try {
            console.log('Requesting notification permission...');
            
            // Check if Notification API is supported
            if (!('Notification' in window)) {
                console.error('Notification API not supported');
                showToast('Notifications not supported on this device', 'error', '·');
                closeSidebar();
                return;
            }
            
            // Check if Service Worker is supported
            if (!('serviceWorker' in navigator)) {
                console.error('Service Worker not supported');
                showToast('Service Workers not supported', 'error', '·');
                closeSidebar();
                return;
            }
            
            const permission = await Notification.requestPermission();
            console.log('Permission result:', permission);
            
            if (permission === 'granted') {
                console.log('Permission granted, registering service worker...');
                
                const registration = await registerServiceWorker();
                
                if (registration) {
                    console.log('Service worker registered successfully!');
                    pushNotificationsEnabled = true;
                    localStorage.setItem('pushNotificationsEnabled', 'true');
                    updateNotificationUI();
                    showToast('Notifications enabled!', 'success', '·');
                    
                    // Show test notification
                    sendLocalNotification('Notifications Enabled', 'You will now receive booking updates');
                } else {
                    console.error('Service worker registration returned null');
                    showToast('Service worker failed to register', 'error', '·');
                }
            } else if (permission === 'denied') {
                console.log('Permission denied by user');
                showToast('Notification permission denied', 'error', '·');
            } else {
                console.log('Permission dismissed');
                showToast('Notification permission dismissed', 'info', '·');
            }
            closeSidebar();
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            showToast(`Error: ${error.message}`, 'error', '·');
            closeSidebar();
        }
    }
}

function updateNotificationUI() {
    const statusEl = document.getElementById('notificationStatus');
    const toggleBtn = document.getElementById('notificationToggle');
    
    if (pushNotificationsEnabled) {
        if (statusEl) statusEl.textContent = 'Notifications ON';
        if (toggleBtn) toggleBtn.style.background = '#dcfce7';
    } else {
        if (statusEl) statusEl.textContent = 'Enable Notifications';
        if (toggleBtn) toggleBtn.style.background = '';
    }
}

function sendLocalNotification(title, body, tag = 'booking') {
    // Only send if notifications are enabled
    if (!pushNotificationsEnabled) return;
    
    // Check if silent mode is active (for admin testing)
    const silentMode = document.getElementById('silentMode');
    if (silentMode && silentMode.checked) return;
    
    // Use Service Worker notification for mobile compatibility
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
            const options = {
                body: body,
                tag: tag,
                vibrate: [200, 100, 200],
                requireInteraction: false,
                data: {
                    url: window.location.href
                }
            };
            
            // Use Service Worker to show notification (works on mobile!)
            registration.showNotification(title, options)
                .then(() => {
                    console.log('Notification shown via Service Worker');
                })
                .catch((error) => {
                    console.error('Error showing notification:', error);
                });
        }).catch((error) => {
            console.error('Service Worker not ready:', error);
        });
    }
}

function showAbout(){
    overlay.style.display = 'block';
    aboutSheet.classList.add('active');
    document.body.style.overflow = 'hidden';
}


// UI FUNCTIONS
function showHint() {
    if (!localStorage.getItem('seenHint')) {
        setTimeout(() => {
            document.getElementById('hintOverlay').style.display = 'block';
            document.getElementById('fabTip').style.display = 'block';
            // Add pulse animation to FAB button
            document.querySelector('.fab').classList.add('pulse-hint');
        }, 700);
    }
}

function closeHint() {
    localStorage.setItem('seenHint', 'true');
    document.getElementById('hintOverlay').style.display = 'none';
    document.getElementById('fabTip').style.display = 'none';
    // Remove pulse animation from FAB button
    document.querySelector('.fab').classList.remove('pulse-hint');
}

// TOAST NOTIFICATION FUNCTIONS
function showToast(message, type = 'success', icon = '✓') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    // Set content
    toastIcon.textContent = icon;
    toastMessage.textContent = message;
    
    // Remove old classes
    toast.classList.remove('success', 'error', 'info');
    
    // Add type class
    if (type) {
        toast.classList.add(type);
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function openCreateSheet() {
    overlay.style.display = 'block';
    createSheet.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Set today's date as default
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    document.getElementById('manualDate').value = todayStr;
    document.getElementById('manualEndDate').value = todayStr;

    // Reset multi-day checkbox
    const multiCheck = document.getElementById('multiDayCheck');
    const endDateContainer = document.getElementById('endDateContainer');
    if (multiCheck) multiCheck.checked = false;
    if (endDateContainer) endDateContainer.style.display = 'none';

    // Show silent mode checkbox only for admins
    const silentModeContainer = document.getElementById('silentModeContainer');
    if (silentModeContainer) {
        silentModeContainer.style.display = isAdmin ? 'block' : 'none';
    }
}

function toggleMultiDay() {
    const checked = document.getElementById('multiDayCheck').checked;
    const endDateContainer = document.getElementById('endDateContainer');
    endDateContainer.style.display = checked ? 'block' : 'none';

    // Set end date to match start date when first expanding
    if (checked) {
        const startVal = document.getElementById('manualDate').value;
        if (startVal) document.getElementById('manualEndDate').value = startVal;
    }
}

function openViewSheet(b) {
    overlay.style.display = 'block';
    viewSheet.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Apply division color to the top border strip
    const hex = divisionHexColors[b.division] || '#2563eb';
    viewSheet.style.borderTopColor = hex;

    modalTitle.textContent = b.activity || 'Untitled';

    // Format dates in Indonesia timezone (Asia/Jakarta)
    const startDate = new Date(b.start);
    const endDate   = new Date(b.end);

    const options = {
        timeZone: 'Asia/Jakarta',
        year:     'numeric',
        month:    '2-digit',
        day:      '2-digit',
        hour:     '2-digit',
        minute:   '2-digit',
        hour12:   true
    };

    const startStr = startDate.toLocaleString('en-US', options);
    const endStr   = endDate.toLocaleString('en-US', options);

    modalBody.innerHTML = `
<div style="display:flex;flex-direction:column;gap:6px;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="width:8px;height:8px;border-radius:50%;background:${hex};flex-shrink:0;"></span>
    <span><b>Divisi:</b> ${b.division}</span>
  </div>
  <div><b>Room:</b> ${b.room}</div>
  <div><b>Mulai:</b> ${startStr} WIB</div>
  <div><b>Selesai:</b> ${endStr} WIB</div>
  ${b.notes ? `<div style="margin-top:8px;padding:10px 12px;background:var(--surface);border-radius:8px;font-size:14px;line-height:1.6;border-left:3px solid ${hex};">${b.notes}</div>` : ''}
</div>`;

    adminBtns.style.display = isAdmin ? 'flex' : 'none';
}

function closeSheets() {
    overlay.style.display = 'none';

    document.querySelectorAll('.bottom-sheet')
        .forEach(sheet => sheet.classList.remove('active'));

    document.body.style.overflow = 'auto';
}

// ===== 1. HAPTIC FEEDBACK =====
function haptic(type = 'light') {
    if (!navigator.vibrate) return;
    const patterns = {
        light:   [30],
        medium:  [60],
        heavy:   [100],
        success: [40, 30, 40],
        error:   [80, 40, 80],
    };
    navigator.vibrate(patterns[type] || patterns.light);
}

// ===== 2. SWIPE DOWN TO CLOSE BOTTOM SHEETS =====
function initSwipeToClose() {
    document.querySelectorAll('.bottom-sheet').forEach(sheet => {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        sheet.addEventListener('touchstart', (e) => {
            // Only start swipe if touch is on handle or top 40px of sheet
            const touchY = e.touches[0].clientY;
            const sheetTop = sheet.getBoundingClientRect().top;
            if (touchY - sheetTop > 60) return; // Only drag from top area

            startY = e.touches[0].clientY;
            isDragging = true;
            sheet.classList.add('is-dragging');
        }, { passive: true });

        sheet.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            if (deltaY < 0) return; // Don't allow dragging up
            sheet.style.transform = `translateY(${deltaY}px)`;
        }, { passive: true });

        sheet.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            sheet.classList.remove('is-dragging');
            const deltaY = currentY - startY;

            if (deltaY > 100) {
                // Swiped down far enough — close
                sheet.style.transform = `translateY(100%)`;
                haptic('medium');
                setTimeout(() => {
                    sheet.style.transform = '';
                    closeSheets();
                }, 250);
            } else {
                // Snap back
                sheet.style.transform = '';
            }
            startY = 0;
            currentY = 0;
        });
    });
}

// ===== 3. BOOKING REMINDERS =====
const scheduledReminders = new Set(); // Track so we don't double-schedule

function scheduleReminders() {
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    const thirtyMin = 30 * 60 * 1000;

    bookings.forEach(b => {
        const startMs = new Date(b.start).getTime();
        const msUntil = startMs - now - thirtyMin; // fire 30 min before

        // Only schedule future bookings we haven't scheduled yet
        if (msUntil > 0 && msUntil < 24 * 60 * 60 * 1000 && !scheduledReminders.has(b.id)) {
            scheduledReminders.add(b.id);

            setTimeout(() => {
                sendLocalNotification(
                    `Reminder: ${b.activity}`,
                    `${b.room} mulai dalam 30 menit`,
                    `reminder-${b.id}`
                );
            }, msUntil);

            console.log(`Reminder scheduled for "${b.activity}" in ${Math.round(msUntil/60000)} min`);
        }
    });
}


// EDIT SHEET FUNCTIONS
function openEditSheet() {
    const booking = bookings.find(b => b.id === selectedBookingId);
    if (!booking) return;
    
    // Close view sheet, open edit sheet
    document.getElementById('viewSheet').classList.remove('active');
    document.getElementById('editSheet').classList.add('active');
    
    // Pre-fill form with current data
    document.getElementById('editDivision').value = booking.division;
    document.getElementById('editRoom').value = booking.room;
    document.getElementById('editActivity').value = booking.activity;
    document.getElementById('editNotes').value = booking.notes || '';
    
    // Parse dates in Indonesia timezone
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);
    
    // Format for date/time inputs (YYYY-MM-DD and HH:MM)
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };
    
    document.getElementById('editStartDate').value = formatDate(startDate);
    document.getElementById('editStartTime').value = formatTime(startDate);
    document.getElementById('editEndDate').value = formatDate(endDate);
    document.getElementById('editEndTime').value = formatTime(endDate);
}

function closeEditSheet() {
    document.getElementById('editSheet').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function saveEditedBooking() {
    const division = document.getElementById('editDivision').value;
    const room = document.getElementById('editRoom').value;
    const activity = document.getElementById('editActivity').value;
    const notes = document.getElementById('editNotes').value;
    const startDate = document.getElementById('editStartDate').value;
    const startTime = document.getElementById('editStartTime').value;
    const endDate = document.getElementById('editEndDate').value;
    const endTime = document.getElementById('editEndTime').value;
    
    if (!division || !room || !activity || !startDate || !startTime || !endDate || !endTime) {
        alert('Please fill in all required fields!');
        return;
    }
    
    // Create timestamps in Indonesia timezone
    const start = `${startDate}T${startTime}:00+07:00`;
    const end = `${endDate}T${endTime}:00+07:00`;
    
    const updatedBooking = { division, room, activity, notes, start, end };
    
    // Check for conflicts (excluding current booking)
    if (findOverlap(updatedBooking, selectedBookingId)) {
        alert('Room is already booked at this time!');
        return;
    }
    
    const success = await updateBookingInDB(selectedBookingId, updatedBooking);
    if (success) {
        await loadBookings();
        closeEditSheet();
        showToast(`Booking updated: ${activity}`, 'success', '·');
        
        // Send push notification
        sendLocalNotification(
            'Booking Updated',
            `${activity} - ${room}`,
            'booking-updated'
        );
    } else {
        showToast('Failed to update booking', 'error', '·');
    }
}

// SEARCH MODAL FUNCTIONS
function openSearchModal() {
    document.getElementById('searchModal').style.display = 'flex';
    updateFilterResults();
}

function closeSearchModal() {
    document.getElementById('searchModal').style.display = 'none';
}

function updateFilterResults() {
    const resultsDiv = document.getElementById('filterResults');
    if (filteredBookings.length === bookings.length) {
        resultsDiv.innerHTML = `<span data-translate="showingAll">Showing all ${bookings.length} bookings</span>`;
    } else {
        resultsDiv.innerHTML = `<span data-translate="showingFiltered">Showing ${filteredBookings.length} of ${bookings.length} bookings</span>`;
    }
}

// BOOKING OPERATIONS
async function createBooking() {
    const division = document.getElementById('division').value;
    const room = document.getElementById('room').value;
    const activity = document.getElementById('activity').value;
    const notes = document.getElementById('notes').value;
    const manualDate = document.getElementById('manualDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    // Check if multi-day booking
    const isMultiDay = document.getElementById('multiDayCheck').checked;
    const endDateStr = isMultiDay
        ? document.getElementById('manualEndDate').value
        : manualDate;

    // Validate dates
    if (!manualDate || !startTime || !endTime) {
        alert('Mohon lengkapi tanggal dan jam.');
        return;
    }
    if (isMultiDay && !endDateStr) {
        alert('Mohon lengkapi Tanggal Selesai untuk booking multi-hari.');
        return;
    }
    if (isMultiDay && endDateStr < manualDate) {
        alert('Tanggal Selesai tidak boleh sebelum Tanggal Mulai.');
        return;
    }

    let start = `${manualDate}T${startTime}:00+07:00`;
    let end   = `${endDateStr}T${endTime}:00+07:00`;
    
    // Validate required fields
    if (!division || !room || !activity) {
        alert('Mohon lengkapi semua field wajib (Komisi, Room, Activity).');
        return;
    }

    const booking = { division, room, activity, notes, start, end };

    if (findOverlap(booking)) {
        alert('Room sudah dibooking pada waktu tersebut');
        return;
    }

    const success = await createBookingInDB(booking);
    if (success) {
        await loadBookings();
        closeSheets();
        
        // Clear manual inputs
        document.getElementById('manualDate').value = '';
        
        // Check if silent mode is enabled (admin only)
        const silentMode = document.getElementById('silentMode');
        const isSilent = silentMode && silentMode.checked;
        
        // Show toast notification if not in silent mode
        if (!isSilent) {
            showToast(`Booking created: ${activity}`, 'success', '·');
            haptic('success');
            
            // Send push notification
            sendLocalNotification(
                'New Booking Created',
                `${activity} - ${room}`,
                'booking-created'
            );
        }
        
        // Reset silent mode checkbox
        if (silentMode) {
            silentMode.checked = false;
        }
        
        document.getElementById('division').value = '';
        document.getElementById('room').value = '';
        document.getElementById('activity').value = '';
        document.getElementById('notes').value = '';
    } else {
        showToast('Failed to create booking', 'error', '·');
        haptic('error');
    }
}

async function deleteBooking() {
    const booking = bookings.find(b => b.id === selectedBookingId);
    const bookingName = booking ? booking.activity : 'Booking';
    
    if (!confirm('Delete booking?')) return;
    
    const success = await deleteBookingFromDB(selectedBookingId);
    if (success) {
        await loadBookings();
        closeSheets();
        showToast(`Deleted: ${bookingName}`, 'info', '·');
        haptic('heavy');
        
        // Send push notification
        sendLocalNotification(
            'Booking Deleted',
            `${bookingName} has been removed`,
            'booking-deleted'
        );
    } else {
        showToast('Failed to delete booking', 'error', '·');
    }
}

// ADMIN
// CHANGE PASSWORD
function openChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'flex';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    setTimeout(() => {
        document.getElementById('currentPassword').focus();
    }, 100);
}

function closeChangePassword() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

async function submitPasswordChange() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate current password
    if (currentPassword !== ADMIN_PASSWORD) {
        alert('Current password is incorrect!');
        document.getElementById('currentPassword').value = '';
        document.getElementById('currentPassword').focus();
        return;
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 4) {
        alert('New password must be at least 4 characters long!');
        document.getElementById('newPassword').focus();
        return;
    }
    
    // Validate password confirmation
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        document.getElementById('confirmPassword').value = '';
        document.getElementById('confirmPassword').focus();
        return;
    }
    
    // Save new password to database
    try {
        const { error } = await sb
            .from('admin_settings')
            .update({ 
                admin_password: newPassword,
                updated_at: new Date().toISOString()
            })
            .eq('id', 1);
        
        if (error) {
            console.error('Error updating password:', error);
            alert('Failed to update password in database: ' + error.message);
            return;
        }
        
        // Update local variable
        ADMIN_PASSWORD = newPassword;
        
        closeChangePassword();
        alert('Password changed successfully! Your new password is now saved in the database.\nIt will work on all devices!');
        
    } catch (err) {
        console.error('Error updating password:', err);
        alert('Error updating password: ' + err.message);
    }
}


// REALTIME
console.log('Setting up realtime...');
sb.channel('bookings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        console.log('Realtime update detected');
        loadBookings();
    })
    .subscribe();

// INIT
console.log('Setting up DOMContentLoaded listener...');
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded! Starting app...');
    
    // Set initial language
    document.getElementById('languageSelect').value = currentLanguage;
    updatePageLanguage();
    
    // Initialize push notifications
    initPushNotifications();
    
    // Load admin password then bookings
    await loadAdminPassword();
    buildLegend();
    loadBookings();
    updateSidebarMenu();
    showHint();

    // Init swipe to close on all bottom sheets
    initSwipeToClose();

    // Init time of day scene
    startSceneClock();

    // Haptic on FAB tap
    document.querySelector('.fab')?.addEventListener('touchstart', () => haptic('light'), { passive: true });
    
    // Set up Enter key for change password
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitPasswordChange();
        });
    }
});

console.log('Script loaded successfully!');

// ===== PWA INSTALLATION =====
let deferredPrompt;

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw-pwa.js')
            .then((registration) => {
                console.log('✅ PWA Service Worker registered:', registration);
                
                // Check for updates immediately and every 10 seconds
                registration.update();
                setInterval(() => {
                    registration.update();
                }, 10000);
                
                // Auto-reload when new service worker is waiting
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // New service worker available, show toast and reload
                                    console.log('🔄 New version available! Updating...');
                                    showToast('Update tersedia! Memuat ulang...', 'info', '🔄');
                                    
                                    setTimeout(() => {
                                        // Send message to skip waiting
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                        window.location.reload(true); // Hard reload
                                    }, 1000);
                                } else {
                                    // First install
                                    console.log('✅ Service Worker installed for first time');
                                }
                            }
                        });
                    }
                });
                
                // Listen for controlling service worker change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('🔄 Controller changed, reloading...');
                    window.location.reload(true);
                });
            })
            .catch((error) => {
                console.log('❌ PWA Service Worker registration failed:', error);
            });
    });
}

// Capture install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💾 Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button (optional - browser will show its own prompt)
    showInstallPromotion();
});

// Handle successful install
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully!');
    deferredPrompt = null;
    showToast('App installed! You can now use it from your home screen', 'success', '📱');
});

function showInstallPromotion() {
    // Show a subtle toast suggesting installation
    setTimeout(() => {
        if (deferredPrompt && !localStorage.getItem('installPromptShown')) {
            showToast('Tap "Add to Home Screen" to install the app!', 'info', '📲');
            localStorage.setItem('installPromptShown', 'true');
        }
    }, 5000); // Show after 5 seconds
}

// Optional: Manual install trigger function (can be called from a button)
async function installPWA() {
    if (!deferredPrompt) {
        console.log('Install prompt not available');
        return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
    deferredPrompt = null;
}
// ===== TIME OF DAY SCENE =====
const sceneConfig = [
    { id: 'sceneMorning',   label: 'Morning',   start: 5,  end: 10 },
    { id: 'sceneAfternoon', label: 'Afternoon', start: 10, end: 15 },
    { id: 'sceneEvening',   label: 'Evening',   start: 15, end: 18 },
    { id: 'sceneNight',     label: 'Night',      start: 18, end: 29 }, // 29 = next day 5am
];

function getTimeScene() {
    const hour = new Date().getHours();
    // Night wraps: 18-23 and 0-4
    if (hour >= 18 || hour < 5)  return 'sceneNight';
    if (hour >= 15)               return 'sceneEvening';
    if (hour >= 10)               return 'sceneAfternoon';
    return 'sceneMorning';
}

function getSceneLabel() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 5)  return 'Malam';
    if (hour >= 15)               return 'Sore';
    if (hour >= 10)               return 'Siang';
    return 'Pagi';
}

function initTimeScene() {
    const activeId = getTimeScene();
    const isNight  = activeId === 'sceneNight';

    // Hide all scenes first
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));

    // Show the active one
    const active = document.getElementById(activeId);
    if (active) active.classList.add('active');

    // Auto theme: night → dark, day → restore saved preference
    if (isNight) {
        // Save user's current theme before overriding (only if not already night-forced)
        if (!document.documentElement.getAttribute('data-night-forced')) {
            const current = localStorage.getItem('theme') || 'light';
            localStorage.setItem('theme-before-night', current);
            document.documentElement.setAttribute('data-night-forced', 'true');
        }
        applyTheme('dark');
    } else {
        // Restore previous theme if we were night-forced
        if (document.documentElement.getAttribute('data-night-forced')) {
            document.documentElement.removeAttribute('data-night-forced');
            const saved = localStorage.getItem('theme-before-night') || 'light';
            applyTheme(saved);
        }
    }
}

// Update scene every minute in case the user leaves the tab open
function startSceneClock() {
    initTimeScene();
    // Check every minute
    setInterval(initTimeScene, 60 * 1000);
}
