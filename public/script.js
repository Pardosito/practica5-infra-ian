const hour = new Date().getHours();

let greeting = 'Good evening';
if (hour < 12) greeting = 'Good morning';
else if (hour < 18) greeting = 'Good afternoon';

document.getElementById('greeting').textContent = `${greeting}, welcome!`;
document.getElementById('subtitle').textContent = `It's ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} where you are.`;
