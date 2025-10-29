"use strict";
// components/pdf/BesichtigungPDF.tsx
// reine React-Komponente, kein Browser-API nötig
Object.defineProperty(exports, "__esModule", { value: true });
exports.BesichtigungPDF = BesichtigungPDF;
// Wichtig: nur inline-styles / Tailwind-Klassen, nix mit useEffect etc.
function BesichtigungPDF({ data }) {
    var _a, _b, _c, _d, _e, _f, _g;
    return (React.createElement("div", { style: {
            fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
            fontSize: "12px",
            padding: "24px",
            color: "#111",
            width: "100%",
            maxWidth: "800px",
            margin: "0 auto",
        } },
        React.createElement("div", { style: { marginBottom: "16px" } },
            React.createElement("div", { style: {
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#1e3a8a",
                    display: "flex",
                    justifyContent: "space-between",
                } },
                React.createElement("span", null, "Besichtigungsbericht"),
                React.createElement("span", { style: { fontSize: "11px", color: "#555" } }, (_a = data.date) !== null && _a !== void 0 ? _a : "—")),
            React.createElement("div", { style: { fontSize: "13px", color: "#444", marginTop: "4px" } },
                "Objekt: ", (_b = data.object) !== null && _b !== void 0 ? _b : "—"),
            data.address ? (React.createElement("div", { style: { fontSize: "11px", color: "#666", marginTop: "2px" } }, (_c = data.address.street) !== null && _c !== void 0 ? _c : "—",
                React.createElement("br", null),
                [data.address.zip, data.address.city].filter(Boolean).join(" "))) : null),
        React.createElement("section", { style: {
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
            } },
            React.createElement(Row, { label: "Status", value: (_d = data.status) !== null && _d !== void 0 ? _d : "—" }),
            React.createElement(Row, { label: "Dringlichkeit", value: (_e = data.priority) !== null && _e !== void 0 ? _e : "—" })),
        React.createElement("section", { style: {
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
            } },
            React.createElement(Block, { title: "Mangel", body: (_f = data.shortage) !== null && _f !== void 0 ? _f : "—" }),
            React.createElement(Block, { title: "Ma\u00DFnahmen", body: (_g = data.measures) !== null && _g !== void 0 ? _g : "—" })),
        data.photos && data.photos.length > 0 ? (React.createElement("section", { style: {
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px 16px",
            } },
            React.createElement("div", { style: {
                    fontSize: "11px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#222",
                } },
                "Fotos (",
                data.photos.length,
                ")"),
            React.createElement("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                } }, data.photos.map((url, idx) => (React.createElement("div", { key: idx, style: {
                    width: "100%",
                    height: "100px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#eee",
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                    backgroundImage: `url(${url})`,
                } })))))) : null));
}
function Row({ label, value }) {
    return (React.createElement("div", { style: {
            display: "flex",
            fontSize: "12px",
            marginBottom: "6px",
        } },
        React.createElement("div", { style: { width: "120px", color: "#555", fontWeight: 600 } },
            label,
            ":"),
        React.createElement("div", { style: { color: "#111" } }, value)));
}
function Block({ title, body }) {
    return (React.createElement("div", { style: { marginBottom: "12px" } },
        React.createElement("div", { style: {
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "#555",
                marginBottom: "4px",
                fontWeight: 600,
            } }, title),
        React.createElement("div", { style: {
                whiteSpace: "pre-wrap",
                fontSize: "12px",
                color: "#111",
                lineHeight: "1.4",
                border: "1px solid #eee",
                backgroundColor: "#fafafa",
                borderRadius: "4px",
                padding: "8px",
            } }, body)));
}
