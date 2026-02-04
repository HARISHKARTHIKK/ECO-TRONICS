// ECO-TRONICS 2026 - Registration Logic
// Supabase Integration

// --- CONFIGURATION ---
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

// Initialize Supabase client
// Note: If URL/Key are placeholders, the script will show an error on submit
const supabase = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    const statusMessage = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');

    if (!registrationForm) return;

    // --- 0. Generate Team ID on Load ---
    const teamIdDisplay = document.getElementById('teamIdDisplay');
    const generateTeamID = () => `ET26-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    let currentTeamID = generateTeamID();
    if (teamIdDisplay) teamIdDisplay.value = currentTeamID;

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if Supabase is initialized
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            showMessage('SYSTEM_ERROR: Supabase credentials not found. Please configure registration.js with your URL and Anon Key.', 'error');
            return;
        }

        // --- 1. Prepare UI for Loading ---
        setLoading(true);
        hideMessage();

        try {
            // --- 2. Extract Form Data ---
            const formData = new FormData(registrationForm);
            const teamName = formData.get('teamName');
            const track = formData.get('track');
            const pptFile = formData.get('pptFile');

            // --- 4. Upload File to Supabase Storage ---
            // Bucket name should be 'ppt-submissions' (ensure this exists in Supabase)
            const timestamp = Date.now();
            const fileExt = pptFile.name.split('.').pop();
            const fileName = `${currentTeamID}_${timestamp}.${fileExt}`;
            const filePath = `submissions/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('ppt-submissions')
                .upload(filePath, pptFile);

            if (uploadError) throw new Error(`STORAGE_FAILURE: ${uploadError.message}`);

            // Get Public URL for the uploaded file
            const { data: urlData } = supabase.storage
                .from('ppt-submissions')
                .getPublicUrl(filePath);

            const pptUrl = urlData.publicUrl;

            // --- 5. Insert Team Data into Database ---
            const { data: insertData, error: insertError } = await supabase
                .from('registrations')
                .insert([{
                    team_id: currentTeamID,
                    team_name: teamName,
                    track: track,
                    leader_name: formData.get('leaderName'),
                    leader_email: formData.get('leaderEmail'),
                    leader_phone: formData.get('leaderPhone'),
                    leader_college: formData.get('leaderCollege'),
                    leader_dept: formData.get('leaderDept'),
                    leader_year: formData.get('leaderYear'),
                    member2_name: formData.get('member2Name'),
                    member2_phone: formData.get('member2Phone'),
                    member2_dept: formData.get('member2Dept'),
                    member2_year: formData.get('member2Year'),
                    member3_name: formData.get('member3Name'),
                    member3_phone: formData.get('member3Phone'),
                    member3_dept: formData.get('member3Dept'),
                    member3_year: formData.get('member3Year'),
                    ppt_url: pptUrl,
                    created_at: new Date()
                }]);

            if (insertError) throw new Error(`DATABASE_FAILURE: ${insertError.message}`);

            // --- 6. Success Flow ---
            showMessage(`MISSION_ACCOMPLISHED: Team ${currentTeamID} registered successfully. Synchronizing sectors...`, 'success');

            // Generate new ID for next possible registration without reload
            registrationForm.reset();
            currentTeamID = generateTeamID();
            if (teamIdDisplay) teamIdDisplay.value = currentTeamID;

            document.getElementById('file-name-display').textContent = 'NO_FILE_DETECTED';
            document.getElementById('upload-icon').textContent = '📂';

        } catch (error) {
            console.error('Registration Error:', error);
            showMessage(`UPLINK_ERROR: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    });

    // Helper: Show UI feedback
    function showMessage(text, type) {
        statusMessage.textContent = text;
        statusMessage.className = type === 'success' ? 'status-success' : 'status-error';
        statusMessage.style.display = 'block';

        // Scroll to message
        statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function hideMessage() {
        statusMessage.style.display = 'none';
    }

    // Helper: Loader state
    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            btnText.innerHTML = '<span class="loader-spinner"></span>SYNCHRONIZING_DATA...';
            submitBtn.style.opacity = '0.7';
            submitBtn.style.cursor = 'wait';
        } else {
            submitBtn.disabled = false;
            btnText.innerHTML = 'DEVISE_REGISTRATION';
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        }
    }
});
