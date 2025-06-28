const content = document.getElementById('content');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const logoutBtn = document.getElementById('logoutBtn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let loginTimer;

if (currentUser) {
    updateAuthDisplay();
    startLoginTimer();
}

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

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    fetch(`http://localhost:3000/users?username=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(users => {
            if (users.length === 0) {
                alert('User not found. Please signup.');
            } else if (users[0].password === password) {
                currentUser = users[0];
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                startLoginTimer();
                updateAuthDisplay();
                alert('Login successful!');
                loginModal.style.display = 'none';
                loadHome();
            } else {
                alert('Incorrect password. Please try again.');
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error logging in. Please try again later.');
        });
}

function handleSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    fetch(`http://localhost:3000/users?username=${encodeURIComponent(username)}`)
        .then(res => res.json())
        .then(users => {
            if (users.length > 0) {
                alert('Username already exists. Please choose another one.');
            } else {
                fetch('http://localhost:3000/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                })
                    .then(res => res.json())
                    .then(newUser => {
                        alert('Signup successful! You can now login.');
                        signupModal.style.display = 'none';
                    })
                    .catch(err => {
                        console.error(err);
                        alert('Error signing up. Please try again later.');
                    });
            }
        })
        .catch(err => {
            console.error(err);
            alert('Error checking username. Please try again later.');
        });
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    clearTimeout(loginTimer);
    updateAuthDisplay();
    alert('Logged out successfully.');
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

// Additional Features

function loadHome() {
    content.innerHTML = `
        <h2>Welcome to Mind Vitals</h2>
        <p>Your safe space for mental health support and connection.</p>
        <div class="home-section">
            <img src="images/home1.jpg" class="home-img">
            <blockquote>"Your mental health is a priority, your happiness is essential, your self-care is a necessity."</blockquote>
        </div>
        <div class="home-section">
            <img src="images/home2.jpg" class="home-img">
            <blockquote>"It's okay to ask for help. It's brave to seek support."</blockquote>
        </div>
        <div class="home-section">
            <h3>Kenyan Mental Health Emergency Contacts</h3>
            <ul>
                <li>Befrienders Kenya: 0722 178 177</li>
                <li>Chiromo Hospital Group: 0730 933 939</li>
                <li>Red Cross Psychological Support: 1199</li>
            </ul>
        </div>
    `;
}

function loadJournals() {
    if (!currentUser) return alert('Please login to view your journal.');
    fetch(`http://localhost:3000/journals?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(journals => {
            content.innerHTML = `<h2>My Journal</h2><button id="addJournalBtn" class="primary-btn">Add Entry</button>`;
            if (journals.length) {
                journals.forEach(j => {
                    content.innerHTML += `
                        <div class="card">
                            <h3>${j.title}</h3>
                            <p>${j.content}</p>
                            <p><em>Mood: ${j.mood}</em></p>
                            <button onclick="deleteJournal(${j.id})" class="secondary-btn">Delete</button>
                        </div>
                    `;
                });
            } else {
                content.innerHTML += '<p>You have no journal entries yet.</p>';
            }
            document.getElementById('addJournalBtn').addEventListener('click', showAddJournalForm);
        });
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
    if (!title || !contentText || !mood) return alert('Please fill all fields.');

    fetch('http://localhost:3000/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, title, content: contentText, mood })
    }).then(loadJournals);
}

function deleteJournal(journalId) {
    if (!confirm('Delete this journal entry?')) return;
    fetch(`http://localhost:3000/journals/${journalId}`, { method: 'DELETE' })
        .then(loadJournals);
}

function loadTherapists() {
    fetch('http://localhost:3000/therapists')
        .then(res => res.json())
        .then(therapists => {
            content.innerHTML = '<h2>Therapists</h2>';
            therapists.forEach(t => {
                content.innerHTML += `
                    <div class="card">
                        <img src="${t.image}" class="therapist-img">
                        <h3>${t.name}</h3>
                        <p>${t.speciality}</p>
                        <p>Hours: ${t.hours}</p>
                        ${currentUser ? `<button class="primary-btn" onclick="bookTherapist(${t.id}, '${t.name}')">Book</button>` : '<em>Login to book</em>'}
                    </div>
                `;
            });
        });
}

function bookTherapist(therapistId, therapistName) {
    const date = prompt('Enter preferred appointment date and time (e.g. 2024-07-10 10:00am):');
    if (!date) return;

    fetch('http://localhost:3000/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, therapistId, therapistName, date })
    }).then(() => {
        alert('Appointment booked successfully!');
        loadBookings();
    });
}

function loadBookings() {
    if (!currentUser) return alert('Please login to view your bookings.');
    fetch(`http://localhost:3000/bookings?userId=${currentUser.id}`)
        .then(res => res.json())
        .then(bookings => {
            content.innerHTML = '<h2>My Appointments</h2>';
            if (bookings.length) {
                bookings.forEach(b => {
                    content.innerHTML += `
                        <div class="card">
                            <h3>Therapist: ${b.therapistName}</h3>
                            <p>Date: ${b.date}</p>
                        </div>
                    `;
                });
            } else {
                content.innerHTML += '<p>You have no bookings yet.</p>';
            }
        });
}

function loadCommunity() {
    fetch('http://localhost:3000/communityPosts')
        .then(res => res.json())
        .then(posts => {
            content.innerHTML = '<h2>Community Space</h2>';
            if (currentUser) {
                content.innerHTML += `
                    <textarea id="communityMessage" placeholder="Share your thoughts..." class="textarea"></textarea><br>
                    <label><input type="checkbox" id="anonymousCheckbox"> Post anonymously</label><br>
                    <button id="postCommunity" class="primary-btn">Post</button>
                `;
            }
            posts.forEach(p => {
                content.innerHTML += `
                    <div class="card">
                        <h3>${p.author}</h3>
                        <p>${p.message}</p>
                    </div>
                `;
            });
            if (currentUser) {
                document.getElementById('postCommunity').addEventListener('click', postCommunityMessage);
            }
        });
}

function postCommunityMessage() {
    const message = document.getElementById('communityMessage').value.trim();
    const anonymous = document.getElementById('anonymousCheckbox').checked;
    if (!message) return alert('Please enter a message.');

    fetch('http://localhost:3000/communityPosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: anonymous ? 'Anonymous' : currentUser.username, message })
    }).then(loadCommunity);
}

function loadResources() {
    fetch('http://localhost:3000/resources')
        .then(res => res.json())
        .then(resources => {
            content.innerHTML = '<h2>Resources</h2>';
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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function applySavedTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// Initialize
loadHome();
updateAuthDisplay();