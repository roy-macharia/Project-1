const content = document.getElementById('content');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let loginTimer;

if (currentUser) startLoginTimer();

// Event Listeners
document.getElementById('homeBtn').addEventListener('click', loadHome);
document.getElementById('journalBtn').addEventListener('click', loadJournals);
document.getElementById('communityBtn').addEventListener('click', loadCommunity);
document.getElementById('therapistBtn').addEventListener('click', loadTherapists);
document.getElementById('resourcesBtn').addEventListener('click', loadResources);
document.getElementById('bookingsBtn').addEventListener('click', loadBookings);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);

loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
signupBtn.addEventListener('click', () => signupModal.style.display = 'flex');
document.getElementById('closeLogin').addEventListener('click', () => loginModal.style.display = 'none');
document.getElementById('closeSignup').addEventListener('click', () => signupModal.style.display = 'none');
document.getElementById('loginSubmit').addEventListener('click', handleLogin);
document.getElementById('signupSubmit').addEventListener('click', handleSignup);
logoutBtn.addEventListener('click', handleLogout);

applySavedTheme();

// Authentication Handlers
function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    fetch('/api/users?username=' + username)
        .then(res => res.json())
        .then(users => {
            if (users.length && users[0].password === password) {
                currentUser = users[0];
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                startLoginTimer();
                alert('Login successful!');
                loginModal.style.display = 'none';
                updateAuthDisplay();
                loadHome();
            } else {
                alert('Invalid credentials');
            }
        });
}

function handleSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }

    fetch('/api/users?username=' + username)
        .then(res => res.json())
        .then(users => {
            if (users.length) {
                alert('Username already exists. Please choose another one.');
            } else {
                fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                })
                    .then(res => res.json())
                    .then(user => {
                        alert('Signup successful! Please login.');
                        signupModal.style.display = 'none';
                    });
            }
        });
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    clearTimeout(loginTimer);
    alert('Logged out successfully');
    updateAuthDisplay();
    loadHome();
}

function startLoginTimer() {
    clearTimeout(loginTimer);
    loginTimer = setTimeout(() => {
        alert('Session expired. You have been logged out.');
        handleLogout();
    }, 5 * 60 * 1000);
}

function updateAuthDisplay() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

function loadHome() {
    content.innerHTML = `
        <h2>Welcome to Mind Vitals</h2>
        <p>Your space for safe, stigma-free mental health support.</p>
    `;
}

async function loadJournals() {
    if (!currentUser) return alert('Please login to view your journal.');

    const res = await fetch(`/api/journals?userId=${currentUser.id}`);
    const journals = await res.json();
    content.innerHTML = `
        <h2>My Journal</h2>
        <button id="addJournalBtn" class="primary-btn">Add Entry</button>
    ` + (journals.length ? journals.map(j => `
        <div class="card">
            <h3>${j.title}</h3>
            <p>${j.content}</p>
            <p><em>Mood: ${j.mood}</em></p>
        </div>
    `).join('') : '<p>You have no journal entries yet.</p>');

    document.getElementById('addJournalBtn').addEventListener('click', showAddJournalForm);
}

function showAddJournalForm() {
    content.innerHTML = `
        <h2>New Journal Entry</h2>
        <input type="text" id="journalTitle" placeholder="Title" class="input"><br><br>
        <textarea id="journalContent" placeholder="Your thoughts..." class="textarea"></textarea><br><br>
        <input type="text" id="journalMood" placeholder="Mood" class="input"><br><br>
        <button id="saveJournal" class="primary-btn">Save</button>
        <button id="cancelJournal" class="secondary-btn">Cancel</button>
    `;

    document.getElementById('saveJournal').addEventListener('click', saveJournal);
    document.getElementById('cancelJournal').addEventListener('click', loadJournals);
}

function saveJournal() {
    const title = document.getElementById('journalTitle').value.trim();
    const contentText = document.getElementById('journalContent').value.trim();
    const mood = document.getElementById('journalMood').value.trim();

    if (!title || !contentText || !mood) {
        alert('Please fill all fields.');
        return;
    }

    fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, title, content: contentText, mood })
    })
        .then(() => loadJournals());
}

