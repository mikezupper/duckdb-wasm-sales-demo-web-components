// Updated table.js with debug logging
export function renderTable(tableEl, headers, rows) {
    // console.log(`Table: Rendering with ${rows.length} rows:`, rows);
    tableEl.innerHTML = "";

    const headerRow = document.createElement("tr");
    headers.forEach(h => {
        const th = document.createElement("th");
        th.textContent = h;
        headerRow.appendChild(th);
    });
    tableEl.appendChild(headerRow);

    rows.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(val => {
            const td = document.createElement("td");
            td.textContent = val;
            tr.appendChild(td);
        });
        tableEl.appendChild(tr);
    });

    if (rows.length === 0) {
        console.warn('Table: No rows to render - table will be empty.');
    }
}