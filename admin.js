// ECO-TRONICS 2026 - Admin Dashboard Logic
const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State Management
let allRegistrations = [];
let filteredRegistrations = [];
let currentPage = 1;
const rowsPerPage = 50;
const ADMIN_PASSWORD = 'admin_123'; // Simple password for dashboard

// DOM Elements
const tableBody = document.getElementById('table-body');
const totalCountEl = document.getElementById('total-count');
const ecoCountEl = document.getElementById('eco-count');
const healthCountEl = document.getElementById('health-count');
const edtechCountEl = document.getElementById('edtech-count');
const cleanCountEl = document.getElementById('clean-count');
const urbanCountEl = document.getElementById('urban-count');
const climateCountEl = document.getElementById('climate-count');
const trackFilter = document.getElementById('track-filter');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const searchPassword = document.getElementById('admin-password');
const authBtn = document.getElementById('auth-btn');
const authOverlay = document.getElementById('auth-overlay');
const authError = document.getElementById('auth-error');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toast-message');

// Authentication Logic
authBtn.addEventListener('click', () => {
    if (searchPassword.value === ADMIN_PASSWORD) {
        gsap.to(authOverlay, {
            opacity: 0, duration: 0.5, onComplete: () => {
                authOverlay.style.display = 'none';
                initDashboard();
            }
        });
    } else {
        authError.style.display = 'block';
        gsap.from(authError, { x: 10, repeat: 3, yoyo: true, duration: 0.05 });
    }
});

searchPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') authBtn.click();
});

// Initialize Dashboard
async function initDashboard() {
    await fetchRegistrations();
    setupSubscriptions();
}

// Fetch Data from Supabase
async function fetchRegistrations() {
    try {
        const { data, error } = await supabaseClient
            .from('registrations')
            .select('*')
            .order('team_id', { ascending: true });

        if (error) throw error;

        allRegistrations = data;
        applyFilters();
        updateStats();
    } catch (err) {
        console.error('Error fetching data:', err);
    }
}

// Update Stats Cards
function updateStats() {
    const total = allRegistrations.length;
    const eco = allRegistrations.filter(r => r.track === 'Eco Tech').length;
    const health = allRegistrations.filter(r => r.track === 'Health Tech').length;
    const edtech = allRegistrations.filter(r => r.track === 'EdTech').length;
    const clean = allRegistrations.filter(r => r.track === 'Clean Energy').length;
    const urban = allRegistrations.filter(r => r.track === 'Urban Intelligence').length;
    const climate = allRegistrations.filter(r => r.track === 'Climate Action').length;

    totalCountEl.textContent = total.toString().padStart(2, '0');
    ecoCountEl.textContent = eco.toString().padStart(2, '0');
    healthCountEl.textContent = health.toString().padStart(2, '0');
    edtechCountEl.textContent = edtech.toString().padStart(2, '0');
    cleanCountEl.textContent = clean.toString().padStart(2, '0');
    urbanCountEl.textContent = urban.toString().padStart(2, '0');
    climateCountEl.textContent = climate.toString().padStart(2, '0');
}

// Apply Filters (Client-side)
function applyFilters() {
    const track = trackFilter.value;
    if (track === 'All') {
        filteredRegistrations = allRegistrations;
    } else {
        filteredRegistrations = allRegistrations.filter(r => r.track === track);
    }
    currentPage = 1;
    renderTable();
}

// Render Table Rows
function renderTable() {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const pageData = filteredRegistrations.slice(startIndex, endIndex);

    tableBody.innerHTML = '';

    if (pageData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; opacity: 0.5; padding: 40px;">No registrations found for this sequence.</td></tr>';
    }

    pageData.forEach(reg => {
        const date = new Date(reg.created_at).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${reg.team_id}</td>
            <td style="font-weight: 600;">${reg.team_name}</td>
            <td><span class="track-badge">${reg.track}</span></td>
            <td>${reg.leader_name}</td>
            <td style="font-size: 0.8rem; opacity: 0.7;">${reg.leader_email}</td>
            <td>
                ${reg.ppt_url ? `<a href="${reg.ppt_url}" target="_blank" class="btn-link">VIEW_BLUEPRINT</a>` : '<span style="opacity: 0.3;">N/A</span>'}
            </td>
            <td>
                ${reg.payment_screenshot_url ? `<a href="${reg.payment_screenshot_url}" target="_blank" class="btn-link">CHECK_FUNDS</a>` : '<span style="opacity: 0.3; color: #ffaa00;">PENDING</span>'}
            </td>
            <td style="font-size: 0.75rem; opacity: 0.6;">${date}</td>
        `;
        tableBody.appendChild(row);
    });

    updatePagination();
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredRegistrations.length / rowsPerPage);
    pageInfo.textContent = `PAGE ${currentPage.toString().padStart(2, '0')} / ${Math.max(1, totalPages).toString().padStart(2, '0')}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// Event Listeners
trackFilter.addEventListener('change', applyFilters);

prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredRegistrations.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
});

document.getElementById('refresh-btn').addEventListener('click', () => {
    fetchRegistrations();
    showToast('Manual data synchronization complete.');
});

// Real-Time Subscriptions
function setupSubscriptions() {
    supabaseClient
        .channel('schema-db-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'registrations' },
            (payload) => {
                console.log('Realtime change:', payload);
                handlePayload(payload);
            }
        )
        .subscribe();
}

function handlePayload(payload) {
    if (payload.eventType === 'INSERT') {
        allRegistrations.unshift(payload.new);
        showToast(`New registration received: ${payload.new.team_name}`);
    } else if (payload.eventType === 'UPDATE') {
        const index = allRegistrations.findIndex(r => r.team_id === payload.new.team_id);
        if (index !== -1) {
            allRegistrations[index] = payload.new;
            showToast(`Registration updated: ${payload.new.team_name}`);
        }
    } else if (payload.eventType === 'DELETE') {
        allRegistrations = allRegistrations.filter(r => r.team_id !== payload.old.team_id);
    }

    applyFilters();
    updateStats();
}

// Toast System
function showToast(message) {
    toastMsg.textContent = message;
    toastEl.classList.add('active');
    setTimeout(() => {
        toastEl.classList.remove('active');
    }, 4000);
}
