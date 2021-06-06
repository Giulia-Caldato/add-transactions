const storageKey = 'savedAccount';

let state = {
  account: null
};

const routes = {
    '/login': { templateId: 'login' },
    '/logout': { templateId: '', init: logout },
    '/dashboard': {
      templateId: 'dashboard',
      init: updateDashboard
    },
};

function updateState(property, newData) {
  state = Object.freeze({
    ...state,
    [property]: newData
  });

  localStorage.setItem(storageKey, JSON.stringify(state.account));
}

async function loadStateSnapshot() {
  const textFromStorage = localStorage.getItem(storageKey);

  if (textFromStorage && textFromStorage != 'null') {
    const savedAccount = JSON.parse(textFromStorage);

    updateState('account', savedAccount);
    navigate('/dashboard');

    const updatedData = await getAccount(savedAccount.user);

    if (!updatedData.error) {
      updateState('account', updatedData);
    }
  }

  updateRoute();
}

function updateRoute() {
    const path = window.location.pathname;
    const route = routes[path];

    if (!route) {
        return navigate('/login');
    }

    const template = document.getElementById(route.templateId);
    const view = template?.content.cloneNode(true);
    const app = document.getElementById('app');

    app.innerHTML = '';

    if (typeof route.init === 'function') {
      route.init(view);
    }

    if (view) {
      app.appendChild(view);
    }
}

function updateDashboard(view) {
  const viewModel = {
    ...state.account,
    formattedBalance: state.account.balance.toFixed(2)
  };

  bind(view, viewModel);

  const template = document.getElementById('transaction');
  const table = view.querySelector("tbody");

  for (let transaction of state.account.transactions) {
    const row = template.content.cloneNode(true);
    const viewModel = {
      ...transaction,
      formattedAmount: transaction.amount.toFixed(2)
    };

    bind(row, viewModel);
    table.append(row);
  }

}

function bind(target, model) {
  for (let [ key, value ] of Object.entries(model)) {
    const selector = `[data-bind=${key}]`;
    const elements = target.querySelectorAll(selector);
    elements.forEach(element => { element.textContent = value });
  }
}

function navigate(path) {
    const location = path.startsWith('/') ? window.location.origin + path : path;
    window.history.pushState({}, path, location);
    updateRoute();
}

function onLinkClick(event) {
    event.preventDefault();
    navigate(event.target.href);
}

async function register(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  const jsonData = JSON.stringify(data);
  const response = await createAccount(jsonData);

  updateState('account', response);
  navigate('/dashboard');
}

async function createAccount(account) {
  const response = await fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: account
  });

  return await response.json();
}

async function login(event) {
  event.preventDefault();
  const user = event.target.user.value;
  const data = await getAccount(user);

  if (!data || data.error) {
    const message = data?.error || "An unknown error has occurred.";
    alert(message);
    return;
  }

  updateState('account', data);
  navigate('/dashboard');
}

function logout() {
  updateState('account', null);
  navigate('/login');
}

async function getAccount(user) {
  const response = await fetch('/api/accounts/' + encodeURIComponent(user));
  return await response.json();
}

window.onpopstate = () => updateRoute();

loadStateSnapshot();