const hour = new Date().getHours();

let greeting = 'Good evening';
if (hour < 12) greeting = 'Good morning';
else if (hour < 18) greeting = 'Good afternoon';

document.getElementById('greeting').textContent = `${greeting}, welcome!`;
document.getElementById('subtitle').textContent = `It's ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} where you are.`;

const form = document.getElementById('user-form');
const result = document.getElementById('form-result');
const userList = document.getElementById('user-list');

function showResult(className, message, details = []) {
	result.className = className;
	result.textContent = message;
	if (details.length) {
		const list = document.createElement('ul');
		for (const detail of details) {
			const item = document.createElement('li');
			item.textContent = detail;
			list.append(item);
		}
		result.append(list);
	}
}

async function loadUsers() {
	try {
		const response = await fetch('/api/users');
		const { dbData } = await response.json();
		userList.replaceChildren();
		if (!dbData.length) {
			const item = document.createElement('li');
			item.textContent = 'No users yet.';
			userList.append(item);
		}
		for (const user of dbData) {
			const item = document.createElement('li');
			const label = document.createElement('span');
			label.textContent = `${user.name} (${user.email})`;
			const deleteButton = document.createElement('button');
			deleteButton.type = 'button';
			deleteButton.className = 'delete-user';
			deleteButton.textContent = '×';
			deleteButton.title = `Delete ${user.name}`;
			deleteButton.setAttribute('aria-label', `Delete ${user.name}`);
			deleteButton.addEventListener('click', () => deleteUser(user, deleteButton));
			item.append(label, deleteButton);
			userList.append(item);
		}
	} catch {
		userList.textContent = 'Could not load users.';
	}
}

async function deleteUser(user, button) {
	if (!confirm(`Delete ${user.name} (${user.email})?`)) return;
	button.disabled = true;
	try {
		const response = await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
		const body = await response.json();
		if (response.ok) {
			showResult('success', `Deleted ${user.name} (${user.email}).`);
		} else {
			showResult('error', body.error);
		}
		loadUsers();
	} catch {
		showResult('error', 'Request failed. Is the worker running?');
		button.disabled = false;
	}
}

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	const button = form.querySelector('button');
	button.disabled = true;
	try {
		const response = await fetch('/api/users', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: form.name.value, email: form.email.value }),
		});
		const body = await response.json();
		if (response.ok) {
			showResult('success', `Saved ${body.user.name} (${body.user.email}).`);
			form.reset();
			loadUsers();
		} else {
			showResult('error', body.error, body.details);
		}
	} catch {
		showResult('error', 'Request failed. Is the worker running?');
	} finally {
		button.disabled = false;
	}
});

loadUsers();
