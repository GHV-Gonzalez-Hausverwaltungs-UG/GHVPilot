// components/pdf/BesichtigungPDF.tsx
// reine React-Komponente, kein Browser-API nötig

export type BesichtigungData = {
  object?: string;
  date?: string;
  status?: string;
  priority?: string;
  shortage?: string;
  measures?: string;
  address?: {
    street?: string;
    city?: string;
    zip?: string;
  };
  photos?: string[];
};

// Wichtig: nur inline-styles / Tailwind-Klassen, nix mit useEffect etc.
export function BesichtigungPDF({ data }: { data: BesichtigungData }) {
  return (
    <div
      style={{
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont",
        fontSize: "12px",
        padding: "24px",
        color: "#111",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      {/* Header / Titel */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1e3a8a",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Besichtigungsbericht</span>
          <span style={{ fontSize: "11px", color: "#555" }}>
            {data.date ?? "—"}
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "#444", marginTop: "4px" }}>
          Objekt: {data.object ?? "—"}
        </div>
        {data.address ? (
          <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>
            {data.address.street ?? "—"}
            <br />
            {[data.address.zip, data.address.city].filter(Boolean).join(" ")}
          </div>
        ) : null}
      </div>

      {/* Meta Infos */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <Row label="Status" value={data.status ?? "—"} />
        <Row label="Dringlichkeit" value={data.priority ?? "—"} />
      </section>

      {/* Mangel / Maßnahmen */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px 16px",
          marginBottom: "16px",
        }}
      >
        <Block title="Mangel" body={data.shortage ?? "—"} />
        <Block title="Maßnahmen" body={data.measures ?? "—"} />
      </section>

      {/* Fotos */}
      {data.photos && data.photos.length > 0 ? (
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#222",
            }}
          >
            Fotos ({data.photos.length})
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
            }}
          >
            {data.photos.map((url, idx) => (
              <div
                key={idx}
                style={{
                  width: "100%",
                  height: "100px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  backgroundColor: "#eee",
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  backgroundImage: `url(${url})`,
                }}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: "12px",
        marginBottom: "6px",
      }}
    >
      <div style={{ width: "120px", color: "#555", fontWeight: 600 }}>
        {label}:
      </div>
      <div style={{ color: "#111" }}>{value}</div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#555",
          marginBottom: "4px",
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div
        style={{
          whiteSpace: "pre-wrap",
          fontSize: "12px",
          color: "#111",
          lineHeight: "1.4",
          border: "1px solid #eee",
          backgroundColor: "#fafafa",
          borderRadius: "4px",
          padding: "8px",
        }}
      >
        {body}
      </div>
    </div>
  );
}
