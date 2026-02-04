// ECO-TRONICS 2026 - Registration Logic
// Supabase Integration

// --- CONFIGURATION ---
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://xriqtbeibkhoswbacpgk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyaXF0YmVpYmtob3N3YmFjcGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzczNjQsImV4cCI6MjA4NTc1MzM2NH0.2Y6Cpq67RAyynqI2t1Q7caOWRmvhXgMPa0rj6CuSowM';

// Initialize Supabase client
// Using a different name to avoid conflict with the global 'supabase' object from the CDN
const supabaseClient = (typeof supabase !== 'undefined') ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registration-form');
    const statusMessage = document.getElementById('status-message');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const teamIdDisplay = document.getElementById('teamIdDisplay');
    const successModal = document.getElementById('success-modal');

    if (!registrationForm) return;

    // --- 0. Sequential Team ID Logic ---
    let currentTeamID = "101";

    const fetchNextTeamID = async () => {
        try {
            const { data, error } = await supabaseClient
                .from('registrations')
                .select('team_id')
                .order('team_id', { ascending: false }) // Use numeric order if possible
                .limit(1);

            if (error) {
                console.warn("Sequence fetch error (Table might be empty or missing column):", error.message);
                currentTeamID = "101";
            } else if (data && data.length > 0) {
                const lastId = parseInt(data[0].team_id);
                currentTeamID = (!isNaN(lastId) ? (lastId + 1) : 101).toString();
            } else {
                currentTeamID = "101";
            }
        } catch (err) {
            console.warn("Could not fetch last ID, defaulting to 101:", err);
            currentTeamID = "101";
        }
        updateTeamIDDisplay(currentTeamID);
    };

    // Function to update the UI with the Team ID
    const updateTeamIDDisplay = (id) => {
        const display = document.getElementById('teamIdDisplay');
        const hiddenInput = document.getElementById('teamIdHidden');
        if (display) {
            display.textContent = id;
        }
        if (hiddenInput) {
            hiddenInput.value = id;
        }
    };

    // Initialize by fetching from database
    fetchNextTeamID();

    // Global closeModal function for the modal button
    window.closeModal = () => {
        if (successModal) successModal.style.display = 'none';
        window.location.href = 'index.html'; // Redirect to home after acknowledgment
    };

    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Check if Supabase is initialized
        if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || !supabaseClient) {
            showMessage('SYSTEM_ERROR: Supabase not configured.', 'error');
            return;
        }

        // --- 1. Prepare UI for Loading ---
        setLoading(true);
        hideMessage();

        try {
            // --- 2. Extract Data ---
            const formData = new FormData(registrationForm);
            const teamName = formData.get('teamName');

            // Explicitly get file from input
            const fileInput = document.getElementById('pptFile');
            const pptFile = fileInput.files[0];

            if (!pptFile) {
                throw new Error("No blueprint file detected. Please upload your PPT/PDF.");
            }

            // --- 3. Validate File Name matches Team Name ---
            // Remove extension, spaces, and punctuation for comparison
            const userFileNameRaw = pptFile.name.split('.').slice(0, -1).join('.');
            const userFileNameNormalized = userFileNameRaw.toLowerCase().replace(/[^a-z0-9]/g, '');
            const normalizedTeamName = teamName.toLowerCase().replace(/[^a-z0-9]/g, '');

            if (userFileNameNormalized !== normalizedTeamName) {
                throw new Error(`FILE_NAME_MISMATCH: Your file must be named exactly after your team. \nRequired: "${teamName}.pdf" \nDetected: "${pptFile.name}"`);
            }

            // --- 4. Upload File to Supabase Storage ---
            const timestamp = Date.now(); // Unique timestamp
            const fileExt = pptFile.name.split('.').pop();
            // Sanitize team name for the storage path
            const safeTeamName = teamName.replace(/[^a-z0-9]/gi, '_');
            const fileName = `${safeTeamName}_ID${currentTeamID}_T${timestamp}.${fileExt}`;
            const filePath = `submissions/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('ppt-submissions')
                .upload(filePath, pptFile, {
                    cacheControl: '3600',
                    upsert: true // Enable overwrite to prevent "resource already exists" error
                });

            if (uploadError) throw new Error(`STORAGE_FAILURE: ${uploadError.message}`);

            // Get Public URL for the uploaded file
            const { data: urlData } = supabaseClient.storage
                .from('ppt-submissions')
                .getPublicUrl(filePath);

            const pptUrl = urlData.publicUrl;

            // --- 4. Insert Team Data into Database ---
            const { error: insertError } = await supabaseClient
                .from('registrations')
                .insert([{
                    team_id: currentTeamID,
                    team_name: formData.get('teamName'),
                    track: formData.get('track'),
                    leader_name: formData.get('leaderName'),
                    leader_email: formData.get('leaderEmail'),
                    leader_phone: formData.get('leaderPhone'),
                    leader_college: formData.get('leaderCollege'),
                    leader_dept: formData.get('leaderDept'),
                    leader_year: formData.get('leaderYear'),
                    member2_name: formData.get('member2Name'),
                    member2_email: formData.get('member2Email'),
                    member2_phone: formData.get('member2Phone'),
                    member2_dept: formData.get('member2Dept'),
                    member2_year: formData.get('member2Year'),
                    member3_name: formData.get('member3Name') || null,
                    member3_email: formData.get('member3Email') || null,
                    member3_phone: formData.get('member3Phone') || null,
                    member3_dept: formData.get('member3Dept') || null,
                    member3_year: formData.get('member3Year') || null,
                    member4_name: formData.get('member4Name') || null,
                    member4_email: formData.get('member4Email') || null,
                    member4_phone: formData.get('member4Phone') || null,
                    member4_dept: formData.get('member4Dept') || null,
                    member4_year: formData.get('member4Year') || null,
                    ppt_url: pptUrl,
                    created_at: new Date()
                }]);

            if (insertError) throw new Error(`DATABASE_FAILURE: ${insertError.message}`);

            // --- 5. Success Flow ---
            // Update modal with the ID
            const finalIdTag = document.getElementById('final-team-id');
            if (finalIdTag) finalIdTag.textContent = currentTeamID;

            // Show Modal
            if (successModal) successModal.style.display = 'flex';

            registrationForm.reset();
            // Fetch next ID for the next registration sequence
            fetchNextTeamID();

        } catch (error) {
            console.error('Registration Error:', error);
            let userFriendlyMsg = error.message;

            if (error.message.includes("registrations") && error.message.includes("schema cache")) {
                userFriendlyMsg = "CRITICAL_ERROR: The table 'registrations' does not exist in your Supabase database. Please create it in the Supabase Dashboard.";
            } else if (error.message.includes("row-level security")) {
                userFriendlyMsg = "STORAGE_DENIED: Your Supabase Storage bucket 'ppt-submissions' has RLS enabled. Please add a 'Public Insert' policy in the Supabase Storage settings.";
            } else if (error.message.includes("team_id")) {
                userFriendlyMsg = "SCHEMA_ERROR: The 'team_id' column is missing in your 'registrations' table.";
            }

            showMessage(`UPLINK_ERROR: ${userFriendlyMsg}`, 'error');
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
