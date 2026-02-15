// ECO-TRONICS 2026 - Confirmation & Screenshot Upload Logic

const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('screenshotInput');
    const preview = document.getElementById('screenshot-preview');
    const uploadIcon = document.getElementById('upload-icon');
    const uploadText = document.getElementById('upload-text');
    const finalSubmit = document.getElementById('final-submit');
    const statusMsg = document.getElementById('status-msg');
    const finalSuccess = document.getElementById('final-success');
    const teamIdDisplay = document.getElementById('team-id-static');
    const sessionIdDisplay = document.getElementById('session-id-display');
    const confirmedId = document.getElementById('confirmed-id');

    const urlParams = new URLSearchParams(window.location.search);
    const regId = urlParams.get('id');

    if (!regId) {
        window.location.href = 'registration.html';
        return;
    }

    // Set initial display values
    if (sessionIdDisplay) sessionIdDisplay.textContent = regId;
    if (teamIdDisplay) teamIdDisplay.textContent = "FETCHING...";
    if (confirmedId) confirmedId.textContent = "...";

    // --- Data Sync ---
    const fetchTeamData = async () => {
        try {
            const { data, error } = await supabaseClient
                .from('registrations')
                .select('team_id')
                .eq('id', regId)
                .single();

            if (error) {
                console.warn("Could not fetch team_id:", error.message);
                if (teamIdDisplay) teamIdDisplay.textContent = "NOT_FOUND";
            } else if (data) {
                if (teamIdDisplay) teamIdDisplay.textContent = data.team_id;
                if (confirmedId) confirmedId.textContent = data.team_id;
            }
        } catch (err) {
            console.error("Sync error:", err);
        }
    };
    fetchTeamData();

    // --- File Handling ---
    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput && fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--neon-green)';
            dropZone.style.background = 'rgba(0, 255, 136, 0.05)';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            dropZone.style.background = 'rgba(255, 255, 255, 0.02)';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
            }
        });
    }

    function handleFileSelect(file) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
            if (uploadIcon) uploadIcon.style.display = 'none';
            if (uploadText) uploadText.textContent = 'REPLACE_SCREENSHOT';
            if (finalSubmit) finalSubmit.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    // --- Final Submission ---
    if (finalSubmit) {
        finalSubmit.addEventListener('click', async () => {
            const file = fileInput.files[0];
            if (!file) {
                if (statusMsg) {
                    statusMsg.textContent = "ERROR: Please select a screenshot first.";
                    statusMsg.style.color = "#ff4d4d";
                }
                return;
            }

            setLoading(true);
            if (statusMsg) statusMsg.textContent = "";

            try {
                // 1. Upload to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const filePath = `screenshots/${regId}.${fileExt}`; // This results in payment-screenshots/<UUID>.<ext>

                const { error: uploadError } = await supabaseClient.storage
                    .from('ppt-submissions')
                    .upload(filePath, file, {
                        upsert: true,
                        contentType: file.type
                    });

                if (uploadError) throw uploadError;

                // 2. Get Public URL
                const { data: urlData } = supabaseClient.storage
                    .from('ppt-submissions')
                    .getPublicUrl(filePath);

                const publicUrl = urlData.publicUrl;

                // 3. Update registrations row matching by UUID (regId)
                const { data: updateData, error: updateError, count } = await supabaseClient
                    .from('registrations')
                    .update({
                        payment_status: 'paid',
                        payment_screenshot: publicUrl,
                        payment_updated_at: new Date()
                    })
                    .eq('id', regId)
                    .select();

                if (updateError) throw updateError;

                if (!updateData || updateData.length === 0) {
                    console.warn("Update Warning: 0 rows affected for ID:", regId);
                    if (statusMsg) {
                        statusMsg.textContent = "WARNING: No matching record found to update.";
                        statusMsg.style.color = "#ffcc00";
                    }
                    setLoading(false);
                    return;
                }

                // 4. Show Success Overlay
                if (finalSuccess) {
                    finalSuccess.style.display = 'flex';
                    if (typeof gsap !== 'undefined') {
                        gsap.from('#final-success > *', {
                            opacity: 0,
                            y: 30,
                            stagger: 0.2,
                            duration: 0.8,
                            ease: 'power4.out'
                        });
                    }
                }

            } catch (error) {
                console.error("Process failed:", error);
                if (statusMsg) {
                    statusMsg.textContent = `FAILURE: ${error.message || 'Unknown error during upload'}`;
                    statusMsg.style.color = "#ff4d4d";
                }
            } finally {
                setLoading(false);
            }
        });
    }

    function setLoading(isLoading) {
        if (!finalSubmit) return;
        if (isLoading) {
            finalSubmit.disabled = true;
            finalSubmit.textContent = 'VERIFYING_PAYMENT...';
            finalSubmit.style.opacity = '0.7';
        } else {
            finalSubmit.disabled = false;
            finalSubmit.textContent = 'FINALIZE_ONBOARDING';
            finalSubmit.style.opacity = '1';
        }
    }
});

