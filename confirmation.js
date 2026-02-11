// ECO-TRONICS 2026 - Confirmation & Screenshot Upload Logic

const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamId = urlParams.get('id');
    const paymentStatus = urlParams.get('payment');

    const teamIdDisplay = document.getElementById('team-id-static');
    const sessionIdDisplay = document.getElementById('session-id-display');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('screenshotInput');
    const preview = document.getElementById('screenshot-preview');
    const uploadIcon = document.getElementById('upload-icon');
    const uploadText = document.getElementById('upload-text');
    const finalSubmit = document.getElementById('final-submit');
    const statusMsg = document.getElementById('status-msg');
    const finalSuccess = document.getElementById('final-success');
    const confirmedId = document.getElementById('confirmed-id');

    if (!teamId) {
        window.location.href = 'registration.html';
        return;
    }

    teamIdDisplay.textContent = teamId;
    sessionIdDisplay.textContent = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    confirmedId.textContent = teamId;

    // --- File Handling ---
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--neon-green)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadIcon.style.display = 'none';
                uploadText.textContent = 'REPLACE_SCREENSHOT';
                finalSubmit.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    }

    // --- Final Submission ---
    finalSubmit.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        setLoading(true);
        try {
            // 1. Upload Screenshot to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `screenshot_${teamId}.${fileExt}`;
            const filePath = `screenshots/${fileName}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('ppt-submissions')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Get URL
            const { data: urlData } = supabaseClient.storage
                .from('ppt-submissions')
                .getPublicUrl(filePath);

            const screenshotUrl = urlData.publicUrl;

            // 3. Update Database (Optionally adding a column or just updating metadata)
            // Note: If you haven't added payment_screenshot column, this might fail or do nothing
            // We'll update the 'registrations' record for this team_id
            const { error: dbError } = await supabaseClient
                .from('registrations')
                .update({ payment_screenshot_url: screenshotUrl })
                .eq('team_id', teamId);

            if (dbError) {
                console.warn("DB update failed (column might be missing), but screenshot uploaded:", dbError);
                // We'll proceed anyway if the screenshot is in storage
            }

            // 4. Show Success
            finalSuccess.style.display = 'flex';
            gsap.from('#final-success > *', {
                opacity: 0,
                y: 30,
                stagger: 0.2,
                duration: 0.8,
                ease: 'power4.out'
            });

        } catch (error) {
            console.error(error);
            statusMsg.textContent = `ERROR: ${error.message}`;
            statusMsg.style.color = '#ff3e3e';
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        if (isLoading) {
            finalSubmit.disabled = true;
            finalSubmit.textContent = 'TRANSMITTING_DATA...';
        } else {
            finalSubmit.disabled = false;
            finalSubmit.textContent = 'FINALIZE_ONBOARDING';
        }
    }
});
