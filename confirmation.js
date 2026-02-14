// ECO-TRONICS 2026 - Confirmation & Screenshot Upload Logic

const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const regId = urlParams.get('id');

    if (!regId) {
        window.location.href = 'registration.html';
        return;
    }

    // Set display values. We fetch the actual team_id in syncTeamData.
    teamIdDisplay.textContent = "VERIFYING...";
    sessionIdDisplay.textContent = `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    confirmedId.textContent = "RESERVED";

    // --- Automatic Data Sync ---
    const syncTeamData = async () => {
        try {
            const savedData = JSON.parse(sessionStorage.getItem(`reg_data_${regId}`));
            if (savedData) {
                if (savedData.team_id) {
                    teamIdDisplay.textContent = savedData.team_id;
                    confirmedId.textContent = savedData.team_id;
                }
            } else {
                // If no saved data, fetch the team_id for display
                const { data, error } = await supabaseClient
                    .from('registrations')
                    .select('team_id')
                    .eq('id', regId)
                    .single();

                if (error) {
                    console.warn("Could not fetch team_id:", error.message);
                } else if (data) {
                    teamIdDisplay.textContent = data.team_id;
                    confirmedId.textContent = data.team_id;
                }
            }
        } catch (err) {
            console.warn("Sync error:", err);
        }
    };
    syncTeamData();

    // --- File Handling ---
    if (dropZone) dropZone.addEventListener('click', () => fileInput.click());

    if (fileInput) fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    if (dropZone) {
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
    }

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
            const fileName = `screenshot_${regId}.${fileExt}`;
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

            // 3. Update Database (Targeting UUID only for stability)
            const { data: updatedRows, error: updateError } = await supabaseClient
                .from('registrations')
                .update({
                    payment_status: 'paid',
                    payment_screenshot: screenshotUrl,
                    payment_updated_at: new Date()
                })
                .eq('id', regId)
                .select();

            if (updateError) {
                console.error("Database update failed:", updateError);
                throw new Error("Failed to update payment status. Please contact support.");
            }

            if (!updatedRows || updatedRows.length === 0) {
                console.warn("Update Warning: No record found for ID:", regId);
                throw new Error("No matching registration found. Please ensure you used the correct link.");
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
