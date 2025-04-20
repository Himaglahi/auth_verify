// ✅ Already declared in supabaseClient.js
// const supabaseClient = supabase.createClient(...);

document.addEventListener("DOMContentLoaded", () => {
    let currentUser = null;

    // ✅ Check current session
    supabaseClient.auth.getSession().then(({ data }) => {
        if (data.session) {
            currentUser = data.session.user;
            initDashboard(currentUser);
        } else {
            window.location.href = "login.html";
        }
    });

    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (session) {
            currentUser = session.user;
            initDashboard(currentUser);
        }
    });

    async function initDashboard(user) {
        const { data: userData } = await supabaseClient
            .from("users")
            .select("id, role")
            .eq("email", user.email)
            .maybeSingle();

        if (userData && userData.role === "teacher") {
            document.getElementById("post-announcement").style.display = "block";
            loadSubjects(userData.id);
            loadSchedule(userData.id);
        }

        loadSections(); // static for now
    }

    async function loadSubjects(teacherId) {
        const { data, error } = await supabaseClient
            .from("schedules")
            .select("subject_code")
            .eq("teacher_id", teacherId);

        const subjectDropdown = document.getElementById("subject");
        subjectDropdown.innerHTML = `<option value="">Select Subject</option>`;
        const added = new Set();

        data?.forEach(row => {
            if (!added.has(row.subject_code)) {
                let opt = document.createElement("option");
                opt.value = row.subject_code;
                opt.textContent = row.subject_code;
                subjectDropdown.appendChild(opt);
                added.add(row.subject_code);
            }
        });
    }

    function loadSections() {
        const sectionDropdown = document.getElementById("section");
        sectionDropdown.innerHTML = `
            <option value="">Select Section</option>
            <option value="3A">Block 3A</option>
            <option value="3B">Block 3B</option>
            <option value="3C">Block 3C</option>
        `;
    }

    async function loadSchedule(teacherId) {
        const { data, error } = await supabaseClient
            .from("schedules")
            .select("subject_code, time_slot")
            .eq("teacher_id", teacherId);

        const tableBody = document.querySelector("#schedule-table tbody");
        tableBody.innerHTML = "";

        data?.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${row.time_slot}</td><td colspan="6">${row.subject_code}</td>`;
            tableBody.appendChild(tr);
        });
    }

    document.getElementById("announcement-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const subject = document.getElementById("subject").value;
        const section = document.getElementById("section").value;
        const message = document.getElementById("message").value;

        if (!subject || !section || !message) {
            alert("All fields are required.");
            return;
        }

        const { data: userData } = await supabaseClient
            .from("users")
            .select("id")
            .eq("email", currentUser.email)
            .maybeSingle();

        const { data: schedule } = await supabaseClient
            .from("schedules")
            .select("id")
            .eq("teacher_id", userData.id)
            .eq("subject_code", subject)
            .maybeSingle();

        const { error } = await supabaseClient.from("announcements").insert([{
            teacher_id: userData.id,
            schedule_id: schedule?.id || null,
            subject_code: subject,
            section,
            message,
        }]);

        if (error) {
            alert("Failed to post announcement.");
        } else {
            alert("Announcement posted!");
            e.target.reset();
        }
    });

    document.getElementById("logout").addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });
});