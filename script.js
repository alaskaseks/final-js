'use strict';

const api = 'https://open.er-api.com/v6/latest/USD';
const name = 'currencyAppCache';
const ttl = 10 * 60 * 1000;

const lastUpdateEl = document.getElementById('lastUpdate');
const refreshBtn = document.getElementById('refreshBtn');
const ratesTableBody = document.querySelector('#ratesTable tbody');
const fromSelect = document.getElementById('fromSelect');
const toSelect = document.getElementById('toSelect');
const amountInput = document.getElementById('amountInput');
const convertBtn = document.getElementById('convertBtn');
const convertResult = document.getElementById('convertResult');

let state = {
    rates: null,
    updatedAt: null,
};

function saveToCache(data) {
    localStorage.setItem(name, JSON.stringify(data));
}

function loadFromCache() {
    const raw = localStorage.getItem(name);
    return raw ? JSON.parse(raw) : null;
}

function isCacheFresh(cache) {
    return cache && Date.now() - cache.updatedAt < ttl;
}

async function fetchRates() {
    const response = await fetch(api);
    const data = await response.json();
    return data.rates;
}

async function loadRates(forceRefresh = false) {
    const cache = loadFromCache();

    if (!forceRefresh && isCacheFresh(cache)) {
        state = cache;
        renderAll();
        return;
    }

    const rates = await fetchRates();

    state.rates = rates;
    state.updatedAt = Date.now();

    saveToCache(state);
    renderAll();
}

function renderAll() {
    renderLastUpdate();
    renderRatesTable();
    fillSelectOptions();
}

function renderLastUpdate() {
    lastUpdateEl.textContent = `Last update: ${new Date(state.updatedAt).toLocaleString('en-US')}`;
}

function renderRatesTable() {
    ratesTableBody.innerHTML = '';
    const popular = ['USD', 'EUR', 'UAH', 'GBP', 'PLN', 'JPY', 'CHF', 'CAD'];

    for (const code of popular) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${code}</td><td>${state.rates[code]}</td>`;
        ratesTableBody.appendChild(row);
    }
}

function fillSelectOptions() {
    const codes = Object.keys(state.rates).sort();
    const optionsHtml = codes.map((code) => `<option value="${code}">${code}</option>`).join('');

    fromSelect.innerHTML = optionsHtml;
    toSelect.innerHTML = optionsHtml;

    fromSelect.value = 'USD';
    toSelect.value = 'UAH';
}

function convertCurrency(amount, fromCode, toCode) {
    const amountInUsd = amount / state.rates[fromCode];
    return amountInUsd * state.rates[toCode];
}

function handleConvert() {
    const amount = parseFloat(amountInput.value);
    const fromCode = fromSelect.value;
    const toCode = toSelect.value;

    const result = convertCurrency(amount, fromCode, toCode);
    convertResult.textContent = `${amount} ${fromCode} = ${result.toFixed(4)} ${toCode}`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadRates(false);

    refreshBtn.addEventListener('click', () => loadRates(true));
    convertBtn.addEventListener('click', handleConvert);

    setInterval(() => loadRates(false), ttl);
});
