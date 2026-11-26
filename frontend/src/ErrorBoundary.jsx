import { Component } from "react";

// Catches render crashes anywhere below it and shows a message + reload
// button instead of a blank black/white page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Campus Connect crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const err = this.state.error;
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          background: "var(--bg-page, #f6f7f9)",
          color: "var(--text-primary, #111827)",
        }}
      >
        <h1>Something went wrong</h1>
        <p>
          Campus Connect hit an unexpected error. Reloading usually fixes it.
        </p>
        <pre
          style={{
            maxWidth: "100%",
            overflow: "auto",
            textAlign: "left",
            fontSize: 12,
            background: "rgba(0,0,0,0.06)",
            padding: 12,
            borderRadius: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {String(err?.message || err)}
          {err?.stack ? `\n${String(err.stack).split("\n").slice(0, 5).join("\n")}` : ""}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            background: "#14532d",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          Reload the page
        </button>
      </div>
    );
  }
}
