window.getLocalStorageName = function () {
    return window.localStorage ? window.localStorage.name : null;
};

window.indexedDbSet = async function (key, value) {
    const db = await openDb();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    await store.put({ id: key, data: value });
    return true;
};

window.indexedDbGet = async function (key) {
    const db = await openDb();
    const tx = db.transaction("items", "readonly");
    const store = tx.objectStore("items");
    const request = store.get(key);
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result ? request.result.data : null);
        request.onerror = () => reject(request.error);
    });
};

window.indexedDbRemove = async function (key) {
    const db = await openDb();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    await store.delete(key);
    return true;
};

window.indexedDbClear = async function () {
    const db = await openDb();
    const tx = db.transaction("items", "readwrite");
    const store = tx.objectStore("items");
    await store.clear();
    return true;
};

async function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("MiniPosDb", 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("items")) {
                db.createObjectStore("items", { keyPath: "id" });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

window.applyHighchartsTheme = function () {
    const hc = window.Highcharts;
    if (!hc) return false;

    const root = document.documentElement;
    const themeKey = root.classList.contains("dark") ? "dark" : "light";
    if (window.__miniPosHighchartsThemeKey === themeKey) return true;

    const getCssVar = (name) => {
        try {
            return getComputedStyle(root).getPropertyValue(name).trim();
        } catch {
            return "";
        }
    };

    const toHsl = (raw, alpha) => {
        if (!raw) return "";
        const parts = raw.split(/\s+/).filter(Boolean);
        if (parts.length < 3) return "";
        const [h, s, l] = parts;
        return alpha === undefined
            ? `hsl(${h}, ${s}, ${l})`
            : `hsla(${h}, ${s}, ${l}, ${alpha})`;
    };

    const palette = [];
    for (let i = 1; i <= 9; i++) {
        const v = getCssVar(`--chart-${i}`);
        if (v) palette.push(v);
    }

    const colors = palette.length
        ? palette
        : ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#ea580c', '#c2410c', '#9a3412', '#7c2d12'];

    const foreground = toHsl(getCssVar("--foreground"));
    const mutedForeground = toHsl(getCssVar("--muted-foreground"));
    const border = toHsl(getCssVar("--border"));
    const grid = toHsl(getCssVar("--border"), 0.45);

    hc.theme = {
        colors,
        chart: {
            backgroundColor: "rgba(0, 0, 0, 0)",
            style: { fontFamily: "Outfit, sans-serif" }
        },
        title: {
            style: { color: foreground || "#1f2937", fontWeight: "bold" }
        },
        subtitle: {
            style: { color: mutedForeground || "#6b7280" }
        },
        xAxis: {
            lineColor: border || "#e5e7eb",
            tickColor: border || "#e5e7eb",
            gridLineColor: grid || "#f3f4f6",
            labels: { style: { color: mutedForeground || "#6b7280" } }
        },
        yAxis: {
            gridLineColor: grid || "#f3f4f6",
            labels: { style: { color: mutedForeground || "#6b7280" } },
            title: { style: { color: mutedForeground || "#6b7280" } }
        },
        legend: {
            itemStyle: { color: mutedForeground || "#4b5563" },
            itemHoverStyle: { color: foreground || "#1f2937" }
        },
        credits: { enabled: false }
    };

    hc.setOptions(hc.theme);
    window.__miniPosHighchartsThemeKey = themeKey;
    return true;
};

window.setMiniPosTheme = function (theme) {
    try {
        const root = document.documentElement;
        const isDark = theme === "dark";
        root.classList.toggle("dark", isDark);
        localStorage.setItem("minipos-theme", isDark ? "dark" : "light");

        // Update Highcharts (new + existing charts)
        if (window.Highcharts) {
            window.applyHighchartsTheme();
            const t = window.Highcharts.theme || {};
            const charts = window.Highcharts.charts || [];
            charts.forEach((c) => {
                if (!c) return;
                c.update({
                    colors: t.colors,
                    chart: t.chart,
                    title: t.title,
                    subtitle: t.subtitle,
                    xAxis: t.xAxis,
                    yAxis: t.yAxis,
                    legend: t.legend
                }, true, true, false);
            });
        }
    } catch {
        // ignore
    }
};

window.toggleMiniPosTheme = function () {
    try {
        const root = document.documentElement;
        const isDark = root.classList.contains("dark");
        window.setMiniPosTheme(isDark ? "light" : "dark");
    } catch {
        // ignore
    }
};

window.renderHighchartsColumn = function (containerId, title, categories, seriesData) {
    const hc = window.Highcharts;
    if (!hc) {
        console.error("Highcharts is not defined. Ensure Highcharts scripts are loaded before calling renderHighchartsColumn.");
        return;
    }
    window.applyHighchartsTheme();
    hc.chart(containerId, {
        chart: {
            type: 'column',
            borderRadius: 12
        },
        title: {
            text: title
        },
        xAxis: {
            categories: categories,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Quantity'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.0f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                borderRadius: 4
            }
        },
        series: seriesData
    });
};

window.renderHighchartsPie = function (containerId, title, seriesData) {
    const hc = window.Highcharts;
    if (!hc) {
        console.error("Highcharts is not defined. Ensure Highcharts scripts are loaded before calling renderHighchartsPie.");
        return;
    }
    window.applyHighchartsTheme();
    hc.chart(containerId, {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: title
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                },
                showInLegend: true
            }
        },
        series: [{
            name: 'Share',
            colorByPoint: true,
            data: seriesData
        }]
    });
};