async function loadCommunity() {
    const res = await fetch('/api/communityPosts');
    const posts = await res.json();
    content.innerHTML = '<h2>Community Space</h2>';

    if (currentUser) {
        content.innerHTML += `
            <textarea id="communityMessage" placeholder="Share your thoughts..." class="textarea"></textarea><br>
            <label><input type="checkbox" id="anonymousCheckbox"> Post as anonymous</label><br>
            <button id="postCommunity" class="primary-btn">Post</button>
        `;
    }

    content.innerHTML += posts.map(p => `
        <div class="card">
            <h3>${p.author}</h3>
            <p>${p.message}</p>
            <h4>Comments:</h4>
            <div id="comments${p.id}">
                ${(p.comments || []).map(c => `
                    <p><strong>${c.author}:</strong> ${c.text}
                    ${currentUser && c.author === currentUser.username ? `<button onclick="deleteComment(${p.id}, '${c.text}')">Delete</button>` : ''}</p>
                `).join('')}
            </div>
            ${currentUser ? `
                <input type="text" placeholder="Add a comment" id="commentInput${p.id}" class="input">
                <button class="primary-btn" onclick="addComment(${p.id})">Comment</button>
                ${p.author === currentUser.username ? `<button class="secondary-btn" onclick="deletePost(${p.id})">Delete Post</button>` : ''}
            ` : ''}
        </div>
    `).join('');

    if (currentUser) {
        document.getElementById('postCommunity').addEventListener('click', postCommunityMessage);
    }
}

function postCommunityMessage() {
    const message = document.getElementById('communityMessage').value.trim();
    const anonymous = document.getElementById('anonymousCheckbox').checked;
    if (!message) return alert('Please enter a message.');

    fetch('/api/communityPosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            author: anonymous ? 'Anonymous' : currentUser.username,
            message,
            comments: []
        })
    })
        .then(() => loadCommunity());
}

function addComment(postId) {
    const input = document.getElementById(`commentInput${postId}`);
    const text = input.value.trim();
    if (!text) return alert('Please enter a comment.');

    fetch(`/api/communityPosts/${postId}`)
        .then(res => res.json())
        .then(post => {
            post.comments = post.comments || [];
            post.comments.push({ author: currentUser.username, text });

            return fetch(`/api/communityPosts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });
        })
        .then(() => loadCommunity());
}

function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    fetch(`/api/communityPosts/${postId}`, { method: 'DELETE' })
        .then(() => loadCommunity());
}

function deleteComment(postId, text) {
    fetch(`/api/communityPosts/${postId}`)
        .then(res => res.json())
        .then(post => {
            post.comments = post.comments.filter(c => !(c.author === currentUser.username && c.text === text));

            return fetch(`/api/communityPosts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(post)
            });
        })
        .then(() => loadCommunity());
}

function loadHome() {
    content.innerHTML = `
        <h2>Welcome to Mind Vitals</h2>
        <p>Your space for safe, stigma-free mental health support.</p>

        <div class="home-section">
            <img src="https://images.unsplash.com/photo-1526256262350-7da7584cf5eb" alt="Relaxation" class="home-img">
            <div>
                <h3>Prioritize Your Mental Well-being</h3>
                <p>Explore resources, connect with therapists, and express yourself through journaling. You are not alone.</p>
            </div>
        </div>

        <div class="home-section">
            <div>
                <h3>Join Our Supportive Community</h3>
                <p>Share your experiences, uplift others, and find comfort in our safe community space.</p>
            </div>
            <img src="https://images.unsplash.com/photo-1532635248-2f969b3a9d3c" alt="Community" class="home-img">
        </div>

        <div class="home-section">
            <img src="https://images.unsplash.com/photo-1618005198919-778b3f0c1b36" alt="Therapy" class="home-img">
            <div>
                <h3>Professional Support at Your Fingertips</h3>
                <p>Connect with licensed therapists for confidential, professional guidance whenever you need it.</p>
            </div>
        </div>
    `;
}

async function loadTherapists() {
    const res = await fetch('/api/therapists');
    const therapists = await res.json();
    content.innerHTML = '<h2>Find a Therapist</h2>' + therapists.map(t => `
        <div class="card">
            <h3>${t.name}</h3>
            <p>${t.specialization}</p>
            <p>Available: ${t.availability}</p>
            ${currentUser ? `<button class="primary-btn" onclick="bookTherapist(${t.id}, '${t.name}')">Book Appointment</button>` : '<p><em>Login to book</em></p>'}
        </div>
    `).join('');
}

async function loadResources() {
    content.innerHTML = '<h2>Resources</h2>';
    fetch('/api/resources')
        .then(res => res.json())
        .then(resources => {
            resources.forEach(r => {
                content.innerHTML += `
                    <div class="card">
                        <h3>${r.title}</h3>
                        <p>${r.description}</p>
                        <a href="${r.link}" target="_blank">Visit Site</a>
                    </div>
                `;
            });
        });
}

async function loadBookings() {
    if (!currentUser) return alert('Please login to view your bookings.');

    const res = await fetch(`/api/bookings?userId=${currentUser.id}`);
    const bookings = await res.json();
    content.innerHTML = '<h2>My Appointments</h2>' + (bookings.length ? bookings.map(b => `
        <div class="card">
            <h3>Therapist: ${b.therapistName}</h3>
        </div>
    `).join('') : '<p>You have no bookings yet.</p>');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

function applySavedTheme() {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) document.body.classList.add('dark-mode');
}

loadHome();
updateAuthDisplay();