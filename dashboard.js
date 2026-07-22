// ============================================
// KUN Digital DSR Dashboard — Main Script
// ============================================

(function () {
    'use strict';

    // Color palette
    const COLORS = {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        cyan: '#06b6d4',
        emerald: '#10b981',
        amber: '#f59e0b',
        rose: '#f43f5e',
        sky: '#0ea5e9',
        orange: '#f97316',
        pink: '#ec4899',
        teal: '#14b8a6',
        violet: '#a855f7',
        lime: '#84cc16',
    };

    const CHART_COLORS = [
        COLORS.primary, COLORS.cyan, COLORS.emerald, COLORS.amber,
        COLORS.rose, COLORS.sky, COLORS.orange, COLORS.pink,
        COLORS.teal, COLORS.violet, COLORS.secondary, COLORS.lime
    ];

    // Chart.js defaults
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.borderColor = 'rgba(99,102,241,0.08)';
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10,10,18,0.95)';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(99,102,241,0.2)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.titleFont = { weight: '600' };
    Chart.defaults.elements.bar.borderRadius = 6;
    Chart.defaults.elements.bar.borderSkipped = false;

    // ---- Helper Functions ----
    function countBy(arr, key) {
        const map = {};
        arr.forEach(item => {
            const v = (item[key] || '').trim();
            if (v) map[v] = (map[v] || 0) + 1;
        });
        return map;
    }

    function sortedEntries(obj, desc = true) {
        return Object.entries(obj).sort((a, b) => desc ? b[1] - a[1] : a[1] - b[1]);
    }

    function normalizeModel(model) {
        const m = (model || '').toUpperCase().trim();
        if (m.includes('TIAGO') && !m.includes('EV')) return 'TIAGO';
        if (m.includes('TIAGO') && m.includes('EV')) return 'TIAGO EV';
        if (m.includes('PUNCH') && !m.includes('EV') && !m.includes('FACELIFT')) return 'PUNCH';
        if (m.includes('PUNCH') && m.includes('EV')) return 'PUNCH EV';
        if (m.includes('PUNCH') && m.includes('FACELIFT')) return 'PUNCH FACELIFT';
        if (m.includes('NEXON') && !m.includes('EV')) return 'NEXON';
        if (m.includes('NEXON') && m.includes('EV')) return 'NEXON EV';
        if (m.includes('ALTROZ')) return 'ALTROZ';
        if (m.includes('XPRES') || m.includes('XPRESS')) return 'XPRES T';
        if (m.includes('SIERRA')) return 'SIERRA';
        if (m.includes('SAFARI')) return 'SAFARI';
        if (m.includes('HARRIER') && !m.includes('EV')) return 'HARRIER';
        if (m.includes('HARRIER') && m.includes('EV')) return 'HARRIER EV';
        if (m.includes('TIGOR') && !m.includes('EV')) return 'TIGOR';
        if (m.includes('TIGOR') && m.includes('EV')) return 'TIGOR EV';
        if (m.includes('CURVV') && !m.includes('EV')) return 'CURVV';
        if (m.includes('CURVV') && m.includes('EV')) return 'CURVV EV';
        return m || 'UNKNOWN';
    }

    function parseDateNum(dateStr) {
        const d = (dateStr || '').trim();
        const match = d.match(/(\d+)[\s-]*(Jun)/i);
        if (match) return parseInt(match[1]);
        return 0;
    }

    function parseHour(timeStr) {
        const t = (timeStr || '').trim();
        const match = t.match(/(\d+):/);
        if (match) return parseInt(match[1]);
        return -1;
    }

    // ---- Process Data ----
    const data = RAW_DATA.map(r => ({
        ...r,
        modelNorm: normalizeModel(r.model),
        dateNum: parseDateNum(r.leadDate),
        hour: parseHour(r.leadTime),
        hasTD: r.tdDate && r.tdDate.length > 1
    }));

    const totalLeads = data.length;
    const pvLeads = data.filter(d => d.pvEv === 'PV').length;
    const evLeads = data.filter(d => d.pvEv === 'EV').length;
    const tdLeads = data.filter(d => d.hasTD).length;
    const uniqueModels = [...new Set(data.map(d => d.modelNorm))].filter(m => m && m !== 'UNKNOWN');
    const uniqueLocations = [...new Set(data.map(d => d.location).filter(l => l))];

    // ---- Update KPIs ----
    document.getElementById('kpiTotal').textContent = totalLeads.toLocaleString();
    document.getElementById('kpiPV').textContent = pvLeads.toLocaleString();
    document.getElementById('kpiEV').textContent = evLeads.toLocaleString();
    document.getElementById('kpiTD').textContent = tdLeads.toLocaleString();
    document.getElementById('kpiModels').textContent = uniqueModels.length;

    document.getElementById('kpiPVpct').textContent = `${((pvLeads / totalLeads) * 100).toFixed(1)}% of total`;
    document.getElementById('kpiEVpct').textContent = `${((evLeads / totalLeads) * 100).toFixed(1)}% of total`;
    document.getElementById('kpiTDpct').textContent = `${((tdLeads / totalLeads) * 100).toFixed(1)}% conversion`;
    document.getElementById('kpiLocations').textContent = `${uniqueLocations.length} locations`;

    document.getElementById('totalLeadsHeader').textContent = totalLeads.toLocaleString();
    document.getElementById('tdRateHeader').textContent = `${((tdLeads / totalLeads) * 100).toFixed(1)}%`;

    // ---- Chart 1: Daily Lead Volume ----
    const dailyCounts = {};
    data.forEach(d => {
        if (d.dateNum > 0 && d.dateNum <= 30) {
            dailyCounts[d.dateNum] = (dailyCounts[d.dateNum] || 0) + 1;
        }
    });
    const days = Object.keys(dailyCounts).map(Number).sort((a, b) => a - b);
    const dailyLabels = days.map(d => `${d} Jun`);
    const dailyValues = days.map(d => dailyCounts[d]);

    new Chart(document.getElementById('chartDaily'), {
        type: 'line',
        data: {
            labels: dailyLabels,
            datasets: [{
                label: 'Leads',
                data: dailyValues,
                borderColor: COLORS.primary,
                backgroundColor: 'rgba(99,102,241,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: COLORS.primary,
                pointBorderColor: '#0a0a12',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
                borderWidth: 2.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: ctx => ctx[0].label,
                        label: ctx => `${ctx.parsed.y} leads`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxRotation: 45, font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' },
                    ticks: { stepSize: 10 }
                }
            }
        }
    });

    // ---- Chart 2: PV vs EV Donut ----
    new Chart(document.getElementById('chartPVEV'), {
        type: 'doughnut',
        data: {
            labels: ['PV (Passenger)', 'EV (Electric)'],
            datasets: [{
                data: [pvLeads, evLeads],
                backgroundColor: [COLORS.cyan, COLORS.emerald],
                borderColor: ['rgba(6,182,212,0.3)', 'rgba(16,185,129,0.3)'],
                borderWidth: 2,
                hoverBorderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.parsed} (${((ctx.parsed / totalLeads) * 100).toFixed(1)}%)`
                    }
                }
            }
        }
    });

    // ---- Chart 3: Top Models ----
    const modelCounts = countBy(data, 'modelNorm');
    const topModels = sortedEntries(modelCounts).slice(0, 12);

    new Chart(document.getElementById('chartModels'), {
        type: 'bar',
        data: {
            labels: topModels.map(e => e[0]),
            datasets: [{
                label: 'Leads',
                data: topModels.map(e => e[1]),
                backgroundColor: topModels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '88'),
                borderColor: topModels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 1.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.parsed.x} leads (${((ctx.parsed.x / totalLeads) * 100).toFixed(1)}%)`
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' }
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { weight: '600', size: 11 } }
                }
            }
        }
    });

    // ---- Chart 4: Lead Sources (Sub Source) ----
    const sourceCounts = countBy(data, 'subSource');
    const sourceEntries = sortedEntries(sourceCounts).slice(0, 8);

    new Chart(document.getElementById('chartSources'), {
        type: 'doughnut',
        data: {
            labels: sourceEntries.map(e => e[0]),
            datasets: [{
                data: sourceEntries.map(e => e[1]),
                backgroundColor: sourceEntries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + 'cc'),
                borderColor: '#0a0a12',
                borderWidth: 2,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '55%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10 } } },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.label}: ${ctx.parsed} (${((ctx.parsed / totalLeads) * 100).toFixed(1)}%)`
                    }
                }
            }
        }
    });

    // ---- Chart 5: Location Performance ----
    const locCounts = countBy(data, 'location');
    const locEntries = sortedEntries(locCounts);
    const locTD = {};
    data.forEach(d => {
        if (d.location && d.hasTD) locTD[d.location] = (locTD[d.location] || 0) + 1;
    });

    new Chart(document.getElementById('chartLocations'), {
        type: 'bar',
        data: {
            labels: locEntries.map(e => e[0]),
            datasets: [
                {
                    label: 'Total Leads',
                    data: locEntries.map(e => e[1]),
                    backgroundColor: COLORS.primary + '88',
                    borderColor: COLORS.primary,
                    borderWidth: 1.5,
                },
                {
                    label: 'Test Drives',
                    data: locEntries.map(e => locTD[e[0]] || 0),
                    backgroundColor: COLORS.amber + '88',
                    borderColor: COLORS.amber,
                    borderWidth: 1.5,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' }
                }
            }
        }
    });

    // ---- Chart 6: Team Leader Performance ----
    const tlCounts = countBy(data, 'tl');
    const tlEntries = sortedEntries(tlCounts).filter(e => e[0]).slice(0, 10);
    const tlTD = {};
    data.forEach(d => {
        if (d.tl && d.hasTD) tlTD[d.tl] = (tlTD[d.tl] || 0) + 1;
    });

    new Chart(document.getElementById('chartTL'), {
        type: 'bar',
        data: {
            labels: tlEntries.map(e => e[0]),
            datasets: [
                {
                    label: 'Total Leads',
                    data: tlEntries.map(e => e[1]),
                    backgroundColor: COLORS.secondary + '88',
                    borderColor: COLORS.secondary,
                    borderWidth: 1.5,
                },
                {
                    label: 'Test Drives',
                    data: tlEntries.map(e => tlTD[e[0]] || 0),
                    backgroundColor: COLORS.emerald + '88',
                    borderColor: COLORS.emerald,
                    borderWidth: 1.5,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' } }
            }
        }
    });

    // ---- Chart 7: Sales Manager Performance ----
    const smCounts = countBy(data, 'sm');
    const smEntries = sortedEntries(smCounts).filter(e => e[0]);
    const smTD = {};
    data.forEach(d => {
        if (d.sm && d.hasTD) smTD[d.sm] = (smTD[d.sm] || 0) + 1;
    });

    new Chart(document.getElementById('chartSM'), {
        type: 'bar',
        data: {
            labels: smEntries.map(e => e[0]),
            datasets: [
                {
                    label: 'Total Leads',
                    data: smEntries.map(e => e[1]),
                    backgroundColor: COLORS.sky + '88',
                    borderColor: COLORS.sky,
                    borderWidth: 1.5,
                },
                {
                    label: 'Test Drives',
                    data: smEntries.map(e => smTD[e[0]] || 0),
                    backgroundColor: COLORS.orange + '88',
                    borderColor: COLORS.orange,
                    borderWidth: 1.5,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' } }
            }
        }
    });

    // ---- Chart 8: Sub-Source Breakdown ----
    const subSourceCounts = countBy(data, 'subSource');
    const subSourceEntries = sortedEntries(subSourceCounts).filter(e => e[0]).slice(0, 10);

    new Chart(document.getElementById('chartSubSource'), {
        type: 'bar',
        data: {
            labels: subSourceEntries.map(e => e[0]),
            datasets: [{
                label: 'Leads',
                data: subSourceEntries.map(e => e[1]),
                backgroundColor: subSourceEntries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length] + '88'),
                borderColor: subSourceEntries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                borderWidth: 1.5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' } },
                y: { grid: { display: false }, ticks: { font: { size: 10 } } }
            }
        }
    });

    // ---- Chart 9: Top Customer Advisors ----
    const caCounts = countBy(data, 'caName');
    const caEntries = sortedEntries(caCounts).filter(e => e[0]).slice(0, 15);
    const caTD = {};
    data.forEach(d => {
        if (d.caName && d.hasTD) caTD[d.caName] = (caTD[d.caName] || 0) + 1;
    });

    new Chart(document.getElementById('chartCA'), {
        type: 'bar',
        data: {
            labels: caEntries.map(e => e[0]),
            datasets: [
                {
                    label: 'Total Leads',
                    data: caEntries.map(e => e[1]),
                    backgroundColor: COLORS.primary + '88',
                    borderColor: COLORS.primary,
                    borderWidth: 1.5,
                },
                {
                    label: 'Test Drives',
                    data: caEntries.map(e => caTD[e[0]] || 0),
                    backgroundColor: COLORS.amber + '88',
                    borderColor: COLORS.amber,
                    borderWidth: 1.5,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 45 } },
                y: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' } }
            }
        }
    });

    // ---- Chart 10: Model vs Vehicle Type (Stacked) ----
    const modelTypeData = {};
    data.forEach(d => {
        const m = d.modelNorm;
        const t = d.pvEv || 'Other';
        if (!modelTypeData[m]) modelTypeData[m] = { PV: 0, EV: 0 };
        if (t === 'PV') modelTypeData[m].PV++;
        else if (t === 'EV') modelTypeData[m].EV++;
    });
    const modelTypeEntries = Object.entries(modelTypeData)
        .map(([m, v]) => [m, v.PV + v.EV, v])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

    new Chart(document.getElementById('chartModelType'), {
        type: 'bar',
        data: {
            labels: modelTypeEntries.map(e => e[0]),
            datasets: [
                {
                    label: 'PV',
                    data: modelTypeEntries.map(e => e[2].PV),
                    backgroundColor: COLORS.cyan + '88',
                    borderColor: COLORS.cyan,
                    borderWidth: 1,
                },
                {
                    label: 'EV',
                    data: modelTypeEntries.map(e => e[2].EV),
                    backgroundColor: COLORS.emerald + '88',
                    borderColor: COLORS.emerald,
                    borderWidth: 1,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: { size: 10 }, maxRotation: 45 }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: { color: 'rgba(99,102,241,0.06)' }
                }
            }
        }
    });

    // ---- Chart 11: Hourly Distribution ----
    const hourlyCounts = {};
    data.forEach(d => {
        if (d.hour >= 0 && d.hour <= 23) {
            hourlyCounts[d.hour] = (hourlyCounts[d.hour] || 0) + 1;
        }
    });
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
    const hourLabels = hours.map(h => `${h}:00`);
    const hourValues = hours.map(h => hourlyCounts[h] || 0);

    new Chart(document.getElementById('chartHourly'), {
        type: 'bar',
        data: {
            labels: hourLabels,
            datasets: [{
                label: 'Leads',
                data: hourValues,
                backgroundColor: hourValues.map((v, i) => {
                    const maxVal = Math.max(...hourValues);
                    const intensity = 0.3 + (v / maxVal) * 0.7;
                    return `rgba(99,102,241,${intensity})`;
                }),
                borderColor: COLORS.primary,
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                y: { beginAtZero: true, grid: { color: 'rgba(99,102,241,0.06)' } }
            }
        }
    });

    // ---- Data Table ----
    const PAGE_SIZE = 25;
    let currentPage = 1;
    let filteredData = [...data];

    // Populate filter dropdowns
    const modelSelect = document.getElementById('filterModel');
    const sourceSelect = document.getElementById('filterSource');
    const locationSelect = document.getElementById('filterLocation');

    [...new Set(data.map(d => d.modelNorm))].filter(m => m).sort().forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
    });

    [...new Set(data.map(d => d.subSource))].filter(s => s).sort().forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        sourceSelect.appendChild(opt);
    });

    [...new Set(data.map(d => d.location))].filter(l => l).sort().forEach(l => {
        const opt = document.createElement('option');
        opt.value = l;
        opt.textContent = l;
        locationSelect.appendChild(opt);
    });

    function applyFilters() {
        const search = document.getElementById('searchInput').value.toLowerCase().trim();
        const model = modelSelect.value;
        const source = sourceSelect.value;
        const location = locationSelect.value;

        filteredData = data.filter(d => {
            if (model && d.modelNorm !== model) return false;
            if (source && d.subSource !== source) return false;
            if (location && d.location !== location) return false;
            if (search) {
                const searchable = [d.customerName, d.model, d.caName, d.tl, d.sm, d.location, d.subSource, d.leadDate]
                    .join(' ').toLowerCase();
                if (!searchable.includes(search)) return false;
            }
            return true;
        });

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        const tbody = document.getElementById('tableBody');
        const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
        const start = (currentPage - 1) * PAGE_SIZE;
        const pageData = filteredData.slice(start, start + PAGE_SIZE);

        tbody.innerHTML = pageData.map((d, i) => `
            <tr>
                <td>${start + i + 1}</td>
                <td>${d.leadDate}</td>
                <td style="color:var(--text-primary);font-weight:500">${d.customerName}</td>
                <td>${d.modelNorm}</td>
                <td><span class="type-badge ${d.pvEv === 'EV' ? 'type-badge-ev' : 'type-badge-pv'}">${d.pvEv || '—'}</span></td>
                <td>${d.subSource}</td>
                <td>${d.source}</td>
                <td>${d.caName}</td>
                <td>${d.tl}</td>
                <td>${d.location}</td>
                <td>${d.sm}</td>
                <td>${d.tdDate || '—'}</td>
            </tr>
        `).join('');

        document.getElementById('tableInfo').textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filteredData.length)} of ${filteredData.length} leads`;

        // Pagination
        const pagDiv = document.getElementById('pagination');
        pagDiv.innerHTML = '';

        if (totalPages <= 1) return;

        const addBtn = (text, page, active = false) => {
            const btn = document.createElement('button');
            btn.textContent = text;
            if (active) btn.classList.add('active');
            btn.addEventListener('click', () => {
                currentPage = page;
                renderTable();
                document.querySelector('.table-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            pagDiv.appendChild(btn);
        };

        if (currentPage > 1) addBtn('‹', currentPage - 1);

        const maxBtns = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxBtns / 2));
        let endPage = Math.min(totalPages, startPage + maxBtns - 1);
        if (endPage - startPage < maxBtns - 1) startPage = Math.max(1, endPage - maxBtns + 1);

        for (let p = startPage; p <= endPage; p++) {
            addBtn(p, p, p === currentPage);
        }

        if (currentPage < totalPages) addBtn('›', currentPage + 1);
    }

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    modelSelect.addEventListener('change', applyFilters);
    sourceSelect.addEventListener('change', applyFilters);
    locationSelect.addEventListener('change', applyFilters);

    // Initial render
    renderTable();

})();