window.renderHighchartsLine = function (containerId, title, categories, seriesData) {
    const hc = window.Highcharts;
    if (!hc) {
        console.error("Highcharts is not defined. Ensure Highcharts scripts are loaded before calling renderHighchartsLine.");
        return;
    }
    window.applyHighchartsTheme();
    hc.chart(containerId, {
        chart: {
            type: 'line',
            borderRadius: 12
        },
        title: {
            text: title
        },
        xAxis: {
            categories: categories
        },
        yAxis: {
            title: {
                text: 'Amount'
            }
        },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true
                },
                enableMouseTracking: true
            }
        },
        series: seriesData
    });
};

window.renderHighchartsFunnel = function (containerId, title, seriesData) {
    const hc = window.Highcharts;
    if (!hc) {
        console.error("Highcharts is not defined. Ensure Highcharts scripts are loaded before calling renderHighchartsFunnel.");
        return;
    }
    window.applyHighchartsTheme();
    hc.chart(containerId, {
        chart: {
            type: 'funnel',
            borderRadius: 12
        },
        title: {
            text: title
        },
        plotOptions: {
            series: {
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b> ({point.y:,.0f})',
                    softConnector: true
                },
                center: ['40%', '50%'],
                neckWidth: '30%',
                neckHeight: '25%',
                width: '80%'
            }
        },
        legend: {
            enabled: false
        },
        series: [{
            name: 'Unique users',
            data: seriesData
        }]
    });
};

window.miniPosReports = {
    printThermalReceipt: function (elementId, documentTitle) {
        const source = document.getElementById(elementId);
        if (!source) return false;

        const frame = document.createElement("iframe");
        frame.setAttribute("aria-hidden", "true");
        frame.style.position = "fixed";
        frame.style.right = "0";
        frame.style.bottom = "0";
        frame.style.width = "0";
        frame.style.height = "0";
        frame.style.border = "0";
        document.body.appendChild(frame);

        const printWindow = frame.contentWindow;
        const printDocument = printWindow && printWindow.document;
        if (!printWindow || !printDocument) {
            frame.remove();
            return false;
        }

        const safeTitle = String(documentTitle || "MiniPOS receipt")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");

        printDocument.open();
        printDocument.write(`<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>${safeTitle}</title>
    <style>
        @page { size: 80mm auto; margin: 0; }
        @font-face { font-family: "Noto Sans Myanmar"; src: url("fonts/NotoSansMyanmar.ttf") format("truetype"); font-weight: 100 900; font-style: normal; }
        * { box-sizing: border-box; }
        html, body { width: 80mm; margin: 0; padding: 0; background: #fff; color: #000; }
        body { font-family: "Noto Sans Myanmar", Arial, sans-serif; font-size: 10pt; }
        .thermal-receipt { width: 72mm; margin: 0 auto; padding: 4mm 3mm 5mm; }
        .thermal-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 3mm; }
        .thermal-logo { width: 12mm; height: 12mm; margin: 0 auto 2mm; display: flex; align-items: center; justify-content: center; border: 1px solid #000; border-radius: 2mm; }
        .thermal-logo svg { width: 7mm; height: 7mm; }
        .thermal-header h3 { margin: 0; font-size: 15pt; }
        .thermal-header > p { margin: 1mm 0 0; font-size: 8pt; text-transform: uppercase; letter-spacing: .08em; }
        .thermal-meta { display: grid; grid-template-columns: 1fr; gap: 1.5mm; margin-top: 3mm; text-align: left; }
        .thermal-meta-item { display: flex; flex-direction: column; padding: 2mm; border: 1px solid #999; border-radius: 1mm; }
        .thermal-meta-item span:first-child { font-size: 7pt; text-transform: uppercase; }
        .thermal-meta-item span:last-child { margin-top: .5mm; font-size: 8.5pt; font-weight: 700; overflow-wrap: anywhere; }
        .thermal-items { padding: 3mm 0; }
        .thermal-line { display: flex; justify-content: space-between; align-items: flex-start; gap: 2mm; padding: 1.5mm 0; border-bottom: 1px dotted #aaa; }
        .thermal-line > div:first-child { min-width: 0; flex: 1; }
        .thermal-line-name { margin: 0; font-size: 9pt; font-weight: 700; overflow-wrap: anywhere; }
        .thermal-line-detail { margin: .5mm 0 0; font-size: 7.5pt; }
        .thermal-line-amount { white-space: nowrap; font-weight: 700; }
        .thermal-total { border-top: 1px dashed #000; padding-top: 3mm; }
        .thermal-total > div { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
        .thermal-total > div > span:first-child { font-size: 8pt; font-weight: 700; text-transform: uppercase; }
        .thermal-total > div > div > span:first-child { font-size: 16pt; font-weight: 800; }
        .thermal-total > div > div > span:last-child { font-size: 8pt; font-weight: 700; }
        .thermal-thanks { margin: 4mm 0 0; text-align: center; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; }
    </style>
</head>
<body>${source.outerHTML}</body>
</html>`);
        printDocument.close();

        const cleanup = () => window.setTimeout(() => frame.remove(), 250);
        printWindow.onafterprint = cleanup;
        window.setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            window.setTimeout(() => {
                if (frame.isConnected) frame.remove();
            }, 30000);
        }, 150);

        return true;
    },

    downloadFile: function (fileName, contentType, content) {
        let bytes = content;
        if (typeof content === "string") {
            const binary = atob(content);
            bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        } else if (!(content instanceof Uint8Array)) {
            bytes = new Uint8Array(content);
        }

        const blob = new Blob([bytes], { type: contentType || "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
};
