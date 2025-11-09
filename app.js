// Simple client-side 'Online Banking' demo using localStorage
// Demo accounts structure:
// accounts = { username: { username, pin, balance, tx: [ {type, amount, to, from, date} ] } }

const demoAccounts = {
  Shivam: { username: 'Shivam', pin: 'Shivam@321', balance: 5000.00, tx: [] },
  Ritik: { username: 'Ritik', pin: 'Ritik@321', balance: 2500.00, tx: [] }
};

function saveAccounts(accounts){
  localStorage.setItem('obs_accounts', JSON.stringify(accounts));
}
function loadAccounts(){
  return JSON.parse(localStorage.getItem('obs_accounts') || '{}');
}
function ensureDemo(){
  const acc = loadAccounts();
  if(!acc.Shivam || !acc.Ritik){
    saveAccounts(demoAccounts);
    return demoAccounts;
  }
  return acc;
}

function formatCurrency(n){ return '₹' + Number(n).toFixed(2); }
function now(){ return new Date().toLocaleString(); }

// UI elements
const authSec = document.getElementById('auth');
const dashSec = document.getElementById('dashboard');
const loginBtn = document.getElementById('loginBtn');
const createDemoBtn = document.getElementById('createDemoBtn');
const logoutBtn = document.getElementById('logoutBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const welcomeEl = document.getElementById('welcome');
const balanceEl = document.getElementById('balance');
const accIdEl = document.getElementById('accId');
const txList = document.getElementById('txList');

let current = null;
let accounts = ensureDemo();

function renderDashboard(){
  if(!current) return;
  welcomeEl.textContent = 'Welcome, ' + current.username;
  balanceEl.textContent = formatCurrency(current.balance);
  accIdEl.textContent = current.username;
  renderTx();
}

function renderTx(){
  txList.innerHTML = '';
  const list = (current.tx || []).slice().reverse();
  if(list.length === 0){
    txList.innerHTML = '<li>No transactions yet.</li>';
    return;
  }
  list.forEach(t => {
    const li = document.createElement('li');
    li.textContent = `[${t.date}] ${t.type.toUpperCase()} - ${formatCurrency(t.amount)} ${t.to ? 'to ' + t.to : t.from ? 'from ' + t.from : ''}`;
    txList.appendChild(li);
  });
}

loginBtn.addEventListener('click', () => {
  const u = usernameInput.value.trim();
  const p = passwordInput.value.trim();
  accounts = loadAccounts();
  if(!accounts[u]) return alert('User not found. Click "Create demo accounts" to set up demo users.');
  if(accounts[u].pin !== p) return alert('Incorrect PIN');
  current = accounts[u];
  authSec.classList.add('hidden');
  dashSec.classList.remove('hidden');
  renderDashboard();
});

createDemoBtn.addEventListener('click', () => {
  saveAccounts(demoAccounts);
  alert('Demo accounts created: user1 / 1111 and user2 / 2222');
  accounts = loadAccounts();
});

logoutBtn.addEventListener('click', () => {
  current = null;
  authSec.classList.remove('hidden');
  dashSec.classList.add('hidden');
  usernameInput.value = '';
  passwordInput.value = '';
});

// Transfer
document.getElementById('transferBtn').addEventListener('click', () => {
  const to = document.getElementById('toUser').value.trim();
  const amt = Number(document.getElementById('transferAmount').value);
  if(!current) return alert('Login first');
  if(!to || !amt || amt <= 0) return alert('Enter valid recipient and amount');
  accounts = loadAccounts();
  if(!accounts[to]) return alert('Recipient not found');
  if(accounts[current.username].balance < amt) return alert('Insufficient balance');
  // debit current
  accounts[current.username].balance -= amt;
  accounts[current.username].tx = accounts[current.username].tx || [];
  accounts[current.username].tx.push({ type: 'transfer-out', amount: amt, to, date: now() });
  // credit recipient
  accounts[to].balance += amt;
  accounts[to].tx = accounts[to].tx || [];
  accounts[to].tx.push({ type: 'transfer-in', amount: amt, from: current.username, date: now() });
  saveAccounts(accounts);
  current = accounts[current.username];
  alert('Transfer successful');
  renderDashboard();
});

// Deposit / Withdraw
document.getElementById('depositBtn').addEventListener('click', () => {
  const amt = Number(document.getElementById('cashAmount').value);
  if(!current) return alert('Login first');
  if(!amt || amt <= 0) return alert('Enter valid amount');
  accounts = loadAccounts();
  accounts[current.username].balance += amt;
  accounts[current.username].tx = accounts[current.username].tx || [];
  accounts[current.username].tx.push({ type: 'deposit', amount: amt, date: now() });
  saveAccounts(accounts);
  current = accounts[current.username];
  alert('Deposit successful');
  renderDashboard();
});

document.getElementById('withdrawBtn').addEventListener('click', () => {
  const amt = Number(document.getElementById('cashAmount').value);
  if(!current) return alert('Login first');
  if(!amt || amt <= 0) return alert('Enter valid amount');
  accounts = loadAccounts();
  if(accounts[current.username].balance < amt) return alert('Insufficient balance');
  accounts[current.username].balance -= amt;
  accounts[current.username].tx = accounts[current.username].tx || [];
  accounts[current.username].tx.push({ type: 'withdraw', amount: amt, date: now() });
  saveAccounts(accounts);
  current = accounts[current.username];
  alert('Withdrawal successful');
  renderDashboard();
});

document.getElementById('clearTx').addEventListener('click', () => {
  if(!current) return;
  if(!confirm('Clear your transaction history? This cannot be undone.')) return;
  accounts = loadAccounts();
  accounts[current.username].tx = [];
  saveAccounts(accounts);
  current = accounts[current.username];
  renderDashboard();
});

// Init: if a session exists, keep logged out by default
(function init(){
  ensureDemo();
})();